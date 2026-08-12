/**
 * Opérations pures sur les sous-titres de l'éditeur.
 *
 * Volontairement séparées des composants : ce sont les règles métier qui
 * décident où un sous-titre atterrit. Les garder pures les rend vérifiables
 * sans navigateur — c'est précisément la logique qui avait dérivé (une ligne
 * ajoutée se retrouvait à 2 secondes alors qu'on regardait la vidéo à 3 min).
 */

/** Durée confortable d'une ligne créée à la main (s), quand la place le permet. */
export const NEW_CUE_DURATION = 2;
/** Place minimale à réserver en toute fin de vidéo (s). */
export const MIN_NEW_CUE = 0.6;
/** Plancher absolu : une ligne ne peut pas être plus courte que ça (s). */
export const FLOOR_CUE = 0.2;

export type TimeSpan = { start: number; end: number };

/**
 * Où insérer une nouvelle ligne **à la tête de lecture** ?
 *
 * ─── La règle, en une phrase ──────────────────────────────────────────────────
 * **La ligne naît toujours là où l'utilisateur regarde.**
 *
 * Déclinaison :
 *  1. départ = la tête de lecture ;
 *  2. si la tête tombe DANS un sous-titre, on démarre juste après lui (on ne
 *     crée jamais une ligne à cheval sur une autre) ;
 *  3. fin = le premier de : début du sous-titre suivant, +2 s, fin de la vidéo ;
 *  4. si le trou disponible est court, **la ligne est courte** — on ne la
 *     déplace pas. Reculer pour « faire tenir » une durée confortable
 *     ramènerait le défaut qu'on corrige : une ligne qui apparaît ailleurs que
 *     là où on l'a demandée.
 *  5. seule exception : la toute fin de vidéo, où il n'y a rien après — on
 *     recule alors juste ce qu'il faut, au lieu d'abandonner en silence (le
 *     comportement d'origine).
 *
 * Renvoie `null` seulement si la vidéo est trop courte pour accueillir quoi que
 * ce soit.
 */
export function planInsertion(
  cues: TimeSpan[],
  playhead: number,
  duration: number,
): { index: number; start: number; end: number } | null {
  if (!(duration > MIN_NEW_CUE)) return null;

  // Règle 5 : en toute fin de vidéo, on recule pour laisser la place.
  const t = Math.max(0, Math.min(playhead, duration - MIN_NEW_CUE));

  // Position d'insertion = juste après le dernier cue qui commence avant nous.
  let index = cues.findIndex((c) => c.start > t);
  if (index === -1) index = cues.length;

  const prev = cues[index - 1];
  const next = cues[index];

  // Règle 2 : jamais à l'intérieur du sous-titre précédent.
  const start = Math.max(0, Math.min(prev ? Math.max(t, prev.end) : t, duration));
  const ceiling = next ? next.start : duration;

  // Règles 3 et 4 : on prend la place disponible, sans jamais déplacer le début.
  // Le plancher évite une ligne d'épaisseur nulle dans un trou minuscule (au
  // pire, un chevauchement de quelques centièmes que l'éditeur sait gérer).
  const end = Math.min(
    duration,
    Math.max(start + FLOOR_CUE, Math.min(start + NEW_CUE_DURATION, ceiling)),
  );

  return { index, start, end };
}
