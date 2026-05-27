import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

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
      <main id="main-content" className="py-12 md:py-20 bg-cream-50 min-h-screen">
        <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-10"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>

          <header className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Journal
              </span>
              <span className="h-px w-12 bg-primary-300" />
            </div>
            <h1 className="font-serif text-5xl md:text-6xl leading-[1.1] text-neutral-900 mb-6">
              Construit en public,{" "}
              <em className="text-primary-600">sans filtre</em>.
            </h1>
            <p className="text-lg text-neutral-700 leading-relaxed max-w-2xl">
              Les décisions, les doutes, les choix techniques, les chiffres
              bruts. Tout est ici. Pas pour faire joli — pour être lisible par
              celui qui voudra construire la même chose après.
            </p>
          </header>

          <ul className="space-y-12 border-t border-neutral-200 pt-12">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block lift-on-hover bg-white rounded-2xl border border-neutral-200 p-8 md:p-10 hover:border-primary-300"
                >
                  <div className="flex items-center gap-3 mb-4 text-xs text-neutral-500">
                    <time dateTime={post.date}>{post.dateLabel}</time>
                    <span className="h-1 w-1 rounded-full bg-neutral-300" />
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl leading-tight text-neutral-900 mb-4 group-hover:text-primary-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-base text-neutral-700 leading-relaxed mb-6">
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 group-hover:gap-3 transition-all">
                    Lire l&apos;article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-20 text-sm text-neutral-500 italic text-center">
            Un nouvel article toutes les 2 à 3 semaines, selon ce qui s&apos;est
            passé.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
