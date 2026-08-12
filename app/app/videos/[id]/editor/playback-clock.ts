"use client";

/**
 * Horloge de lecture — le temps NE PASSE PLUS PAR REACT.
 *
 * ─── Pourquoi ce module existe ────────────────────────────────────────────────
 * Avant, le lecteur appelait `setCurrentTime()` à chaque image (60 fois par
 * seconde) via une boucle `requestAnimationFrame`. Conséquence en cascade :
 *   1. tout l'éditeur (1 300 lignes) se re-rendait 60 fois par seconde ;
 *   2. la timeline recréait ses 400 à 700 blocs de sous-titres à chaque fois ;
 *   3. le thread principal saturait, la balise <video> perdait ses images, le
 *      son hoquetait, et il fallait recharger la page.
 *
 * Un éditeur vidéo ne peut pas faire passer son horloge par l'état d'un
 * framework : à 60 images/s, le budget est de 16 ms par image pour TOUT, or un
 * seul rendu React de cette taille en consomme plusieurs dizaines.
 *
 * ─── Le principe ──────────────────────────────────────────────────────────────
 * Une horloge minuscule, hors React, à laquelle on s'abonne :
 *   - le LECTEUR y publie le temps à chaque image (`set`) ;
 *   - la TIMELINE s'y abonne pour déplacer la tête de lecture en écrivant
 *     directement un `transform` CSS — zéro rendu React ;
 *   - l'ÉDITEUR s'y abonne pour ne mettre à jour son état QUE lorsque le
 *     sous-titre actif change (quelques fois par seconde, pas soixante).
 *
 * `time` reste lisible à tout moment de façon synchrone (`clock.time`), ce qui
 * évite d'avoir à transporter le temps dans les dépendances des callbacks.
 */

export type ClockListener = (time: number) => void;

export class PlaybackClock {
  private t = 0;
  private listeners = new Set<ClockListener>();

  /** Temps courant (s), lisible synchroniquement — jamais périmé. */
  get time(): number {
    return this.t;
  }

  /**
   * Publie un nouveau temps. Appelé à la fréquence d'affichage par le lecteur :
   * ce chemin doit rester le plus court possible (aucune allocation, aucun
   * rendu). Une erreur dans un abonné ne doit jamais interrompre la lecture.
   */
  set(time: number): void {
    if (!Number.isFinite(time) || time === this.t) return;
    this.t = time;
    for (const listener of this.listeners) {
      try {
        listener(time);
      } catch {
        /* un abonné cassé ne doit pas figer la lecture */
      }
    }
  }

  /** S'abonne au temps. Renvoie la fonction de désabonnement. */
  subscribe(listener: ClockListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/**
 * Index du cue actif à l'instant `time`, ou -1.
 *
 * Optimisé pour l'appel à 60 Hz : on teste d'abord l'index précédent et son
 * voisin de droite (le cas de très loin le plus fréquent en lecture continue),
 * et on ne retombe sur la recherche dichotomique que lors d'un saut (scrub,
 * clic sur un bloc). Une recherche linéaire sur 700 cues, soixante fois par
 * seconde, coûtait à elle seule plusieurs millisecondes par image.
 */
export function findActiveIndex(
  cues: { start: number; end: number }[],
  time: number,
  hint: number,
): number {
  const n = cues.length;
  if (n === 0) return -1;

  // 1) Chemin rapide : on est encore dans le même cue, ou on vient d'entrer
  //    dans le suivant.
  if (hint >= 0 && hint < n) {
    const c = cues[hint]!;
    if (time >= c.start && time < c.end) return hint;
    const next = cues[hint + 1];
    if (next && time >= next.start && time < next.end) return hint + 1;
  }

  // 2) Saut : recherche dichotomique sur les débuts (les cues sont triés).
  let lo = 0;
  let hi = n - 1;
  let candidate = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid]!.start <= time) {
      candidate = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (candidate >= 0 && time < cues[candidate]!.end) return candidate;
  return -1;
}
