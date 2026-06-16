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
/** Couleur du texte : « auto » = contraste calculé sur le fond ; sinon palette. */
export type SubtitleTextColor = SubtitleColor | "auto";
export type SubtitlePosition = "bottom" | "center" | "top";
export type SubtitleOutlineWidth = "thin" | "medium" | "thick";
export type SubtitleBgOpacity = "full" | "medium" | "light";
/** Animation karaoké mot-à-mot : aucune / remplissage progressif / mot courant. */
export type SubtitleAnimation = "none" | "fill" | "word";
/** Couleur de surlignage du karaoké. */
export type SubtitleHighlight = "jaune" | "rouge" | "vert" | "bleu" | "blanc";

export type SubtitleStyle = {
  font: SubtitleFont;
  size: SubtitleSize;
  mode: SubtitleMode;
  color: SubtitleColor;
  /** Comment différencier les locuteurs (par défaut : aucune → texte blanc). */
  speakerMode: SubtitleSpeakerMode;
  /** Couleur du texte (indépendante du fond) ; « auto » = contraste. */
  textColor: SubtitleTextColor;
  position: SubtitlePosition;
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  /** Épaisseur du contour (mode contour). */
  outlineWidth: SubtitleOutlineWidth;
  shadow: boolean;
  /** Opacité de la boîte (mode fond). */
  bgOpacity: SubtitleBgOpacity;
  /** Animation karaoké (par défaut : aucune). */
  animation: SubtitleAnimation;
  /** Couleur de surlignage du karaoké. */
  highlight: SubtitleHighlight;
};

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  font: "inter",
  size: "m",
  mode: "background",
  color: "black",
  speakerMode: "off",
  textColor: "auto",
  position: "bottom",
  bold: false,
  italic: false,
  uppercase: false,
  outlineWidth: "medium",
  shadow: false,
  bgOpacity: "full",
  animation: "none",
  highlight: "jaune",
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

export const POSITION_OPTIONS: { id: SubtitlePosition; label: string }[] = [
  { id: "bottom", label: "Bas" },
  { id: "center", label: "Milieu" },
  { id: "top", label: "Haut" },
];

export const TEXT_COLOR_OPTIONS: {
  id: SubtitleTextColor;
  label: string;
  hex: string | null;
}[] = [
  { id: "auto", label: "Auto", hex: null },
  ...COLOR_OPTIONS.map((c) => ({ id: c.id, label: c.label, hex: c.hex })),
];

export const OUTLINE_WIDTH_OPTIONS: {
  id: SubtitleOutlineWidth;
  label: string;
}[] = [
  { id: "thin", label: "Fin" },
  { id: "medium", label: "Moyen" },
  { id: "thick", label: "Épais" },
];

export const BG_OPACITY_OPTIONS: { id: SubtitleBgOpacity; label: string }[] = [
  { id: "full", label: "Plein" },
  { id: "medium", label: "Moyen" },
  { id: "light", label: "Léger" },
];

export const ANIMATION_OPTIONS: { id: SubtitleAnimation; label: string }[] = [
  { id: "none", label: "Aucune" },
  { id: "fill", label: "Remplissage" },
  { id: "word", label: "Mot actif" },
];

/** Couleurs de surlignage du karaoké (mêmes valeurs que le worker burn.ts). */
const HIGHLIGHT_HEX: Record<SubtitleHighlight, string> = {
  jaune: "#FFE45C",
  rouge: "#C8392F",
  vert: "#2E7D5B",
  bleu: "#5CC8FF",
  blanc: "#F8F4E9",
};

export const HIGHLIGHT_OPTIONS: {
  id: SubtitleHighlight;
  label: string;
  hex: string;
}[] = [
  { id: "jaune", label: "Jaune", hex: HIGHLIGHT_HEX.jaune },
  { id: "rouge", label: "Rouge", hex: HIGHLIGHT_HEX.rouge },
  { id: "vert", label: "Vert", hex: HIGHLIGHT_HEX.vert },
  { id: "bleu", label: "Bleu", hex: HIGHLIGHT_HEX.bleu },
  { id: "blanc", label: "Blanc", hex: HIGHLIGHT_HEX.blanc },
];

/** Hex de la couleur de surlignage karaoké (pour l'overlay du lecteur). */
export function highlightHex(highlight: SubtitleHighlight): string {
  return HIGHLIGHT_HEX[highlight];
}

const OUTLINE_EM: Record<SubtitleOutlineWidth, number> = {
  thin: 0.04,
  medium: 0.06,
  thick: 0.09,
};
const BG_ALPHA: Record<SubtitleBgOpacity, number> = {
  full: 1,
  medium: 0.62,
  light: 0.38,
};

/** Hex « #RRGGBB » → « rgba(r,g,b,a) ». */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
  const D = DEFAULT_SUBTITLE_STYLE;
  return {
    font: s.font && FONT_VAR[s.font] ? s.font : D.font,
    size: s.size && SIZE_SCALE[s.size] ? s.size : D.size,
    mode: s.mode === "outline" ? "outline" : "background",
    color: s.color && COLOR_HEX[s.color] ? s.color : D.color,
    speakerMode:
      s.speakerMode === "text" || s.speakerMode === "box"
        ? s.speakerMode
        : "off",
    textColor:
      s.textColor === "auto" || (s.textColor && COLOR_HEX[s.textColor as SubtitleColor])
        ? s.textColor
        : "auto",
    position:
      s.position === "center" || s.position === "top" ? s.position : "bottom",
    bold: !!s.bold,
    italic: !!s.italic,
    uppercase: !!s.uppercase,
    outlineWidth:
      s.outlineWidth === "thin" || s.outlineWidth === "thick"
        ? s.outlineWidth
        : "medium",
    shadow: !!s.shadow,
    bgOpacity:
      s.bgOpacity === "medium" || s.bgOpacity === "light"
        ? s.bgOpacity
        : "full",
    animation:
      s.animation === "fill" || s.animation === "word" ? s.animation : "none",
    highlight:
      s.highlight && HIGHLIGHT_HEX[s.highlight as SubtitleHighlight]
        ? (s.highlight as SubtitleHighlight)
        : "jaune",
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
  // Couleur du texte : « auto » = contraste sur le fond ; sinon couleur choisie.
  const textHex =
    style.textColor === "auto" ? contrast : COLOR_HEX[style.textColor];
  const dropShadow = style.shadow ? "0 2px 4px rgba(0,0,0,0.65)" : "none";

  const base: CSSProperties = {
    fontFamily: FONT_VAR[style.font],
    fontWeight: style.bold ? 800 : 600,
    fontStyle: style.italic ? "italic" : "normal",
    textTransform: style.uppercase ? "uppercase" : "none",
    fontSize: "calc(clamp(0.78rem, 3.2cqw, 1.1rem) * var(--sub-scale, 1))",
    lineHeight: 1.25,
    maxWidth: "92%",
    padding: "0.2em 0.55em",
    borderRadius: "0.18em",
    color: textHex,
    ["--sub-scale" as string]: String(SIZE_SCALE[style.size]),
  } as CSSProperties;

  if (style.mode === "background") {
    return {
      ...base,
      backgroundColor: hexToRgba(accent, BG_ALPHA[style.bgOpacity]),
      textShadow: dropShadow,
    };
  }
  return {
    ...base,
    background: "transparent",
    WebkitTextStroke: `${OUTLINE_EM[style.outlineWidth]}em ${accent}`,
    paintOrder: "stroke fill",
    textShadow: style.shadow ? dropShadow : "0 1px 2px rgba(0,0,0,0.5)",
  } as CSSProperties;
}
