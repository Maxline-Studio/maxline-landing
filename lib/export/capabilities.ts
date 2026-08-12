/**
 * Le navigateur sait-il graver la vidéo lui-même ?
 *
 * ─── Le problème qu'on résout ────────────────────────────────────────────────
 * L'incrustation MP4 tourne aujourd'hui sur une VM à 0,25 vCPU : x264 logiciel,
 * une file d'attente globale à un seul encodage, et un aller-retour
 * transatlantique. Les logs de production sont sans appel — un burn démarré à
 * 17:12 était encore en cours à 18:43, avant d'être abandonné.
 *
 * Or la machine de l'utilisateur a, elle, un encodeur MATÉRIEL (NVENC côté
 * NVIDIA, QuickSync côté Intel, VideoToolbox côté Apple) que l'API WebCodecs
 * expose directement. C'est ainsi que fonctionne un logiciel de montage : il
 * encode en local, à 5-20× le temps réel, sans réseau.
 *
 * Ce module répond à une seule question, honnêtement : « ici, maintenant,
 * est-ce possible ? » Si non, on retombe sur le serveur — jamais d'échec sec.
 */

export type ExportSupport =
  | { ok: true; codec: string; hardware: boolean }
  | { ok: false; reason: string };

/** Configurations tentées, de la plus compatible à la plus efficace.
 * `avc1.42…` = H.264 Baseline/Main/High — lisible partout (TikTok, Instagram,
 * YouTube, QuickTime). On ne propose PAS de VP9/AV1 : le fichier doit pouvoir
 * être déposé tel quel sur n'importe quelle plateforme. */
const CANDIDATES = [
  "avc1.640028", // High 4.0
  "avc1.4d0028", // Main 4.0
  "avc1.42001f", // Baseline 3.1
];

/** Les API strictement nécessaires sont-elles présentes ? */
export function hasWebCodecs(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { VideoEncoder?: unknown }).VideoEncoder ===
      "function" &&
    typeof (globalThis as { VideoFrame?: unknown }).VideoFrame === "function" &&
    typeof (globalThis as { AudioEncoder?: unknown }).AudioEncoder === "function"
  );
}

/**
 * Teste réellement l'encodeur pour les dimensions demandées.
 *
 * On ne se contente PAS de vérifier la présence de l'API : un navigateur peut
 * exposer `VideoEncoder` et refuser la configuration (dimensions trop grandes,
 * profil absent). `isConfigSupported` pose la question au système avant qu'on
 * promette quoi que ce soit à l'utilisateur.
 */
export async function checkExportSupport(
  width: number,
  height: number,
  fps = 30,
): Promise<ExportSupport> {
  if (!hasWebCodecs()) {
    return {
      ok: false,
      reason: "Ce navigateur ne sait pas encore encoder de vidéo localement.",
    };
  }
  if (width <= 0 || height <= 0) {
    return { ok: false, reason: "Dimensions vidéo inconnues." };
  }

  const VideoEncoderRef = (
    globalThis as unknown as { VideoEncoder: typeof VideoEncoder }
  ).VideoEncoder;

  for (const codec of CANDIDATES) {
    for (const acceleration of ["prefer-hardware", "no-preference"] as const) {
      try {
        const res = await VideoEncoderRef.isConfigSupported({
          codec,
          width: even(width),
          height: even(height),
          bitrate: bitrateFor(width, height, fps),
          framerate: fps,
          hardwareAcceleration: acceleration,
        });
        if (res.supported) {
          return {
            ok: true,
            codec,
            hardware: acceleration === "prefer-hardware",
          };
        }
      } catch {
        // Configuration refusée : on essaie la suivante.
      }
    }
  }
  return {
    ok: false,
    reason: "Aucun encodeur H.264 disponible sur cette machine.",
  };
}

/** H.264 exige des dimensions paires. */
export function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

/**
 * Débit cible. Calé sur les recommandations des plateformes sociales : assez
 * généreux pour que le texte gravé reste net (c'est LE détail qui compte pour
 * du sous-titrage), sans produire un fichier absurde.
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
