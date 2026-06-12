// Couleur par LOCUTEUR (diarisation). Le locuteur 0 garde la couleur de texte
// par défaut ; les suivants reçoivent une couleur vive et lisible. DOIT rester
// synchronisé avec le worker (code/worker/src/pipeline/burn.ts SPEAKER_PALETTE).

export const SPEAKER_PALETTE = [
  "#FFE45C", // jaune
  "#5CC8FF", // bleu ciel
  "#7CFF8A", // vert
  "#FF9E5C", // orange
  "#FF7CC8", // rose
] as const;

/** Couleur d'un locuteur (null = locuteur 0 / inconnu → couleur par défaut). */
export function speakerColor(speaker?: number): string | null {
  if (typeof speaker !== "number" || speaker <= 0) return null;
  return SPEAKER_PALETTE[(speaker - 1) % SPEAKER_PALETTE.length]!;
}

/** Libellé court d'un locuteur (« Voix 1 », « Voix 2 »…). */
export function speakerLabel(speaker?: number): string {
  const n = typeof speaker === "number" ? speaker + 1 : 1;
  return `Voix ${n}`;
}

/** Nombre de locuteurs distincts dans une liste de segments. */
export function countSpeakers(
  segments: { speaker?: number }[],
): number {
  const set = new Set<number>();
  for (const s of segments) {
    if (typeof s.speaker === "number") set.add(s.speaker);
  }
  return set.size;
}
