/**
 * Conventions de clés de stockage objet (provider-agnostic) + validations upload.
 *
 * Répartition des providers (depuis la migration R2) :
 *   - Vidéo source `source.{ext}` et `burned.mp4` → **Cloudflare R2** (cf. lib/r2.ts)
 *     car le plan Supabase Free plafonne les uploads à 50 Mo ; R2 = 10 Go + egress
 *     gratuit (le worker GCP télécharge sans frais).
 *   - Sous-titres `subtitles.srt`/`.vtt` (quelques Ko) → **Supabase Storage** (bucket
 *     'videos'). L'audio extrait reste local sur la VM (non stocké).
 * Les fonctions de clé ci-dessous sont communes aux deux providers.
 *
 * Convention de chemins (clés de stockage) :
 *   {user_id}/{video_id}/source.{ext}    — vidéo uploadée (R2)
 *   {user_id}/{video_id}/audio.mp3       — audio extrait (worker, local)
 *   {user_id}/{video_id}/subtitles.srt   — sous-titres (Supabase)
 *   {user_id}/{video_id}/subtitles.vtt   — sous-titres (Supabase)
 *   {user_id}/{video_id}/burned.mp4      — vidéo finale incrustée (R2, différé)
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

export const ACCEPTED_VIDEO_FORMATS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "video/webm": "webm",
};

// Audio / podcast : le worker extrait l'audio de n'importe quelle source (ffmpeg),
// donc on accepte les formats audio courants au même titre que la vidéo.
export const ACCEPTED_AUDIO_FORMATS: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/opus": "opus",
  "audio/webm": "weba",
};

export const ACCEPTED_FORMATS: Record<string, string> = {
  ...ACCEPTED_VIDEO_FORMATS,
  ...ACCEPTED_AUDIO_FORMATS,
};

export const ACCEPTED_VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm"];
export const ACCEPTED_AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "flac",
  "opus",
  "weba",
];
export const ACCEPTED_EXTENSIONS = [
  ...ACCEPTED_VIDEO_EXTENSIONS,
  ...ACCEPTED_AUDIO_EXTENSIONS,
];

/** Vrai si l'extension correspond à un format audio (podcast). */
export function isAudioExtension(ext: string): boolean {
  return ACCEPTED_AUDIO_EXTENSIONS.includes(ext.replace(/^\./, "").toLowerCase());
}

/** Vrai si le fichier est un fichier audio (MIME ou extension). */
export function isAudioFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return file.type.startsWith("audio/") || isAudioExtension(ext);
}

/**
 * Valide un fichier vidéo OU audio côté client avant upload.
 * Retourne null si OK, ou un message d'erreur en français.
 */
export function validateVideoFile(file: File): string | null {
  // Format : on accepte par MIME type ou par extension (certains navigateurs
  // ne renseignent pas le MIME pour .mkv / certains audios)
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeOk = file.type in ACCEPTED_FORMATS;
  const extOk = ACCEPTED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return `Format non supporté. Vidéo : ${ACCEPTED_VIDEO_EXTENSIONS.join(", ").toUpperCase()} · Audio : ${ACCEPTED_AUDIO_EXTENSIONS.join(", ").toUpperCase()}.`;
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
 * Lit la durée d'un média (vidéo OU audio) côté client. Pour un fichier audio on
 * utilise un élément <audio> (un <video> ne charge pas toujours les métadonnées
 * d'un .mp3/.wav). Retourne la durée en secondes, ou null si illisible.
 */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(isAudioFile(file) ? "audio" : "video");
    el.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(url);
      el.remove();
    };

    el.onloadedmetadata = () => {
      const duration = el.duration;
      cleanup();
      resolve(Number.isFinite(duration) ? duration : null);
    };
    el.onerror = () => {
      cleanup();
      resolve(null);
    };

    el.src = url;
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
