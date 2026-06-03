// Données pour les pages « alternative à … ». Comparatifs HONNÊTES et factuels :
// chaque page reconnaît les forces du concurrent ET dit clairement quand le
// choisir. Voix Maxline : pas de dénigrement (ça se retourne contre soi).
// Les prix sont prudents (« au moment de l'écriture ») car ils bougent.

export type Alternative = {
  slug: string;
  name: string;
  title: string;
  description: string;
  keywords: string[];
  /** Ce qu'est le concurrent, en une phrase neutre. */
  positioning: string;
  /** Repère tarifaire prudent. */
  priceNote: string;
  /** Résumé du concurrent pour la mini-comparaison « En bref ». */
  brief: string;
  /** Ce que le concurrent fait très bien (on concède d'abord). */
  theirStrengths: string[];
  /** Ses limites, factuelles. */
  theirLimits: string[];
  /** Où Maxline fait la différence. */
  maxlineWins: string[];
  /** Quand choisir le concurrent (honnêteté). */
  whenThem: string;
  /** Verdict en une phrase. */
  verdict: string;
  faq: { question: string; answer: string }[];
  /** Lien vers un article de fond, si existant. */
  blogPath?: string;
};

const MAXLINE_BRIEF =
  "Sous-titrage + traduction dans 10 langues, forfait clair à 12 €/mois (120 min), édité en France, exports .srt/.vtt/.fcpxml.";

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "submagic",
    name: "Submagic",
    title: "Alternative à Submagic : la française pour traduire et sous-titrer",
    description:
      "Submagic excelle sur les captions virales. Pour traduire et sous-titrer proprement, en français et au forfait clair, voici l'alternative — comparatif honnête, où chacun gagne.",
    keywords: [
      "alternative à submagic",
      "submagic français",
      "submagic alternative",
      "concurrent submagic",
    ],
    positioning:
      "Submagic est la référence des captions virales pour TikTok, Reels et Shorts : styles animés mot par mot, emojis, B-roll automatique.",
    priceNote:
      "À partir d'environ 12 à 23 $/mois (facturation annuelle), avec un nombre d'exports limité par palier — au moment de l'écriture.",
    brief:
      "Captions virales short-form (animations mot par mot, emojis, B-roll), marque mondiale, en dollars.",
    theirStrengths: [
      "Des captions animées mot par mot, des emojis et un style « viral » au top pour les formats courts.",
      "Un montage assisté (B-roll, suppression des silences) pensé pour TikTok, Reels et Shorts.",
      "Une marque énorme et une communauté de créateurs très active.",
    ],
    theirLimits: [
      "L'outil est taillé pour le viral court, pas pour une traduction longue et fidèle au registre.",
      "Tout est pensé en anglais et à l'échelle mondiale : l'identité et le support français passent au second plan.",
      "Le nombre d'exports est plafonné par palier, et la facturation est en dollars.",
    ],
    maxlineWins: [
      "Une traduction qui respecte le ton, le registre et l'argot, dans 10 langues — pas seulement des sous-titres dans la langue d'origine.",
      "Un forfait clair en euros (12 €/mois, 120 minutes) sans plafond d'exports surprise.",
      "Un soin particulier sur le français, l'arabe (droite à gauche) et le chinois/japonais (découpe au caractère).",
      "Un .srt / .vtt / .fcpxml propre, prêt pour le montage.",
    ],
    whenThem:
      "Si votre besoin, c'est avant tout des Shorts et Reels viraux avec des captions animées et des emojis ultra-tendance, Submagic reste excellent — c'est leur cœur de métier.",
    verdict:
      "Submagic pour le viral court ; Maxline pour traduire et sous-titrer proprement, en français, sans piège tarifaire.",
    faq: [
      {
        question: "Maxline fait-il les captions animées mot par mot ?",
        answer:
          "Pas encore : aujourd'hui Maxline produit des sous-titres propres et stylés, incrustables en MP4. Les animations mot par mot sont sur notre feuille de route. Le cœur de Maxline, c'est la qualité de traduction et de sous-titrage.",
      },
      {
        question: "Lequel choisir pour traduire mes vidéos ?",
        answer:
          "Maxline : la traduction dans 10 langues, fidèle au registre et corrigeable ligne par ligne, est son cœur de métier — là où Submagic vise surtout les captions virales.",
      },
    ],
    blogPath: "/blog/submagic-alternative-francais",
  },
  {
    slug: "veed",
    name: "VEED",
    title: "Alternative à VEED : sous-titrage et traduction sans piège",
    description:
      "VEED est un éditeur vidéo complet, mais sa traduction est très limitée. Pour traduire généreusement et au forfait clair, voici l'alternative — comparatif honnête.",
    keywords: [
      "alternative à veed",
      "veed alternative",
      "alternative veed.io",
      "concurrent veed",
    ],
    positioning:
      "VEED est un éditeur vidéo tout-en-un en ligne, avec sous-titres et traduction parmi de nombreuses fonctions.",
    priceNote:
      "Plan gratuit avec filigrane ; offres payantes à partir d'environ 24 à 55 $/mois — au moment de l'écriture.",
    brief:
      "Éditeur vidéo tout-en-un, 100+ langues, mais traduction très plafonnée ; en dollars.",
    theirStrengths: [
      "Un éditeur complet (couper, habiller, exporter) dans le navigateur.",
      "Une très large couverture de langues et une marque bien établie.",
      "Pratique si vous voulez tout faire au même endroit.",
    ],
    theirLimits: [
      "La traduction est très limitée en quantité (de l'ordre de 20 minutes par mois, même sur le plan Pro, au moment de l'écriture).",
      "Filigrane sur le plan gratuit, et tarifs en dollars qui grimpent vite.",
      "Outil généraliste : le sous-titrage n'est qu'une fonction parmi d'autres.",
    ],
    maxlineWins: [
      "Une traduction généreuse (120 minutes par mois à 12 €), pas un quota symbolique.",
      "Un focus clair sur le sous-titrage et la traduction de qualité, pas un couteau suisse.",
      "Un forfait simple en euros, édité en France.",
    ],
    whenThem:
      "Si vous cherchez surtout un éditeur vidéo en ligne pour monter et habiller vos vidéos (au-delà des sous-titres), VEED couvre plus large.",
    verdict:
      "VEED pour l'édition vidéo tout-en-un ; Maxline pour traduire vraiment, sans quota symbolique.",
    faq: [
      {
        question: "Pourquoi la traduction de VEED est-elle limitée ?",
        answer:
          "Au moment de l'écriture, la traduction est plafonnée à quelques minutes par mois selon le plan. Chez Maxline, vos 120 minutes mensuelles couvrent transcription et traduction sans distinction.",
      },
    ],
  },
  {
    slug: "happyscribe",
    name: "HappyScribe",
    title: "Alternative à HappyScribe : pensée pour les créateurs",
    description:
      "HappyScribe est solide pour les pros et les entreprises. Pour un créateur, voici une alternative plus simple et plus chaleureuse — comparatif honnête.",
    keywords: [
      "alternative à happyscribe",
      "happyscribe alternative",
      "concurrent happyscribe",
    ],
    positioning:
      "HappyScribe est une plateforme européenne de transcription et de sous-titrage, IA et service humain, orientée professionnels, entreprises et médias.",
    priceNote:
      "Offres IA à partir d'environ 6 €/mois ; services humains autour de 2 $ la minute — au moment de l'écriture.",
    brief:
      "Transcription/sous-titres pro et humains, 150+ langues, orienté entreprise/médias.",
    theirStrengths: [
      "Une couverture linguistique énorme (150+ langues) et une option de transcription humaine très fiable.",
      "Des outils robustes pour les entreprises, les médias et les workflows pros.",
      "Une plateforme mature avec des intégrations.",
    ],
    theirLimits: [
      "L'expérience est pensée pour le pro et l'entreprise, moins pour le créateur solo.",
      "Les services humains certifiés sont coûteux.",
      "Une interface « sérieuse », moins chaleureuse qu'un outil pensé pour les créateurs.",
    ],
    maxlineWins: [
      "Une expérience pensée pour les créateurs, claire et sans jargon.",
      "Un forfait unique et lisible, et une identité chaleureuse plutôt que corporate.",
      "Une traduction qui soigne le registre et l'argot, pas seulement la transcription.",
    ],
    whenThem:
      "Pour de gros volumes en entreprise, de la transcription humaine certifiée ou des intégrations métier poussées, HappyScribe est taillé pour ça.",
    verdict:
      "HappyScribe pour l'entreprise et le volume ; Maxline pour le créateur qui veut du simple et du soigné.",
    faq: [
      {
        question: "HappyScribe propose-t-il de la transcription humaine ?",
        answer:
          "Oui, c'est l'une de ses forces pour les besoins « zéro erreur » certifiés. Maxline mise sur une IA de qualité (large-v3 + relecture) corrigeable par vous, à un forfait bien plus accessible.",
      },
    ],
  },
  {
    slug: "kapwing",
    name: "Kapwing",
    title: "Alternative à Kapwing : focus sous-titrage et traduction",
    description:
      "Kapwing est un éditeur collaboratif tout-en-un. Pour un outil concentré sur le sous-titrage et la traduction de qualité, voici l'alternative — comparatif honnête.",
    keywords: [
      "alternative à kapwing",
      "kapwing alternative",
      "concurrent kapwing",
    ],
    positioning:
      "Kapwing est un éditeur vidéo collaboratif en ligne, avec sous-titres, traduction et doublage parmi ses fonctions.",
    priceNote:
      "Offres payantes à partir d'environ 16 $/mois — au moment de l'écriture.",
    brief:
      "Éditeur collaboratif tout-en-un, 100+ langues, doublage limité.",
    theirStrengths: [
      "Un éditeur complet et collaboratif, pratique pour les équipes.",
      "Une large couverture de langues pour les sous-titres.",
      "Tout dans le navigateur, sans installation.",
    ],
    theirLimits: [
      "Outil généraliste : le sous-titrage n'est qu'une brique parmi d'autres.",
      "Le doublage est plus limité et le lip-sync en option coûte cher.",
      "Pas d'angle ni de support spécifiquement français.",
    ],
    maxlineWins: [
      "Un outil concentré sur le sous-titrage et la traduction, pas dilué dans un éditeur généraliste.",
      "Une qualité de traduction soignée (registre, argot) dans 10 langues.",
      "Un forfait clair en euros, édité en France.",
    ],
    whenThem:
      "Si vous travaillez en équipe et voulez monter ET sous-titrer au même endroit, l'aspect collaboratif de Kapwing est un vrai plus.",
    verdict:
      "Kapwing pour l'édition collaborative ; Maxline pour des sous-titres et une traduction soignés.",
    faq: [
      {
        question: "Kapwing est-il meilleur pour le travail d'équipe ?",
        answer:
          "Oui, la collaboration est l'un de ses points forts. Maxline est pensé pour le créateur ou la petite structure qui veut surtout des sous-titres et une traduction de qualité, simplement.",
      },
    ],
  },
  {
    slug: "maestra",
    name: "Maestra",
    title: "Alternative à Maestra : sous-titrage français et forfait clair",
    description:
      "Maestra couvre transcription, traduction et doublage. Pour une alternative française au forfait clair et à la traduction soignée, voici le comparatif honnête.",
    keywords: [
      "alternative à maestra",
      "maestra alternative",
      "concurrent maestra",
    ],
    positioning:
      "Maestra réunit transcription, traduction de sous-titres et doublage IA, avec une large couverture de langues.",
    priceNote:
      "Offres payantes à partir d'environ 16 $/mois — au moment de l'écriture.",
    brief:
      "Transcription + traduction + doublage IA, 125+ langues, plusieurs moteurs de traduction.",
    theirStrengths: [
      "Une suite complète : transcription, sous-titres, traduction et doublage en un endroit.",
      "Un accès à plusieurs moteurs de traduction et une très large couverture de langues.",
      "Un doublage en un clic pratique pour des essais rapides.",
    ],
    theirLimits: [
      "Le doublage (notamment le lip-sync) reste perfectible.",
      "Une marque plus discrète et pas d'angle spécifiquement français.",
      "Beaucoup de fonctions, au risque de diluer la qualité du sous-titrage.",
    ],
    maxlineWins: [
      "Une traduction qui soigne le registre et l'argot, corrigeable ligne par ligne.",
      "Un forfait clair en euros, édité en France, sans empilement d'options.",
      "Un soin particulier sur le français, l'arabe (RTL) et le chinois/japonais (CJK).",
    ],
    whenThem:
      "Si vous voulez ajouter un doublage voix off à vos sous-titres dans le même outil, Maestra propose cette brique que Maxline ne fait pas (Maxline ne touche pas à votre voix).",
    verdict:
      "Maestra pour la suite tout-en-un avec doublage ; Maxline pour un sous-titrage/traduction soigné et un forfait clair.",
    faq: [
      {
        question: "Maxline propose-t-il du doublage comme Maestra ?",
        answer:
          "Non, et c'est un choix : Maxline ne remplace pas votre voix. Nous misons sur le sous-titrage et la traduction, qui préservent votre personnalité et soulèvent moins de questions éthiques que la voix clonée.",
      },
    ],
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    title: "Alternative à ElevenLabs : sous-titres plutôt que voix clonée",
    description:
      "ElevenLabs est la référence du doublage par voix clonée. Si vous voulez sous-titrer et traduire sans toucher à votre voix, voici l'alternative — comparatif honnête.",
    keywords: [
      "alternative à elevenlabs",
      "elevenlabs alternative",
      "elevenlabs sous-titres",
      "doublage vs sous-titres",
    ],
    positioning:
      "ElevenLabs est spécialiste du doublage IA et du clonage de voix : il remplace l'audio par une version dans une autre langue.",
    priceNote:
      "À partir d'environ 22 $/mois, avec une facturation par langue (chaque langue cible compte séparément) — au moment de l'écriture.",
    brief:
      "Doublage IA / voix clonée multilingue ; facturé par langue. Ce n'est pas un outil de sous-titres.",
    theirStrengths: [
      "Une qualité de voix clonée multilingue impressionnante.",
      "Un doublage qui adapte le phrasé, pas seulement le mot à mot.",
      "La référence si votre objectif est de doubler votre voix.",
    ],
    theirLimits: [
      "Ce n'est pas un outil de sous-titrage : il remplace l'audio, il ne génère pas de .srt soigné.",
      "La facturation par langue fait grimper le coût très vite (10 min × 3 langues = 30 minutes décomptées).",
      "Le clonage de voix soulève des questions d'éthique et de consentement.",
    ],
    maxlineWins: [
      "Le sous-titrage et la traduction qui préservent votre voix d'origine.",
      "Un forfait clair où vos minutes ne sont pas multipliées par le nombre de langues.",
      "Un .srt / .vtt propre, pour le montage et l'accessibilité.",
    ],
    whenThem:
      "Si vous voulez vraiment doubler votre voix dans une autre langue (et que l'éthique de la voix clonée vous convient), ElevenLabs est la référence.",
    verdict:
      "ElevenLabs pour doubler votre voix ; Maxline pour sous-titrer et traduire en gardant votre voix.",
    faq: [
      {
        question: "Sous-titrer ou doubler : que choisir ?",
        answer:
          "Le sous-titrage préserve votre voix, coûte moins cher et reste neutre éthiquement — c'est ce que veulent la plupart des créateurs. Le doublage remplace votre voix : plus immersif, mais plus lourd et plus délicat.",
      },
    ],
  },
  {
    slug: "checksub",
    name: "Checksub",
    title: "Alternative à Checksub : forfait clair et identité d'atelier",
    description:
      "Checksub est un outil français solide. Voici une alternative au forfait mensuel clair, avec une identité d'atelier et un soin particulier sur le registre — comparatif honnête.",
    keywords: [
      "alternative à checksub",
      "checksub alternative",
      "checksub avis",
      "concurrent checksub",
    ],
    positioning:
      "Checksub est un outil français de sous-titrage et de traduction, avec plusieurs années d'expérience.",
    priceNote:
      "Tarification autour de 18 € de l'heure de vidéo, avec des paliers — au moment de l'écriture.",
    brief:
      "Outil français de sous-titrage/traduction, expérimenté, tarif souvent à l'heure.",
    theirStrengths: [
      "Un outil français sérieux, avec de l'expérience et de bons designs de sous-titres.",
      "Une bonne couverture de langues et une qualité reconnue.",
      "Un acteur honnête du marché français — on le dit volontiers.",
    ],
    theirLimits: [
      "Une tarification à l'heure pas toujours lisible d'un coup d'œil.",
      "Une marque discrète et une interface qui a un peu vieilli (au moment de l'écriture).",
    ],
    maxlineWins: [
      "Un forfait mensuel clair (12 €, 120 minutes) plutôt qu'une facturation à l'heure.",
      "Une identité d'atelier soignée et une voix de marque assumée.",
      "Un soin particulier sur le registre, l'argot, et l'écriture arabe (RTL) / chinoise (CJK).",
    ],
    whenThem:
      "Checksub est un concurrent français solide et honnête : si son interface et sa tarification vous conviennent, c'est un bon outil. La différence tient surtout à l'approche (forfait clair, identité).",
    verdict:
      "Deux outils français sérieux : Maxline mise sur le forfait clair, l'identité et le soin du détail.",
    faq: [
      {
        question: "Maxline est-il aussi français que Checksub ?",
        answer:
          "Oui : Maxline est édité en France par un créateur indépendant. Les deux outils sont français ; ils diffèrent surtout par l'approche tarifaire (forfait mensuel vs à l'heure) et l'identité.",
      },
    ],
  },
  {
    slug: "capcut",
    name: "CapCut",
    title: "Alternative à CapCut : qualité, montage propre et données en Europe",
    description:
      "CapCut est gratuit et grand public. Pour une traduction soignée, un .srt propre et une alternative éditée en France, voici le comparatif honnête.",
    keywords: [
      "alternative à capcut",
      "capcut alternative",
      "capcut sous-titres",
      "alternative européenne capcut",
    ],
    positioning:
      "CapCut est un éditeur vidéo gratuit et grand public (groupe ByteDance), avec sous-titres et traduction intégrés.",
    priceNote: "Gratuit pour l'essentiel, avec des fonctions Pro payantes — au moment de l'écriture.",
    brief:
      "Éditeur gratuit grand public, très répandu ; qualité « grand public », éditeur appartenant à ByteDance.",
    theirStrengths: [
      "Gratuit et extrêmement répandu, surtout sur mobile.",
      "Simple à prendre en main pour des montages rapides.",
      "Des sous-titres automatiques intégrés au montage.",
    ],
    theirLimits: [
      "Une qualité de traduction « grand public », sans soin particulier du registre.",
      "Un éditeur qui appartient à ByteDance, ce qui soulève des questions de données et de confiance.",
      "Pas pensé pour un flux pro (export propre, montage externe).",
    ],
    maxlineWins: [
      "Une traduction soignée (registre, argot) dans 10 langues, corrigeable ligne par ligne.",
      "Un .srt / .vtt propre pour votre montage sur DaVinci, Premiere ou Final Cut.",
      "Une alternative éditée en France, plus claire sur le traitement de vos vidéos.",
    ],
    whenThem:
      "Pour un montage gratuit et rapide sur mobile, CapCut est difficile à battre sur le prix.",
    verdict:
      "CapCut pour le montage mobile gratuit ; Maxline pour une traduction soignée et un export propre, en Europe.",
    faq: [
      {
        question: "Pourquoi payer alors que CapCut est gratuit ?",
        answer:
          "Pour la qualité de traduction (registre, argot), un .srt propre prêt pour le montage, et une alternative éditée en France plutôt qu'un outil grand public d'un grand groupe. Si le gratuit vous suffit, CapCut fait le travail de base.",
      },
    ],
  },
];

export const ALTERNATIVE_BY_SLUG: Record<string, Alternative> = Object.fromEntries(
  ALTERNATIVES.map((a) => [a.slug, a]),
);

export function alternativeFromSlug(slug: string): Alternative | null {
  return ALTERNATIVE_BY_SLUG[slug] ?? null;
}

export { MAXLINE_BRIEF };
