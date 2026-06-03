import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Minus } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqPageLd, absoluteUrl } from "@/lib/seo";
import { fr } from "@/lib/typo";
import {
  ALTERNATIVES,
  alternativeFromSlug,
  MAXLINE_BRIEF,
} from "@/lib/alternative-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALTERNATIVES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = alternativeFromSlug(slug);
  if (!a) return { title: "Alternative" };
  const path = `/alternative/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    openGraph: {
      title: a.title,
      description: a.description,
      url: absoluteUrl(path),
      type: "website",
    },
    twitter: { card: "summary_large_image", title: a.title, description: a.description },
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = alternativeFromSlug(slug);
  if (!a) notFound();
  const path = `/alternative/${a.slug}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Alternatives", path: "/alternative" },
            { name: a.name, path },
          ]),
          faqPageLd(a.faq),
        ]}
      />
      <Header />
      <main id="main-content" className="bg-ivory-50 relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative py-12 md:py-16">
          <Link
            href="/alternative"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Toutes les alternatives
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="annotation">§ Comparatif honnête</span>
            </div>
            <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.06] tracking-[-0.02em] text-ink-900 mb-5">
              Alternative à{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  {a.name}
                </HandUnderline>
              </span>
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">
              {fr(a.positioning)} Voici un comparatif sans langue de bois : ce
              qu&apos;il fait très bien, ses limites, et quand choisir Maxline.
            </p>
          </header>

          {/* En bref : mini-comparaison */}
          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            <div className="rounded-sm border-2 border-ink-900 bg-ivory-50 p-5">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-2">
                Maxline Studio
              </h2>
              <p className="text-sm text-ink-700 leading-relaxed">{MAXLINE_BRIEF}</p>
            </div>
            <div className="rounded-sm border border-ivory-300 bg-ivory-100 p-5">
              <h2 className="font-display font-semibold text-lg text-ink-900 mb-2">
                {a.name}
              </h2>
              <p className="text-sm text-ink-700 leading-relaxed">{fr(a.brief)}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                {fr(a.priceNote)}
              </p>
            </div>
          </div>

          <div className="space-y-7 text-lg text-neutral-800 leading-relaxed">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-4 mb-2">
              {fr(`Ce que ${a.name} fait très bien`)}
            </h2>
            <ul className="space-y-3 pl-6 list-disc marker:text-ink-400">
              {a.theirStrengths.map((s, i) => (
                <li key={i}>{fr(s)}</li>
              ))}
            </ul>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Ses limites
            </h2>
            <ul className="space-y-3 not-prose">
              {a.theirLimits.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <Minus className="h-5 w-5 text-ink-400 flex-shrink-0 mt-1" aria-hidden />
                  <span>{fr(s)}</span>
                </li>
              ))}
            </ul>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Où Maxline fait la différence
            </h2>
            <ul className="space-y-3 not-prose">
              {a.maxlineWins.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <Check className="h-5 w-5 text-rouge-500 flex-shrink-0 mt-1" aria-hidden />
                  <span>{fr(s)}</span>
                </li>
              ))}
            </ul>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              {fr(`Quand choisir ${a.name}`)}
            </h2>
            <p>{fr(a.whenThem)}</p>
            <p className="font-display italic text-xl text-ink-900 border-l-[3px] border-rouge-500 pl-6 my-8">
              {fr(a.verdict)}
            </p>

            {a.blogPath && (
              <p>
                Pour aller plus loin, lisez le{" "}
                <Link href={a.blogPath} className="link-pen">
                  comparatif détaillé {a.name} vs Maxline
                </Link>
                .
              </p>
            )}

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              {a.faq.map((f) => (
                <div key={f.question}>
                  <h3 className="font-serif text-xl md:text-2xl text-neutral-900 mb-1.5">
                    {fr(f.question)}
                  </h3>
                  <p className="text-base text-ink-700">{fr(f.answer)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA bas */}
          <aside className="mt-16 bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-10 shadow-[6px_6px_0_0_rgba(26,24,20,1)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="annotation">§ Essayez Maxline</span>
            </div>
            <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight text-ink-900 mb-3 tracking-[-0.015em]">
              Le studio français,{" "}
              <span className="font-display italic font-light text-rouge-500">
                clair et sans piège.
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed">
              Sous-titrage et traduction dans 10 langues, édition ligne par ligne,
              export propre. En français, à 12 €/mois, sans engagement.
            </p>
            <Link href="/signup" className="btn-pen text-base">
              Créer mon atelier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          {/* Maillage interne : autres alternatives */}
          <nav className="mt-14" aria-label="Autres alternatives">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-4">
              Comparer avec d&apos;autres outils
            </h2>
            <div className="flex flex-wrap gap-2">
              {ALTERNATIVES.filter((o) => o.slug !== a.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/alternative/${o.slug}`}
                  className="inline-flex items-center rounded-sm border border-ivory-300 bg-ivory-50 px-2.5 py-1 text-sm text-ink-700 hover:border-ink-400 hover:text-ink-900 transition-colors"
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </nav>
        </article>
      </main>
      <Footer />
    </>
  );
}
