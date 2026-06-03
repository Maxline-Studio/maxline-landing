import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, absoluteUrl } from "@/lib/seo";
import { USAGES } from "@/lib/usage-seo";

const TITLE = "Sous-titrer une vidéo : tous les usages";
const DESCRIPTION =
  "Sous-titrez vos vidéos selon votre besoin : TikTok, YouTube, Reels, podcast, accessibilité, formation, montage. Sous-titres automatiques, 10 langues, export propre.";
const PATH = "/sous-titres";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "sous-titrer une vidéo",
    "sous-titres automatiques",
    "générateur de sous-titres",
    "ajouter des sous-titres à une vidéo",
  ],
  openGraph: {
    title: `${TITLE} — Maxline Studio`,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: "website",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

export default function SousTitresHub() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Sous-titres", path: PATH },
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
              <span className="annotation">§ Sous-titres</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                pour chaque usage
              </span>
            </div>

            <h1 className="font-display font-medium text-5xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-8">
              Sous-titrer une vidéo,
              <br />
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  selon votre besoin
                </HandUnderline>
              </span>
              .
            </h1>

            <p className="text-lg text-ink-600 leading-relaxed max-w-2xl mb-14">
              Chaque plateforme et chaque usage a ses règles. Choisissez le vôtre
              pour des conseils concrets — et des sous-titres faits pour ça.
            </p>

            <ul className="grid sm:grid-cols-2 gap-6">
              {USAGES.map((u) => (
                <li key={u.slug}>
                  <Link
                    href={`/sous-titres/${u.slug}`}
                    className="group block h-full bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-7 hover:shadow-[6px_6px_0_0_rgba(26,24,20,1)] transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-rouge-500 border border-rouge-200 rounded-sm px-2 py-0.5">
                        {u.label}
                      </span>
                    </div>
                    <h2 className="font-display font-medium text-xl md:text-2xl leading-tight tracking-[-0.015em] text-ink-900 mb-2 group-hover:text-rouge-500 transition-colors">
                      {u.h1}
                    </h2>
                    <p className="text-sm text-ink-700 leading-relaxed mb-4">
                      {u.lede}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-rouge-500 group-hover:gap-3 transition-all">
                      Voir les conseils
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <aside className="mt-16 bg-ink-900 text-ivory-50 rounded-sm p-8 md:p-10">
              <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight mb-3 tracking-[-0.015em]">
                Une autre langue, aussi ?
              </h2>
              <p className="text-ink-300 mb-6 leading-relaxed max-w-2xl">
                Au-delà du sous-titrage, Maxline traduit vos vidéos entre 10
                langues. Découvrez toutes les combinaisons.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/signup" className="btn-pen text-base">
                  Créer mon atelier
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/traduire-une-video"
                  className="inline-flex items-center gap-2 px-5 py-3 border-2 border-ivory-50 rounded-sm text-base font-semibold text-ivory-50 hover:bg-ivory-50 hover:text-ink-900 transition-colors"
                >
                  Traduire une vidéo
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
