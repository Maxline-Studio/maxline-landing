// Centralise l'URL du site et les données structurées (JSON-LD).
// Le domaine servi est en www (non-www fait un 308 vers www) :
// tous les canonicals et OG doivent donc pointer vers www.
export const SITE_URL = "https://www.maxlinestudio.fr";

export const ORG_NAME = "Maxline Studio";
const LOGO_URL = `${SITE_URL}/maxline-avatar.png`;
const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61581498317108";
const CONTACT_EMAIL = "contact@maxlinestudio.fr";

// Construit une URL absolue (www) à partir d'un chemin.
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Organisation — utilisée à l'échelle du site.
export const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORG_NAME,
  url: SITE_URL,
  logo: LOGO_URL,
  description:
    "Outil de sous-titrage vidéo pour créateurs français : transcription et traduction français ↔ anglais, sous-titres exportables.",
  email: CONTACT_EMAIL,
  founder: { "@type": "Person", name: "Maxence Chopin" },
  foundingDate: "2026",
  sameAs: [FACEBOOK_URL],
};

// Le site lui-même.
export const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: ORG_NAME,
  url: SITE_URL,
  inLanguage: "fr-FR",
};

// L'application — porte le prix (offers) pour les résultats enrichis.
export const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: ORG_NAME,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Sous-titrage automatique de vidéos YouTube et TikTok, du français vers l'anglais (et anglais → français, ou transcription dans la langue parlée). Sous-titres propres et exportables.",
  inLanguage: "fr-FR",
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "EUR",
    url: absoluteUrl("/#tarif"),
    availability: "https://schema.org/InStock",
    description: "Abonnement mensuel, 120 minutes de vidéo par mois.",
  },
  publisher: { "@type": "Organization", name: ORG_NAME, url: SITE_URL },
};

// FAQPage — construit depuis les données FAQ partagées.
export function faqPageLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

// Fil d'Ariane (breadcrumb).
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
