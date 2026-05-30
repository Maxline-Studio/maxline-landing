"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sourceKey, videoFolder, STORAGE_BUCKET } from "@/lib/storage";
import type { VideoStatus, Segment } from "@/lib/mock-worker";
import type { SubtitleStyle } from "@/lib/subtitle-style";

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

  // NB (Sprint 3) : on ne persiste PAS storage_key_source ici. Cette colonne est
  // le "signal de prise en charge" du worker : il ne traite que les vidéos dont
  // storage_key_source est renseigné — ce que fait markVideoUploaded UNE FOIS
  // l'upload terminé et les minutes consommées. Cela évite qu'une vidéo dont
  // l'upload a été abandonné (ou les minutes non décomptées) soit traitée.
  return { ok: true, videoId: video.id, storageKey: key };
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

  await supabase
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
 * Sauvegarde les sous-titres anglais édités par l'utilisateur.
 * Marque user_edited=true. Appelée par l'auto-save et le bouton manuel.
 */
export async function saveTranscriptionEn(
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
      transcription_en: segments,
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
 * Régénère la traduction d'une seule ligne.
 * TODO (différé Sprint 3) : brancher sur Claude (comme le worker) pour une vraie
 * reformulation contextuelle. Nécessite ANTHROPIC_API_KEY côté Vercel. En
 * attendant, reformulation déterministe légère (placeholder).
 */
export async function regenerateLine(
  videoId: string,
  index: number,
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { data: video } = await supabase
    .from("videos")
    .select("transcription_fr, transcription_en")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (!video) return { ok: false, error: "Vidéo introuvable." };

  const frSegs = (video.transcription_fr as Segment[]) || [];
  const fr = frSegs[index]?.text || "";

  // Mock : 3 variations de style possibles. Le vrai OPUS-MT remplacera ça.
  const variations = [
    fr, // fallback : renvoie le FR si pas de variation (ne devrait pas arriver)
  ];
  // Variation simple basée sur un dictionnaire de reformulations légères
  const enSegs = (video.transcription_en as Segment[]) || [];
  const currentEn = enSegs[index]?.text || "";
  const alt = mockAlternativeTranslation(currentEn);

  return { ok: true, text: alt || variations[0] };
}

/** Reformulation mock d'une traduction (sera remplacée par OPUS-MT). */
function mockAlternativeTranslation(en: string): string {
  const map: Record<string, string> = {
    "Hi everyone, I hope you're doing great!":
      "Hey everybody, hope you're all doing well!",
    "Today, we're diving into a topic close to my heart.":
      "Today we're tackling a subject that really matters to me.",
    "Before we start, don't forget to subscribe.":
      "Before we begin, make sure to hit subscribe.",
    "So, the first thing to understand is this.":
      "Now, here's the first thing you need to grasp.",
    "Let me show you exactly how I do it.":
      "Here's precisely how I go about it.",
    "And here, you can see the result on screen.":
      "And there, the result appears on screen.",
    "Honestly, it's simpler than you'd think.":
      "Frankly, it's easier than it looks.",
    "A little tip that few people know about.":
      "A small trick most people aren't aware of.",
    "Pay close attention to this step, it's crucial.":
      "Watch this step carefully — it's essential.",
    "If you enjoyed this, leave a comment.":
      "Liked it? Drop a comment below.",
    "See you very soon for the next part.":
      "Catch you soon for what's next.",
    "Thanks for watching to the end, see you soon!":
      "Thanks for sticking around — see you next time!",
  };
  return map[en] || en;
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
