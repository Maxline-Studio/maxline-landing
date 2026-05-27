import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Crédits",
    subtitle: "Pay-as-you-go",
    price: "Dès 8 €",
    period: "",
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
    price: "12 €",
    period: "/mois",
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
    badge: "⭐ Recommandé",
  },
  {
    name: "Plus",
    subtitle: "Pour aller plus loin",
    price: "24 €",
    period: "/mois",
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
    <section id="pricing" className="py-24 md:py-32 bg-white relative">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-12 bg-primary-300" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Tarifs
              </span>
              <span className="h-px w-12 bg-primary-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-tight">
              Lisibles en{" "}
              <em className="text-primary-600">5 secondes</em>.
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Pas de minimum, pas de piège, pas d&apos;astérisque.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <Reveal key={idx} delay={idx * 100}>
              <article
                className={cn(
                  "relative bg-white rounded-2xl p-8 border-2 h-full tilt-on-hover",
                  plan.highlighted
                    ? "border-primary-500 shadow-2xl shadow-primary-200/40 lg:scale-105"
                    : "border-neutral-200 hover:border-neutral-300",
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">{plan.badge}</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-serif text-3xl text-neutral-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1 italic">{plan.subtitle}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl md:text-5xl font-extrabold text-neutral-900 tabular-nums">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-lg text-neutral-500 ml-1">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check
                        className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5"
                        aria-hidden
                      />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={400}>
          <p className="mt-12 text-center text-sm text-neutral-500 italic">
            Votre première vidéo de moins de 5 minutes sera offerte au lancement,
            sans carte demandée.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
