// Traduction de sous-titres par lots, partagée (traduction de fichiers +
// changement de langue dans l'éditeur). Claude (Sonnet par défaut) + RÈGLE D'OR,
// alignement 1:1 strict avec retry.
import { callClaude } from "@/lib/anthropic";
import { subtitleTranslationSystem } from "@/lib/translation-prompt";
import { langLabel } from "@/lib/langs";

const BATCH = 60; // cues par appel Claude (alignement 1:1 fiable)

function parseJsonArray(raw: string): string[] | null {
  const a = raw.indexOf("[");
  const b = raw.lastIndexOf("]");
  if (a === -1 || b === -1 || b <= a) return null;
  try {
    const arr = JSON.parse(raw.slice(a, b + 1));
    if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
      return arr as string[];
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Appel Claude qui ne lève jamais (erreur réseau/HTTP → null). */
async function safeCall(args: {
  system: string;
  user: string;
  temperature: number;
}): Promise<string | null> {
  try {
    return await callClaude({ ...args, maxTokens: 16000 });
  } catch {
    return null;
  }
}

/**
 * Traduit un lot de cues, GARANTI aligné (n entrées) et ne lève JAMAIS.
 * Robustesse : appel + retry strict ; si toujours désaligné (refus de Claude,
 * format cassé, erreur API) et lot > 1 → on coupe en deux pour isoler le cue
 * fautif ; lot de 1 toujours en échec → on conserve le TEXTE SOURCE. Ainsi un
 * incident ne fait jamais échouer la génération (au pire, lignes non traduites).
 */
async function translateOneBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string,
): Promise<string[]> {
  const n = texts.length;
  if (n === 0) return [];

  const tgt = langLabel(targetLang);
  const system = subtitleTranslationSystem(sourceLang, targetLang);
  const user = `Traduis ces ${n} sous-titres en ${tgt}, dans l'ordre. Réponds par un tableau JSON de ${n} chaînes :\n${JSON.stringify(texts)}`;

  const raw1 = await safeCall({ system, user, temperature: 0.3 });
  let out = raw1 ? parseJsonArray(raw1) : null;

  if (!out || out.length !== n) {
    const stricter =
      system +
      `\nIMPORTANT : réponds UNIQUEMENT par un tableau JSON d'EXACTEMENT ${n} chaînes, rien d'autre.`;
    const raw2 = await safeCall({ system: stricter, user, temperature: 0.2 });
    out = raw2 ? parseJsonArray(raw2) : null;
  }

  if (out && out.length === n) return out.map((s) => s.trim());

  if (n > 1) {
    const mid = Math.ceil(n / 2);
    const left = await translateOneBatch(texts.slice(0, mid), sourceLang, targetLang);
    const right = await translateOneBatch(texts.slice(mid), sourceLang, targetLang);
    return [...left, ...right];
  }

  // 1 cue, toujours rien → repli sur le texte source (jamais d'échec global).
  return [texts[0] ?? ""];
}

/**
 * Traduit une liste complète de cues (par lots), alignement 1:1 garanti.
 * Ne lève jamais : au pire, certaines lignes restent en langue source.
 */
export async function translateCuesBatched(
  texts: string[],
  sourceLang: string,
  targetLang: string,
): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const chunk = texts.slice(i, i + BATCH);
    out.push(...(await translateOneBatch(chunk, sourceLang, targetLang)));
  }
  return out;
}
