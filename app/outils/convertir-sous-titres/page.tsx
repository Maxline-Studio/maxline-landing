import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqPageLd, absoluteUrl } from "@/lib/seo";
import { SubtitleConverter } from "./converter-client";

const TITLE = "Convertir des sous-titres SRT, VTT, TXT (gratuit, en ligne)";
const DESCRIPTION =
  "Convertissez vos sous-titres SRT en VTT, VTT en SRT, ou SRT/VTT en TXT, gratuitement et sans inscription. Conversion dans votre navigateur : rien n'est envoyé sur un serveur.";
const PATH = "/outils/convertir-sous-titres";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "convertir srt en vtt",
    "srt en vtt",
    "vtt en srt",
    "srt en txt",
    "convertir sous-titres",
    "convertisseur srt vtt",
    "sous-titres en texte",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convertir des sous-titres SRT, VTT, TXT — gratuit",
    description:
      "SRT en VTT, VTT en SRT, SRT/VTT en TXT. Gratuit, sans inscription, dans votre navigateur.",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

const FAQ = [
  {
    question: "Comment convertir un SRT en VTT ?",
    answer:
      "Déposez votre fichier .srt dans l'outil, choisissez « VTT » comme format de sortie, puis téléchargez le résultat. La conversion ajoute l'en-tête WEBVTT et remplace la virgule des millisecondes par un point, conformément au format VTT.",
  },
  {
    question: "Comment convertir un VTT en SRT ?",
    answer:
      "Déposez votre fichier .vtt, sélectionnez « SRT » en sortie, et téléchargez. L'outil supprime l'en-tête WEBVTT, numérote les sous-titres et remet la virgule décimale attendue par le format SRT.",
  },
  {
    question: "Comment extraire le texte d'un fichier de sous-titres ?",
    answer:
      "Choisissez « TXT » comme format de sortie : l'outil retire les timecodes et les numéros, et ne garde que le texte, une ligne par sous-titre. Pratique pour relire ou réutiliser le contenu.",
  },
  {
    question: "Mes fichiers sont-ils envoyés sur un serveur ?",
    answer:
      "Non. La conversion s'exécute entièrement dans votre navigateur. Aucun fichier n'est téléversé, rien n'est stocké : c'est instantané, gratuit et confidentiel.",
  },
  {
    question: "Quelle est la différence entre SRT, VTT et TXT ?",
    answer:
      "Le SRT (SubRip) est le format de sous-titres le plus répandu, lu par la plupart des logiciels de montage et lecteurs. Le VTT (WebVTT) est le format des sous-titres sur le web (balise <track> en HTML5). Le TXT est du texte brut, sans timecode.",
  },
];

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Convertir des sous-titres (SRT, VTT, TXT)",
  description: DESCRIPTION,
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Importer le fichier",
      text: "Déposez ou collez votre fichier de sous-titres .srt, .vtt ou .txt.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Choisir le format de sortie",
      text: "Sélectionnez le format voulu : SRT, VTT ou TXT.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Télécharger",
      text: "Téléchargez le fichier converti ou copiez le résultat.",
    },
  ],
};

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Convertisseur de sous-titres Maxline",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: absoluteUrl(PATH),
  description: DESCRIPTION,
  inLanguage: "fr-FR",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function ConvertirSousTitres() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Outils", path: "/outils" },
            { name: "Convertir des sous-titres", path: PATH },
          ]),
          howToLd,
          softwareLd,
          faqPageLd(FAQ),
        ]}
      />
      <Header />
      <main id="main-content" className="bg-ivory-50 relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

        <article className="container mx-auto max-w-4xl px-4 md:px-6 lg:px-8 relative py-12 md:py-16">
          <Link
            href="/outils"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Tous les outils
          </Link>

          <header className="mb-8 md:mb-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="annotation">§ Outil gratuit</span>
            </div>
            <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-5">
              Convertir des sous-titres{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  SRT, VTT, TXT
                </HandUnderline>
              </span>
              .
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">
              Passez d&apos;un format à l&apos;autre en un clic. Gratuit, sans
              inscription, et <strong>sans rien envoyer</strong> : tout se passe
              dans votre navigateur.
            </p>
          </header>

          {/* L'outil */}
          <SubtitleConverter />

          {/* Contenu SEO */}
          <div className="mt-16 space-y-7 text-lg text-neutral-800 leading-relaxed max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-4 mb-2">
              Comment ça marche
            </h2>
            <ol className="space-y-3 pl-6 list-decimal marker:text-ink-500 marker:font-mono">
              <li>
                <strong>Importez</strong> votre fichier (.srt, .vtt ou .txt), par
                glisser-déposer ou en collant le texte.
              </li>
              <li>
                <strong>Choisissez</strong> le format de sortie : SRT, VTT ou TXT.
              </li>
              <li>
                <strong>Téléchargez</strong> le fichier converti, ou copiez le
                résultat.
              </li>
            </ol>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              SRT, VTT, TXT : lequel choisir ?
            </h2>
            <ul className="space-y-3 pl-6 list-disc marker:text-rouge-500">
              <li>
                <strong>SRT (SubRip)</strong> — le format le plus répandu. Lu par
                DaVinci Resolve, Premiere Pro, VLC, YouTube… Le choix par défaut
                pour le montage.
              </li>
              <li>
                <strong>VTT (WebVTT)</strong> — le format des sous-titres sur le
                web, utilisé par la balise{" "}
                <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                  &lt;track&gt;
                </code>{" "}
                en HTML5. À privilégier pour un lecteur vidéo de site.
              </li>
              <li>
                <strong>TXT</strong> — du texte brut, sans timecode. Pratique pour
                relire, réutiliser le contenu ou en faire un article.
              </li>
            </ul>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              {FAQ.map((f) => (
                <div key={f.question}>
                  <h3 className="font-serif text-xl md:text-2xl text-neutral-900 mb-1.5">
                    {f.question}
                  </h3>
                  <p className="text-base text-ink-700">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA produit */}
          <aside className="mt-16 bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-10 shadow-[6px_6px_0_0_rgba(26,24,20,1)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="annotation">§ Aller plus loin</span>
            </div>
            <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight text-ink-900 mb-3 tracking-[-0.015em]">
              Pas encore de sous-titres ?{" "}
              <span className="font-display italic font-light text-rouge-500">
                Maxline les crée pour vous.
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed max-w-2xl">
              Déposez une vidéo : Maxline la transcrit et la traduit dans 10
              langues, puis vous rend des sous-titres propres et exportables
              (.srt, .vtt). En français, à 12 €/mois, sans engagement.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="btn-pen text-base">
                Créer mon atelier
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/outils" className="btn-outline text-base">
                Voir les autres outils
              </Link>
            </div>
          </aside>
        </article>
      </main>
      <Footer />
    </>
  );
}
