/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  SOURCE UNIQUE DE LA DÉCOUPE DES SOUS-TITRES                            ║
 * ║  Ce fichier existe en DEUX exemplaires, qui doivent rester IDENTIQUES :  ║
 * ║    • code/landing/lib/subtitle-cut.ts            (re-traduction, .srt)   ║
 * ║    • code/worker/src/pipeline/subtitle-cut.ts    (pipeline principal)    ║
 * ║  Le test `code/worker/test/geometry-sync.test.ts` compare les deux et    ║
 * ║  ÉCHOUE s'ils divergent. Ne modifiez jamais l'un sans l'autre.           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ─── Pourquoi ce fichier ─────────────────────────────────────────────────────
 * La « divergence 34/42 » a été corrigée DEUX FOIS, et elle est revenue les deux
 * fois — parce que la correction n'a jamais été faite qu'un côté à la fois.
 *
 * Août 2026 : le worker a été réparé (profils de découpe, mise en lignes calée
 * sur le profil). L'application, elle, a gardé un `wrap-lines.ts` avec 42
 * caractères EN DUR et un algorithme sans pénalités linguistiques. Conséquence
 * concrète et visible : changer la langue des sous-titres d'une vidéo « Court »
 * re-mettait le texte en lignes à 42 caractères sur 2 lignes au lieu de 34 sur
 * 1 — le même contenu n'avait pas le même rythme selon la langue, exactement le
 * symptôme qu'on croyait avoir supprimé.
 *
 * Le fichier voisin `cut-profiles.ts` portait pourtant l'avertissement en
 * toutes lettres : « ne pas y dupliquer de chiffres ». Un commentaire ne tient
 * pas une invariante. Un fichier unique et un test qui casse, si.
 *
 * Ce module est VOLONTAIREMENT sans aucun import : c'est ce qui permet aux deux
 * copies d'être identiques au octet près malgré des conventions de chemins
 * différentes entre l'app (alias `@/`) et le worker (extensions `.ts`).
 */

export type CutProfileId = "court" | "equilibre" | "broadcast";

export type CutProfile = {
  id: CutProfileId;
  /** Libellé montré à l'utilisateur. */
  label: string;
  /** Caractères par ligne (dur). */
  maxCharsPerLine: number;
  /** Lignes par sous-titre (dur). */
  maxLines: number;
  /**
   * Longueur VISÉE d'un sous-titre (caractères). C'est elle qui guide la
   * découpe : on cherche des morceaux proches de cette taille, aux bonnes
   * frontières linguistiques. Le maximum dur ne sert que de garde-fou.
   */
  targetChars: number;
  /** Plafond de mots par sous-titre (0 = aucun). Réservé au style « court ». */
  maxWords: number;
  minCueDuration: number;
  maxCueDuration: number;
  /** Vitesse de lecture max (caractères/seconde). Norme pro : 15-17. */
  maxCps: number;
  /** Temps max pendant lequel un sous-titre reste après la fin de la parole. */
  maxTrailingSilence: number;
};

/** Longueur maximale absolue d'un sous-titre pour un profil donné. */
export function maxCharsPerCue(p: CutProfile): number {
  return p.maxCharsPerLine * p.maxLines;
}

/**
 * « Court » — style réseaux sociaux (TikTok / Reels / Shorts). Une ligne brève,
 * peu de mots, idéal pour le karaoké mot-à-mot et la vidéo verticale.
 */
export const COURT: CutProfile = {
  id: "court",
  label: "Court (vertical, TikTok)",
  maxCharsPerLine: 34,
  maxLines: 1,
  targetChars: 26,
  maxWords: 7,
  minCueDuration: 0.7,
  maxCueDuration: 4.5,
  maxCps: 17,
  maxTrailingSilence: 0.6,
};

/**
 * « Équilibré » — LE DÉFAUT. Des groupes de sens complets, une ligne la plupart
 * du temps, deux quand la phrase le demande. C'est le réglage qui se lit
 * naturellement sans hacher le propos.
 */
export const EQUILIBRE: CutProfile = {
  id: "equilibre",
  label: "Équilibré",
  maxCharsPerLine: 42,
  maxLines: 2,
  targetChars: 52,
  maxWords: 0,
  minCueDuration: 0.9,
  maxCueDuration: 6,
  maxCps: 17,
  maxTrailingSilence: 0.9,
};

/**
 * « Broadcast » — norme de sous-titrage télé/cinéma : deux lignes de
 * 42 caractères, phrases longues, rythme posé. Pour les vidéos de format long,
 * les documentaires, l'accessibilité.
 */
export const BROADCAST: CutProfile = {
  id: "broadcast",
  label: "Broadcast (2 lignes)",
  maxCharsPerLine: 42,
  maxLines: 2,
  targetChars: 72,
  maxWords: 0,
  minCueDuration: 1,
  maxCueDuration: 7,
  maxCps: 17,
  maxTrailingSilence: 999,
};

/**
 * Variante CJK d'un profil : le chinois et le japonais n'ont pas d'espaces et
 * leur écriture est dense — il faut des lignes bien plus courtes, et le plafond
 * de mots n'a aucun sens.
 */
export function toCjk(p: CutProfile): CutProfile {
  return {
    ...p,
    maxCharsPerLine: p.id === "court" ? 14 : 18,
    targetChars: p.id === "court" ? 12 : 22,
    maxWords: 0,
    maxCps: 10,
  };
}

export const PROFILES: Record<CutProfileId, CutProfile> = {
  court: COURT,
  equilibre: EQUILIBRE,
  broadcast: BROADCAST,
};

/** Profil par défaut : « équilibré ». */
export const DEFAULT_PROFILE = EQUILIBRE;

/** Valide un identifiant de profil venu de la base (jamais de confiance). */
export function resolveProfile(id: unknown, lang?: string): CutProfile {
  const base =
    typeof id === "string" && id in PROFILES
      ? PROFILES[id as CutProfileId]
      : DEFAULT_PROFILE;
  return isCjkLang(lang) ? toCjk(base) : base;
}

/** Langues sans espaces entre les mots. */
const CJK_LANGS = new Set(["zh", "ja"]);
export function isCjkLang(lang?: string): boolean {
  return !!lang && CJK_LANGS.has(lang);
}

// ─────────────────────────────────────────────────────────────────
//  Frontières linguistiques — où couper, où surtout pas
// ─────────────────────────────────────────────────────────────────


/** Fin de phrase (y compris ponctuation pleine chasse CJK). */
const STRONG_END = /[.!?…。！？]["»)\]」』]?$/;
/** Groupe de sens (virgule, point-virgule, deux-points, tiret). */
const WEAK_END = /[,;:—–、，；：]["»)\]」』]?$/;
/** Nombre décimal (« 3.5 », « 12,50 ») : la ponctuation y est interne. */
const DECIMAL = /\d[.,]\d/;
/** Abréviation courte à initiale majuscule (« M. », « Dr. »). */
const ABBREV = /^[A-ZÀ-Ý][a-zà-ÿ]?\.$/;

/**
 * Mots après lesquels on ne coupe JAMAIS : ils ne peuvent pas terminer un
 * sous-titre sans casser le groupe grammatical (déterminant seul, préposition
 * orpheline, auxiliaire séparé de son participe, pronom sujet sans verbe…).
 *
 * C'est la règle qui distingue un sous-titrage professionnel d'une découpe
 * mécanique : « le » ne doit jamais finir une ligne dont le nom commence la
 * suivante.
 */
const NEVER_BREAK_AFTER: Record<string, Set<string>> = {
  fr: new Set([
    // déterminants
    "le", "la", "les", "un", "une", "des", "du", "de", "au", "aux", "ce", "cet",
    "cette", "ces", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses",
    "notre", "nos", "votre", "vos", "leur", "leurs", "quel", "quelle", "quels",
    "quelles", "chaque", "tout", "toute", "tous", "toutes", "plusieurs",
    // prépositions
    "à", "en", "dans", "sur", "sous", "par", "pour", "avec", "sans", "chez",
    "vers", "entre", "depuis", "pendant", "contre", "selon", "malgré", "dès",
    // pronoms sujets / négation
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles", "ne",
    "me", "te", "se", "y",
    // auxiliaires et modaux courants
    "est", "sont", "était", "étaient", "a", "ont", "avait", "avaient", "sera",
    "seront", "suis", "es", "sommes", "êtes", "ai", "as", "avons", "avez",
    "peut", "peux", "pouvez", "veut", "veux", "voulez", "doit", "dois", "devez",
    "va", "vais", "allez", "vont", "plus", "très", "trop", "bien",
  ]),
  en: new Set([
    "the", "a", "an", "this", "that", "these", "those", "my", "your", "his",
    "her", "its", "our", "their", "some", "any", "each", "every", "no",
    "in", "on", "at", "by", "for", "with", "from", "to", "of", "as", "into",
    "onto", "over", "under", "about", "than", "through", "during",
    "i", "you", "he", "she", "it", "we", "they",
    "is", "are", "was", "were", "be", "been", "being", "am",
    "have", "has", "had", "will", "would", "can", "could", "should", "must",
    "do", "does", "did", "very", "too", "so", "not",
  ]),
  es: new Set([
    "el", "la", "los", "las", "un", "una", "unos", "unas", "del", "al", "de",
    "en", "con", "por", "para", "sin", "sobre", "entre", "desde", "hasta",
    "yo", "tú", "él", "ella", "nosotros", "vosotros", "ellos", "ellas", "no",
    "es", "son", "era", "eran", "ha", "han", "había", "será", "muy", "más",
  ]),
  it: new Set([
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "del", "della",
    "di", "a", "da", "in", "con", "su", "per", "tra", "fra", "non",
    "io", "tu", "lui", "lei", "noi", "voi", "loro",
    "è", "sono", "era", "erano", "ha", "hanno", "aveva", "sarà", "molto", "più",
  ]),
  pt: new Set([
    "o", "a", "os", "as", "um", "uma", "uns", "umas", "do", "da", "dos", "das",
    "de", "em", "com", "por", "para", "sem", "sobre", "entre", "até", "não",
    "eu", "tu", "ele", "ela", "nós", "vós", "eles", "elas",
    "é", "são", "era", "eram", "tem", "têm", "tinha", "será", "muito", "mais",
  ]),
  de: new Set([
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem",
    "einer", "eines", "mein", "dein", "sein", "ihr", "unser", "euer",
    "in", "an", "auf", "für", "mit", "von", "zu", "bei", "nach", "über",
    "unter", "durch", "gegen", "ohne", "um", "aus", "seit", "nicht",
    "ich", "du", "er", "sie", "es", "wir", "ihr",
    "ist", "sind", "war", "waren", "hat", "haben", "hatte", "wird", "werden",
    "kann", "können", "muss", "müssen", "sehr", "mehr",
  ]),
};

/**
 * Mots devant lesquels une coupure est BIENVENUE : conjonctions et
 * subordonnants. Commencer un sous-titre par « mais… » ou « parce que… » est
 * naturel — c'est même la façon dont un sous-titreur professionnel découpe.
 */
const PREFER_BREAK_BEFORE: Record<string, Set<string>> = {
  fr: new Set([
    "mais", "ou", "et", "donc", "or", "ni", "car", "puis", "ensuite", "alors",
    "que", "qui", "quand", "lorsque", "si", "parce", "puisque", "comme",
    "dont", "où", "pourtant", "cependant", "toutefois", "sauf", "pendant",
  ]),
  en: new Set([
    "but", "or", "and", "so", "yet", "nor", "because", "then", "however",
    "that", "which", "who", "when", "while", "if", "although", "though",
    "since", "unless", "before", "after", "until", "whereas",
  ]),
  es: new Set([
    "pero", "o", "y", "así", "porque", "que", "quien", "cuando", "si",
    "aunque", "mientras", "sino", "entonces", "luego",
  ]),
  it: new Set([
    "ma", "o", "e", "quindi", "perché", "che", "chi", "quando", "se",
    "anche", "mentre", "però", "allora", "poi",
  ]),
  pt: new Set([
    "mas", "ou", "e", "então", "porque", "que", "quem", "quando", "se",
    "embora", "enquanto", "porém", "depois",
  ]),
  de: new Set([
    "aber", "oder", "und", "also", "weil", "dass", "der", "die", "wenn",
    "obwohl", "während", "denn", "dann", "sondern",
  ]),
};

/** Normalise un token pour la comparaison (minuscule, sans ponctuation). */
function norm(token: string): string {
  return token
    .toLowerCase()
    .replace(/^[«»"'([{¿¡]+/, "")
    .replace(/[.,;:!?…»"')\]}]+$/, "");
}

/** Le token se termine-t-il par une apostrophe élidée (l', d', qu', n'…) ? */
function isElided(token: string): boolean {
  return /['’]$/.test(token);
}

/** Le token termine-t-il une phrase ? (décimales et abréviations exclues) */
export function endsSentence(token: string): boolean {
  const t = token.trim();
  if (!t || DECIMAL.test(t)) return false;
  if (ABBREV.test(t)) return false;
  return STRONG_END.test(t);
}

/** Le token termine-t-il un groupe de sens (ponctuation faible) ? */
function endsClause(token: string): boolean {
  const t = token.trim();
  if (!t || DECIMAL.test(t)) return false;
  return WEAK_END.test(t);
}

/**
 * Coût d'une coupure ENTRE `prev` et `next`. Plus c'est bas, meilleure est la
 * frontière. `Infinity` = coupure interdite.
 */
export function breakPenalty(prev: string, next: string, lang: string): number {
  if (!prev || !next) return Infinity;

  // Élision (« l' », « qu' ») : le mot suivant lui appartient.
  if (isElided(prev)) return Infinity;

  // Un trait d'union / tiret en attente ne se coupe pas.
  if (/[-–—]$/.test(prev)) return Infinity;

  if (endsSentence(prev)) return 0; // frontière idéale
  if (endsClause(prev)) return 4; // très bonne frontière

  const never = NEVER_BREAK_AFTER[lang];
  if (never?.has(norm(prev))) return Infinity;

  const prefer = PREFER_BREAK_BEFORE[lang];
  if (prefer?.has(norm(next))) return 8; // bonne frontière

  return 20; // frontière neutre : acceptable si la longueur l'exige
}

// ─────────────────────────────────────────────────────────────────
//  Mise en lignes
// ─────────────────────────────────────────────────────────────────

/** Ponctuation CJK (pleine chasse) : bon endroit où couper une ligne. */
export const CJK_BREAK_AFTER = /[。！？、，；：…）」』】]/;

/** Répartit un texte CJK sur ≤ maxLines lignes, caractère par caractère. */
function wrapCjk(text: string, profile: CutProfile): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const chars = [...clean];
  if (chars.length <= profile.maxCharsPerLine) return clean;

  const mid = Math.floor(chars.length / 2);
  const maxFirst = Math.min(profile.maxCharsPerLine, chars.length - 1);
  let bestIdx = -1;
  let bestScore = Infinity;
  for (let i = 1; i <= maxFirst; i++) {
    if (chars.length - i > profile.maxCharsPerLine) continue;
    let score = Math.abs(i - mid);
    if (CJK_BREAK_AFTER.test(chars[i - 1]!)) score -= 4;
    if (score < bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  if (bestIdx === -1) bestIdx = profile.maxCharsPerLine;
  return chars.slice(0, bestIdx).join("") + "\n" + chars.slice(bestIdx).join("");
}

/**
 * Met un sous-titre en lignes SELON LE PROFIL.
 *
 * C'est ici que se corrige la divergence 34/42 : la mise en lignes utilise
 * désormais exactement les mêmes bornes que la découpe. Toutes les langues
 * d'une même vidéo ont donc le même rythme visuel.
 */
export function wrapToLines(
  text: string,
  profile: CutProfile,
  lang?: string,
): string {
  if (isCjkLang(lang)) return wrapCjk(text, profile);
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= profile.maxCharsPerLine || profile.maxLines < 2) {
    return clean;
  }

  const words = clean.split(" ");
  let best: { line1: string; line2: string; score: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(" ");
    const line2 = words.slice(i).join(" ");
    if (line1.length > profile.maxCharsPerLine) break;
    if (line2.length > profile.maxCharsPerLine) continue;
    // On minimise le déséquilibre, avec un bonus si la 1re ligne se termine sur
    // une frontière naturelle — et un malus si elle se termine sur un mot qui
    // ne doit pas rester seul en fin de ligne.
    let score = Math.abs(line1.length - line2.length);
    const prev = words[i - 1]!;
    const next = words[i]!;
    const p = breakPenalty(prev, next, lang ?? "fr");
    if (!isFinite(p)) score += 40;
    else score += p / 4;
    if (best === null || score < best.score) best = { line1, line2, score };
  }

  if (best === null) {
    // Aucune coupe ≤ max/≤ max (texte très long) : coupe dure, zéro perte.
    let i = 1;
    while (
      i < words.length &&
      words.slice(0, i + 1).join(" ").length <= profile.maxCharsPerLine
    ) {
      i++;
    }
    return words.slice(0, i).join(" ") + "\n" + words.slice(i).join(" ");
  }
  return best.line1 + "\n" + best.line2;
}
