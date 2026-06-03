// Données SEO par langue pour les pages programmatiques « traduire une vidéo
// de X vers Y ». Chaque langue porte un contenu RÉEL et spécifique (audience,
// famille linguistique, particularités de sous-titrage) afin que chaque page
// générée soit unique et utile — pas du « thin content ».
import { type Lang, LANGS, isRtl, isCjk } from "@/lib/langs";

export type LangSeo = {
  /** Slug d'URL en français, sans accent (ex. "francais", "espagnol"). */
  slug: string;
  /** Nom natif (ex. "español", "中文", "العربية"). */
  native: string;
  /** Ordre de grandeur des locuteurs. */
  speakers: string;
  /** Marchés / régions principales. */
  where: string;
  /** Famille linguistique. */
  family: string;
  /** Pourquoi traduire VERS cette langue (opportunité d'audience). */
  toAngle: string;
  /** Cadrage quand cette langue est la SOURCE. */
  fromAngle: string;
  /** Particularités de sous-titrage propres à cette langue (le cœur unique). */
  specifics: string;
};

export const LANG_SEO: Record<Lang, LangSeo> = {
  fr: {
    slug: "francais",
    native: "français",
    speakers: "plus de 320 millions de locuteurs",
    where: "France, Belgique, Suisse, Québec et toute l'Afrique francophone",
    family: "langue romane",
    toAngle:
      "Le public francophone est exigeant sur la langue : une traduction française réussie doit sonner naturelle, jamais « traduite ». C'est précisément le terrain de jeu d'un studio français.",
    fromAngle:
      "Vous partez d'un contenu français : tout l'enjeu est de préserver votre ton, votre humour et votre registre — y compris l'argot — dans la langue d'arrivée.",
    specifics:
      "Le français a ses pièges de sous-titrage : la ponctuation à espace insécable (« ! », « ? », « : »), les accents, et un texte généralement plus long que l'anglais. Un bon sous-titrage condense sans trahir le registre.",
  },
  en: {
    slug: "anglais",
    native: "English",
    speakers: "près de 1,5 milliard de locuteurs",
    where: "États-Unis, Royaume-Uni, Canada — et la langue commune d'Internet",
    family: "langue germanique",
    toAngle:
      "L'anglais ouvre la plus large audience internationale qui soit. C'est souvent la première traduction qui fait décoller une chaîne au-delà des frontières.",
    fromAngle:
      "Partir de l'anglais donne accès à un contenu très riche ; le défi est de le rendre naturel dans la langue cible sans calque maladroit.",
    specifics:
      "L'anglais est plus concis que le français : la traduction raccourcit souvent le texte, ce qui aide à tenir une vitesse de lecture confortable. Attention aux idiomes et aux contractions, qui ne se traduisent jamais mot à mot.",
  },
  es: {
    slug: "espagnol",
    native: "español",
    speakers: "près de 600 millions de locuteurs",
    where: "Espagne et toute l'Amérique latine (Mexique, Argentine, Colombie…)",
    family: "langue romane",
    toAngle:
      "L'espagnol ouvre un marché immense, jeune et très actif sur les réseaux sociaux. Un excellent second public pour un créateur francophone.",
    fromAngle:
      "L'espagnol est une langue expressive et chaleureuse ; la traduction doit garder cette énergie plutôt que de l'aplatir.",
    specifics:
      "Le point clé : la variante. Castillan (Espagne) et espagnol d'Amérique latine diffèrent (vouvoiement, vocabulaire, « vosotros » vs « ustedes »). On choisit un registre cohérent avec votre audience, et on respecte les « ¿ » et « ¡ » inversés.",
  },
  de: {
    slug: "allemand",
    native: "Deutsch",
    speakers: "environ 100 millions de locuteurs",
    where: "Allemagne, Autriche et Suisse alémanique",
    family: "langue germanique",
    toAngle:
      "Un public au fort pouvoir d'achat et friand de contenu de qualité. L'allemand est un marché sérieux, souvent sous-exploité par les créateurs francophones.",
    fromAngle:
      "L'allemand est précis et structuré ; la traduction gagne à rester claire et directe.",
    specifics:
      "L'allemand est… long : les mots composés et la grammaire allongent le texte de 20 à 30 % par rapport au français. Pour des sous-titres, cela veut dire condenser davantage afin de ne pas déborder les deux lignes. Les noms prennent une majuscule, et le vouvoiement (« Sie ») compte.",
  },
  it: {
    slug: "italien",
    native: "italiano",
    speakers: "environ 85 millions de locuteurs",
    where: "Italie, Suisse italienne et diaspora",
    family: "langue romane",
    toAngle:
      "Proche du français, l'italien est une traduction « naturelle » pour un créateur francophone, avec une audience passionnée et fidèle.",
    fromAngle:
      "L'italien est musical et expressif ; la traduction doit en garder le relief.",
    specifics:
      "Deux langues latines voisines : la structure des phrases se ressemble, ce qui aide au calage des sous-titres. Restent les faux-amis et une expressivité orale forte à rendre sans la lisser.",
  },
  pt: {
    slug: "portugais",
    native: "português",
    speakers: "environ 260 millions de locuteurs",
    where: "Brésil (audience énorme) et Portugal",
    family: "langue romane",
    toAngle:
      "Le Brésil est l'un des plus gros marchés de contenu vidéo au monde. Le portugais est un levier de croissance majeur, encore peu disputé par les créateurs FR.",
    fromAngle:
      "Le portugais est riche et chaleureux ; la traduction doit en préserver le naturel.",
    specifics:
      "Distinguez le portugais du Brésil et celui du Portugal : vocabulaire, orthographe et tournures diffèrent (« você » vs « tu »). On cale la variante sur votre audience cible — le plus souvent le Brésil pour la vidéo en ligne.",
  },
  ru: {
    slug: "russe",
    native: "русский",
    speakers: "environ 255 millions de locuteurs",
    where: "Russie et espace russophone",
    family: "langue slave",
    toAngle:
      "Un vaste bassin russophone, très consommateur de vidéo. Une traduction soignée y fait la différence face aux sous-titres automatiques bruts.",
    fromAngle:
      "Le russe est dense et imagé ; la traduction doit restituer ses nuances.",
    specifics:
      "Le russe s'écrit en alphabet cyrillique et fonctionne par déclinaisons (cas), ce qui rend l'ordre des mots souple. La longueur varie : on ajuste le découpage pour garder des lignes lisibles.",
  },
  zh: {
    slug: "chinois",
    native: "中文",
    speakers: "plus d'un milliard de locuteurs (mandarin)",
    where: "Chine continentale, Taïwan, Singapour et diaspora",
    family: "langue sinitique",
    toAngle:
      "Le plus grand bassin de locuteurs au monde. Même une fraction de cette audience représente une portée considérable.",
    fromAngle:
      "Partir du chinois demande une vraie compréhension du contexte ; la traduction doit dérouler le sens sans rigidité.",
    specifics:
      "Le chinois ne sépare pas les mots par des espaces et chaque caractère porte beaucoup de sens. Résultat : un sous-titre se découpe au caractère, sur des lignes courtes. Maxline gère ce découpage CJK nativement (≈ 16 caractères par ligne, deux lignes max) — là où beaucoup d'outils laissent des lignes interminables.",
  },
  ja: {
    slug: "japonais",
    native: "日本語",
    speakers: "environ 125 millions de locuteurs",
    where: "Japon et communautés japonophones",
    family: "langue japonique",
    toAngle:
      "Une audience exigeante sur la qualité et très engagée. Le soin apporté aux sous-titres japonais se remarque immédiatement.",
    fromAngle:
      "Le japonais joue sur l'implicite et les niveaux de politesse ; la traduction doit expliciter sans alourdir.",
    specifics:
      "Le japonais mêle trois écritures (hiragana, katakana, kanji), ne met pas d'espaces entre les mots, et code la politesse (keigo) dans la grammaire. Les sous-titres se découpent au caractère, sur des lignes courtes — ce que Maxline gère nativement pour rester lisible à l'écran.",
  },
  ar: {
    slug: "arabe",
    native: "العربية",
    speakers: "environ 400 millions de locuteurs",
    where: "Afrique du Nord, Moyen-Orient et diaspora",
    family: "langue sémitique",
    toAngle:
      "Un très large public arabophone, jeune et très présent sur la vidéo en ligne, encore mal servi par les outils de sous-titrage. Une vraie opportunité.",
    fromAngle:
      "L'arabe est riche en registres ; la traduction doit choisir le bon niveau de langue selon votre audience.",
    specifics:
      "L'arabe s'écrit de droite à gauche (RTL) et lie ses lettres. À l'écran comme dans l'éditeur, le sens d'écriture doit être respecté : Maxline affiche et édite l'arabe en RTL, avec un export .srt/.vtt correct. À surveiller aussi : l'arabe standard moderne face aux dialectes, selon le public visé.",
  },
};

/** Map slug → code langue. */
export const LANG_BY_SLUG: Record<string, Lang> = Object.fromEntries(
  (LANGS as readonly Lang[]).map((l) => [LANG_SEO[l].slug, l]),
) as Record<string, Lang>;

const LABELS: Record<Lang, string> = {
  fr: "français",
  en: "anglais",
  es: "espagnol",
  de: "allemand",
  it: "italien",
  pt: "portugais",
  ru: "russe",
  zh: "chinois",
  ja: "japonais",
  ar: "arabe",
};

/** Libellé français minuscule d'une langue (« français », « espagnol »). */
export function langName(lang: Lang): string {
  return LABELS[lang];
}

/** « le français », « l'anglais »… (élision devant voyelle). */
export function withArticle(lang: Lang): string {
  const name = LABELS[lang];
  return /^[aeiou]/i.test(name) ? `l'${name}` : `le ${name}`;
}

export type LangPair = { source: Lang; target: Lang; slug: string };

/** Slug d'une paire : "francais-vers-espagnol". */
export function pairSlug(source: Lang, target: Lang): string {
  return `${LANG_SEO[source].slug}-vers-${LANG_SEO[target].slug}`;
}

/** Toutes les paires source ≠ cible (90). */
export function allPairs(): LangPair[] {
  const pairs: LangPair[] = [];
  for (const source of LANGS) {
    for (const target of LANGS) {
      if (source === target) continue;
      pairs.push({ source, target, slug: pairSlug(source, target) });
    }
  }
  return pairs;
}

/** Parse un slug "x-vers-y" → paire valide, ou null. */
export function pairFromSlug(slug: string): LangPair | null {
  const m = slug.match(/^([a-z]+)-vers-([a-z]+)$/);
  if (!m) return null;
  const source = LANG_BY_SLUG[m[1]!];
  const target = LANG_BY_SLUG[m[2]!];
  if (!source || !target || source === target) return null;
  return { source, target, slug };
}

/**
 * Note spécifique à la PAIRE (variation réelle d'une page à l'autre) :
 * langues latines proches, cible RTL (arabe), cible CJK (chinois/japonais),
 * cible concise (anglais) ou longue (allemand).
 */
export function pairNote(source: Lang, target: Lang): string {
  const ROMANCE = new Set<Lang>(["fr", "es", "it", "pt"]);
  if (isRtl(target)) {
    return `Comme ${withArticle(target)} s'écrit de droite à gauche, Maxline affiche et édite vos sous-titres en RTL — un détail que la plupart des outils négligent, et qui change tout à l'écran.`;
  }
  if (isCjk(target)) {
    return `${cap(withArticle(target))} ne sépare pas les mots par des espaces : Maxline découpe les sous-titres au caractère, sur des lignes courtes, pour rester lisible.`;
  }
  if (target === "en") {
    return `L'anglais étant plus concis, la traduction depuis ${withArticle(source)} raccourcit souvent le texte — pratique pour des sous-titres rapides à lire.`;
  }
  if (target === "de") {
    return `L'allemand allonge le texte (mots composés) : on condense davantage la traduction depuis ${withArticle(source)} pour éviter des sous-titres trop longs.`;
  }
  if (ROMANCE.has(source) && ROMANCE.has(target)) {
    return `${cap(withArticle(source))} et ${withArticle(target)} sont deux langues latines proches : la structure des phrases se ressemble, ce qui aide à garder des sous-titres fluides et bien calés.`;
  }
  return `L'enjeu d'une traduction ${langName(source)} → ${langName(target)} réussie, c'est de préserver le registre et le ton — pas seulement les mots.`;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
