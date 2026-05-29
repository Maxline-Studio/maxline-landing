/**
 * Abstraction de stockage objet, provider-agnostic.
 *
 * Implémentation actuelle : Supabase Storage (bucket 'videos').
 * Migration future : Cloudflare R2 (zéro egress) — il suffira de réécrire
 * les fonctions de ce fichier en gardant la même signature. Le reste de
 * l'app n'a aucune dépendance directe au provider.
 *
 * Convention de chemins (clés de stockage) :
 *   {user_id}/{video_id}/source.{ext}    — vidéo uploadée
 *   {user_id}/{video_id}/audio.mp3       — audio extrait (worker)
 *   {user_id}/{video_id}/subtitles.srt   — sous-titres
 *   {user_id}/{video_id}/subtitles.vtt
 *   {user_id}/{video_id}/burned.mp4      — vidéo finale incrustée
 */

export const STORAGE_BUCKET = "videos";

/** Construit la clé de stockage de la vidéo source. */
export function sourceKey(userId: string, videoId: string, ext: string): string {
  const cleanExt = ext.replace(/^\./, "").toLowerCase();
  return `${userId}/${videoId}/source.${cleanExt}`;
}

export function audioKey(userId: string, videoId: string): string {
  return `${userId}/${videoId}/audio.mp3`;
}

export function srtKey(userId: string, videoId: string): string {
  return `${userId}/${videoId}/subtitles.srt`;
}

export function vttKey(userId: string, videoId: string): string {
  return `${userId}/${videoId}/subtitles.vtt`;
}

export function burnedKey(userId: string, videoId: string): string {
  return `${userId}/${videoId}/burned.mp4`;
}

/** Préfixe du dossier de la vidéo (pour suppression récursive). */
export function videoFolder(userId: string, videoId: string): string {
  return `${userId}/${videoId}`;
}

// ─────────────────────────────────────────────────────────────────
//  Contraintes upload (cf. spec MVP F02)
// ─────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024; // 1 Go
export const MAX_DURATION_SECONDS = 30 * 60; // 30 minutes

export const ACCEPTED_FORMATS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "video/webm": "webm",
};

export const ACCEPTED_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm"];

/**
 * Valide un fichier vidéo côté client avant upload.
 * Retourne null si OK, ou un message d'erreur en français.
 */
export function validateVideoFile(file: File): string | null {
  // Format : on accepte par MIME type ou par extension (certains navigateurs
  // ne renseignent pas le MIME pour .mkv)
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeOk = file.type in ACCEPTED_FORMATS;
  const extOk = ACCEPTED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return `Format non supporté. Formats acceptés : ${ACCEPTED_EXTENSIONS.join(", ").toUpperCase()}.`;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeGo = (file.size / (1024 * 1024 * 1024)).toFixed(2);
    return `Fichier trop volumineux (${sizeGo} Go). Maximum : 1 Go.`;
  }

  if (file.size === 0) {
    return "Le fichier est vide.";
  }

  return null;
}

/** Extension normalisée d'un fichier (depuis le nom). */
export function fileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "mp4";
}

/**
 * Lit la durée d'une vidéo côté client via l'élément <video>.
 * Retourne la durée en secondes, ou null si illisible.
 */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.remove();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      resolve(Number.isFinite(duration) ? duration : null);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = url;
  });
}

/** Formate une durée en secondes vers "mm:ss" ou "h:mm:ss". */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
