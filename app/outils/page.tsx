import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Repeat, Scissors, Clock } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd, absoluteUrl } from "@/lib/seo";

const TITLE = "Outils gratuits pour les sous-titres";
const DESCRIPTION =
  "Des outils gratuits et sans inscription pour vos sous-titres : convertir SRT/VTT/TXT, extraire le texte, et décaler les timecodes. Tout se passe dans votre navigateur.";
const PATH = "/outils";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "outils sous-titres gratuits",
    "convertir sous-titres",
    "éditeur de sous-titres en ligne",
    "outil srt",
    "outil vtt",
  ],
  openGraph: {
    title: `${TITLE} — Maxline Studio`,
    description: DESCRIPTION,
    url: absoluteUrl(PATH),
    type: "website",
  },
  alternates: { canonical: absoluteUrl(PATH) },
};

type Tool = {
  href?: string;
  icon: typeof Repeat;
  title: string;
  desc: string;
  soon?: boolean;
};

const TOOLS: Tool[] = [
  {
    href: "/outils/convertir-sous-titres",
    icon: Repeat,
    title: "Convertir des sous-titres",
    desc: "SRT en VTT, VTT en SRT, ou SRT/VTT en TXT. Gratuit, dans votre navigateur.",
  },
  {
    href: "/outils/extraire-texte-sous-titres",
    icon: Scissors,
    title: "Extraire le texte",
    desc: "Récupérer le texte d'un fichier de sous-titres, sans les timecodes.",
  },
  {
    href: "/outils/decaler-sous-titres",
    icon: Clock,
    title: "Décaler / synchroniser",
    desc: "Avancer ou retarder tous les timecodes d'un fichier de sous-titres.",
  },
];

export default function OutilsIndex() {
  return (
    <>
      <JsonLd
        data={breadcrumbLd([
          { name: "Accueil", path: "/" },
          { name: "Outils", path: PATH },
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
              <span className="annotation">§ Outils</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                gratuits · sans inscription
              </span>
            </div>

            <h1 className="font-display font-medium text-5xl md:text-6xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-8">
              La petite boîte à outils,
              <br />
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  offerte
                </HandUnderline>
              </span>
              .
            </h1>

            <p className="text-lg text-ink-600 leading-relaxed max-w-2xl mb-14">
              Des outils simples pour manipuler vos sous-titres, sans créer de
              compte et sans rien téléverser. Pratiques au quotidien — et
              entièrement gratuits.
            </p>

            <ul className="grid sm:grid-cols-2 gap-6">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                const inner = (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border-2 border-ink-900 bg-ivory-50 text-rouge-500">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      {tool.soon && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400 border border-ivory-300 rounded-sm px-2 py-0.5">
                          bientôt
                        </span>
                      )}
                    </div>
                    <h2 className="font-display font-medium text-xl md:text-2xl leading-tight tracking-[-0.015em] text-ink-900 mb-2 group-hover:text-rouge-500 transition-colors">
                      {tool.title}
                    </h2>
                    <p className="text-sm text-ink-700 leading-relaxed mb-4">
                      {tool.desc}
                    </p>
                    {!tool.soon && (
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-rouge-500 group-hover:gap-3 transition-all">
                        Ouvrir l&apos;outil
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={tool.title}>
                    {tool.href ? (
                      <Link
                        href={tool.href}
                        className="group block h-full bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-7 hover:shadow-[6px_6px_0_0_rgba(26,24,20,1)] transition-shadow"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div className="h-full bg-ivory-50/60 border-2 border-dashed border-ivory-300 rounded-sm p-6 md:p-7 opacity-80">
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Passerelle produit */}
            <aside className="mt-16 bg-ink-900 text-ivory-50 rounded-sm p-8 md:p-10">
              <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight mb-3 tracking-[-0.015em]">
                Et pour créer les sous-titres ?
              </h2>
              <p className="text-ink-300 mb-6 leading-relaxed max-w-2xl">
                Maxline transcrit et traduit votre vidéo dans 10 langues, puis
                vous rend des sous-titres propres et exportables. En français, à
                12 €/mois, sans engagement.
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
