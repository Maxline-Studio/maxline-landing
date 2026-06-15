import type { CSSProperties } from "react";

/**
 * Style des sous-titres personnalisable dans l'éditeur. S'applique à l'aperçu
 * (overlay du lecteur) et alimentera l'incrustation MP4 (différée). NB : les
 * exports .srt/.txt ne portent pas de style (limitation du format).
 */

export type SubtitleFont =
  | "inter"
  | "fraunces"
  | "montserrat"
  | "anton"
  | "caveat";
export type SubtitleSize = "s" | "m" | "l";
export type SubtitleMode = "background" | "outline";
export type SubtitleColor = "black" | "white" | "rouge" | "encre" | "vert";
/** Distinction des voix (diarisation) : aucune (blanc), couleur du texte, ou
 * couleur du fond/contour, au choix de l'utilisateur. */
export type SubtitleSpeakerMode = "off" | "text" | "box";

export type SubtitleStyle = {
  font: SubtitleFont;
  size: SubtitleSize;
  mode: SubtitleMode;
  color: SubtitleColor;
  /** Comment différencier les locuteurs (par défaut : aucune → texte blanc). */
  speakerMode: SubtitleSpeakerMode;
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  font: "inter",
  size: "m",
  mode: "background",
  color: "black",
  speakerMode: "off",
};

export const FONT_OPTIONS: { id: SubtitleFont; label: string }[] = [
  { id: "inter", label: "Inter" },
  { id: "fraunces", label: "Fraunces" },
  { id: "montserrat", label: "Montserrat" },
  { id: "anton", label: "Anton" },
  { id: "caveat", label: "Caveat" },
];

export const COLOR_OPTIONS: { id: SubtitleColor; label: string; hex: string }[] = [
  { id: "black", label: "Noir", hex: "#1A1814" },
  { id: "white", label: "Blanc", hex: "#F8F4E9" },
  { id: "rouge", label: "Rouge", hex: "#C8392F" },
  { id: "encre", label: "Bleu encre", hex: "#1D3557" },
  { id: "vert", label: "Vert", hex: "#2E7D5B" },
];

export const SIZE_OPTIONS: { id: SubtitleSize; label: string }[] = [
  { id: "s", label: "S" },
  { id: "m", label: "M" },
  { id: "l", label: "L" },
];

export const SPEAKER_MODE_OPTIONS: {
  id: SubtitleSpeakerMode;
  label: string;
}[] = [
  { id: "off", label: "Aucune" },
  { id: "text", label: "Couleur du texte" },
  { id: "box", label: "Couleur du fond" },
];

const FONT_VAR: Record<SubtitleFont, string> = {
  inter: "var(--font-inter)",
  fraunces: "var(--font-fraunces)",
  montserrat: "var(--font-montserrat)",
  anton: "var(--font-anton)",
  caveat: "var(--font-caveat)",
};

const COLOR_HEX: Record<SubtitleColor, string> = {
  black: "#1A1814",
  white: "#F8F4E9",
  rouge: "#C8392F",
  encre: "#1D3557",
  vert: "#2E7D5B",
};

const SIZE_SCALE: Record<SubtitleSize, number> = { s: 0.8, m: 1, l: 1.28 };

/** Renvoie le hex d'une couleur (pour les pastilles du panneau). */
export function subtitleColorHex(color: SubtitleColor): string {
  return COLOR_HEX[color];
}

/** Valide/normalise une valeur jsonb venue de la base. */
export function normalizeSubtitleStyle(raw: unknown): SubtitleStyle {
  const s =
    raw && typeof raw === "object" ? (raw as Partial<SubtitleStyle>) : {};
  return {
    font: s.font && FONT_VAR[s.font] ? s.font : DEFAULT_SUBTITLE_STYLE.font,
    size: s.size && SIZE_SCALE[s.size] ? s.size : DEFAULT_SUBTITLE_STYLE.size,
    mode: s.mode === "outline" ? "outline" : "background",
    color:
      s.color && COLOR_HEX[s.color] ? s.color : DEFAULT_SUBTITLE_STYLE.color,
    speakerMode:
      s.speakerMode === "text" || s.speakerMode === "box"
        ? s.speakerMode
        : "off",
  };
}

/**
 * Surcharge CSS à appliquer pour un locuteur donné (diarisation), selon le mode
 * choisi. `speakerHex` = couleur du locuteur (null pour le locuteur principal ou
 * si distinction désactivée) → renvoie {} (texte blanc/style par défaut).
 */
export function speakerOverrideCss(
  style: SubtitleStyle,
  speakerHex: string | null,
): CSSProperties {
  if (!speakerHex || style.speakerMode === "off") return {};
  if (style.speakerMode === "text") {
    return { color: speakerHex };
  }
  // "box" : la couleur du locuteur habille le fond (ou le contour), texte foncé
  // lisible (la palette de voix est claire).
  if (style.mode === "background") {
    return { backgroundColor: speakerHex, color: "#1A1814" };
  }
  return {
    WebkitTextStroke: `0.06em ${speakerHex}`,
    color: "#F8F4E9",
  } as CSSProperties;
}

/** Calcule le style CSS de l'overlay de sous-titre.
 * La taille de police combine cqw (s'adapte à la largeur du lecteur) et un
 * multiplicateur `--sub-scale` (S/M/L). En plein écran, une règle dédiée
 * (globals.css) augmente la base mais réutilise le même `--sub-scale`. */
export function overlayStyleCss(style: SubtitleStyle): CSSProperties {
  const accent = COLOR_HEX[style.color];
  const isLight = style.color === "white";
  const contrast = isLight ? "#1A1814" : "#F8F4E9";

  const base: CSSProperties = {
    fontFamily: FONT_VAR[style.font],
    fontWeight: 600,
    fontSize: "calc(clamp(0.78rem, 3.2cqw, 1.1rem) * var(--sub-scale, 1))",
    lineHeight: 1.25,
    maxWidth: "92%",
    padding: "0.2em 0.55em",
    borderRadius: "0.18em",
    ["--sub-scale" as string]: String(SIZE_SCALE[style.size]),
  } as CSSProperties;

  if (style.mode === "background") {
    return { ...base, backgroundColor: accent, color: contrast };
  }
  return {
    ...base,
    background: "transparent",
    color: contrast,
    WebkitTextStroke: `0.055em ${accent}`,
    paintOrder: "stroke fill",
    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
  } as CSSProperties;
}
