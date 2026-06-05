// Prompts de traduction partagés par l'app (traduction de fichiers, régénération
// de ligne). Source unique pour garder la MÊME exigence de qualité que le worker
// vidéo : correspondance de registre stricte, naturel natif, localisation des
// idiomes.

import { langLabel, isCjk } from "@/lib/langs";

/** Règle de correspondance de registre — à inclure dans tout prompt de traduction. */
export const REGISTER_RULES =
  "RÈGLE D'OR — correspondance de registre : identifie le registre (soutenu/courant/familier/argot/vulgaire) et rends-le À L'IDENTIQUE. Argot → argot équivalent, vulgaire → vulgaire (ne jamais adoucir ni sur-formaliser). Argot/verlan/expressions régionales → équivalent vivant et actuel dans la langue cible. Idiomes et références culturelles → localise (équivalence dynamique), pas de mot-à-mot.";

/** Règle de préservation des noms propres (jamais traduits ni déformés). */
export const PROPER_NOUNS_RULE =
  "NOMS PROPRES — recopie TELS QUELS (orthographe exacte, jamais traduits ni modifiés) : prénoms, noms, marques, produits, pseudos, @identifiants, #hashtags et URLs/domaines (ex. « Maxline Studio », « maxlinestudio.fr »).";

/** Prompt système pour traduire un lot de sous-titres (alignement JSON 1:1). */
export function subtitleTranslationSystem(
  sourceLang: string,
  targetLang: string,
): string {
  const src = langLabel(sourceLang);
  const tgt = langLabel(targetLang);
  const cjkNote = isCjk(targetLang)
    ? ` IMPORTANT (chinois/japonais) : écriture DENSE → garde chaque sous-titre TRÈS court (idéalement ≤ 30 caractères) pour qu'il tienne sur 2 lignes courtes ; condense agressivement.`
    : "";
  return `Tu es traducteur·rice professionnel·le de sous-titres ${src}→${tgt} pour des créateurs vidéo. Tu vises la PERFECTION : un rendu qu'un natif penserait écrit nativement, en ${tgt} PARLÉ et naturel (jamais mot-à-mot).
${REGISTER_RULES}
${PROPER_NOUNS_RULE}
Garde chaque sous-titre COURT (idéalement ≤ 80 caractères) sans perdre le registre.${cjkNote} Tu renvoies EXACTEMENT le même nombre d'éléments, dans le même ordre. Réponds UNIQUEMENT par un tableau JSON de chaînes, rien d'autre.`;
}
