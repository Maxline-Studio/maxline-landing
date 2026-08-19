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
import {
  SIZE_FRAC,
  OUTLINE_MULT,
  BG_ALPHA,
  MARGIN_FRAC,
  SHADOW_MULT,
  MIN_FONT_PX,
} from "@/lib/subtitle-geometry";

// ─────────────────────────────────────────────────────────────────
//  Géométrie — miroir EXACT de code/worker/src/pipeline/burn.ts
// ─────────────────────────────────────────────────────────────────

/** Interligne (worker : ScaledBorderAndShadow + interligne ASS par défaut). */
const LINE_HEIGHT = 1.25;
/** Rembourrage de la boîte, en fraction de la taille de police. */
const BOX_PAD_X = 0.55;
const BOX_PAD_Y = 0.2;

/**
 * Familles de polices, dans l'ordre de repli.
 *
 * ⚠️ AUCUN `var(--font-…)` ICI. Un canvas n'est pas du CSS : `ctx.font` suit la
 * grammaire du raccourci `font` et ne résout PAS les variables CSS. Une chaîne
 * contenant `var(...)` est jugée invalide et l'affectation est IGNORÉE
 * SILENCIEUSEMENT — le contexte garde alors sa valeur par défaut,
 * `10px sans-serif`. C'est exactement ce qui se passait jusqu'ici : tous les
 * sous-titres gravés par le navigateur sortaient en 10 px, quelle que soit la
 * police, la taille ou la graisse choisies dans l'éditeur.
 *
 * Les vraies familles générées par next/font (`__Inter_e8ce0c`…) sont récupérées
 * à l'exécution par `resolveFontFamilies()` et placées EN TÊTE de ces replis.
 */
const FONT_FALLBACK: Record<SubtitleStyle["font"], string> = {
  inter: '"Inter", system-ui, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
  fraunces: '"Fraunces", Georgia, serif',
  anton: '"Anton", Impact, system-ui, sans-serif',
  caveat: '"Caveat", cursive',
};

/** Variable CSS posée par next/font pour chaque police (cf. app/layout.tsx). */
const FONT_CSS_VAR: Record<SubtitleStyle["font"], string> = {
  inter: "--font-inter",
  montserrat: "--font-montserrat",
  fraunces: "--font-fraunces",
  anton: "--font-anton",
  caveat: "--font-caveat",
};

/** Familles de police valides pour un canvas, par police du style. */
export type FontFamilies = Record<SubtitleStyle["font"], string>;

/**
 * Résout les familles réelles depuis les variables CSS du document.
 *
 * next/font ne publie pas le nom de famille qu'il génère : il le pose dans une
 * variable CSS. On lit donc cette variable et on l'aplatit dans une chaîne que
 * le canvas sait parser. Hors navigateur (rendu serveur, test), on renvoie les
 * replis — qui restent valides.
 */
export function resolveFontFamilies(): FontFamilies {
  const out = { ...FONT_FALLBACK };
  if (typeof document === "undefined") return out;
  const root = getComputedStyle(document.documentElement);
  for (const key of Object.keys(FONT_CSS_VAR) as (keyof FontFamilies)[]) {
    const real = root.getPropertyValue(FONT_CSS_VAR[key]).trim();
    // La variable contient déjà un nom de famille cité si besoin.
    if (real) out[key] = `${real}, ${FONT_FALLBACK[key]}`;
  }
  return out;
}

/**
 * Garantit que la police est réellement DISPONIBLE avant le premier dessin.
 *
 * `document.fonts.ready` ne suffit pas : une police next/font n'est chargée que
 * si la page l'utilise déjà. Sans cet appel, les premières images seraient
 * gravées avec une police de repli, puis la vraie prendrait le relais en cours
 * de route — un changement d'apparence au milieu de la vidéo.
 */
export async function ensureFontLoaded(
  family: string,
  weight: number,
  italic: boolean,
): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const spec = `${italic ? "italic " : ""}${weight} 64px ${family}`;
  try {
    await document.fonts.load(spec, "AÉÈÊÀÇÙàéîöu0123456789");
    await document.fonts.ready;
  } catch {
    /* police indisponible : le repli du canvas s'applique, le rendu tient. */
  }
}

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
  families: FontFamilies = FONT_FALLBACK,
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
    fontFamily: families[style.font],
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
 * Pose la police sur le contexte, et VÉRIFIE qu'elle a bien été acceptée.
 *
 * Une chaîne `font` invalide est ignorée en silence par le canvas : le contexte
 * reste à `10px sans-serif` et le sous-titre sort minuscule sans qu'aucune
 * erreur ne soit levée. C'est le défaut qui a rendu illisibles tous les MP4
 * gravés dans le navigateur. On contrôle donc l'affectation, et on retombe sur
 * une famille générique plutôt que de graver une vidéo entière avec du 10 px.
 */
function setFont(ctx: Ctx2D, paint: SubtitlePaint, fontSize: number): void {
  const prefix = `${paint.italic ? "italic " : ""}${paint.fontWeight} ${fontSize}px `;
  ctx.font = prefix + paint.fontFamily;
  // Le canvas normalise la valeur : si la taille demandée n'y figure pas,
  // c'est que la chaîne a été rejetée.
  if (ctx.font.includes(`${fontSize}px`)) return;
  ctx.font = prefix + "sans-serif";
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
  const fontSize = Math.max(MIN_FONT_PX, Math.round(o.paint.sizeFrac * minDim));
  const lineHeight = fontSize * LINE_HEIGHT;
  const marginX = o.width * MARGIN_FRAC;
  const marginY = o.height * MARGIN_FRAC;

  ctx.save();
  setFont(ctx, o.paint, fontSize);
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
    ctx.shadowOffsetY = fontSize * SHADOW_MULT;
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
