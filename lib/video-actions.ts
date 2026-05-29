"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sourceKey, videoFolder, srtKey, vttKey, STORAGE_BUCKET } from "@/lib/storage";
import {
  generateMockTranscription,
  computeStage,
  MOCK_TOTAL_SECONDS,
  type VideoStatus,
} from "@/lib/mock-worker";

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
  // Insert la ligne video
  const { data: video, error: insertError } = await supabase
    .from("videos")
    .insert({
      user_id: user.id,
      original_filename: params.filename,
      duration_seconds: params.durationSeconds,
      size_bytes: params.sizeBytes,
      format: ext,
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

  // Sauvegarde la clé source
  await supabase
    .from("videos")
    .update({ storage_key_source: key })
    .eq("id", video.id);

  return { ok: true, videoId: video.id, storageKey: key };
}

/**
 * Appelé par le client une fois l'upload terminé.
 * Démarre le traitement (MOCK Sprint 2) :
 *  - consomme les minutes (quota puis crédits)
 *  - génère une transcription factice (stockée pour l'éditeur)
 *  - passe le statut en 'extracting_audio' avec processing_started_at
 *
 * La progression ensuite est calculée à la volée par tickVideoProcessing
 * (state machine paresseuse basée sur le temps écoulé).
 *
 * Au Sprint 3, ce corps sera remplacé par un appel au worker Oracle Cloud.
 */
export async function markVideoUploaded(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, duration_seconds")
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

  await supabase
    .from("profiles")
    .update({
      quota_minutes_used: newQuotaUsed,
      credits_minutes: newCredits,
    })
    .eq("id", user.id);

  // Génère la transcription factice (sera affinée par le vrai worker plus tard)
  const transcription = generateMockTranscription(durationSeconds);

  await supabase
    .from("videos")
    .update({
      status: "extracting_audio",
      processing_started_at: new Date().toISOString(),
      transcription_fr: transcription.fr,
      transcription_en: transcription.en,
    })
    .eq("id", videoId);

  revalidatePath("/app/videos");
  revalidatePath("/app/dashboard");
}

export type VideoTickResult = {
  status: VideoStatus;
  progress: number;
};

/**
 * State machine paresseuse du worker MOCK. Appelée en polling par la page
 * détail. Calcule l'étape selon le temps écoulé depuis processing_started_at
 * et, à la fin, marque la vidéo 'done' (+ clés de sous-titres + bump
 * lifetime_minutes_used pour la progression Atelier).
 */
export async function tickVideoProcessing(
  videoId: string,
): Promise<VideoTickResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, processing_started_at, duration_seconds")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return null;

  // États terminaux : on renvoie tel quel
  if (
    video.status === "done" ||
    video.status === "failed" ||
    video.status === "cancelled"
  ) {
    return {
      status: video.status as VideoStatus,
      progress: video.status === "done" ? 100 : 0,
    };
  }

  if (video.status === "queued" || !video.processing_started_at) {
    return { status: "queued", progress: 0 };
  }

  const elapsed =
    (Date.now() - new Date(video.processing_started_at).getTime()) / 1000;
  const { status, progress } = computeStage(elapsed);

  if (status === "done" && elapsed >= MOCK_TOTAL_SECONDS) {
    // Transition finale : marque done + clés sous-titres + bump lifetime
    const durationMinutes = (Number(video.duration_seconds) || 0) / 60;

    await supabase
      .from("videos")
      .update({
        status: "done",
        processing_completed_at: new Date().toISOString(),
        storage_key_srt: srtKey(user.id, videoId),
        storage_key_vtt: vttKey(user.id, videoId),
      })
      .eq("id", videoId);

    // Bump lifetime_minutes_used (progression Atelier ; recalcul du rang en S6)
    const { data: profile } = await supabase
      .from("profiles")
      .select("lifetime_minutes_used")
      .eq("id", user.id)
      .single();
    if (profile) {
      await supabase
        .from("profiles")
        .update({
          lifetime_minutes_used:
            profile.lifetime_minutes_used + durationMinutes,
        })
        .eq("id", user.id);
    }

    revalidatePath("/app/videos");
    revalidatePath("/app/dashboard");
    return { status: "done", progress: 100 };
  }

  // Met à jour le statut courant si changé (pour cohérence liste/dashboard)
  if (status !== video.status) {
    await supabase.from("videos").update({ status }).eq("id", videoId);
  }

  return { status, progress };
}

/**
 * Relance une vidéo en échec SANS refacturer les minutes (spec F03 : retry
 * gratuit). Régénère la transcription et redémarre la state machine mock.
 */
export async function retryVideo(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: video } = await supabase
    .from("videos")
    .select("id, status, duration_seconds, retry_count")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video || video.status !== "failed") return;

  const transcription = generateMockTranscription(
    Number(video.duration_seconds) || 0,
  );

  await supabase
    .from("videos")
    .update({
      status: "extracting_audio",
      error_message: null,
      processing_started_at: new Date().toISOString(),
      retry_count: (video.retry_count ?? 0) + 1,
      transcription_fr: transcription.fr,
      transcription_en: transcription.en,
    })
    .eq("id", videoId);

  revalidatePath(`/app/videos/${videoId}`);
}

/** Supprime une vidéo (ligne + fichiers storage). */
export async function deleteVideo(videoId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Supprime les fichiers du dossier
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
