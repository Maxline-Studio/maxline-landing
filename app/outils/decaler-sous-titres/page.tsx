import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqPageLd, absoluteUrl } from "@/lib/seo";
import { fr } from "@/lib/typo";
import { SubtitleShifter } from "./shift-client";

const TITLE = "Décaler des sous-titres (synchroniser un .srt / .vtt)";
const DESCRIPTION =
  "Synchronisez vos sous-titres décalés : avancez ou retardez tous les timecodes d'un fichier .srt ou .vtt en un clic. Gratuit, sans inscription, dans votre navigateur.";
const PATH = "/outils/decaler-sous-titres";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "décaler des sous-titres",
    "synchroniser des sous-titres",
    "sous-titres décalés",
    "retarder sous-titres",
    "avancer sous-titres",
    "resynchroniser srt",
  ],
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl(PATH), type: "website" },
  twitter: {
    card: "summary_large_image",
    title: "Décaler des sous-titres — gratuit, en ligne",
    description: "Avancez ou retardez tous les timecodes d'un .srt / .vtt. Gratuit, sans inscription.",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

const FAQ = [
  {
    question: "Mes sous-titres sont en retard, comment les recaler ?",
    answer:
      "Importez votre fichier, puis appliquez un décalage négatif (par exemple −2 secondes) pour les faire apparaître plus tôt. À l'inverse, un décalage positif les retarde. Vous voyez le résultat immédiatement.",
  },
  {
    question: "Le décalage s'applique-t-il à tout le fichier ?",
    answer:
      "Oui : tous les sous-titres sont décalés du même nombre de secondes, en conservant leur durée et l'écart entre eux. C'est ce qu'il faut quand toute la piste est en avance ou en retard de façon constante.",
  },
  {
    question: "Quels formats sont gérés ?",
    answer:
      "Les fichiers .srt (SubRip) et .vtt (WebVTT), les deux formats de sous-titres horodatés les plus courants.",
  },
  {
    question: "Mes fichiers sont-ils envoyés quelque part ?",
    answer:
      "Non. Tout se passe dans votre navigateur : aucun téléversement, rien n'est stocké. C'est instantané, gratuit et confidentiel.",
  },
];

const howToLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Décaler / synchroniser des sous-titres",
  description: DESCRIPTION,
  step: [
    { "@type": "HowToStep", position: 1, name: "Importer le fichier", text: "Déposez ou collez votre .srt ou .vtt." },
    { "@type": "HowToStep", position: 2, name: "Régler le décalage", text: "Choisissez le décalage en secondes (positif pour retarder, négatif pour avancer)." },
    { "@type": "HowToStep", position: 3, name: "Télécharger", text: "Téléchargez le fichier resynchronisé." },
  ],
};

const softwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Décaleur de sous-titres Maxline",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: absoluteUrl(PATH),
  description: DESCRIPTION,
  inLanguage: "fr-FR",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
};

export default function DecalerSousTitres() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Outils", path: "/outils" },
            { name: "Décaler des sous-titres", path: PATH },
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
              Décaler des{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  sous-titres
                </HandUnderline>
              </span>
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">
              Vos sous-titres sont en avance ou en retard sur l&apos;image ? Recalez
              toute la piste en un clic. Gratuit, sans inscription, et{" "}
              <strong>sans rien envoyer</strong>.
            </p>
          </header>

          <SubtitleShifter />

          <div className="mt-16 space-y-7 text-lg text-neutral-800 leading-relaxed max-w-2xl">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-4 mb-2">
              Comment ça marche
            </h2>
            <ol className="space-y-3 pl-6 list-decimal marker:text-ink-500 marker:font-mono">
              <li><strong>Importez</strong> votre fichier .srt ou .vtt.</li>
              <li>
                <strong>Réglez le décalage</strong> en secondes : positif pour
                retarder les sous-titres, négatif pour les avancer.
              </li>
              <li><strong>Téléchargez</strong> le fichier resynchronisé.</li>
            </ol>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Quand l&apos;utiliser
            </h2>
            <p>
              Le décalage constant est le cas le plus fréquent : toute la piste de
              sous-titres est en retard (ou en avance) du même nombre de secondes,
              souvent à cause d&apos;un montage qui ne démarre pas au même endroit
              que le fichier d&apos;origine. Un seul décalage global suffit alors à
              tout recaler.
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
              Pas encore de sous-titres ?{" "}
              <span className="font-display italic font-light text-rouge-500">
                Maxline les crée et les cale.
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed max-w-2xl">
              Déposez votre vidéo : Maxline génère des sous-titres parfaitement
              synchronisés, dans 10 langues, prêts à exporter. En français, à
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
