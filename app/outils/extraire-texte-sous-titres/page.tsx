import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqPageLd, absoluteUrl } from "@/lib/seo";
import { fr } from "@/lib/typo";
import { SubtitleExtractor } from "./extract-client";

const TITLE = "Extraire le texte d'un fichier de sous-titres (SRT/VTT en texte)";
const DESCRIPTION =
  "Récupérez le texte d'un fichier de sous-titres .srt ou .vtt, sans les timecodes : une ligne par sous-titre ou un paragraphe fluide. Gratuit, sans inscription, dans votre navigateur.";
const PATH = "/outils/extraire-texte-sous-titres";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "extraire le texte d'un srt",
    "sous-titres en texte",
    "srt en texte",
    "extraire les sous-titres",
    "transcription depuis srt",
    "convertir sous-titres en texte",
  ],
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl(PATH), type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "Extraire le texte d'un fichier de sous-titres — gratuit",
    description: "SRT / VTT → texte sans timecodes, en lignes ou en paragraphe. Gratuit, sans inscription.",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

const FAQ = [
  {
    question: "Comment récupérer le texte d'un fichier .srt ?",
    answer:
      "Déposez votre .srt (ou .vtt) dans l'outil : il retire automatiquement les numéros et les timecodes, et ne garde que le texte. Vous pouvez le copier ou le télécharger en .txt.",
  },
  {
    question: "Quelle est la différence entre « Lignes » et « Paragraphe » ?",
    answer:
      "« Lignes » garde un sous-titre par ligne (utile pour relire ou réutiliser tel quel). « Paragraphe » recolle tout en un texte fluide, pratique pour en faire un article ou des notes.",
  },
  {
    question: "Peut-on extraire les sous-titres directement d'une vidéo ?",
    answer:
      "Cet outil travaille sur un fichier de sous-titres existant (.srt / .vtt). Si vous partez d'une vidéo sans fichier, Maxline génère la transcription et les sous-titres pour vous, dans 10 langues.",
  },
  {
    question: "Mes fichiers sont-ils envoyés sur un serveur ?",
    answer:
      "Non. Tout se passe dans votre navigateur : aucun téléversement, rien n'est stocké. Gratuit et confidentiel.",
  },
];

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Extraire le texte d'un fichier de sous-titres",
  description: DESCRIPTION,
  step: [
    { "@type": "HowToStep", position: 1, name: "Importer le fichier", text: "Déposez ou collez votre .srt ou .vtt." },
    { "@type": "HowToStep", position: 2, name: "Choisir le rendu", text: "Une ligne par sous-titre, ou un paragraphe fluide." },
    { "@type": "HowToStep", position: 3, name: "Récupérer le texte", text: "Copiez le texte ou téléchargez-le en .txt." },
  ],
};

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Extracteur de texte de sous-titres Maxline",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: absoluteUrl(PATH),
  description: DESCRIPTION,
  inLanguage: "fr-FR",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function ExtraireTexteSousTitres() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Outils", path: "/outils" },
            { name: "Extraire le texte", path: PATH },
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
              Extraire le{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  texte
                </HandUnderline>
              </span>{" "}
              des sous-titres
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">
              Récupérez le texte d&apos;un fichier .srt ou .vtt, sans les
              timecodes — prêt à relire, citer ou transformer en article. Gratuit,
              sans inscription, <strong>sans rien envoyer</strong>.
            </p>
          </header>

          <SubtitleExtractor />

          <div className="mt-16 space-y-7 text-lg text-neutral-800 leading-relaxed max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-4 mb-2">
              Comment ça marche
            </h2>
            <ol className="space-y-3 pl-6 list-decimal marker:text-ink-500 marker:font-mono">
              <li><strong>Importez</strong> votre fichier .srt ou .vtt.</li>
              <li>
                <strong>Choisissez le rendu</strong> : une ligne par sous-titre,
                ou un paragraphe fluide.
              </li>
              <li><strong>Copiez</strong> le texte ou téléchargez-le en .txt.</li>
            </ol>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              À quoi ça sert
            </h2>
            <p>
              Un fichier de sous-titres contient un texte précieux, noyé sous les
              timecodes. L&apos;en extraire permet de le relire, de le citer, d&apos;en
              faire les notes d&apos;un épisode, un article de blog, ou un support
              écrit. C&apos;est aussi un bon point de départ pour le référencement :
              du texte que les moteurs de recherche peuvent indexer.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              {FAQ.map((f) => (
                <div key={f.question}>
                  <h3 className="font-serif text-xl md:text-2xl text-neutral-900 mb-1.5">
                    {fr(f.question)}
                  </h3>
                  <p className="text-base text-ink-700">{fr(f.answer)}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="mt-16 bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-10 shadow-[6px_6px_0_0_rgba(26,24,20,1)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="annotation">§ Aller plus loin</span>
            </div>
            <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight text-ink-900 mb-3 tracking-[-0.015em]">
              Une vidéo sans sous-titres ?{" "}
              <span className="font-display italic font-light text-rouge-500">
                Maxline la transcrit.
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed max-w-2xl">
              Déposez votre vidéo : Maxline en produit la transcription et les
              sous-titres, dans 10 langues, prêts à exporter. En français, à
              12 €/mois, sans engagement.
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
