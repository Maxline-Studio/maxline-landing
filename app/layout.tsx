import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/scroll-progress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://maxlinestudio.fr"),
  title: {
    default: "Maxline Studio — Vos vidéos françaises, sous-titrées en anglais en 10 minutes",
    template: "%s | Maxline Studio",
  },
  description:
    "Maxline Studio traduit automatiquement vos vidéos YouTube et TikTok du français vers l'anglais. Sous-titres propres, exportables vers DaVinci ou Premiere. À 12 € par mois, sans piège.",
  keywords: [
    "traduction vidéo",
    "sous-titres anglais",
    "youtube traduction",
    "tiktok traduction",
    "transcription automatique",
    "sous-titres srt",
    "vidéo international",
  ],
  authors: [{ name: "Maxline Studio" }],
  creator: "Maxline Studio",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://maxlinestudio.fr",
    siteName: "Maxline Studio",
    title: "Vos vidéos françaises, sous-titrées en anglais en 10 minutes.",
    description:
      "L'outil de sous-titrage vidéo pour créateurs YouTube et TikTok, en français, à 12 €/mois.",
    // OG image générée dynamiquement par app/opengraph-image.tsx
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
    canonical: "https://maxlinestudio.fr",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${bricolage.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
