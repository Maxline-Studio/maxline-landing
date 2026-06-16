/**
 * Karaoké mot-à-mot — MIROIR (app) du module worker `code/worker/src/pipeline/
 * karaoke.ts`. Le worker hors git n'est pas importable ; toute évolution de la
 * répartition doit être répliquée des deux côtés (comme wrap-lines / subtitle-style).
 *
 * Côté app, on s'en sert pour (re)calculer les timings par mot quand on génère
 * une langue à la demande, qu'on re-traduit, ou qu'on sauvegarde des sous-titres
 * édités (le texte a changé → on réaligne le karaoké au prorata). La langue
 * source garde, elle, les timings RÉELS produits par le worker.
 */
import type { Segment, WordTiming } from "@/lib/video-types";

/** Langues sans karaoké mot-à-mot (CJK : pas d'espaces). */
const NO_KARAOKE_LANGS = new Set(["zh", "ja"]);
export function karaokeSupported(lang?: string): boolean {
  return !lang || !NO_KARAOKE_LANGS.has(lang);
}

/**
 * Répartit [start, end] sur les mots du texte (déjà wrappé : les \n comptent
 * comme des espaces) AU PRORATA de leur longueur. Slots contigus couvrant toute
 * la fenêtre. undefined si CJK ou texte vide.
 */
export function prorateWordTimings(
  text: string,
  start: number,
  end: number,
  lang?: string,
): WordTiming[] | undefined {
  if (!karaokeSupported(lang)) return undefined;
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  const toks = flat.split(" ");
  const total = Math.max(0.01, end - start);
  const weights = toks.map((t) => Math.max(1, [...t].length));
  const sum = weights.reduce((a, b) => a + b, 0);
  const out: WordTiming[] = [];
  let t = start;
  for (let i = 0; i < toks.length; i++) {
    const s = t;
    const e = i === toks.length - 1 ? end : s + (weights[i]! / sum) * total;
    out.push({ text: toks[i]!, start: s, end: Math.max(e, s + 0.01) });
    t = e;
  }
  return out;
}

/**
 * Renvoie le segment avec un champ `words` cohérent pour la langue donnée :
 *  - on garde les `words` existants (timings réels du worker) s'ils sont alignés
 *    avec le texte courant (le texte n'a pas été édité) ;
 *  - sinon on (re)calcule au prorata.
 * Pour le CJK, on retire les `words` (pas de karaoké).
 */
export function withProratedWords(seg: Segment, lang?: string): Segment {
  if (!karaokeSupported(lang)) {
    if (seg.words) {
      const { words: _drop, ...rest } = seg;
      return rest;
    }
    return seg;
  }
  // Les `words` existants sont-ils encore alignés avec le texte ? (édition possible)
  const expected = seg.text.replace(/\s+/g, " ").trim();
  const current = seg.words?.map((w) => w.text).join(" ");
  if (seg.words && seg.words.length > 0 && current === expected) {
    return seg; // timings réels (source) toujours valides → on les conserve.
  }
  const words = prorateWordTimings(seg.text, seg.start, seg.end, lang);
  if (!words) {
    if (seg.words) {
      const { words: _drop, ...rest } = seg;
      return rest;
    }
    return seg;
  }
  return { ...seg, words };
}
