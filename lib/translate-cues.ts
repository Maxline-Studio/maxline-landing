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

/** Traduit un lot de cues, alignement 1:1 strict (retry une fois si désaligné). */
async function translateOneBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string,
): Promise<string[]> {
  const tgt = langLabel(targetLang);
  const system = subtitleTranslationSystem(sourceLang, targetLang);
  const user = `Traduis ces ${texts.length} sous-titres en ${tgt}, dans l'ordre. Réponds par un tableau JSON de ${texts.length} chaînes :\n${JSON.stringify(texts)}`;

  let out = parseJsonArray(
    await callClaude({ system, user, maxTokens: 16000, temperature: 0.3 }),
  );
  if (!out || out.length !== texts.length) {
    const stricter =
      system +
      `\nIMPORTANT : le tableau DOIT contenir EXACTEMENT ${texts.length} chaînes.`;
    out = parseJsonArray(
      await callClaude({ system: stricter, user, maxTokens: 16000, temperature: 0.2 }),
    );
  }
  if (!out || out.length !== texts.length) {
    throw new Error(
      `Traduction désalignée (attendu ${texts.length}, reçu ${out?.length ?? 0}).`,
    );
  }
  return out.map((s) => s.trim());
}

/**
 * Traduit une liste complète de cues (par lots de 60), alignement 1:1 strict.
 * Lève en cas d'échec/désalignement.
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
