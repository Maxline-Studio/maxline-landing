import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, absoluteUrl } from "@/lib/seo";
import { LANGS } from "@/lib/langs";
import { LANG_SEO, pairSlug, langName, withArticle } from "@/lib/lang-seo";

const TITLE = "Traduire une vidéo : toutes les langues";
const DESCRIPTION =
  "Traduisez vos vidéos entre 10 langues (français, anglais, espagnol, allemand, italien, portugais, russe, chinois, japonais, arabe). Sous-titres automatiques, ton respecté, export propre.";
const PATH = "/traduire-une-video";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "traduire une vidéo",
    "traduction vidéo",
    "traduire les sous-titres d'une vidéo",
    "sous-titres multilingues",
    "traducteur de vidéo",
  ],
  openGraph: {
    title: `${TITLE} — Maxline Studio`,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: "website",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

export default function TraduireHub() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Traduire une vidéo", path: PATH },
        ])}
      />
      <Header />
      <main id="main-content" className="bg-ivory-50 min-h-screen relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

        <section className="relative py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-4 md:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-10 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Retour à l&apos;accueil
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§ Traduction vidéo</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                10 langues · dans tous les sens
              </span>
            </div>

            <h1 className="font-display font-medium text-5xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-8">
              Traduire une vidéo,
              <br />
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  dans 10 langues
                </HandUnderline>
              </span>
              .
            </h1>

            <p className="text-lg text-ink-600 leading-relaxed max-w-2xl mb-14">
              Choisissez votre combinaison. Maxline transcrit votre vidéo, la
              traduit en respectant le ton et le registre, et vous rend des
              sous-titres propres et exportables.
            </p>

            <div className="space-y-10 border-t-2 border-ink-900 pt-12">
              {LANGS.map((source) => (
                <div key={source}>
                  <h2 className="font-display font-medium text-xl md:text-2xl text-ink-900 mb-3 tracking-[-0.015em]">
                    Depuis {withArticle(source)}{" "}
                    <span className="text-ink-400 font-mono text-sm not-italic">
                      ({LANG_SEO[source].native})
                    </span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.filter((t) => t !== source).map((target) => (
                      <Link
                        key={target}
                        href={`/traduire-une-video/${pairSlug(source, target)}`}
                        className="inline-flex items-center rounded-sm border border-ivory-300 bg-ivory-50 px-3 py-1.5 text-sm text-ink-700 hover:border-ink-900 hover:text-ink-900 hover:shadow-[3px_3px_0_0_rgba(26,24,20,1)] transition-all"
                      >
                        {langName(target)}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <aside className="mt-16 bg-ink-900 text-ivory-50 rounded-sm p-8 md:p-10">
              <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight mb-3 tracking-[-0.015em]">
                Prêt à toucher un nouveau public ?
              </h2>
              <p className="text-ink-300 mb-6 leading-relaxed max-w-2xl">
                Déposez une vidéo, choisissez vos langues, récupérez des
                sous-titres propres. En français, à 12 €/mois, sans engagement.
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
