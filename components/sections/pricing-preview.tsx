import { Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
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
      "Tous les exports inclus",
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
      "Export .fcpxml (DaVinci)",
      "Export .xml (Premiere)",
      "Glossaire personnalisé",
      "Traitement prioritaire",
    ],
    highlighted: false,
  },
];

export function PricingPreview() {
  return (
    <section
      id="pricing"
      className="relative py-24 md:py-36 bg-white overflow-hidden"
    >
      <div className="absolute inset-0 -z-0 tape-lines-light pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-3xl mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="timecode-cobalt">CH. 06 · TARIFS</span>
            </div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-[1.0] tracking-tighter">
              Lisibles en{" "}
              <span className="slab-cobalt">5 secondes</span>.
            </h2>
            <p className="mt-6 text-lg text-neutral-700 max-w-xl">
              Pas de minimum, pas de piège, pas d&apos;astérisque. Le prix que
              tu vois est celui que tu payes.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <article
                className={cn(
                  "relative h-full rounded-sm transition-all duration-300 card-subtitle-bar",
                  plan.highlighted
                    ? "bg-neutral-900 text-cream-50 border-2 border-primary-400 lg:scale-[1.03] shadow-2xl"
                    : "bg-cream-50 border-2 border-neutral-900",
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-400 text-neutral-900 px-3 py-1 font-mono font-bold text-[10px] uppercase tracking-widest border-2 border-neutral-900 rounded-sm">
                    ★ Recommandé
                  </div>
                )}

                <div className="p-8 md:p-10">
                  {/* Header card */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3
                        className={cn(
                          "font-display font-extrabold text-3xl tracking-tighter",
                          plan.highlighted ? "text-cream-50" : "text-neutral-900",
                        )}
                      >
                        {plan.name}
                      </h3>
                    </div>
                    <p
                      className={cn(
                        "text-xs font-mono uppercase tracking-widest",
                        plan.highlighted ? "text-primary-400" : "text-neutral-500",
                      )}
                    >
                      {plan.subtitle}
                    </p>
                  </div>

                  {/* Prix géant tabulaire */}
                  <div className="mb-6 border-t border-b py-5"
                       style={{ borderColor: plan.highlighted ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-5xl md:text-6xl font-display font-extrabold tabular-nums tracking-tighter",
                          plan.highlighted ? "text-primary-400" : "text-neutral-900",
                        )}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={cn(
                          "text-lg font-mono",
                          plan.highlighted ? "text-cream-50" : "text-neutral-700",
                        )}
                      >
                        {plan.period}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm mt-2",
                        plan.highlighted ? "text-neutral-400" : "text-neutral-700",
                      )}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span
                          className={cn(
                            "h-5 w-5 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5",
                            plan.highlighted
                              ? "bg-primary-400 text-neutral-900"
                              : "bg-neutral-900 text-primary-400",
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                        <span
                          className={
                            plan.highlighted
                              ? "text-cream-50"
                              : "text-neutral-800"
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
          <p className="mt-14 text-center text-sm text-neutral-700 font-mono uppercase tracking-widest">
            › Première vidéo de moins de 5 min offerte au lancement · sans carte
          </p>
        </Reveal>
      </div>
    </section>
  );
}
