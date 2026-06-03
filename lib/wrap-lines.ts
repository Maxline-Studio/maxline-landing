/**
 * Découpe d'un texte de sous-titre sur ≤ 2 lignes, pour l'affichage (éditeur,
 * lecteur) et la gravure MP4. Port fidèle de la logique du worker
 * (code/worker/src/pipeline/segment.ts) — gardé synchronisé manuellement, le
 * worker étant hors de ce repo.
 *
 *  - Langues à espaces (fr/en/es/…) : coupe par mots, lignes ≤ 42 caractères,
 *    en préférant couper après une ponctuation et en équilibrant les 2 lignes.
 *  - Langues CJK (zh/ja, sans espaces) : coupe par caractères, lignes ≤ 16,
 *    en préférant couper après une ponctuation pleine chasse.
 *
 * Utilisé là où l'app produit des cues SANS repasser par le worker : changement
 * de langue dans l'éditeur (re-traduction) et traduction de fichiers .srt/.vtt.
 */
import { isCjk } from "@/lib/langs";

export const MAX_CHARS_PER_LINE = 42;
export const MAX_CHARS_PER_LINE_CJK = 16;

const SENTENCE_END = /[.!?…]["»)\]]?$/;
const CLAUSE_END = /[,;:]["»)\]]?$/;
/** Ponctuation CJK (pleine chasse) : bon endroit où couper une ligne. */
const CJK_BREAK_AFTER = /[。！？、，；：…）」』】]/;

/** Découpe CJK : caractère par caractère, lignes courtes, bonus ponctuation. */
function wrapLinesCjk(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const chars = [...clean]; // spread par points de code → gère le CJK
  if (chars.length <= MAX_CHARS_PER_LINE_CJK) return clean;

  const mid = Math.floor(chars.length / 2);
  const maxFirst = Math.min(MAX_CHARS_PER_LINE_CJK, chars.length - 1);
  let bestIdx = -1;
  let bestScore = Infinity;
  for (let i = 1; i <= maxFirst; i++) {
    if (chars.length - i > MAX_CHARS_PER_LINE_CJK) continue; // 2e ligne trop longue
    let score = Math.abs(i - mid);
    if (CJK_BREAK_AFTER.test(chars[i - 1]!)) score -= 4;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) bestIdx = MAX_CHARS_PER_LINE_CJK; // texte > 2× limite (rare)

  return chars.slice(0, bestIdx).join("") + "\n" + chars.slice(bestIdx).join("");
}

/**
 * Répartit un texte sur ≤ 2 lignes. `lang` choisit la stratégie (CJK par
 * caractères, sinon par mots). Retourne le texte avec un \n si une 2e ligne est
 * nécessaire.
 */
export function wrapLines(text: string, lang?: string): string {
  if (lang && isCjk(lang)) return wrapLinesCjk(text);

  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_CHARS_PER_LINE) return clean;

  const words = clean.split(" ");
  let best: { line1: string; line2: string; score: number } | null = null;

  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(" ");
    const line2 = words.slice(i).join(" ");
    if (line1.length > MAX_CHARS_PER_LINE) break;
    if (line2.length > MAX_CHARS_PER_LINE) continue;

    let score = Math.abs(line1.length - line2.length);
    if (CLAUSE_END.test(line1) || SENTENCE_END.test(line1)) score -= 6;
    if (best === null || score < best.score) {
      best = { line1, line2, score };
    }
  }

  // Aucune coupe ≤42/≤42 (texte > 84, rare) : coupe dure au plus proche.
  if (best === null) {
    let i = 1;
    while (i < words.length && words.slice(0, i + 1).join(" ").length <= MAX_CHARS_PER_LINE) {
      i++;
    }
    return words.slice(0, i).join(" ") + "\n" + words.slice(i).join(" ");
  }
  return best.line1 + "\n" + best.line2;
}
