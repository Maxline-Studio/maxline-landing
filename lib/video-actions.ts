"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sourceKey, burnedKey, videoFolder, STORAGE_BUCKET } from "@/lib/storage";
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
  getAllSubtitles,
  listLanguages,
  upsertSubtitle,
  type SubtitleLang,
} from "@/lib/subtitles-store";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CreateUploadResult =
  | { ok: true; videoId: string; storageKey: string }
  | { ok: false; error: string };

/**
 * Crée une ligne `videos` en statut 'queued' après vérification du quota.
 * Ne consomme PAS les minutes ici (consommation au démarrage du traitement,
 * cf. spec F08). Retourne l'id et la clé de stockage où le client doit
 * uploader le fichier directement.
 */
export async function createVideoUpload(params: {
  filename: string;
  durationSeconds: number;
  sizeBytes: number;
  format: string;
  /** Langue parlée, ou "auto" pour laisser le worker la détecter. */
  sourceLang?: Lang | "auto";
  /** Langue des sous-titres, ou "same" = dans la langue parlée (transcription). */
  targetLang?: Lang | "same";
  /** Noms propres à respecter (marques/prénoms/noms/URLs), séparés par virgules. */
  importantTerms?: string;
}): Promise<CreateUploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Session expirée. Reconnectez-vous." };
  }

  // Garde durée (30 min max)
  if (params.durationSeconds > 30 * 60) {
    return {
      ok: false,
      error: "Vidéo trop longue (max 30 minutes en MVP).",
    };
  }
  if (params.durationSeconds <= 0) {
    return { ok: false, error: "Durée de vidéo invalide." };
  }

  // Garde quota : minutes disponibles >= durée de la vidéo
  const { data: minutesAvailable, error: rpcError } = await supabase.rpc(
    "get_user_minutes_available",
    { p_user_id: user.id },
  );

  if (rpcError) {
    // get_user_minutes_available a son EXECUTE révoqué pour authenticated.
    // On lit donc directement le profil (couvert par RLS).
    const { data: profile } = await supabase
      .from("profiles")
      .select("quota_minutes_total, quota_minutes_used, credits_minutes")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { ok: false, error: "Profil introuvable." };
    }
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
  } else {
    const needed = params.durationSeconds / 60;
    if ((minutesAvailable as number) < needed) {
      return {
        ok: false,
        error: `Quota insuffisant. Il vous reste ${(minutesAvailable as number).toFixed(1)} min, cette vidéo en demande ${needed.toFixed(1)}.`,
      };
    }
  }

  // Récupérer la durée de rétention du profil pour delete_at
  const { data: prefs } = await supabase
    .from("profiles")
    .select("delete_after_days")
    .eq("id", user.id)
    .single();
  const deleteAfterDays = prefs?.delete_after_days ?? 30;
  const deleteAt = new Date(
    Date.now() + deleteAfterDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const ext = params.format;
  // Langue parlée. Mode "auto" = détection par le worker : on pose un placeholder
  // valide (écrasé par la langue détectée) + source_lang_auto. Sinon on valide
  // pour ne jamais insérer une langue hors liste (défaut FR).
  const autoDetect = params.sourceLang === "auto";
  const sourceLang: Lang =
    !autoDetect && isLang(params.sourceLang) ? params.sourceLang : "fr";
  // Cible. "same" = sous-titres dans la langue parlée (transcription). Si la
  // source est imposée, on résout tout de suite (cible = source) ; si elle est
  // auto-détectée, le worker résout après détection (flag + placeholder).
  const wantSameTarget = params.targetLang === "same";
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
    targetLang = isLang(params.targetLang) ? params.targetLang : "en";
  }

  // Insert la ligne video
  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      original_filename: params.filename,
      duration_seconds: params.durationSeconds,
      size_bytes: params.sizeBytes,
      format: ext,
      source_lang: sourceLang,
      target_lang: targetLang,
      source_lang_auto: autoDetect,
      target_same_as_source: targetSameAsSource,
      important_terms: (params.importantTerms || "").trim().slice(0, 600) || null,
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

  const key = sourceKey(user.id, video.id, ext);

  // NB (Sprint 3) : on ne persiste PAS storage_key_source ici. Cette colonne est
  // le "signal de prise en charge" du worker : il ne traite que les vidéos dont
  // storage_key_source est renseigné — ce que fait markVideoUploaded UNE FOIS
  // l'upload terminé et les minutes consommées. Cela évite qu'une vidéo dont
  // l'upload a été abandonné (ou les minutes non décomptées) soit traitée.
  return { ok: true, videoId: video.id, storageKey: key };
}

export type UploadUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Génère une URL PUT présignée (Cloudflare R2) pour que le navigateur uploade la
 * vidéo source directement, sans transiter par Vercel (limite de corps ~4,5 Mo) et
 * sans le plafond Supabase Free (50 Mo). La clé est imposée par le serveur depuis
 * la session → un utilisateur ne peut écrire que dans son propre dossier.
 */
export async function createSourceUploadUrl(
  videoId: string,
): Promise<UploadUrlResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  // La vidéo doit appartenir à l'utilisateur et être en attente d'upload.
  const { data: video } = await supabase
    .from("videos")
    .select("id, format, status")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video || video.status !== "queued") {
    return { ok: false, error: "Vidéo introuvable ou déjà traitée." };
  }

  try {
    const key = sourceKey(user.id, videoId, video.format || "mp4");
    const url = await presignPut(key);
    return { ok: true, url };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Préparation de l'upload impossible.",
    };
  }
}

/**
 * Appelé par le client une fois l'upload terminé.
 *  - consomme les minutes (quota d'abord, puis crédits)
 *  - renseigne storage_key_source : c'est LE signal qui met la vidéo à
 *    disposition du worker (qui poll les 'queued' avec storage_key_source).
 *
 * Le statut reste 'queued' : le worker (VM) le fera réellement avancer
 * (extracting_audio → … → done) et écrira la transcription. Aucune transcription
 * factice ici. Le worker ne touche jamais aux minutes (déjà décomptées ici).
 */
export async function markVideoUploaded(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, duration_seconds, format")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video || video.status !== "queued") return;

  const durationSeconds = Number(video.duration_seconds) || 0;
  const minutesNeeded = durationSeconds / 60;

  // Consommation des minutes (quota d'abord, puis crédits) via user client.
  // get_user_minutes_available/consume_user_minutes ont leur EXECUTE révoqué
  // pour authenticated, donc on fait la logique ici sous RLS.
  const { data: profile } = await supabase
    .from("profiles")
    .select("quota_minutes_total, quota_minutes_used, credits_minutes")
    .eq("id", user.id)
    .single();

  if (!profile) return;

  const quotaAvail = Math.max(
    profile.quota_minutes_total - profile.quota_minutes_used,
    0,
  );
  if (quotaAvail + profile.credits_minutes < minutesNeeded) {
    // Quota devenu insuffisant entre l'upload et le start (race rare)
    await supabase
      .from("videos")
      .update({
        status: "failed",
        error_message: "Quota insuffisant au démarrage du traitement.",
      })
      .eq("id", videoId);
    return;
  }

  let newQuotaUsed = profile.quota_minutes_used;
  let newCredits = profile.credits_minutes;
  if (quotaAvail >= minutesNeeded) {
    newQuotaUsed += minutesNeeded;
  } else {
    newQuotaUsed = profile.quota_minutes_total;
    newCredits -= minutesNeeded - quotaAvail;
  }

  // Colonnes sensibles (quota/crédits) : écriture via le client admin
  // (service_role). Le rôle `authenticated` n'a PAS le droit de modifier ces
  // colonnes directement (privilèges au niveau colonne, migration 015) → un
  // utilisateur ne peut pas se créditer des minutes via l'API.
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      quota_minutes_used: newQuotaUsed,
      credits_minutes: newCredits,
    })
    .eq("id", user.id);

  // Renseigne storage_key_source → met la vidéo à disposition du worker.
  // Le statut reste 'queued' ; le worker prend le relais.
  const key = sourceKey(user.id, videoId, video.format || "mp4");
  await supabase
    .from("videos")
    .update({ storage_key_source: key })
    .eq("id", videoId)
    .eq("status", "queued");

  revalidatePath("/app/videos");
  revalidatePath("/app/dashboard");
}

export type VideoStatusResult = {
  status: VideoStatus;
  errorMessage: string | null;
};

/**
 * Lit le statut RÉEL de la vidéo (mis à jour par le worker sur la VM). Appelée
 * en polling par la page détail. Lecture seule : c'est le worker qui fait
 * avancer le pipeline et écrit la transcription.
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
    .select("status, error_message")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return null;

  return {
    status: video.status as VideoStatus,
    errorMessage: video.error_message ?? null,
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

/** Lit l'état du burn (polling côté éditeur). */
export async function getBurnStatus(
  videoId: string,
): Promise<{ status: BurnStatus; error: string | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: video } = await supabase
    .from("videos")
    .select("burn_status, burn_error")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return null;
  return {
    status: (video.burn_status as BurnStatus) ?? "idle",
    error: video.burn_error ?? null,
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
  transcription_source: Segment[] | null;
  transcription_target: Segment[] | null;
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
  // Base = transcription source (table → repli colonnes legacy pour les vidéos
  // d'avant la migration / traitées avant le déploiement du worker).
  let base = await getSubtitle(supabase, video.id, srcLang);
  if (!base || base.length === 0) {
    base =
      (video.transcription_source as Segment[] | null) ??
      (video.transcription_target as Segment[] | null) ??
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

const GEN_SELECT =
  "id, source_lang, target_lang, transcription_source, transcription_target, status";

/**
 * Charge l'état multi-langue d'une vidéo : langues présentes (+ statut) et leurs
 * segments prêts, indexés par langue. Le lecteur l'appelle au montage puis en
 * polling court tant que les 10 langues ne sont pas encore générées (le worker
 * les pré-génère en arrière-plan après 'done') → les langues « s'allument » au
 * fur et à mesure et la bascule reste instantanée (cache client).
 */
export async function loadSubtitles(videoId: string): Promise<{
  ok: boolean;
  langs?: SubtitleLang[];
  segments?: Record<string, Segment[]>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  // RLS : la lecture ne renvoie que les sous-titres des vidéos de l'utilisateur.
  const { data: video } = await supabase
    .from("videos")
    .select("id")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();
  if (!video) return { ok: false, error: "Vidéo introuvable." };

  const [langs, segments] = await Promise.all([
    listLanguages(supabase, videoId),
    getAllSubtitles(supabase, videoId),
  ]);
  return { ok: true, langs, segments };
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

  // Récupère la clé source réelle (R2) avant suppression de la ligne.
  const { data: video } = await supabase
    .from("videos")
    .select("storage_key_source")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  // 1. Vidéo source + MP4 incrusté → R2.
  await deleteObjects([
    video?.storage_key_source ?? null,
    burnedKey(user.id, videoId),
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
