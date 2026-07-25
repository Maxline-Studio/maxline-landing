/**
 * Types & libellés partagés du pipeline vidéo (statuts, segments, étapes).
 *
 * Le vrai worker tourne sur la VM (cf. code/worker/) ; ce fichier ne contient
 * que les types et libellés partagés par l'app (liste, détail, éditeur, badges).
 * Le format `Segment` est identique à celui produit par le worker.
 */

/** Mot (token d'affichage) horodaté pour le karaoké mot-à-mot. Slots CONTIGUS
 * (`end` d'un mot = `start` du suivant). `text` = token tel qu'affiché → s'aligne
 * 1:1 avec le texte du cue découpé sur les espaces. Cf. worker karaoke.ts. */
export type WordTiming = {
  text: string;
  start: number;
  end: number;
};

export type Segment = {
  start: number;
  end: number;
  text: string;
  /** Index du locuteur (diarisation) si connu : couleur/découpe par voix. */
  speaker?: number;
  /** Timings par mot (karaoké), optionnel. Absent pour le CJK et les vidéos
   * d'avant le karaoké → le lecteur retombe alors sur l'affichage classique. */
  words?: WordTiming[];
};

/**
 * Colonnes à sélectionner pour AFFICHER UNE LISTE de vidéos (page « Mes vidéos »,
 * tableau de bord).
 *
 * Ne JAMAIS faire `select("*")` sur `videos` : la table porte deux colonnes jsonb
 * (`transcription_source` / `transcription_target`) qui pèsent ~110 Ko par langue
 * et par vidéo. Un `select("*")` sur 20 vidéos transférait plusieurs mégaoctets
 * depuis l'Irlande… pour afficher un nom de fichier et un badge de statut.
 */
export const VIDEO_LIST_COLUMNS =
  "id, original_filename, duration_seconds, duration_minutes, status, uploaded_at";

/** Forme minimale d'une vidéo dans une liste (cf. VIDEO_LIST_COLUMNS). */
export type VideoListItem = {
  id: string;
  original_filename: string;
  duration_seconds: number | null;
  duration_minutes: number | null;
  status: string;
  uploaded_at: string;
};

/**
 * Colonnes de la page détail / éditeur. Exclut `transcription_source` et
 * `transcription_target` : les sous-titres viennent de `video_subtitles`, langue
 * par langue et à la demande (cf. lib/subtitles-store.ts).
 */
export const VIDEO_DETAIL_COLUMNS = [
  "id",
  "user_id",
  "original_filename",
  "duration_seconds",
  "size_bytes",
  "format",
  "status",
  "error_message",
  "retry_count",
  "uploaded_at",
  "processing_started_at",
  "processing_completed_at",
  "storage_key_source",
  "storage_key_preview",
  "storage_key_burned",
  "subtitle_style",
  "source_lang",
  "target_lang",
  "source_lang_auto",
  "target_same_as_source",
  "user_edited",
  "burn_status",
  "burn_error",
  "burn_progress",
].join(", ");

/** Forme de la vidéo passée à l'éditeur (cf. VIDEO_DETAIL_COLUMNS). */
export type VideoDetail = {
  id: string;
  user_id: string;
  original_filename: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  format: string | null;
  status: string;
  error_message: string | null;
  retry_count: number;
  uploaded_at: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  storage_key_source: string | null;
  storage_key_preview: string | null;
  storage_key_burned: string | null;
  subtitle_style: unknown;
  source_lang: string;
  target_lang: string;
  source_lang_auto: boolean;
  target_same_as_source: boolean;
  user_edited: boolean;
  burn_status: string;
  burn_error: string | null;
  burn_progress: number;
};

export type VideoStatus =
  | "queued"
  | "extracting_audio"
  | "transcribing"
  | "translating"
  | "aligning"
  | "generating_subtitles"
  | "burning_in"
  | "done"
  | "failed"
  | "cancelled";

/** Libellé humain (FR) de chaque étape du pipeline. */
export const STAGE_LABELS: Record<VideoStatus, string> = {
  queued: "En attente",
  extracting_audio: "Extraction de l'audio",
  transcribing: "Transcription",
  translating: "Traduction",
  aligning: "Alignement des sous-titres",
  generating_subtitles: "Génération des sous-titres",
  burning_in: "Incrustation vidéo",
  done: "Terminé",
  failed: "Échec",
  cancelled: "Annulé",
};

/** Progression indicative (0-100) par étape, pour la barre de suivi. */
export const STAGE_PROGRESS: Record<VideoStatus, number> = {
  queued: 5,
  extracting_audio: 20,
  transcribing: 45,
  translating: 70,
  aligning: 82,
  generating_subtitles: 92,
  burning_in: 97,
  done: 100,
  failed: 0,
  cancelled: 0,
};
