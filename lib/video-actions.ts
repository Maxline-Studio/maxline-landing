"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sourceKey,
  burnedKey,
  previewKey,
  videoFolder,
  STORAGE_BUCKET,
} from "@/lib/storage";
import { presignPut, presignGet, deleteObjects } from "@/lib/r2";
import { isLang, langLabel, type Lang } from "@/lib/langs";
import type { VideoStatus, Segment } from "@/lib/video-types";
import type { SubtitleStyle } from "@/lib/subtitle-style";
import { callClaude, isAnthropicConfigured } from "@/lib/anthropic";
import { REGISTER_RULES } from "@/lib/translation-prompt";
import { translateCuesBatched } from "@/lib/translate-cues";
import { wrapLines } from "@/lib/wrap-lines";
import { withProratedWords } from "@/lib/karaoke";
import {
  getSubtitle,
  listLanguages,
  upsertSubtitle,
  type SubtitleLang,
} from "@/lib/subtitles-store";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type StartUploadResult =
  | { ok: true; videoId: string; uploadUrl: string }
  | { ok: false; error: string };

/**
 * ÉTAPE 1 — appelée DÈS LE DÉPÔT du fichier, avant même que l'utilisateur ait
 * choisi sa langue.
 *
 * Crée la ligne `videos` (statut 'queued', configuration par défaut) ET renvoie
 * l'URL PUT présignée : le navigateur peut donc commencer à envoyer le fichier
 * pendant que l'utilisateur réfléchit. Sur une vidéo de 200 Mo en fibre, l'envoi
 * est souvent DÉJÀ TERMINÉ au moment où il clique sur « Générer ».
 *
 * Une seule action (avant : createVideoUpload puis createSourceUploadUrl, deux
 * allers-retours, chacun refaisant getUser + une lecture).
 *
 * Ne consomme PAS les minutes : c'est finalizeVideoUpload qui le fait, de façon
 * atomique, une fois l'envoi terminé. Une vidéo dont l'upload est abandonné n'est
 * donc jamais facturée ni traitée (storage_key_source reste NULL = invisible pour
 * le worker).
 */
export async function startVideoUpload(params: {
  filename: string;
  durationSeconds: number;
  sizeBytes: number;
  format: string;
}): Promise<StartUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Session expirée. Reconnectez-vous." };
  }

  // Garde durée (30 min max)
  if (params.durationSeconds > 30 * 60) {
    return { ok: false, error: "Vidéo trop longue (max 30 minutes)." };
  }
  if (params.durationSeconds <= 0) {
    return { ok: false, error: "Durée de vidéo invalide." };
  }

  // UNE seule lecture du profil : quota disponible ET durée de rétention.
  // (Avant : un RPC `get_user_minutes_available` dont l'EXECUTE est révoqué —
  // donc en échec systématique — suivi de DEUX lectures du profil.)
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "quota_minutes_total, quota_minutes_used, credits_minutes, delete_after_days",
    )
    .eq("id", user.id)
    .single();

  if (!profile) return { ok: false, error: "Profil introuvable." };

  const available =
    Math.max(profile.quota_minutes_total - profile.quota_minutes_used, 0) +
    profile.credits_minutes;
  const needed = params.durationSeconds / 60;
  if (available < needed) {
    return {
      ok: false,
      error: `Quota insuffisant. Il vous reste ${available.toFixed(1)} min, cette vidéo en demande ${needed.toFixed(1)}.`,
    };
  }

  const deleteAt = new Date(
    Date.now() + (profile.delete_after_days ?? 30) * 24 * 60 * 60 * 1000,
  ).toISOString();

  const ext = params.format;

  // Configuration par défaut, écrasée par finalizeVideoUpload : détection auto de
  // la langue parlée + sous-titres dans cette même langue.
  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      original_filename: params.filename,
      duration_seconds: params.durationSeconds,
      size_bytes: params.sizeBytes,
      format: ext,
      source_lang: "fr", // placeholder, écrasé par la langue détectée
      target_lang: "fr",
      source_lang_auto: true,
      target_same_as_source: true,
      status: "queued",
      delete_at: deleteAt,
    })
    .select("id")
    .single();

  if (insertError || !video) {
    return {
      ok: false,
      error: `Erreur création : ${insertError?.message ?? "inconnue"}`,
    };
  }

  try {
    const key = sourceKey(user.id, video.id, ext);
    const uploadUrl = await presignPut(key);
    return { ok: true, videoId: video.id, uploadUrl };
  } catch (e) {
    // La ligne existe mais l'upload est impossible : on la nettoie pour ne pas
    // laisser de vidéo fantôme dans « Mes vidéos ».
    await supabase.from("videos").delete().eq("id", video.id);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Préparation de l'upload impossible.",
    };
  }
}

export type FinalizeUploadResult = { ok: true } | { ok: false; error: string };

/**
 * ÉTAPE 2 — appelée quand l'utilisateur clique « Générer » ET que l'envoi du
 * fichier est terminé.
 *
 *  - enregistre la configuration de langues choisie ;
 *  - consomme les minutes de façon ATOMIQUE (RPC `consume_minutes`, migration
 *    026) : deux uploads simultanés ne peuvent plus dépenser les mêmes minutes ;
 *  - renseigne storage_key_source, LE signal qui met la vidéo à disposition du
 *    worker.
 *
 * Le statut reste 'queued' : c'est le worker qui fait avancer le pipeline.
 */
export async function finalizeVideoUpload(
  videoId: string,
  config: {
    /** Langue parlée, ou "auto" pour laisser le worker la détecter. */
    sourceLang?: Lang | "auto";
    /** Langue des sous-titres, ou "same" = dans la langue parlée. */
    targetLang?: Lang | "same";
    /** Noms propres à respecter (marques/prénoms/noms/URLs). */
    importantTerms?: string;
  },
): Promise<FinalizeUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, duration_seconds, format, storage_key_source")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return { ok: false, error: "Vidéo introuvable." };
  if (video.status !== "queued") {
    return { ok: false, error: "Cette vidéo est déjà prise en charge." };
  }
  if (video.storage_key_source) {
    return { ok: true }; // déjà finalisée (double clic) — idempotent
  }

  // ── Résolution des langues ──
  const autoDetect = config.sourceLang === "auto" || !config.sourceLang;
  const sourceLang: Lang =
    !autoDetect && isLang(config.sourceLang) ? config.sourceLang : "fr";
  const wantSameTarget = config.targetLang === "same" || !config.targetLang;
  let targetLang: Lang;
  let targetSameAsSource = false;
  if (wantSameTarget) {
    if (autoDetect) {
      targetSameAsSource = true;
      targetLang = "fr"; // placeholder écrasé par le worker (= source détectée)
    } else {
      targetLang = sourceLang;
    }
  } else {
    targetLang = isLang(config.targetLang) ? config.targetLang : "en";
  }

  // ── Débit ATOMIQUE des minutes ──
  // `consume_minutes` verrouille la ligne du profil (for update) : deux uploads
  // terminés au même instant se sérialisent au lieu de se marcher dessus.
  // EXECUTE réservé à service_role (modèle migration 015) → client admin.
  const minutesNeeded = (Number(video.duration_seconds) || 0) / 60;
  const admin = createAdminClient();
  const { data: consumed, error: consumeError } = await admin.rpc(
    "consume_minutes",
    { p_user_id: user.id, p_minutes: minutesNeeded },
  );

  if (consumeError) {
    return {
      ok: false,
      error: "Impossible de décompter les minutes. Réessayez dans un instant.",
    };
  }
  if (consumed === false) {
    return {
      ok: false,
      error:
        "Quota insuffisant : vos minutes ont été consommées entre-temps par un autre traitement.",
    };
  }

  // ── Mise à disposition du worker ──
  const key = sourceKey(user.id, videoId, video.format || "mp4");
  const { error: updateError } = await supabase
    .from("videos")
    .update({
      source_lang: sourceLang,
      target_lang: targetLang,
      source_lang_auto: autoDetect,
      target_same_as_source: targetSameAsSource,
      important_terms:
        (config.importantTerms || "").trim().slice(0, 600) || null,
      storage_key_source: key,
    })
    .eq("id", videoId)
    .eq("status", "queued");

  if (updateError) {
    return { ok: false, error: "Erreur d'enregistrement. Réessayez." };
  }

  revalidatePath("/app/videos");
  revalidatePath("/app/dashboard");
  return { ok: true };
}

/**
 * Annule un upload abandonné (l'utilisateur change de fichier ou quitte la page
 * avant d'avoir cliqué « Générer »). Supprime la ligne et l'objet R2 partiel.
 * Aucune minute n'a été consommée à ce stade.
 */
export async function cancelVideoUpload(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: video } = await supabase
    .from("videos")
    .select("id, format, status, storage_key_source")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  // On ne supprime QUE les brouillons : jamais une vidéo déjà prise en charge.
  if (!video || video.status !== "queued" || video.storage_key_source) return;

  await deleteObjects([sourceKey(user.id, videoId, video.format || "mp4")]);
  await supabase.from("videos").delete().eq("id", videoId).eq("user_id", user.id);
}

export type VideoStatusResult = {
  status: VideoStatus;
  errorMessage: string | null;
  /** Vidéos en file DEVANT celle-ci (tous utilisateurs). 0 = c'est la suivante.
   * null si la vidéo n'est plus en attente (traitement déjà commencé). */
  queueAhead: number | null;
};

/**
 * Lit le statut RÉEL de la vidéo (mis à jour par le worker sur la VM). Appelée
 * en polling par la page détail. Lecture seule : c'est le worker qui fait
 * avancer le pipeline et écrit la transcription.
 *
 * Renvoie aussi la POSITION DANS LA FILE tant que la vidéo attend : le comptage
 * porte sur les vidéos de TOUS les utilisateurs (la file est globale) → il passe
 * par le client admin, car la RLS ne montre à chacun que ses propres vidéos.
 * Seul un NOMBRE est exposé, jamais le contenu des autres vidéos.
 */
export async function getVideoStatus(
  videoId: string,
): Promise<VideoStatusResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: video } = await supabase
    .from("videos")
    .select("status, error_message, uploaded_at")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return null;

  const status = video.status as VideoStatus;

  // Position dans la file (uniquement pertinente en attente). Best-effort : une
  // erreur de comptage ne doit jamais casser le polling de statut.
  let queueAhead: number | null = null;
  if (status === "queued") {
    try {
      const admin = createAdminClient();
      const { count } = await admin
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued")
        .not("storage_key_source", "is", null) // upload réellement terminé
        .lt("uploaded_at", video.uploaded_at);
      queueAhead = typeof count === "number" ? count : null;
    } catch {
      queueAhead = null;
    }
  }

  return {
    status,
    errorMessage: video.error_message ?? null,
    queueAhead,
  };
}

/**
 * Sauvegarde les sous-titres (langue cible) édités par l'utilisateur.
 * Marque user_edited=true. Appelée par l'auto-save et le bouton manuel.
 */
export async function saveTranscriptionTarget(
  videoId: string,
  segments: Segment[],
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  // Validation basique des segments
  if (!Array.isArray(segments)) {
    return { ok: false, error: "Format de sous-titres invalide." };
  }
  for (const seg of segments) {
    if (
      typeof seg.start !== "number" ||
      typeof seg.end !== "number" ||
      typeof seg.text !== "string"
    ) {
      return { ok: false, error: "Segment invalide." };
    }
  }

  // Langue actuellement affichée = videos.target_lang (pointeur de langue active).
  const { data: video } = await supabase
    .from("videos")
    .select("target_lang")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();
  if (!video) return { ok: false, error: "Vidéo introuvable." };
  const lang: Lang = isLang(video.target_lang) ? video.target_lang : "en";

  // Karaoké : si une ligne a été éditée, ses timings par mot ne sont plus alignés
  // → on les recalcule au prorata (withProratedWords garde les timings réels des
  // lignes non touchées). CJK : pas de words.
  const aligned = segments.map((s) => withProratedWords(s, lang));

  // Source de vérité = video_subtitles[langue active] (édition par langue).
  const up = await upsertSubtitle(supabase, videoId, lang, aligned, {
    userEdited: true,
  });
  if (!up.ok) return { ok: false, error: up.error };

  // Miroir legacy (burn worker + export legacy lisent transcription_target).
  const { error } = await supabase
    .from("videos")
    .update({
      transcription_target: aligned,
      user_edited: true,
    })
    .eq("id", videoId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Sauvegarde le style de sous-titres personnalisé (police, taille, fond/contour,
 * couleur) pour une vidéo. S'applique à l'aperçu et alimentera l'incrustation
 * MP4 (différée).
 */
export async function saveSubtitleStyle(
  videoId: string,
  style: SubtitleStyle,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { error } = await supabase
    .from("videos")
    .update({ subtitle_style: style })
    .eq("id", videoId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type BurnStatus = "idle" | "queued" | "burning" | "done" | "failed";

/**
 * Demande l'incrustation MP4 (burn-in) d'une vidéo terminée. Sauvegarde d'abord
 * les segments édités + le style (pour graver la version finale), puis met
 * burn_status='queued' : le worker prend le relais (génère burned.mp4 sur R2).
 *
 * burn_status est écrit via le client admin (le rôle authenticated n'a pas le
 * droit de modifier cette colonne — modèle migration 015).
 */
export async function requestBurn(
  videoId: string,
  segments?: Segment[],
  style?: SubtitleStyle,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, burn_status, target_lang")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return { ok: false, error: "Vidéo introuvable." };
  if (video.status !== "done") {
    return { ok: false, error: "La vidéo n'est pas encore prête." };
  }
  if (video.burn_status === "queued" || video.burn_status === "burning") {
    return { ok: false, error: "Génération déjà en cours." };
  }

  // Sauvegarde des dernières éditions (texte + style) sous RLS (client user).
  if (Array.isArray(segments)) {
    const okSegs = segments.every(
      (s) =>
        typeof s.start === "number" &&
        typeof s.end === "number" &&
        typeof s.text === "string",
    );
    if (!okSegs) return { ok: false, error: "Sous-titres invalides." };
    // Cache table (langue active) + miroir legacy (lu par le worker burn).
    const lang: Lang = isLang(video.target_lang) ? video.target_lang : "en";
    // Karaoké : on réaligne les timings par mot avant de graver (le burn lit
    // transcription_target).
    const aligned = segments.map((s) => withProratedWords(s, lang));
    await upsertSubtitle(supabase, videoId, lang, aligned, { userEdited: true });
    await supabase
      .from("videos")
      .update({ transcription_target: aligned, user_edited: true })
      .eq("id", videoId)
      .eq("user_id", user.id);
  }
  if (style) {
    await supabase
      .from("videos")
      .update({ subtitle_style: style })
      .eq("id", videoId)
      .eq("user_id", user.id);
  }

  // Mise en file du burn (colonne sensible → client admin).
  const admin = createAdminClient();
  const { error } = await admin
    .from("videos")
    .update({
      burn_status: "queued",
      burn_error: null,
      burn_requested_at: new Date().toISOString(),
    })
    .eq("id", videoId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/videos/${videoId}`);
  return { ok: true };
}

/** Lit l'état du burn + la progression (polling côté éditeur). */
export async function getBurnStatus(
  videoId: string,
): Promise<{ status: BurnStatus; error: string | null; progress: number } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // On lit burn_progress si la colonne existe (migration 025). Repli SANS cette
  // colonne si elle n'est pas encore appliquée → le polling ne casse jamais.
  const withProgress = await supabase
    .from("videos")
    .select("burn_status, burn_error, burn_progress")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .maybeSingle();

  let video = withProgress.data as {
    burn_status?: string;
    burn_error?: string | null;
    burn_progress?: number;
  } | null;

  if (withProgress.error) {
    const fallback = await supabase
      .from("videos")
      .select("burn_status, burn_error")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .maybeSingle();
    video = fallback.data;
  }

  if (!video) return null;
  return {
    status: (video.burn_status as BurnStatus) ?? "idle",
    error: video.burn_error ?? null,
    progress: typeof video.burn_progress === "number" ? video.burn_progress : 0,
  };
}

/** URL présignée (1 h) pour télécharger le MP4 incrusté, si prêt. */
export async function getBurnedUrl(
  videoId: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { data: video } = await supabase
    .from("videos")
    .select("burn_status, storage_key_burned, original_filename")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video || video.burn_status !== "done" || !video.storage_key_burned) {
    return { ok: false, error: "Vidéo sous-titrée non disponible." };
  }

  try {
    // Nom de téléchargement : base du fichier source + "-sous-titre.mp4".
    const base =
      (video.original_filename || "video")
        .replace(/\.[^.]+$/, "")
        .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
        .trim() || "video";
    const url = await presignGet(video.storage_key_burned, 3600, `${base}-sous-titre.mp4`);
    return { ok: true, url };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Lien indisponible.",
    };
  }
}

/**
 * Régénère la traduction (ou reformulation) d'une seule ligne via Claude.
 * Réutilise la même logique que le worker : transcription complète en contexte,
 * ton/registre préservés, contrainte de longueur sous-titre. Donne une
 * alternative à la version actuelle (pour que l'utilisateur ait un vrai choix).
 *
 * - En mode traduction (source ≠ cible) : retraduit la ligne source vers la cible.
 * - En mode transcription (source == cible, pas de `transcription_source`) :
 *   reformule/nettoie la ligne dans la même langue.
 *
 * Nécessite ANTHROPIC_API_KEY côté Vercel ; sinon message clair.
 */
export async function regenerateLine(
  videoId: string,
  index: number,
): Promise<{ ok: boolean; text?: string; error?: string }> {
  if (!isAnthropicConfigured()) {
    return {
      ok: false,
      error: "Régénération indisponible pour le moment (configuration manquante).",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { data: video } = await supabase
    .from("videos")
    .select("transcription_source, transcription_target, source_lang, target_lang")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return { ok: false, error: "Vidéo introuvable." };

  const sourceSegs = (video.transcription_source as Segment[] | null) ?? [];
  const targetSegs = (video.transcription_target as Segment[] | null) ?? [];
  const currentTarget = targetSegs[index]?.text ?? "";
  if (!currentTarget && sourceSegs.length === 0) {
    return { ok: false, error: "Ligne introuvable." };
  }

  const srcLang: Lang = isLang(video.source_lang) ? video.source_lang : "fr";
  const tgtLang: Lang = isLang(video.target_lang) ? video.target_lang : "en";
  const isTranslation = srcLang !== tgtLang;

  // Référence : la ligne source (mode traduction) ou la ligne cible actuelle.
  const sourceText = sourceSegs[index]?.text ?? "";
  const reference = isTranslation ? sourceText || currentTarget : currentTarget;
  if (!reference) return { ok: false, error: "Ligne vide." };

  // Contexte global = transcription cible complète (texte joint), borné.
  const context = targetSegs
    .map((s) => s.text)
    .join(" ")
    .slice(0, 6000);

  const langName = (c: Lang) => langLabel(c);

  const system = isTranslation
    ? `Tu es traducteur·rice professionnel·le de sous-titres ${langName(srcLang)}→${langName(tgtLang)} pour des créateurs vidéo. Tu proposes une formulation ALTERNATIVE, naturelle et fluide, de la traduction d'UNE seule réplique — surtout pas du mot-à-mot. ${REGISTER_RULES} Contrainte : reste court et lisible (idéalement ≤ 80 caractères). Réponds UNIQUEMENT par la nouvelle traduction, sans guillemets, sans préambule, sans ponctuation superflue.`
    : `Tu es correcteur·rice de sous-titres en ${langName(tgtLang)} pour des créateurs vidéo. Tu proposes une formulation ALTERNATIVE, plus naturelle et lisible, d'UNE seule réplique, dans la même langue, sans en changer le sens. Tu préserves le registre exact (familier, argot, soutenu…) — jamais d'adoucissement. Contrainte : reste court et lisible (idéalement ≤ 80 caractères). Réponds UNIQUEMENT par la nouvelle version, sans guillemets ni préambule.`;

  const user2 = [
    `Contexte (transcription complète, pour la cohérence) :`,
    `"""`,
    context,
    `"""`,
    ``,
    isTranslation
      ? `Réplique à traduire (${langName(srcLang)}) : « ${reference} »`
      : `Réplique à reformuler (${langName(tgtLang)}) : « ${reference} »`,
    currentTarget
      ? `Version actuelle à NE PAS répéter à l'identique : « ${currentTarget} »`
      : ``,
    ``,
    `Donne UNE seule alternative${isTranslation ? ` en ${langName(tgtLang)}` : ""}.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const out = await callClaude({
      system,
      user: user2,
      maxTokens: 300,
      temperature: 0.8,
    });
    // Nettoyage : enlève d'éventuels guillemets englobants.
    const cleaned = out.replace(/^["«»\s]+|["«»\s]+$/g, "").trim();
    if (!cleaned) return { ok: false, error: "Réponse vide, réessayez." };
    return { ok: true, text: cleaned };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Régénération impossible.",
    };
  }
}

/** Forme minimale d'une vidéo nécessaire pour générer une langue. */
type VideoForGen = {
  id: string;
  source_lang: string | null;
  target_lang: string | null;
};

/**
 * Renvoie les sous-titres d'une langue, en la GÉNÉRANT à la demande si absente
 * (puis mise en cache dans video_subtitles — jamais re-générée). Modèle éco A
 * « tout inclus » : c'est GRATUIT (aucun quota/crédit consommé). La timeline est
 * partagée (alignement 1:1 sur la transcription source).
 *
 * - lang == source parlée → transcription (copie de la source, sans Claude) ;
 * - sinon → traduction source→lang via Claude (RÈGLE D'OR) + découpe CJK/RTL.
 */
async function ensureLanguageSegments(
  supabase: SupabaseClient<Database>,
  video: VideoForGen,
  lang: Lang,
): Promise<{ segments: Segment[]; generated: boolean; userEdited: boolean }> {
  // Déjà en cache ?
  const { data: existing } = await supabase
    .from("video_subtitles")
    .select("segments, user_edited")
    .eq("video_id", video.id)
    .eq("lang", lang)
    .maybeSingle();
  const cached = existing?.segments as Segment[] | undefined;
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return { segments: cached, generated: false, userEdited: !!existing!.user_edited };
  }

  const srcLang: Lang = isLang(video.source_lang) ? video.source_lang : "fr";
  // Base = transcription source, depuis `video_subtitles`. Les colonnes jsonb
  // legacy ne sont lues QU'EN DERNIER RECOURS (vidéos antérieures à la migration
  // 024) : les charger d'office coûtait ~220 Ko à chaque bascule de langue.
  let base = await getSubtitle(supabase, video.id, srcLang);
  if (!base || base.length === 0) {
    const { data: legacy } = await supabase
      .from("videos")
      .select("transcription_source, transcription_target")
      .eq("id", video.id)
      .maybeSingle();
    base =
      (legacy?.transcription_source as Segment[] | null) ??
      (legacy?.transcription_target as Segment[] | null) ??
      [];
  }
  if (base.length === 0) {
    throw new Error("Aucun sous-titre source à traduire.");
  }

  let segments: Segment[];
  if (lang === srcLang) {
    // Transcription dans la langue parlée : pas de traduction. On conserve les
    // timings par mot RÉELS de la source si présents (withProratedWords les garde
    // tant que le texte n'a pas changé), sinon on les calcule au prorata.
    segments = base.map((s) =>
      withProratedWords(
        { start: s.start, end: s.end, text: s.text, speaker: s.speaker, words: s.words },
        lang,
      ),
    );
  } else {
    if (!isAnthropicConfigured()) {
      throw new Error("Génération indisponible pour le moment.");
    }
    const translated = await translateCuesBatched(
      base.map((s) => s.text),
      srcLang,
      lang,
    );
    // Claude renvoie du texte sans coupure de ligne → on rétablit la découpe
    // ≤ 2 lignes (par caractères pour le CJK) pour l'éditeur/lecteur/MP4. Le
    // locuteur (diarisation) est conservé tel quel (timeline partagée). Karaoké :
    // timings par mot répartis au prorata sur le texte traduit.
    segments = base.map((s, i) =>
      withProratedWords(
        {
          start: s.start,
          end: s.end,
          text: wrapLines(translated[i] ?? s.text, lang),
          speaker: s.speaker,
        },
        lang,
      ),
    );
  }

  const up = await upsertSubtitle(supabase, video.id, lang, segments, {
    userEdited: false,
    status: "ready",
  });
  if (!up.ok) throw new Error(up.error || "Échec d'enregistrement.");
  return { segments, generated: true, userEdited: false };
}

// Colonnes nécessaires pour générer une langue. Les colonnes jsonb legacy
// (transcription_source/target, ~110 Ko chacune) ne sont PLUS chargées d'office :
// la base de traduction vient de `video_subtitles`, et le repli legacy n'est lu
// que si cette table est vide (vidéos d'avant la migration 024).
const GEN_SELECT = "id, source_lang, target_lang, status";

/**
 * SONDE LÉGÈRE — quelles langues sont prêtes ? Rien d'autre.
 *
 * Avant, cette fonction renvoyait TOUS les segments de TOUTES les langues, et
 * l'éditeur l'appelait toutes les 4 secondes : jusqu'à ~1,1 Mo par appel, et
 * jusqu'à ~40 Mo retéléchargés pour une seule session d'édition. Elle ne renvoie
 * plus que la liste des langues et leur statut (quelques centaines d'octets).
 *
 * Les segments d'une langue se chargent à la demande, via getLanguageSegments.
 */
export async function listSubtitleLanguages(videoId: string): Promise<{
  ok: boolean;
  langs?: SubtitleLang[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  // RLS : la lecture ne renvoie que les sous-titres des vidéos de l'utilisateur,
  // inutile de vérifier la propriété par une requête supplémentaire.
  const langs = await listLanguages(supabase, videoId);
  return { ok: true, langs };
}

/**
 * Segments d'UNE langue déjà générée (cache éditeur). Ne génère rien : si la
 * langue n'existe pas encore, l'appelant passe par setSubtitleLanguage /
 * generateLanguage.
 */
export async function getLanguageSegments(
  videoId: string,
  lang: string,
): Promise<{ ok: boolean; segments?: Segment[]; error?: string }> {
  if (!isLang(lang)) return { ok: false, error: "Langue invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const segments = await getSubtitle(supabase, videoId, lang);
  if (!segments) return { ok: false, error: "Langue non générée." };
  return { ok: true, segments };
}

/**
 * Génère (ou renvoie le cache) les sous-titres d'une langue, SANS changer la
 * langue affichée. Utilisé pour la génération à la volée (exports, pré-chargement).
 * Gratuit (modèle éco A).
 */
export async function generateLanguage(
  videoId: string,
  lang: string,
): Promise<{ ok: boolean; segments?: Segment[]; generated?: boolean; error?: string }> {
  if (!isLang(lang)) return { ok: false, error: "Langue invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { data: video } = await supabase
    .from("videos")
    .select(GEN_SELECT)
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();
  if (!video) return { ok: false, error: "Vidéo introuvable." };
  if (video.status !== "done") {
    return { ok: false, error: "La vidéo n'est pas encore prête." };
  }

  try {
    const r = await ensureLanguageSegments(supabase, video as VideoForGen, lang);
    return { ok: true, segments: r.segments, generated: r.generated };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Génération impossible.",
    };
  }
}

/**
 * Change la langue des sous-titres AFFICHÉE : génère la langue si besoin (à la
 * demande + cache), la pose comme langue active (videos.target_lang) et met à
 * jour le miroir legacy transcription_target (que le worker burn lit). Comme le
 * MP4 incrusté actuel est dans l'ancienne langue, on réinitialise le burn.
 *
 * Gratuit (modèle éco A « tout inclus » — plus de facturation par langue).
 */
export async function setSubtitleLanguage(
  videoId: string,
  lang: string,
): Promise<{
  ok: boolean;
  segments?: Segment[];
  targetLang?: Lang;
  generated?: boolean;
  error?: string;
}> {
  if (!isLang(lang)) return { ok: false, error: "Langue invalide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { data: video } = await supabase
    .from("videos")
    .select(GEN_SELECT)
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();
  if (!video) return { ok: false, error: "Vidéo introuvable." };
  if (video.status !== "done") {
    return { ok: false, error: "La vidéo n'est pas encore prête." };
  }

  let r: { segments: Segment[]; generated: boolean; userEdited: boolean };
  try {
    r = await ensureLanguageSegments(supabase, video as VideoForGen, lang);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Génération impossible.",
    };
  }

  // Langue active + miroir legacy + reset burn. burn_status est une colonne
  // sensible (réservée à service_role, migration 015) → client admin.
  const admin = createAdminClient();
  const { error } = await admin
    .from("videos")
    .update({
      target_lang: lang,
      transcription_target: r.segments,
      user_edited: r.userEdited,
      burn_status: "idle",
      burn_error: null,
      storage_key_burned: null,
    })
    .eq("id", videoId);
  if (error) return { ok: false, error: "Erreur d'enregistrement, réessayez." };

  return { ok: true, segments: r.segments, targetLang: lang, generated: r.generated };
}

/**
 * Relance une vidéo en échec SANS refacturer les minutes (spec F03 : retry
 * gratuit). Remet la vidéo en file ('queued') : le worker la reprendra (le
 * fichier source et storage_key_source sont déjà en place). Réinitialise les
 * timestamps et l'erreur. lifetime_counted reste false (la vidéo n'a jamais
 * atteint 'done'), donc le comptage des minutes restera correct à la réussite.
 */
export async function retryVideo(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, retry_count")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video || video.status !== "failed") return;

  await supabase
    .from("videos")
    .update({
      status: "queued",
      error_message: null,
      processing_started_at: null,
      processing_completed_at: null,
      retry_count: (video.retry_count ?? 0) + 1,
    })
    .eq("id", videoId);

  revalidatePath(`/app/videos/${videoId}`);
}

/** Supprime une vidéo (ligne + fichiers storage Supabase + objets R2). */
export async function deleteVideo(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Récupère les clés réelles (R2) avant suppression de la ligne.
  const { data: video } = await supabase
    .from("videos")
    .select("storage_key_source, storage_key_burned, storage_key_preview")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  // 1. Vidéo source + MP4 incrusté + proxy d'aperçu → R2.
  await deleteObjects([
    video?.storage_key_source ?? null,
    video?.storage_key_burned ?? burnedKey(user.id, videoId),
    video?.storage_key_preview ?? previewKey(user.id, videoId),
  ]);

  // 2. Sous-titres (.srt/.vtt) → Supabase Storage.
  const folder = videoFolder(user.id, videoId);
  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder);
  if (files && files.length > 0) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(files.map((f) => `${folder}/${f.name}`));
  }

  await supabase.from("videos").delete().eq("id", videoId).eq("user_id", user.id);

  revalidatePath("/app/videos");
  revalidatePath("/app/dashboard");
}
