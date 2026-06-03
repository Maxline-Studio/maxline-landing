import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, absoluteUrl } from "@/lib/seo";
import { ALTERNATIVES } from "@/lib/alternative-seo";

const TITLE = "Alternatives aux outils de sous-titrage et traduction vidéo";
const DESCRIPTION =
  "Comparatifs honnêtes entre Maxline et les principaux outils de sous-titrage et traduction vidéo : Submagic, VEED, HappyScribe, Kapwing, Maestra, ElevenLabs, Checksub, CapCut.";
const PATH = "/alternative";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "alternative sous-titrage",
    "comparatif outils sous-titres",
    "meilleur outil de sous-titrage français",
    "alternative traduction vidéo",
  ],
  openGraph: {
    title: `${TITLE} — Maxline Studio`,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: "website",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

export default function AlternativesHub() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Alternatives", path: PATH },
        ])}
      />
      <Header />
      <main id="main-content" className="bg-ivory-50 min-h-screen relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

        <section className="relative py-16 md:py-24">
          <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-10 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Retour à l&apos;accueil
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§ Comparatifs</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                sans langue de bois
              </span>
            </div>

            <h1 className="font-display font-medium text-5xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-8">
              Maxline face aux{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  autres outils
                </HandUnderline>
              </span>
              .
            </h1>

            <p className="text-lg text-ink-600 leading-relaxed max-w-2xl mb-14">
              Des comparatifs honnêtes : ce que chaque outil fait très bien, ses
              limites, et quand Maxline est le meilleur choix. On dit aussi quand
              ça n&apos;est pas nous — c&apos;est ça, être franc.
            </p>

            <ul className="grid sm:grid-cols-2 gap-6">
              {ALTERNATIVES.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/alternative/${a.slug}`}
                    className="group block h-full bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-7 hover:shadow-[6px_6px_0_0_rgba(26,24,20,1)] transition-shadow"
                  >
                    <h2 className="font-display font-medium text-xl md:text-2xl leading-tight tracking-[-0.015em] text-ink-900 mb-2 group-hover:text-rouge-500 transition-colors">
                      Alternative à {a.name}
                    </h2>
                    <p className="text-sm text-ink-700 leading-relaxed mb-4">
                      {a.brief}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-rouge-500 group-hover:gap-3 transition-all">
                      Voir le comparatif
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <aside className="mt-16 bg-ink-900 text-ivory-50 rounded-sm p-8 md:p-10">
              <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight mb-3 tracking-[-0.015em]">
                Le studio français, clair et sans piège.
              </h2>
              <p className="text-ink-300 mb-6 leading-relaxed max-w-2xl">
                Sous-titrage et traduction dans 10 langues, forfait clair à
                12 €/mois, édité en France. Essayez par vous-même.
              </p>
              <Link href="/signup" className="btn-pen text-base">
                Créer mon atelier
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
