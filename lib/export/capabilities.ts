/**
 * Géométrie et débit de la vidéo exportée.
 *
 * ─── Ce qui a disparu d'ici ──────────────────────────────────────────────────
 * Ce module abritait aussi une sonde `checkExportSupport()` qui interrogeait
 * `VideoEncoder.isConfigSupported` à la main. Elle a été retirée : mediabunny
 * fait la même chose (`getFirstEncodableVideoCodec`) en tenant compte du
 * conteneur de sortie, ce que notre sonde ignorait — elle pouvait donc valider
 * un encodeur pour un codec que le MP4 produit n'aurait pas accepté.
 *
 * Au passage, cette sonde portait l'argument sur lequel toute la refonte du
 * 12 août reposait : « la machine de l'utilisateur a un encodeur matériel ».
 * C'était vrai, et hors sujet. Mesuré le 18 août, l'encodeur tient
 * 240 images/s en 1080×1920 : il n'a jamais été le goulot d'étranglement.
 */

/** H.264 exige des dimensions paires. */
export function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

/**
 * Débit cible. Calé sur les recommandations des plateformes sociales : assez
 * généreux pour que le texte gravé reste net (c'est LE détail qui compte pour du
 * sous-titrage), sans produire un fichier absurde.
 */
export function bitrateFor(width: number, height: number, fps: number): number {
  const pixels = width * height;
  // ~0,09 bit par pixel et par image : net sur du texte, raisonnable en taille.
  const raw = pixels * fps * 0.09;
  return Math.round(Math.min(Math.max(raw, 1_500_000), 24_000_000));
}

/**
 * Dimensions de sortie : on plafonne le plus grand côté, sans jamais agrandir.
 * Même règle que le worker (BURN_MAX_DIM = 1920) → le fichier produit par le
 * navigateur et celui produit par le serveur ont la même définition.
 */
export function scaleToFit(
  width: number,
  height: number,
  maxDim = 1920,
): { width: number; height: number } {
  if (maxDim <= 0 || width <= 0 || height <= 0) return { width, height };
  const r = Math.min(1, maxDim / width, maxDim / height);
  if (r >= 1) return { width: even(width), height: even(height) };
  return { width: even(width * r), height: even(height * r) };
}
