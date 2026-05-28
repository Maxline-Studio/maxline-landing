import { GraduationCap, Pencil, BookOpen, Crown } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

/**
 * Section "L'Atelier" — système de fidélité Maxline.
 * 4 rangs progressifs, vocabulaire d'imprimerie française.
 * Détails complets dans 03-produit/06-atelier-gamification.md
 */

type Marker = "ivory" | "rouge" | "rouge-line" | "rouge-crown";

const ranks: {
  name: string;
  icon: typeof GraduationCap;
  threshold: string;
  marker: Marker;
  perks: string[];
}[] = [
  {
    name: "Apprenti",
    icon: GraduationCap,
    threshold: "0 — 299 min",
    marker: "ivory",
    perks: ["Toutes les fonctions du plan choisi", "Support en français sous 24 h"],
  },
  {
    name: "Correcteur",
    icon: Pencil,
    threshold: "300 — 1 199 min",
    marker: "rouge",
    perks: [
      "Glossaire personnalisé sauvegardé",
      "Priorité dans la file de traitement",
      "+5 min offertes tous les 3 mois consécutifs",
    ],
  },
  {
    name: "Éditeur en chef",
    icon: BookOpen,
    threshold: "1 200 — 4 999 min",
    marker: "rouge-line",
    perks: [
      "Exports .fcpxml et .xml inclus, même sur Starter",
      "Accès anticipé aux nouvelles fonctions",
      "+15 min offertes tous les 3 mois · +30 min anniversaire",
    ],
  },
  {
    name: "Maître d'œuvre",
    icon: Crown,
    threshold: "5 000+ min",
    marker: "rouge-crown",
    perks: [
      "Vote sur la prochaine fonction prioritaire",
      "Un mois gratuit offert tous les ans",
      "+50 min offertes tous les 3 mois",
    ],
  },
];

function RankMarker({ marker }: { marker: Marker }) {
  if (marker === "ivory") {
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-ink-900 bg-ivory-50" aria-hidden />
    );
  }
  if (marker === "rouge") {
    return (
      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-ink-900 bg-rouge-500" aria-hidden />
    );
  }
  if (marker === "rouge-line") {
    return (
      <span className="relative inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-ink-900 bg-rouge-500" aria-hidden>
        <span className="absolute -top-1.5 inset-x-0 h-[2px] bg-ink-900" />
      </span>
    );
  }
  return (
    <span className="relative inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-ink-900 bg-rouge-500" aria-hidden>
      <span className="absolute -top-1.5 inset-x-0 h-[2px] bg-ink-900" />
      <Crown className="absolute -top-3 h-3 w-3 text-ink-900" strokeWidth={2.5} />
    </span>
  );
}

export function Atelier() {
  return (
    <section
      id="atelier"
      className="relative py-24 md:py-36 bg-ivory-50 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§06 · L&apos;Atelier</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                système de fidélité
              </span>
            </div>
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
              Plus vous éditez,
              <br />
              plus votre{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  atelier
                </HandUnderline>
              </span>{" "}
              s&apos;agrandit.
            </h2>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed max-w-2xl">
              Chaque minute traduite vous fait progresser dans la hiérarchie de
              l&apos;Atelier. À chaque rang, votre outil se garnit de
              fonctions, de priorités et de bonus offerts. Inclus dans tous les
              plans, sans frais supplémentaires.
            </p>
          </div>
        </Reveal>

        {/* Ligne de progression entre les 4 rangs */}
        <div className="relative">
          <div className="hidden lg:block absolute top-[68px] left-[12%] right-[12%] h-px bg-ink-300" aria-hidden />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
            {ranks.map((rank, idx) => {
              const Icon = rank.icon;
              return (
                <Reveal key={rank.name} delay={idx * 100}>
                  <article className="group relative h-full bg-white border-2 border-ink-900 rounded-sm p-7 lift-on-hover card-annotated">
                    {/* Tête de carte */}
                    <div className="flex items-center justify-between mb-6 pb-5 border-b border-ink-200">
                      <RankMarker marker={rank.marker} />
                      <span className="font-mono text-[10px] text-ink-500 uppercase tracking-widest tabular-nums">
                        {rank.threshold}
                      </span>
                    </div>

                    {/* Icône + nom */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-sm bg-ink-900 group-hover:bg-rouge-500 flex items-center justify-center transition-colors">
                        <Icon
                          className="h-5 w-5 text-rouge-400 group-hover:text-ivory-50 transition-colors"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </div>
                      <h3 className="font-display italic font-light text-2xl text-ink-900 leading-none">
                        {rank.name}
                      </h3>
                    </div>

                    {/* Avantages */}
                    <ul className="space-y-2.5 text-sm text-ink-700 leading-relaxed">
                      {rank.perks.map((perk, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="text-rouge-500 font-bold mt-0.5 select-none">
                            +
                          </span>
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>

        {/* Mécaniques transversales */}
        <Reveal delay={500}>
          <div className="mt-16 md:mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
            {[
              {
                title: "Anniversaire d'inscription",
                desc: "+10 minutes offertes chaque année, le jour anniversaire de votre inscription.",
              },
              {
                title: "Filleul / Marraine",
                desc: "Invitez un ami. Quand il s'abonne, vous recevez tous les deux 30 minutes.",
              },
              {
                title: "Minutes cumulées à vie",
                desc: "Vos minutes utilisées s'accumulent pour toujours. Aucun reset, jamais.",
              },
            ].map((m, i) => (
              <div key={i} className="flex gap-4">
                <span
                  className="flex-shrink-0 mt-1 h-2 w-2 rounded-full bg-rouge-500"
                  aria-hidden
                />
                <div>
                  <h4 className="font-display font-semibold text-base text-ink-900 mb-1">
                    {m.title}
                  </h4>
                  <p className="text-sm text-ink-600 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <p className="mt-14 text-center text-sm font-mono text-ink-500 uppercase tracking-widest">
          [ système actif dès l&apos;ouverture de la bêta &middot; détails complets sur la page /atelier ]
        </p>
      </div>
    </section>
  );
}
