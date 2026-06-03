import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, faqPageLd, absoluteUrl } from "@/lib/seo";
import { isRtl, isCjk } from "@/lib/langs";
import {
  LANG_SEO,
  allPairs,
  pairFromSlug,
  pairNote,
  langName,
  withArticle,
} from "@/lib/lang-seo";

// Seules les 90 paires connues existent ; tout autre slug → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return allPairs().map((p) => ({ paire: p.slug }));
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Typo française : espace insécable avant la ponctuation double (? ! : ;). */
function fr(s: string): string {
  return s.replace(/ ([?!:;»])/g, " $1").replace(/« /g, "« ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ paire: string }>;
}): Promise<Metadata> {
  const { paire } = await params;
  const pair = pairFromSlug(paire);
  if (!pair) return { title: "Traduire une vidéo" };
  const { source, target } = pair;
  const src = langName(source);
  const tgt = langName(target);
  const title = `Traduire une vidéo en ${tgt} depuis ${withArticle(source)}`;
  const description = `Traduisez vos vidéos ${withArticle(source).replace(/^le |^l'/, "")} → ${tgt} : sous-titres automatiques qui respectent le ton et le registre, export .srt/.vtt propre. ${cap(tgt)} pour ${LANG_SEO[target].where.split(",")[0]}.`;
  const path = `/traduire-une-video/${paire}`;
  return {
    title,
    description,
    keywords: [
      `traduire une vidéo en ${tgt}`,
      `sous-titres ${tgt}`,
      `traduction vidéo ${src} ${tgt}`,
      `traduire ${src} ${tgt}`,
      `sous-titrer une vidéo en ${tgt}`,
    ],
    openGraph: { title, description, url: absoluteUrl(path), type: "website" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: absoluteUrl(path) },
  };
}

export default async function TraduirePairPage({
  params,
}: {
  params: Promise<{ paire: string }>;
}) {
  const { paire } = await params;
  const pair = pairFromSlug(paire);
  if (!pair) notFound();
  const { source, target } = pair;
  const path = `/traduire-une-video/${paire}`;
  const src = langName(source);
  const tgt = langName(target);
  const S = LANG_SEO[source];
  const T = LANG_SEO[target];

  const faq = [
    {
      question: `Comment traduire une vidéo ${withArticle(source).replace(/^le /, "du ").replace(/^l'/, "de l'")} en ${tgt} ?`,
      answer: `Déposez votre vidéo : Maxline la transcrit dans sa langue d'origine (${src}), puis traduit chaque sous-titre en ${tgt} en tenant compte du contexte global. Vous corrigez ce que vous voulez dans l'éditeur, puis vous exportez un fichier .srt ou .vtt propre.`,
    },
    {
      question: `La traduction en ${tgt} garde-t-elle le ton et l'argot ?`,
      answer: `Oui. La traduction respecte le registre : si vous parlez familier ou cash en ${src}, le ${tgt} reste familier ou cash. C'est tout l'écart entre une traduction « corporate » qui efface votre personnalité et une traduction qui sonne native.`,
    },
    isRtl(target)
      ? {
          question: `Les sous-titres en ${tgt} s'affichent-ils de droite à gauche ?`,
          answer: `Oui. ${cap(withArticle(target))} s'écrit de droite à gauche : Maxline affiche et édite vos sous-titres en RTL, et l'export reste correct dans votre logiciel de montage.`,
        }
      : isCjk(target)
        ? {
            question: `Les sous-titres en ${tgt} sont-ils bien découpés à l'écran ?`,
            answer: `Oui. ${cap(withArticle(target))} ne sépare pas les mots par des espaces : Maxline découpe les sous-titres au caractère, sur des lignes courtes et lisibles (deux lignes maximum).`,
          }
        : {
            question: `Puis-je exporter les sous-titres ${tgt} pour mon montage ?`,
            answer: `Oui : vous récupérez un .srt ou .vtt propre, prêt pour DaVinci Resolve, Premiere Pro ou Final Cut. L'export reprend vos dernières corrections.`,
          },
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Traduire une vidéo", path: "/traduire-une-video" },
            { name: `${cap(src)} → ${cap(tgt)}`, path },
          ]),
          faqPageLd(faq),
        ]}
      />
      <Header />
      <main id="main-content" className="bg-ivory-50 relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative py-12 md:py-16">
          <Link
            href="/traduire-une-video"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Toutes les combinaisons
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="annotation">§ Traduction vidéo</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500 border border-ivory-300 rounded-sm px-2 py-1">
                {S.slug.toUpperCase().slice(0, 2)} → {T.slug.toUpperCase().slice(0, 2)}
              </span>
            </div>
            <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-5">
              Traduire une vidéo en{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  {tgt}
                </HandUnderline>
              </span>
              <span className="block text-2xl md:text-3xl text-ink-500 font-light mt-2">
                depuis {withArticle(source)}.
              </span>
            </h1>
            <p className="text-lg text-ink-600 leading-relaxed">
              Déposez votre vidéo {S.slug === "francais" ? "française" : `en ${src}`}, récupérez
              des sous-titres {tgt} propres et exportables. Une traduction qui
              respecte votre ton — en français, à 12 €/mois, sans engagement.
            </p>
          </header>

          {/* CTA haut */}
          <div className="mb-12">
            <Link href="/signup" className="btn-pen text-base">
              Traduire ma vidéo en {tgt}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-7 text-lg text-neutral-800 leading-relaxed">
            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-4 mb-2">
              {fr(`Pourquoi traduire vos vidéos en ${tgt} ?`)}
            </h2>
            <p>{T.toAngle}</p>
            <p>
              {cap(tgt)}, c&apos;est {T.speakers}, surtout en {T.where}. Pour un
              créateur {S.slug === "francais" ? "francophone" : `qui publie en ${src}`}, c&apos;est
              une audience supplémentaire à portée de sous-titres — sans
              retourner une seule prise.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Les spécificités d&apos;une traduction {src} → {tgt}
            </h2>
            <p>{T.specifics}</p>
            <p className="font-display italic text-xl text-ink-900 border-l-[3px] border-rouge-500 pl-6 my-8">
              {pairNote(source, target)}
            </p>
            <p>
              C&apos;est la différence entre des sous-titres « techniquement
              corrects » et des sous-titres qu&apos;un natif croirait écrits pour
              lui. {S.fromAngle}
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Comment ça marche
            </h2>
            <ol className="space-y-3 pl-6 list-decimal marker:text-ink-500 marker:font-mono">
              <li>
                <strong>Déposez votre vidéo</strong> et choisissez {src} →{" "}
                {tgt}.
              </li>
              <li>
                <strong>Maxline transcrit puis traduit</strong> chaque sous-titre
                en tenant compte du contexte global de la vidéo (pas ligne par
                ligne).
              </li>
              <li>
                <strong>Corrigez dans l&apos;éditeur</strong> ce que vous voulez,
                ligne par ligne.
              </li>
              <li>
                <strong>Exportez</strong> un .srt, un .vtt, ou une vidéo
                sous-titrée prête à publier.
              </li>
            </ol>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-12 mb-2">
              Questions fréquentes
            </h2>
            <div className="space-y-6">
              {faq.map((f) => (
                <div key={f.question}>
                  <h3 className="font-serif text-xl md:text-2xl text-neutral-900 mb-1.5">
                    {fr(f.question)}
                  </h3>
                  <p className="text-base text-ink-700">{f.answer}</p>
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
              Vos vidéos, sous-titrées en{" "}
              <span className="font-display italic font-light text-rouge-500">
                {tgt}.
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed">
              Transcription + traduction {src} → {tgt}, édition ligne par ligne,
              export propre. En français, à 12 €/mois, sans engagement.
            </p>
            <Link href="/signup" className="btn-pen text-base">
              Créer mon atelier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          {/* Maillage interne : autres cibles depuis la même source */}
          <nav className="mt-14" aria-label="Autres traductions">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-4">
              Traduire {withArticle(source)} vers d&apos;autres langues
            </h2>
            <div className="flex flex-wrap gap-2">
              {allPairs()
                .filter((p) => p.source === source && p.target !== target)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/traduire-une-video/${p.slug}`}
                    className="inline-flex items-center rounded-sm border border-ivory-300 bg-ivory-50 px-2.5 py-1 text-sm text-ink-700 hover:border-ink-400 hover:text-ink-900 transition-colors"
                  >
                    {langName(p.target)}
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
