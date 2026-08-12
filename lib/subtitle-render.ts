/**
 * Rendu des sous-titres sur un canvas — le moteur de l'export navigateur.
 *
 * ─── Pourquoi ce module existe ───────────────────────────────────────────────
 * Jusqu'ici il y avait DEUX rendus indépendants :
 *   1. l'aperçu de l'éditeur, en HTML/CSS (`overlayStyleCss`) ;
 *   2. le MP4 gravé, en ASS/libass côté worker (`buildAss`).
 * Ils divergeaient déjà : l'aperçu PLAFONNE la taille de police
 * (`clamp(…, 3.2cqw, 1.1rem)`) tandis que le serveur la calcule en PROPORTION
 * de l'image (`0.055 × plus petit côté`). Sur une vidéo 1080p, le serveur écrit
 * en ~59 px là où l'aperçu s'arrête à ~18 px.
 *
 * L'export navigateur doit produire **le même fichier que le serveur**, sinon un
 * utilisateur obtiendrait deux MP4 différents selon le chemin emprunté. Ce
 * module reproduit donc fidèlement la géométrie de `buildAss` (worker), pas
 * celle de l'aperçu CSS.
 *
 * Module PUR : aucune dépendance au DOM au-delà de l'interface de dessin, donc
 * utilisable dans un Worker (OffscreenCanvas) comme sur un canvas classique, et
 * testable.
 */
import {
  highlightHex,
  subtitleColorHex,
  type SubtitleStyle,
} from "@/lib/subtitle-style";
import type { Segment, WordTiming } from "@/lib/video-types";

// ─────────────────────────────────────────────────────────────────
//  Géométrie — miroir EXACT de code/worker/src/pipeline/burn.ts
// ─────────────────────────────────────────────────────────────────

/** Taille de police = fraction de la plus PETITE dimension de la vidéo.
 * Identique à SIZE_FRAC côté worker : cohérent en paysage comme en vertical. */
const SIZE_FRAC: Record<SubtitleStyle["size"], number> = {
  s: 0.045,
  m: 0.055,
  l: 0.07,
};
/** Épaisseur du contour, en fraction de la taille de police (worker : OUTLINE_MULT). */
const OUTLINE_MULT: Record<SubtitleStyle["outlineWidth"], number> = {
  thin: 0.06,
  medium: 0.1,
  thick: 0.16,
};
/** Opacité du fond (worker : BG_ALPHA_HEX, exprimé ici en alpha 0-1). */
const BG_ALPHA: Record<SubtitleStyle["bgOpacity"], number> = {
  full: 1,
  medium: 0.62,
  light: 0.38,
};
/** Marges latérales et verticale, en fraction de l'image (worker : 0.06). */
const MARGIN_FRAC = 0.06;
/** Interligne (worker : ScaledBorderAndShadow + interligne ASS par défaut). */
const LINE_HEIGHT = 1.25;
/** Rembourrage de la boîte, en fraction de la taille de police. */
const BOX_PAD_X = 0.55;
const BOX_PAD_Y = 0.2;

/** Familles de polices, dans l'ordre de repli. Les polices web du site sont
 * chargées par next/font ; on retombe sur des génériques sûres. */
const FONT_STACK: Record<SubtitleStyle["font"], string> = {
  inter: 'var(--font-inter), "Inter", system-ui, sans-serif',
  montserrat: 'var(--font-montserrat), "Montserrat", system-ui, sans-serif',
  fraunces: 'var(--font-fraunces), "Fraunces", Georgia, serif',
  anton: 'var(--font-anton), "Anton", Impact, system-ui, sans-serif',
  caveat: 'var(--font-caveat), "Caveat", cursive',
};

/** Valeurs de dessin résolues pour un style + un locuteur donnés. */
export type SubtitlePaint = {
  fontFamily: string;
  fontWeight: number;
  italic: boolean;
  uppercase: boolean;
  /** Couleur du texte. */
  textColor: string;
  /** Couleur de la boîte (mode « fond »), sinon null. */
  boxColor: string | null;
  /** Opacité de la boîte (0-1). */
  bgAlpha: number;
  /** Couleur du contour (mode « contour »), sinon null. */
  strokeColor: string | null;
  /** Épaisseur du contour, en fraction de la taille de police. */
  strokeFrac: number;
  shadow: boolean;
  position: SubtitleStyle["position"];
  sizeFrac: number;
  highlight: string;
};

/**
 * Résout un style (+ éventuelle couleur de locuteur) en valeurs de dessin.
 * Reproduit la logique de `buildAss` : « auto » = contraste sur le fond, et le
 * mode « box » de la diarisation habille le fond en gardant un texte foncé.
 */
export function resolveSubtitlePaint(
  style: SubtitleStyle,
  speakerHex: string | null = null,
): SubtitlePaint {
  const accent = subtitleColorHex(style.color);
  const contrast = style.color === "white" ? "#1A1814" : "#F8F4E9";
  let textColor =
    style.textColor === "auto" ? contrast : subtitleColorHex(style.textColor);
  let boxColor = style.mode === "background" ? accent : null;
  let strokeColor = style.mode === "outline" ? accent : null;

  if (speakerHex && style.speakerMode !== "off") {
    if (style.speakerMode === "text") {
      textColor = speakerHex;
    } else if (style.mode === "background") {
      boxColor = speakerHex;
      textColor = "#1A1814"; // la palette de voix est claire
    } else {
      strokeColor = speakerHex;
      textColor = "#F8F4E9";
    }
  }

  return {
    fontFamily: FONT_STACK[style.font],
    // « anton » est une police d'affichage : le worker la force en gras.
    fontWeight: style.bold || style.font === "anton" ? 800 : 600,
    italic: style.italic,
    uppercase: style.uppercase,
    textColor,
    boxColor,
    bgAlpha: BG_ALPHA[style.bgOpacity],
    strokeColor,
    strokeFrac: OUTLINE_MULT[style.outlineWidth],
    shadow: style.shadow,
    position: style.position,
    sizeFrac: SIZE_FRAC[style.size],
    highlight: highlightHex(style.highlight),
  };
}

// ─────────────────────────────────────────────────────────────────
//  Dessin
// ─────────────────────────────────────────────────────────────────

/** Sous-ensemble de CanvasRenderingContext2D dont on a besoin. Permet de
 * dessiner aussi bien sur un canvas DOM que sur un OffscreenCanvas. */
export type Ctx2D = {
  save(): void;
  restore(): void;
  measureText(t: string): { width: number };
  fillText(t: string, x: number, y: number): void;
  strokeText(t: string, x: number, y: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  font: string;
  // Volontairement aussi larges que l'API native : un CanvasRenderingContext2D
  // doit pouvoir être passé tel quel, sans conversion ni assertion.
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  lineJoin: CanvasLineJoin;
  miterLimit: number;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  direction?: CanvasDirection;
};

export type DrawOptions = {
  width: number;
  height: number;
  /** Le sous-titre à afficher, déjà mis en lignes (`\n`). */
  text: string;
  paint: SubtitlePaint;
  /** Timings par mot + temps courant → surlignage karaoké. */
  words?: WordTiming[];
  time?: number;
  animation?: SubtitleStyle["animation"];
  /** true pour l'arabe : le texte se lit de droite à gauche. */
  rtl?: boolean;
};

/** Découpe le texte en lignes + tokens, avec l'indice global de chaque token
 * (pour retrouver son timing karaoké). */
function layoutTokens(text: string): { tokens: string[]; from: number }[] {
  const lines: { tokens: string[]; from: number }[] = [];
  let cursor = 0;
  for (const line of text.split("\n")) {
    const tokens = line.trim().split(/\s+/).filter(Boolean);
    lines.push({ tokens, from: cursor });
    cursor += tokens.length;
  }
  return lines;
}

/** Le token d'indice `i` est-il « allumé » par le karaoké à l'instant `time` ? */
function isLit(
  i: number,
  words: WordTiming[] | undefined,
  time: number | undefined,
  animation: SubtitleStyle["animation"] | undefined,
): boolean {
  if (!words || time === undefined || !animation || animation === "none") {
    return false;
  }
  const w = words[i];
  if (!w) return false;
  // « mot » : seul le mot courant. « remplissage » : tous ceux déjà dits.
  return animation === "word" ? time >= w.start && time < w.end : time >= w.start;
}

/**
 * Dessine UN sous-titre sur le contexte, aux coordonnées de l'image.
 *
 * Reproduit la géométrie du worker : police proportionnelle à la plus petite
 * dimension, marges à 6 %, boîte ou contour, position haut/milieu/bas.
 */
export function drawSubtitle(ctx: Ctx2D, o: DrawOptions): void {
  const text = o.paint.uppercase ? o.text.toUpperCase() : o.text;
  if (!text.trim()) return;

  const minDim = Math.min(o.width, o.height);
  const fontSize = Math.max(12, Math.round(o.paint.sizeFrac * minDim));
  const lineHeight = fontSize * LINE_HEIGHT;
  const marginX = o.width * MARGIN_FRAC;
  const marginY = o.height * MARGIN_FRAC;

  ctx.save();
  ctx.font = `${o.paint.italic ? "italic " : ""}${o.paint.fontWeight} ${fontSize}px ${o.paint.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if (ctx.direction !== undefined) ctx.direction = o.rtl ? "rtl" : "ltr";

  const lines = layoutTokens(text);
  const lineTexts = lines.map((l) => l.tokens.join(" "));
  const widths = lineTexts.map((t) => ctx.measureText(t).width);
  const blockHeight = lines.length * lineHeight;

  // Position verticale du bloc (haut de la première ligne).
  let top: number;
  if (o.paint.position === "top") top = marginY;
  else if (o.paint.position === "center") top = (o.height - blockHeight) / 2;
  else top = o.height - marginY - blockHeight;

  const centerX = o.width / 2;
  const padX = fontSize * BOX_PAD_X;
  const padY = fontSize * BOX_PAD_Y;

  // 1) Fond (mode « boîte ») — une boîte par ligne, comme libass.
  if (o.paint.boxColor) {
    ctx.fillStyle = o.paint.boxColor;
    ctx.globalAlpha = o.paint.bgAlpha;
    for (let i = 0; i < lines.length; i++) {
      const w = Math.min(widths[i]! + padX * 2, o.width - marginX);
      ctx.fillRect(
        centerX - w / 2,
        top + i * lineHeight - padY,
        w,
        lineHeight + padY,
      );
    }
    ctx.globalAlpha = 1;
  }

  // 2) Ombre portée (sous le texte, jamais sous le contour).
  if (o.paint.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.65)";
    ctx.shadowBlur = fontSize * 0.12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = fontSize * 0.06;
  }

  // 3) Texte, token par token (le karaoké colore certains tokens).
  const spaceW = ctx.measureText(" ").width;
  for (let li = 0; li < lines.length; li++) {
    const { tokens, from } = lines[li]!;
    const baseline = top + li * lineHeight + fontSize;
    // On part du bord gauche de la ligne centrée, puis on avance token par token.
    let x = centerX - widths[li]! / 2;
    for (let ti = 0; ti < tokens.length; ti++) {
      const tok = tokens[ti]!;
      const w = ctx.measureText(tok).width;
      const lit = isLit(from + ti, o.words, o.time, o.animation);
      const cx = x + w / 2;

      if (o.paint.strokeColor) {
        ctx.strokeStyle = o.paint.strokeColor;
        ctx.lineWidth = fontSize * o.paint.strokeFrac * 2; // trait centré → ×2
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.strokeText(tok, cx, baseline);
      }
      ctx.fillStyle = lit ? o.paint.highlight : o.paint.textColor;
      ctx.fillText(tok, cx, baseline);

      x += w + spaceW;
    }
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
//  Sélection du sous-titre à afficher
// ─────────────────────────────────────────────────────────────────

/**
 * Index du sous-titre actif à `time` (recherche dichotomique, liste triée).
 * Renvoie -1 si aucun.
 */
export function activeSegmentIndex(segments: Segment[], time: number): number {
  let lo = 0;
  let hi = segments.length - 1;
  let cand = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid]!.start <= time) {
      cand = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return cand >= 0 && time < segments[cand]!.end ? cand : -1;
}
