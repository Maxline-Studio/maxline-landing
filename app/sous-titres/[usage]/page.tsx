import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqPageLd, absoluteUrl } from "@/lib/seo";
import { fr } from "@/lib/typo";
import { USAGES, usageFromSlug, usageForLabel } from "@/lib/usage-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return USAGES.map((u) => ({ usage: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ usage: string }>;
}): Promise<Metadata> {
  const { usage } = await params;
  const u = usageFromSlug(usage);
  if (!u) return { title: "Sous-titres" };
  const path = `/sous-titres/${u.slug}`;
  return {
    title: u.title,
    description: u.description,
    keywords: u.keywords,
    openGraph: {
      title: u.title,
      description: u.description,
      url: absoluteUrl(path),
      type: "website",
    },
    twitter: { card: "summary_large_image", title: u.title, description: u.description },
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default async function UsagePage({
  params,
}: {
  params: Promise<{ usage: string }>;
}) {
  const { usage } = await params;
  const u = usageFromSlug(usage);
  if (!u) notFound();
  const path = `/sous-titres/${u.slug}`;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Sous-titres", path: "/sous-titres" },
            { name: u.label, path },
          ]),
          faqPageLd(u.faq),
        ]}
      />
      <Header />
      <main id="main-content" className="bg-ivory-50 relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative py-12 md:py-16">
          <Link
            href="/sous-titres"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Tous les usages
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="annotation">§ Sous-titres · {u.label}</span>
            </div>
            <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.06] tracking-[-0.02em] text-ink-900 mb-5">
              {fr(u.h1)}
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">{fr(u.lede)}</p>
          </header>

          <div className="mb-12">
            <Link href="/signup" className="btn-pen text-base">
              Sous-titrer ma vidéo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-7 text-lg text-neutral-800 leading-relaxed">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-4 mb-2">
              {fr(`Pourquoi sous-titrer pour ${usageForLabel(u)} ?`)}
            </h2>
            {u.why.map((p, i) => (
              <p key={i}>{fr(p)}</p>
            ))}

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Les bons réflexes
            </h2>
            <ul className="space-y-4 not-prose">
              {u.tips.map((tip) => (
                <li key={tip.title} className="flex gap-3">
                  <Check
                    className="h-5 w-5 text-rouge-500 flex-shrink-0 mt-1"
                    aria-hidden
                  />
                  <span>
                    <strong className="text-ink-900">{fr(tip.title)}.</strong>{" "}
                    {fr(tip.body)}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Comment ça marche
            </h2>
            <ol className="space-y-3 pl-6 list-decimal marker:text-ink-500 marker:font-mono">
              <li>
                <strong>Déposez votre vidéo</strong> et choisissez la langue des
                sous-titres (parmi 10), ou la transcription dans la langue parlée.
              </li>
              <li>
                <strong>Maxline transcrit</strong> (et traduit si besoin) en
                tenant compte du contexte.
              </li>
              <li>
                <strong>Corrigez dans l&apos;éditeur</strong>, puis exportez en
                .srt, .vtt, ou une vidéo sous-titrée incrustée.
              </li>
            </ol>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              {u.faq.map((f) => (
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
              <span className="font-display italic font-light text-rouge-500">
                {fr(u.ctaTitle)}
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed">
              Transcription et traduction dans 10 langues, édition ligne par
              ligne, export propre. En français, à 12 €/mois, sans engagement.
            </p>
            <Link href="/signup" className="btn-pen text-base">
              Créer mon atelier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          {/* Maillage interne : autres usages */}
          <nav className="mt-14" aria-label="Autres usages">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-4">
              Sous-titres pour d&apos;autres usages
            </h2>
            <div className="flex flex-wrap gap-2">
              {USAGES.filter((o) => o.slug !== u.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/sous-titres/${o.slug}`}
                  className="inline-flex items-center rounded-sm border border-ivory-300 bg-ivory-50 px-2.5 py-1 text-sm text-ink-700 hover:border-ink-400 hover:text-ink-900 transition-colors"
                >
                  {o.label}
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
