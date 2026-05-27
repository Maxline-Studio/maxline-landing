import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Le journal de bord de Maxline Studio. Décisions, doutes, choix techniques, chiffres. Construit en public, sans filtre.",
  openGraph: {
    title: "Journal — Maxline Studio",
    description:
      "Le journal de bord de Maxline Studio. Décisions, doutes, choix techniques, chiffres. Construit en public, sans filtre.",
    url: "https://maxlinestudio.fr/blog",
  },
  alternates: {
    canonical: "https://maxlinestudio.fr/blog",
  },
};

const posts = [
  {
    slug: "pourquoi-maxline-studio",
    n: "01",
    title: "Pourquoi je crée Maxline Studio",
    excerpt:
      "Il y a un trou évident sur le marché français de la traduction vidéo. Voilà comment je suis tombé dedans, et pourquoi je décide de m'y attaquer seul.",
    date: "2026-05-27",
    dateLabel: "27 mai 2026",
    readingTime: "8 min de lecture",
  },
];

export default function BlogIndex() {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-ivory-50 min-h-screen">
        {/* Hero du journal */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

          <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-10 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Retour à l&apos;accueil
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§ Journal</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                build in public
              </span>
            </div>

            <h1 className="font-display font-medium text-5xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-8">
              Construit en public,
              <br />
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  sans filtre
                </HandUnderline>
              </span>
              .
            </h1>

            <p className="text-lg text-ink-600 leading-relaxed max-w-2xl">
              Les décisions, les doutes, les choix techniques, les chiffres
              bruts. Tout est ici. Pas pour faire joli — pour être lisible par
              celui qui voudra construire la même chose après.
            </p>
          </div>
        </section>

        {/* Liste articles */}
        <section className="relative pb-24 md:pb-32">
          <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
            <ul className="space-y-10 border-t-2 border-ink-900 pt-12">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-10 hover:shadow-[6px_6px_0_0_rgba(26,24,20,1)] transition-shadow card-annotated relative"
                  >
                    {/* Numéro article géant en fond */}
                    <span className="absolute top-4 right-6 font-display italic font-light text-6xl md:text-7xl text-ink-900/10 leading-none tabular-nums group-hover:text-rouge-500/30 transition-colors duration-300">
                      {post.n}
                    </span>

                    <div className="relative">
                      <div className="flex items-center gap-3 mb-4 text-xs font-mono uppercase tracking-widest text-ink-500">
                        <time dateTime={post.date}>{post.dateLabel}</time>
                        <span className="h-1 w-1 rounded-full bg-ink-300" />
                        <span>{post.readingTime}</span>
                      </div>

                      <h2 className="font-display font-medium text-3xl md:text-4xl leading-[1.15] tracking-[-0.015em] text-ink-900 mb-4 group-hover:text-rouge-500 transition-colors max-w-lg">
                        {post.title}
                      </h2>

                      <p className="text-base text-ink-700 leading-relaxed mb-6 max-w-2xl">
                        {post.excerpt}
                      </p>

                      <span className="inline-flex items-center gap-2 text-sm font-bold text-rouge-500 group-hover:gap-3 transition-all">
                        Lire l&apos;article
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-20 text-center text-sm font-mono text-ink-500 uppercase tracking-widest">
              [ un article toutes les 2 à 3 semaines &middot; selon ce qui s&apos;est passé ]
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
