/**
 * Mise en correspondance de sous-titres entre deux langues — PAR LE TEMPS.
 *
 * ─── Pourquoi pas par l'index ────────────────────────────────────────────────
 * L'application faisait correspondre la ligne source et la ligne cible par leur
 * POSITION dans le tableau. C'était faux dans deux cas, dont un très courant :
 *
 *  1. dès que l'utilisateur ajoute, divise ou fusionne une ligne dans
 *     l'éditeur, tous les index suivants se décalent — on affichait alors,
 *     sous une ligne, une phrase source sans aucun rapport, et « Régénérer »
 *     repartait de cette mauvaise phrase ;
 *  2. depuis la refonte du pipeline (traduction par phrases puis
 *     re-segmentation), deux langues n'ont plus forcément le même nombre de
 *     lignes — c'est même souhaitable, chaque langue ayant son propre rythme.
 *
 * Le temps, lui, ne se décale pas : deux lignes qui se recouvrent parlent de la
 * même chose. C'est le seul repère fiable.
 */
import type { Segment } from "@/lib/video-types";

/**
 * Segment de `list` qui recouvre le plus `ref` dans le temps, ou `null` si
 * aucun ne le recouvre. `list` est supposée triée par `start` (invariant de
 * l'éditeur et du pipeline).
 */
export function findByOverlap(
  list: Segment[],
  ref: Pick<Segment, "start" | "end"> | undefined | null,
): Segment | null {
  if (!ref || list.length === 0) return null;
  let best: Segment | null = null;
  let bestOverlap = 0;
  for (const s of list) {
    if (s.start >= ref.end) break; // liste triée : plus rien ne peut recouvrir
    const overlap = Math.min(s.end, ref.end) - Math.max(s.start, ref.start);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = s;
    }
  }
  return bestOverlap > 0 ? best : null;
}

/** Texte du segment correspondant, ou chaîne vide. Confort d'appel. */
export function textByOverlap(
  list: Segment[],
  ref: Pick<Segment, "start" | "end"> | undefined | null,
): string {
  return findByOverlap(list, ref)?.text ?? "";
}
