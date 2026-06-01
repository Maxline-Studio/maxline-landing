import type { Metadata } from "next";
import { Inter, Fraunces, Caveat, Montserrat, Anton } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/scroll-progress";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL, organizationLd, websiteLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Police manuscrite — réservée à la signature du fondateur.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

// Polices proposées pour la personnalisation des sous-titres.
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Maxline Studio — Vos vidéos françaises, sous-titrées en anglais en 10 minutes",
    template: "%s | Maxline Studio",
  },
  description:
    "Maxline Studio sous-titre automatiquement vos vidéos YouTube et TikTok du français vers l'anglais — et aussi anglais → français, ou transcription dans la langue parlée. Sous-titres propres, exportables vers DaVinci ou Premiere. À 12 € par mois, sans piège.",
  keywords: [
    "traduction vidéo",
    "sous-titres anglais",
    "sous-titres français",
    "youtube traduction",
    "tiktok traduction",
    "transcription automatique",
    "accessibilité sous-titres",
    "sous-titres srt",
    "vidéo international",
  ],
  authors: [{ name: "Maxline Studio" }],
  creator: "Maxline Studio",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Maxline Studio",
    title: "Vos vidéos françaises, sous-titrées en anglais en 10 minutes.",
    description:
      "L'outil de sous-titrage vidéo pour créateurs YouTube et TikTok, en français, à 12 €/mois.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maxline Studio",
    description:
      "Vos vidéos françaises, sous-titrées en anglais en 10 minutes. À 12 €/mois.",
    creator: "@maxlinestudio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable} ${montserrat.variable} ${anton.variable}`}
    >
      <body>
        <JsonLd data={[organizationLd, websiteLd]} />
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
