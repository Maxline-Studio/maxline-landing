// Données SEO par USAGE (plateforme / cas d'emploi) pour les pages
// programmatiques « sous-titres pour … ». Chaque usage porte un contenu RÉEL et
// spécifique (pourquoi, conseils, FAQ) → pages uniques, utiles, pas de thin
// content. Honnêteté : on ne promet que ce que Maxline fait vraiment.

export type Usage = {
  slug: string;
  /** Libellé court (fil d'Ariane, chips). */
  label: string;
  /** Titre H1 affiché. */
  h1: string;
  /** <title> (sans le suffixe " | Maxline Studio"). */
  title: string;
  /** Meta description. */
  description: string;
  keywords: string[];
  /** Accroche d'introduction. */
  lede: string;
  /** Pourquoi des sous-titres pour cet usage (2-3 paragraphes). */
  why: string[];
  /** Conseils / spécificités. */
  tips: { title: string; body: string }[];
  /** FAQ propre à l'usage. */
  faq: { question: string; answer: string }[];
  /** Titre de l'encart CTA. */
  ctaTitle: string;
};

export const USAGES: Usage[] = [
  {
    slug: "tiktok",
    label: "TikTok",
    h1: "Sous-titres pour TikTok",
    title: "Sous-titres pour TikTok : automatiques, incrustés, lisibles muet",
    description:
      "Ajoutez des sous-titres à vos vidéos TikTok : incrustés et stylés, lisibles sans le son, au format vertical. Traduction en 10 langues pour percer à l'international.",
    keywords: [
      "sous-titres tiktok",
      "sous-titrer une vidéo tiktok",
      "sous-titres automatiques tiktok",
      "captions tiktok",
    ],
    lede: "La majorité des vidéos sociales sont regardées sans le son. Sur TikTok, des sous-titres clairs ne sont pas une option : c'est ce qui retient le spectateur dans les deux premières secondes.",
    why: [
      "Sur un fil qui défile vite, le texte capte l'œil avant la voix. Des sous-titres bien calés augmentent le temps de visionnage — et le temps de visionnage, c'est le carburant de l'algorithme.",
      "Des sous-titres rendent aussi votre vidéo accessible aux personnes sourdes et malentendantes, et compréhensible dans le métro, en cours ou au bureau, là où le son est coupé.",
      "Enfin, traduire vos sous-titres ouvre un public international sans retourner une seule prise : une même vidéo française peut toucher des spectateurs anglophones ou hispanophones.",
    ],
    tips: [
      {
        title: "Incrustez-les dans la vidéo",
        body: "Les sous-titres automatiques de TikTok sont basiques et ne survivent pas toujours à un repost. Une version incrustée (gravée dans l'image), stylée à votre goût, reste impeccable partout. Maxline génère un MP4 avec sous-titres incrustés.",
      },
      {
        title: "Restez court : une à deux lignes",
        body: "L'écran est vertical et le pouce masque souvent le bas. Des sous-titres courts, remontés et lisibles d'un coup d'œil valent mieux qu'un pavé de texte.",
      },
      {
        title: "Traduisez pour percer ailleurs",
        body: "Un sous-titrage anglais ou espagnol sur une vidéo française, et votre portée potentielle change d'échelle.",
      },
    ],
    faq: [
      {
        question: "TikTok ne met-il pas déjà des sous-titres ?",
        answer:
          "Si, mais ils sont automatiques, peu personnalisables et pas toujours fidèles, surtout en français ou en argot. Des sous-titres soignés et stylés, que vous corrigez avant publication, font une vraie différence à l'écran.",
      },
      {
        question: "Le format vertical est-il géré ?",
        answer:
          "Oui. Maxline s'adapte au format réel de votre vidéo (vertical 9:16, carré, paysage) et cale la taille des sous-titres en conséquence.",
      },
    ],
    ctaTitle: "Vos vidéos TikTok, sous-titrées proprement.",
  },
  {
    slug: "youtube",
    label: "YouTube",
    h1: "Sous-titres pour YouTube",
    title: "Sous-titres pour YouTube : .srt, multilingue, référencement",
    description:
      "Ajoutez des sous-titres à vos vidéos YouTube : fichier .srt à téléverser, plusieurs langues, meilleure accessibilité et meilleur référencement. Édition avant export.",
    keywords: [
      "sous-titres youtube",
      "sous-titrer une vidéo youtube",
      "fichier srt youtube",
      "sous-titres multilingues youtube",
    ],
    lede: "Sur YouTube, les sous-titres ne servent pas qu'à l'accessibilité : ils aident le référencement, retiennent le spectateur, et ouvrent votre chaîne à d'autres langues.",
    why: [
      "YouTube lit le texte de vos sous-titres : un fichier propre aide la plateforme à comprendre votre vidéo et à la proposer sur les bonnes recherches. C'est du référencement vidéo gratuit.",
      "Une piste de sous-titres dans une autre langue, c'est une audience supplémentaire qui peut suivre votre contenu — sans doublage, sans retouche.",
      "Et pour le long format, des sous-titres téléversables (que le spectateur active ou non) sont préférables à des sous-titres gravés : ils restent optionnels et propres.",
    ],
    tips: [
      {
        title: "Téléversez un .srt plutôt que d'incruster",
        body: "Pour une vidéo longue, mieux vaut un fichier .srt que YouTube affiche en option : le spectateur choisit, et vous gardez une image nette. Maxline exporte un .srt propre.",
      },
      {
        title: "Ajoutez plusieurs langues",
        body: "Téléversez une piste de sous-titres par langue. Une chaîne française peut proposer l'anglais, l'espagnol, l'allemand…",
      },
      {
        title: "Corrigez avant de publier",
        body: "Noms propres, jargon, ponctuation : un passage dans l'éditeur garantit un rendu pro.",
      },
    ],
    faq: [
      {
        question: "Les sous-titres améliorent-ils le référencement YouTube ?",
        answer:
          "Ils y contribuent : YouTube exploite le texte des sous-titres pour comprendre et indexer votre vidéo. Un fichier fidèle aide à apparaître sur les bonnes requêtes.",
      },
      {
        question: "Quel format pour YouTube ?",
        answer:
          "Le .srt est parfait : vous le téléversez dans le gestionnaire de sous-titres de YouTube, et vous pouvez en ajouter un par langue.",
      },
    ],
    ctaTitle: "Vos vidéos YouTube, sous-titrées et multilingues.",
  },
  {
    slug: "instagram-reels",
    label: "Instagram Reels",
    h1: "Sous-titres pour Instagram (Reels & Stories)",
    title: "Sous-titres pour Instagram Reels : incrustés, lisibles muet",
    description:
      "Ajoutez des sous-titres à vos Reels et Stories Instagram : incrustés, au format vertical, lisibles sans le son. Traduction en 10 langues pour élargir votre audience.",
    keywords: [
      "sous-titres instagram",
      "sous-titres reels",
      "sous-titrer un reel",
      "sous-titres stories instagram",
    ],
    lede: "Les Reels démarrent souvent en lecture automatique, son coupé. Sans sous-titres, votre message passe à la trappe avant même d'être entendu.",
    why: [
      "Des sous-titres retiennent le spectateur pendant ces premières secondes muettes décisives, et rendent votre Reel compréhensible partout.",
      "Ils rendent votre contenu accessible aux personnes sourdes et malentendantes — une part non négligeable de votre audience.",
      "Traduits, ils transforment un Reel local en contenu compréhensible à l'international.",
    ],
    tips: [
      {
        title: "Incrustez pour un rendu maîtrisé",
        body: "Une version gravée, stylée à votre image, reste nette quel que soit le repartage. Maxline produit un MP4 incrusté prêt à publier.",
      },
      {
        title: "Attention aux zones masquées",
        body: "L'interface d'Instagram (boutons, légende) recouvre les bords : gardez les sous-titres courts et bien positionnés.",
      },
      {
        title: "Une vidéo, plusieurs langues",
        body: "Déclinez votre Reel en anglais ou en espagnol pour toucher au-delà de votre cercle.",
      },
    ],
    faq: [
      {
        question: "Reels et Stories sont-ils gérés pareil ?",
        answer:
          "Oui : dans les deux cas, des sous-titres incrustés courts et lisibles fonctionnent le mieux, car le son est souvent coupé et l'écran est vertical.",
      },
      {
        question: "Puis-je récupérer une vidéo prête à publier ?",
        answer:
          "Oui. Maxline génère un MP4 avec les sous-titres incrustés, au format et au style choisis.",
      },
    ],
    ctaTitle: "Vos Reels, sous-titrés et prêts à publier.",
  },
  {
    slug: "podcast",
    label: "Podcast",
    h1: "Sous-titres et transcription pour podcast",
    title: "Sous-titres pour podcast : extraits vidéo, transcription, SEO",
    description:
      "Transformez votre podcast en extraits vidéo sous-titrés, récupérez une transcription pour vos notes d'épisode, et gagnez en référencement. Transcription dans la langue parlée ou traduction.",
    keywords: [
      "sous-titres podcast",
      "transcription podcast",
      "audiogramme",
      "transcrire un podcast",
    ],
    lede: "Un podcast, c'est de l'audio. Mais le partage, lui, se fait en vidéo : des extraits sous-titrés sont le meilleur moyen de faire découvrir un épisode sur les réseaux.",
    why: [
      "Un extrait vidéo sous-titré (audiogramme) se partage et se comprend sans le son — idéal pour donner envie d'écouter l'épisode complet.",
      "Une transcription écrite enrichit vos notes d'épisode, devient un article de blog, et donne du texte à indexer pour les moteurs de recherche.",
      "Et elle rend votre podcast accessible aux personnes sourdes et malentendantes, trop souvent oubliées par l'audio.",
    ],
    tips: [
      {
        title: "Transcrivez dans la langue parlée",
        body: "Pas besoin de traduire : le mode transcription (même langue à l'entrée et à la sortie) produit des sous-titres fidèles, parfaits pour des extraits ou des notes.",
      },
      {
        title: "Exportez le texte brut",
        body: "Récupérez un .txt pour vos notes d'épisode ou un article — du contenu écrit que Google peut indexer.",
      },
      {
        title: "Découpez des moments forts",
        body: "Repérez les meilleurs passages, sous-titrez-les, publiez-les en extraits verticaux.",
      },
    ],
    faq: [
      {
        question: "Faut-il une vidéo, ou l'audio suffit ?",
        answer:
          "Il faut un fichier vidéo (même un simple fond fixe avec la forme d'onde convient) pour produire des sous-titres synchronisés ou un extrait incrusté.",
      },
      {
        question: "Puis-je récupérer juste la transcription ?",
        answer:
          "Oui : exportez le texte en .txt, ou les sous-titres en .srt/.vtt, selon votre besoin.",
      },
    ],
    ctaTitle: "Votre podcast, partageable et lisible.",
  },
  {
    slug: "accessibilite",
    label: "Accessibilité",
    h1: "Sous-titres pour l'accessibilité (sourds et malentendants)",
    title: "Sous-titres accessibilité : sourds et malentendants, RGAA",
    description:
      "Rendez vos vidéos accessibles aux personnes sourdes et malentendantes : sous-titres fidèles dans la langue parlée, exportables en .srt/.vtt, pour répondre aux enjeux d'inclusion et de conformité.",
    keywords: [
      "sous-titres sourds et malentendants",
      "sous-titres accessibilité",
      "sous-titres SDH",
      "accessibilité vidéo RGAA",
    ],
    lede: "En France, des millions de personnes sont sourdes ou malentendantes. Sans sous-titres, vos vidéos leur sont tout simplement fermées. C'est un enjeu d'inclusion — et, pour le secteur public, une obligation.",
    why: [
      "Sous-titrer une vidéo dans sa propre langue (transcription) la rend accessible à celles et ceux qui ne peuvent pas l'entendre. C'est la base de la vidéo inclusive.",
      "Pour les organismes publics et beaucoup d'entreprises, l'accessibilité numérique (référentiel RGAA) impose des contenus vidéo sous-titrés. Des sous-titres fidèles et exportables aident à répondre à cette exigence.",
      "Au-delà de l'obligation, c'est aussi une audience que la plupart des créateurs négligent — et qui vous le rendra.",
    ],
    tips: [
      {
        title: "Transcrivez dans la langue d'origine",
        body: "Le mode transcription (français → français, anglais → anglais…) produit des sous-titres fidèles à la parole, sans traduction. C'est ce qu'il faut pour l'accessibilité de base.",
      },
      {
        title: "Relisez pour la fidélité",
        body: "Pour l'accessibilité, la fidélité prime : un passage dans l'éditeur garantit des sous-titres exacts, bien calés et lisibles.",
      },
      {
        title: "Exportez un .srt standard",
        body: "Un .srt propre s'intègre à votre lecteur ou à votre plateforme, et reste un standard reconnu pour l'accessibilité.",
      },
    ],
    faq: [
      {
        question: "C'est quoi le SDH ?",
        answer:
          "Le SDH (« Subtitles for the Deaf and Hard of hearing ») ajoute, en plus des dialogues, des indications de sons et de locuteurs. Maxline produit aujourd'hui des sous-titres fidèles et exportables ; l'enrichissement SDH avancé (annotations de sons, couleurs par locuteur) est sur notre feuille de route.",
      },
      {
        question: "Cela aide-t-il à la conformité RGAA ?",
        answer:
          "Le RGAA demande des vidéos sous-titrées. Des sous-titres fidèles, synchronisés et exportables sont un élément essentiel pour y répondre — la conformité complète dépendant ensuite de votre lecteur et de votre intégration.",
      },
    ],
    ctaTitle: "Des vidéos accessibles à toutes et tous.",
  },
  {
    slug: "formation",
    label: "Formation",
    h1: "Sous-titres pour la formation et l'e-learning",
    title: "Sous-titres pour la formation : compréhension, langues, accessibilité",
    description:
      "Sous-titrez vos vidéos de formation et e-learning : meilleure compréhension et mémorisation, contenus multilingues pour des apprenants internationaux, accessibilité.",
    keywords: [
      "sous-titres formation",
      "sous-titres e-learning",
      "sous-titrer une vidéo de formation",
      "vidéo pédagogique sous-titres",
    ],
    lede: "En formation, les sous-titres ne sont pas un décor : ils améliorent la compréhension, la mémorisation, et permettent de suivre une vidéo dans un open space ou les transports.",
    why: [
      "Le double canal (entendre et lire) renforce la compréhension et la mémorisation, surtout pour les notions techniques et les termes nouveaux.",
      "Des sous-titres traduits ouvrent vos modules à des apprenants d'autres langues, sans tout réenregistrer.",
      "Ils rendent vos contenus accessibles et conformes aux exigences d'accessibilité, importantes dans l'enseignement et le secteur public.",
    ],
    tips: [
      {
        title: "Soignez le vocabulaire métier",
        body: "Les termes techniques doivent être justes. L'éditeur (et le glossaire) vous laisse fixer l'orthographe des termes propres à votre domaine.",
      },
      {
        title: "Déclinez en plusieurs langues",
        body: "Une même vidéo de formation peut servir des équipes francophones, anglophones et hispanophones.",
      },
      {
        title: "Fournissez aussi la transcription",
        body: "Un export .txt devient un support écrit, consultable et cherchable par les apprenants.",
      },
    ],
    faq: [
      {
        question: "Les termes techniques sont-ils bien gérés ?",
        answer:
          "La traduction tient compte du contexte global de la vidéo, et vous pouvez corriger chaque ligne. Un glossaire permet d'imposer l'orthographe de vos termes métier.",
      },
      {
        question: "Puis-je proposer la vidéo en plusieurs langues ?",
        answer:
          "Oui : traduisez les sous-titres dans chacune des 10 langues disponibles, et exportez un fichier par langue.",
      },
    ],
    ctaTitle: "Vos formations, comprises par tous.",
  },
  {
    slug: "montage",
    label: "Montage",
    h1: "Ajouter des sous-titres dans DaVinci, Premiere ou Final Cut",
    title: "Sous-titres pour le montage : export .srt propre pour votre logiciel",
    description:
      "Générez des sous-titres et exportez un .srt propre (ou un fichier pour le montage) prêt pour DaVinci Resolve, Premiere Pro et Final Cut. Édition ligne par ligne avant export.",
    keywords: [
      "sous-titres davinci resolve",
      "sous-titres premiere pro",
      "importer srt premiere",
      "sous-titres final cut",
    ],
    lede: "Vous montez sur DaVinci Resolve, Premiere Pro ou Final Cut ? Il vous faut un fichier de sous-titres propre, pas une vidéo figée dans le style d'une plateforme.",
    why: [
      "Un .srt propre s'importe directement dans votre logiciel de montage : vous gardez la main sur la mise en forme, la position et l'animation des sous-titres.",
      "Le vrai gain de temps, c'est la transcription et la traduction automatiques : vous récupérez le texte calé, et vous l'habillez dans votre logiciel.",
      "Encore faut-il pouvoir corriger le texte avant l'export — noms propres, ponctuation, coupures — pour ne pas retoucher cinquante lignes à la main ensuite.",
    ],
    tips: [
      {
        title: "Exportez en .srt",
        body: "Le .srt est lu par DaVinci Resolve, Premiere Pro, Final Cut et la plupart des logiciels. C'est le format pivot du montage sous-titré.",
      },
      {
        title: "Besoin d'aller plus loin ? Le .fcpxml",
        body: "Pour réimporter les sous-titres comme éléments éditables (selon votre logiciel), un export .fcpxml est disponible sur les offres adaptées.",
      },
      {
        title: "Corrigez d'abord, exportez ensuite",
        body: "L'éditeur en ligne vous laisse nettoyer chaque ligne. L'export reprend toujours vos dernières corrections.",
      },
    ],
    faq: [
      {
        question: "Quel format importer dans DaVinci ou Premiere ?",
        answer:
          "Le .srt est le plus simple et universel : il s'importe directement comme piste de sous-titres. Pour un flux plus avancé, le .fcpxml est proposé sur les offres adaptées.",
      },
      {
        question: "Puis-je corriger le texte avant d'exporter ?",
        answer:
          "Oui : vous éditez chaque ligne (texte et timecodes) dans Maxline, puis vous exportez le fichier à jour pour votre montage.",
      },
    ],
    ctaTitle: "Des sous-titres propres, prêts pour le montage.",
  },
];

export const USAGE_BY_SLUG: Record<string, Usage> = Object.fromEntries(
  USAGES.map((u) => [u.slug, u]),
);

export function usageFromSlug(slug: string): Usage | null {
  return USAGE_BY_SLUG[slug] ?? null;
}

/** Libellé naturel après « pour » (« TikTok », « le podcast », « l'accessibilité »). */
export function usageForLabel(u: Usage): string {
  const withArticle: Record<string, string> = {
    podcast: "le podcast",
    accessibilite: "l'accessibilité",
    formation: "la formation",
    montage: "le montage",
  };
  return withArticle[u.slug] ?? u.label;
}
