import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

/**
 * Coque commune aux pages légales, aux couleurs de l'Atelier (ivoire/encre/rouge).
 * Garde une typo lisible et sobre, cohérente avec le reste du site.
 */
export function LegalShell({
  label,
  title,
  intro,
  updated,
  children,
}: {
  /** Petit libellé d'annotation (ex. "Mentions légales"). */
  label: string;
  title: string;
  /** Phrase d'introduction optionnelle sous le titre. */
  intro?: string;
  /** Date de dernière mise à jour (ex. "31 mai 2026"). */
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="bg-ivory-50">
        <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 py-12 md:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-rouge-500 transition-colors mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Retour à l&apos;accueil
          </Link>

          <span className="annotation mb-4 inline-flex">§ {label}</span>

          <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink-900 mt-3">
            {title}
          </h1>

          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-500">
            Dernière mise à jour : {updated}
          </p>

          <div className="h-[3px] w-16 bg-rouge-500 mt-6 mb-10" aria-hidden />

          {intro && (
            <p className="text-lg text-ink-700 leading-relaxed mb-10">{intro}</p>
          )}

          <div className="space-y-10">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Une section légale : titre Fraunces + contenu. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24">
      <h2 className="font-display font-medium text-2xl text-ink-900 mb-4 tracking-[-0.01em]">
        {title}
      </h2>
      <div className="space-y-3 text-ink-700 leading-relaxed [&_a]:text-encre-500 [&_a]:underline [&_a:hover]:text-rouge-500 [&_strong]:text-ink-900 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:marker:text-rouge-400">
        {children}
      </div>
    </section>
  );
}
