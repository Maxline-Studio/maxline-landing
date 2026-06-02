"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sourceKey, burnedKey, videoFolder, STORAGE_BUCKET } from "@/lib/storage";
import { presignPut, deleteObjects } from "@/lib/r2";
import { isLang, type Lang } from "@/lib/langs";
import type { VideoStatus, Segment } from "@/lib/mock-worker";
import type { SubtitleStyle } from "@/lib/subtitle-style";
import { callClaude, isAnthropicConfigured } from "@/lib/anthropic";

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
  sourceLang?: Lang;
  targetLang?: Lang;
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
  // Langues (défaut FR→EN). On valide pour ne jamais insérer une langue hors liste.
  const sourceLang: Lang = isLang(params.sourceLang) ? params.sourceLang : "fr";
  const targetLang: Lang = isLang(params.targetLang) ? params.targetLang : "en";

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

  const { error } = await supabase
    .from("videos")
    .update({
      transcription_target: segments,
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

  const langName = (c: Lang) => (c === "en" ? "anglais" : "français");

  const system = isTranslation
    ? `Tu es traducteur·rice professionnel·le de sous-titres ${langName(srcLang)}→${langName(tgtLang)} pour des créateurs vidéo. Tu proposes une formulation ALTERNATIVE, naturelle et fluide, de la traduction d'UNE seule réplique — surtout pas du mot-à-mot. Tu préserves le ton, le registre et l'énergie. Contrainte : reste court et lisible (idéalement ≤ 80 caractères). Réponds UNIQUEMENT par la nouvelle traduction, sans guillemets, sans préambule, sans ponctuation superflue.`
    : `Tu es correcteur·rice de sous-titres en ${langName(tgtLang)} pour des créateurs vidéo. Tu proposes une formulation ALTERNATIVE, plus naturelle et lisible, d'UNE seule réplique, dans la même langue, sans en changer le sens. Contrainte : reste court et lisible (idéalement ≤ 80 caractères). Réponds UNIQUEMENT par la nouvelle version, sans guillemets ni préambule.`;

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
