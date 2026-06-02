import { Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Crédits",
    subtitle: "Pay-as-you-go",
    price: "Dès 8",
    period: "€",
    description: "Pour les usages ponctuels",
    features: [
      "Pack 30 min — 8 €",
      "Pack 100 min — 22 €",
      "Pack 300 min — 55 €",
      "Crédits sans expiration",
      "Exports sous-titres inclus (.srt, .vtt, .txt)",
      "Atelier inclus dès la première minute",
    ],
    highlighted: false,
  },
  {
    name: "Starter",
    subtitle: "Le plus populaire",
    price: "12",
    period: "€/mois",
    description: "Pour les créateurs réguliers",
    features: [
      "120 minutes de vidéo / mois",
      "Sous-titres .srt + .vtt",
      "Vidéo MP4 sous-titrée",
      "Éditeur sous-titres",
      "Support en français",
      "Atelier + bonus de fidélité",
      "Sans engagement",
    ],
    highlighted: true,
  },
  {
    name: "Plus",
    subtitle: "Pour aller plus loin",
    price: "24",
    period: "€/mois",
    description: "Pour les créateurs très actifs",
    features: [
      "360 minutes de vidéo / mois",
      "Tout le plan Starter",
      "Export montage .fcpxml (DaVinci, Premiere, FCP)",
      "Glossaire personnalisé",
      "Traitement prioritaire",
      "Atelier + bonus accélérés",
    ],
    highlighted: false,
  },
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="relative py-24 md:py-36 bg-ivory-100 border-y border-ivory-200 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§05 · Tarif</span>
            </div>
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
              Lisibles en{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  5 secondes
                </HandUnderline>
              </span>
              .
            </h2>
            <p className="mt-6 text-lg text-ink-700 max-w-xl">
              Pas de minimum, pas de piège, pas d&apos;astérisque. Le prix que
              vous voyez est celui que vous payez.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl">
          {plans.map((plan, idx) => (
            <Reveal key={idx} delay={idx * 120}>
              <article
                className={cn(
                  "relative h-full rounded-sm transition-all duration-300 lift-on-hover",
                  plan.highlighted
                    ? "bg-ink-900 text-ivory-50 border-2 border-ink-900 lg:scale-[1.02] shadow-[8px_8px_0_0_rgba(200,57,47,1)]"
                    : "bg-ivory-50 border-2 border-ink-900",
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-6 bg-rouge-500 text-ivory-50 px-3 py-1 font-mono font-bold text-[10px] uppercase tracking-widest">
                    ★ Recommandé
                  </div>
                )}

                <div className="p-8 md:p-10">
                  {/* En-tête */}
                  <div className="mb-6 pb-6 border-b border-current/15">
                    <h3
                      className={cn(
                        "font-display italic text-3xl font-light tracking-tight mb-1",
                        plan.highlighted ? "text-ivory-50" : "text-ink-900",
                      )}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-widest",
                        plan.highlighted ? "text-rouge-300" : "text-ink-500",
                      )}
                    >
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Prix géant */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          "font-display font-bold text-6xl md:text-7xl tabular-nums leading-none tracking-tight",
                          plan.highlighted ? "text-rouge-400" : "text-ink-900",
                        )}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={cn(
                          "font-display italic text-lg",
                          plan.highlighted ? "text-ivory-300" : "text-ink-600",
                        )}
                      >
                        {plan.period}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm mt-3",
                        plan.highlighted ? "text-ivory-300" : "text-ink-600",
                      )}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Liste features */}
                  <ul className="space-y-3 mb-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span
                          className={cn(
                            "h-5 w-5 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5",
                            plan.highlighted
                              ? "bg-rouge-500 text-ivory-50"
                              : "bg-ink-900 text-rouge-400",
                          )}
                        >
                          <Check
                            className="h-3 w-3"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                        <span
                          className={
                            plan.highlighted ? "text-ivory-50" : "text-ink-800"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <p className="mt-14 text-center text-sm text-ink-600 font-mono uppercase tracking-widest">
            › Première vidéo de moins de 5 min offerte &middot; sans carte bancaire
          </p>
        </Reveal>
      </div>
    </section>
  );
}
