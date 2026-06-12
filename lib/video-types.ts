/**
 * Types & libellés partagés du pipeline vidéo (statuts, segments, étapes).
 *
 * Le vrai worker tourne sur la VM (cf. code/worker/) ; ce fichier ne contient
 * que les types et libellés partagés par l'app (liste, détail, éditeur, badges).
 * Le format `Segment` est identique à celui produit par le worker.
 */

export type Segment = {
  start: number;
  end: number;
  text: string;
  /** Index du locuteur (diarisation) si connu : couleur/découpe par voix. */
  speaker?: number;
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
