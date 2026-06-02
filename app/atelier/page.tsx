import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Atelier } from "@/components/sections/atelier";
import {
  ANNIVERSARY_BONUS_MINUTES,
  REFERRAL_BONUS_MINUTES,
  GIFT_BONUS_MINUTES,
  REFERRAL_MONTHLY_CAP,
} from "@/lib/atelier";

export const metadata: Metadata = {
  title: "L'Atelier — le système de fidélité de Maxline Studio",
  description:
    "Plus vous traduisez, plus votre atelier s'agrandit. Quatre rangs, des minutes offertes, un parrainage symétrique — tout est transparent, sans dark pattern.",
  alternates: { canonical: "https://www.maxlinestudio.fr/atelier" },
  openGraph: {
    title: "L'Atelier — le système de fidélité de Maxline Studio",
    description:
      "Quatre rangs, des minutes offertes, un parrainage symétrique. Tout est transparent.",
    url: "https://www.maxlinestudio.fr/atelier",
    type: "website",
  },
};

const MECHANICS: { title: string; detail: string }[] = [
  {
    title: "Progression visible",
    detail:
      "Une barre permanente sur votre tableau de bord vous indique combien de minutes il vous reste avant le rang suivant. Pas de compte à rebours stressant, juste un repère honnête.",
  },
  {
    title: "Continuité (streak)",
    detail:
      "Tous les 3 mois d'abonnement consécutifs, vous recevez des minutes offertes selon votre rang : +5 (Correcteur), +15 (Éditeur en chef), +50 (Maître d'œuvre). Si vous mettez en pause, le compteur attend — il ne vous punit pas.",
  },
  {
    title: "Anniversaire d'inscription",
    detail: `Chaque année, le jour anniversaire de votre inscription, des minutes offertes selon votre rang (de +${ANNIVERSARY_BONUS_MINUTES} à +200) et un mot personnel. Pour fêter le temps passé ensemble.`,
  },
  {
    title: "Parrainage symétrique",
    detail: `Partagez votre lien. Quand la personne invitée passe à un plan payant, vous recevez tous les deux +${REFERRAL_BONUS_MINUTES} minutes. Plafond de ${REFERRAL_MONTHLY_CAP} parrainages validés par mois, pour rester sain.`,
  },
  {
    title: "Cadeaux inattendus",
    detail: `De temps en temps, sans raison particulière, +${GIFT_BONUS_MINUTES} minutes tombent dans l'atelier de certains. Souvent pour compenser un pépin, parfois juste pour faire plaisir.`,
  },
  {
    title: "Minutes cumulées à vie",
    detail:
      "Les minutes que vous traduisez s'accumulent pour toujours et déterminent votre rang. Aucun reset, jamais. Les minutes offertes, elles non plus, n'expirent pas.",
  },
];

export default function AtelierPublicPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        {/* Section principale (réutilise la présentation des 4 rangs) */}
        <Atelier />

        {/* Détail transparent des mécaniques */}
        <section className="relative py-20 md:py-28 bg-ink-900 text-ivory-50 overflow-hidden">
          <div
            className="absolute inset-0 paper-grain-ink pointer-events-none"
            aria-hidden
          />
          <div className="container mx-auto max-w-4xl px-4 md:px-6 lg:px-8 relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation border-rouge-400 text-rouge-400">
                § Tout en transparence
              </span>
            </div>
            <h2 className="font-display font-medium text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-[-0.02em] mb-6">
              Comment l&apos;Atelier
              <br />
              vous récompense.
            </h2>
            <p className="text-lg text-ink-300 leading-relaxed max-w-2xl mb-14">
              Aucune mécanique cachée, aucun faux compte à rebours, aucun bonus
              qui expire en douce. Voici exactement comment ça marche.
            </p>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-9">
              {MECHANICS.map((m) => (
                <div key={m.title} className="flex gap-4">
                  <span
                    className="flex-shrink-0 mt-2 h-2 w-2 rounded-full bg-rouge-500"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-display font-semibold text-lg mb-2">
                      {m.title}
                    </h3>
                    <p className="text-sm text-ink-300 leading-relaxed">
                      {m.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 pt-10 border-t border-ink-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <p className="text-ink-300 max-w-md leading-relaxed">
                L&apos;Atelier est inclus dans tous les plans, sans frais
                supplémentaire. Il s&apos;active dès votre première minute.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-rouge-500 text-ivory-50 px-6 py-3 rounded-sm font-bold hover:bg-rouge-600 transition-colors flex-shrink-0"
              >
                Ouvrir mon atelier
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-400 hover:text-rouge-400 mt-12 group transition-colors"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
