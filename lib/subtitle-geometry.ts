/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  SOURCE UNIQUE DE LA GÉOMÉTRIE DES SOUS-TITRES                           ║
 * ║  Ce fichier existe en DEUX exemplaires, qui doivent rester IDENTIQUES :  ║
 * ║    • code/landing/lib/subtitle-geometry.ts        (rendu canvas)         ║
 * ║    • code/worker/src/pipeline/subtitle-geometry.ts (rendu ASS / libass)  ║
 * ║  Le test `code/worker/test/geometry-sync.test.ts` compare les deux et    ║
 * ║  ÉCHOUE s'ils divergent. Ne modifiez jamais l'un sans l'autre.           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── Pourquoi ce fichier ─────────────────────────────────────────────────────
 * Il existe deux moteurs de rendu des sous-titres, et il en existera toujours
 * deux : le navigateur dessine sur un canvas (chemin par défaut), le serveur
 * passe par libass (repli quand la machine ou la source ne s'y prêtent pas).
 * Un même utilisateur peut donc obtenir son MP4 par l'un ou par l'autre.
 *
 * Tant que les constantes vivaient en double, rien n'empêchait qu'une taille de
 * police corrigée d'un côté reste inchangée de l'autre — la « maladie de fond »
 * du projet, qui avait déjà produit une divergence de découpe 34/42. Le remède
 * n'est pas de la discipline, c'est un test qui casse.
 *
 * N'entrent ICI que les valeurs réellement PARTAGÉES. Ce qui est propre à un
 * moteur (le rembourrage de boîte du canvas, le crénage de libass) reste chez
 * lui : le prétendre partagé serait un faux accord.
 */

/** Taille de police = fraction de la plus PETITE dimension de l'image. */
export const SIZE_FRAC = { s: 0.045, m: 0.055, l: 0.07 } as const;

/** Épaisseur du contour, en fraction de la taille de police (mode « contour »). */
export const OUTLINE_MULT = { thin: 0.06, medium: 0.1, thick: 0.16 } as const;

/** Épaisseur du fond, en fraction de la taille de police (mode « boîte »). */
export const BOX_OUTLINE_MULT = 0.18;

/** Opacité du fond, de 0 (invisible) à 1 (opaque). */
export const BG_ALPHA = { full: 1, medium: 0.62, light: 0.38 } as const;

/** Marges latérales et verticale, en fraction de l'image. */
export const MARGIN_FRAC = 0.06;

/** Décalage de l'ombre portée, en fraction de la taille de police. */
export const SHADOW_MULT = 0.06;

/** Taille de police minimale, en pixels, quelle que soit la définition. */
export const MIN_FONT_PX = 12;

/**
 * Opacité (0-1) → composante alpha ASS (00 = opaque, FF = transparent).
 *
 * Le worker a besoin d'hexadécimal, le canvas d'un nombre. On DÉRIVE l'un de
 * l'autre plutôt que de tenir deux tables : une table recopiée finit toujours
 * par diverger, et c'est exactement ce qu'on cherche à empêcher ici.
 */
export function assAlphaHex(opacity: number): string {
  const a = Math.round((1 - Math.min(1, Math.max(0, opacity))) * 255);
  return a.toString(16).toUpperCase().padStart(2, "0");
}

/**
 * Empreinte des valeurs ci-dessus. Deux copies qui produisent la même empreinte
 * sont d'accord ; c'est ce que vérifie le test de synchronisation.
 */
export function geometryFingerprint(): string {
  const parts = [
    `size:${SIZE_FRAC.s},${SIZE_FRAC.m},${SIZE_FRAC.l}`,
    `outline:${OUTLINE_MULT.thin},${OUTLINE_MULT.medium},${OUTLINE_MULT.thick}`,
    `box:${BOX_OUTLINE_MULT}`,
    `bg:${BG_ALPHA.full},${BG_ALPHA.medium},${BG_ALPHA.light}`,
    `margin:${MARGIN_FRAC}`,
    `shadow:${SHADOW_MULT}`,
    `minfont:${MIN_FONT_PX}`,
  ];
  return parts.join("|");
}
