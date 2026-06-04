"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { subscribeOrChangePlan } from "@/lib/stripe-actions";
import { buildCheckoutIntent } from "@/lib/checkout-intent";
import type { PaidPlan, BillingInterval } from "@/lib/stripe";

type SubPlan = {
  kind: PaidPlan;
  name: string;
  subtitle: string;
  monthly: number;
  annual: number;
  minutes: number;
  description: string;
  features: string[];
  highlighted: boolean;
};

const SUB_PLANS: SubPlan[] = [
  {
    kind: "starter",
    name: "Starter",
    subtitle: "Le plus populaire",
    monthly: 12,
    annual: 115,
    minutes: 120,
    description: "Pour les créateurs réguliers",
    features: [
      "120 minutes de vidéo / mois",
      "Traduction dans 10 langues",
      "Sous-titres .srt + .vtt",
      "Vidéo MP4 sous-titrée",
      "Éditeur sous-titres",
      "Support en français",
      "Atelier + bonus de fidélité",
    ],
    highlighted: true,
  },
  {
    kind: "plus",
    name: "Plus",
    subtitle: "Pour aller plus loin",
    monthly: 24,
    annual: 230,
    minutes: 360,
    description: "Pour les créateurs très actifs",
    features: [
      "360 minutes de vidéo / mois",
      "Tout le plan Starter",
      "Export montage .fcpxml (DaVinci, Premiere, FCP)",
      "Traitement prioritaire",
      "Atelier + bonus accélérés",
    ],
    highlighted: false,
  },
];

const CREDITS_FEATURES = [
  "Pack 30 min — 8 €",
  "Pack 100 min — 22 €",
  "Pack 300 min — 55 €",
  "Crédits sans expiration",
  "Exports sous-titres inclus (.srt, .vtt, .txt)",
  "Atelier inclus dès la première minute",
];

export function PricingPreview({
  annualAvailable = false,
}: {
  annualAvailable?: boolean;
}) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const annual = interval === "year";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setLoggedIn(!!session?.user),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Connecté → crée la session Stripe (ou portail si déjà abonné).
  function subscribe(kind: PaidPlan) {
    setError(null);
    setBusy(kind);
    startTransition(async () => {
      const res = await subscribeOrChangePlan(kind, interval);
      if (res.ok) {
        window.location.href = res.url;
      } else {
        setError(res.error || "Une erreur est survenue.");
        setBusy(null);
      }
    });
  }

  return (
    <section
      id="pricing"
      className="relative py-24 md:py-36 bg-ivory-100 border-y border-ivory-200 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-12">
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

        {/* Bascule mensuel / annuel (si l'annuel est configuré) */}
        {annualAvailable && (
          <Reveal>
            <div className="inline-flex items-center gap-1 mb-10 p-1 bg-ivory-50 border-2 border-ink-900 rounded-sm">
              <button
                type="button"
                onClick={() => setInterval("month")}
                className={cn(
                  "px-4 py-1.5 rounded-sm text-sm font-medium transition-colors",
                  !annual
                    ? "bg-ink-900 text-ivory-50"
                    : "text-ink-600 hover:text-ink-900",
                )}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setInterval("year")}
                className={cn(
                  "px-4 py-1.5 rounded-sm text-sm font-medium transition-colors",
                  annual
                    ? "bg-ink-900 text-ivory-50"
                    : "text-ink-600 hover:text-ink-900",
                )}
              >
                Annuel{" "}
                <span className={annual ? "text-rouge-300" : "text-rouge-600"}>
                  −20 %
                </span>
              </button>
            </div>
          </Reveal>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700 max-w-md"
          >
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl items-stretch">
          {/* ─── Crédits ─── */}
          <Reveal delay={0}>
            <PriceCard
              highlighted={false}
              name="Crédits"
              subtitle="Pay-as-you-go"
              priceNode={
                <>
                  <span className="font-display font-bold text-6xl md:text-7xl tabular-nums leading-none tracking-tight text-ink-900">
                    Dès 8
                  </span>
                  <span className="font-display italic text-lg text-ink-600">
                    €
                  </span>
                </>
              }
              description="Pour les usages ponctuels"
              features={CREDITS_FEATURES}
              cta={
                <Link
                  href={loggedIn ? "/app/billing" : "/signup?checkout=credits"}
                  className="btn-outline w-full"
                >
                  Voir les crédits
                </Link>
              }
            />
          </Reveal>

          {/* ─── Abonnements ─── */}
          {SUB_PLANS.map((plan, idx) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <Reveal key={plan.kind} delay={(idx + 1) * 120}>
                <PriceCard
                  highlighted={plan.highlighted}
                  name={plan.name}
                  subtitle={plan.subtitle}
                  priceNode={
                    <>
                      <span
                        className={cn(
                          "font-display font-bold text-6xl md:text-7xl tabular-nums leading-none tracking-tight",
                          plan.highlighted ? "text-rouge-400" : "text-ink-900",
                        )}
                      >
                        {price}
                      </span>
                      <span
                        className={cn(
                          "font-display italic text-lg",
                          plan.highlighted ? "text-ivory-300" : "text-ink-600",
                        )}
                      >
                        {annual ? "€/an" : "€/mois"}
                      </span>
                    </>
                  }
                  priceHint={
                    annual
                      ? `≈ ${Math.round(plan.annual / 12)} €/mois · 2 mois offerts`
                      : undefined
                  }
                  description={plan.description}
                  features={plan.features}
                  cta={
                    loggedIn ? (
                      <button
                        type="button"
                        onClick={() => subscribe(plan.kind)}
                        disabled={pending}
                        className={cn(
                          "w-full inline-flex items-center justify-center gap-2 px-5 h-12 rounded-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed group",
                          plan.highlighted
                            ? "bg-rouge-500 text-ivory-50 hover:bg-rouge-600"
                            : "bg-ink-900 text-ivory-50 hover:bg-ink-800",
                        )}
                      >
                        {busy === plan.kind ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <>
                            Choisir {plan.name}
                            <ArrowRight
                              className="h-4 w-4 transition-transform group-hover:translate-x-1"
                              aria-hidden
                            />
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/signup?checkout=${buildCheckoutIntent(plan.kind, interval)}`}
                        className={cn(
                          "w-full inline-flex items-center justify-center gap-2 px-5 h-12 rounded-sm font-semibold transition-colors group",
                          plan.highlighted
                            ? "bg-rouge-500 text-ivory-50 hover:bg-rouge-600"
                            : "bg-ink-900 text-ivory-50 hover:bg-ink-800",
                        )}
                      >
                        Choisir {plan.name}
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </Link>
                    )
                  }
                />
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={400}>
          <p className="mt-14 text-center text-sm text-ink-600 font-mono uppercase tracking-widest">
            › Première vidéo de moins de 5 min offerte &middot; sans carte
            bancaire{annualAvailable ? " · −20 % en annuel" : ""}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/** Carte de prix (présentation). Le bouton d'action est passé en `cta`. */
function PriceCard({
  highlighted,
  name,
  subtitle,
  priceNode,
  priceHint,
  description,
  features,
  cta,
}: {
  highlighted: boolean;
  name: string;
  subtitle: string;
  priceNode: ReactNode;
  priceHint?: string;
  description: string;
  features: string[];
  cta: ReactNode;
}) {
  return (
    <article
      className={cn(
        "relative h-full flex flex-col rounded-sm transition-all duration-300 lift-on-hover",
        highlighted
          ? "bg-ink-900 text-ivory-50 border-2 border-ink-900 lg:scale-[1.02] shadow-[8px_8px_0_0_rgba(200,57,47,1)]"
          : "bg-ivory-50 border-2 border-ink-900",
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-6 bg-rouge-500 text-ivory-50 px-3 py-1 font-mono font-bold text-[10px] uppercase tracking-widest">
          ★ Recommandé
        </div>
      )}

      <div className="p-8 md:p-10 flex flex-col h-full">
        <div className="mb-6 pb-6 border-b border-current/15">
          <h3
            className={cn(
              "font-display italic text-3xl font-light tracking-tight mb-1",
              highlighted ? "text-ivory-50" : "text-ink-900",
            )}
          >
            {name}
          </h3>
          <p
            className={cn(
              "font-mono text-[10px] uppercase tracking-widest",
              highlighted ? "text-rouge-300" : "text-ink-500",
            )}
          >
            {subtitle}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1.5">{priceNode}</div>
          {priceHint && (
            <p
              className={cn(
                "text-xs mt-1",
                highlighted ? "text-rouge-300" : "text-rouge-600",
              )}
            >
              {priceHint}
            </p>
          )}
          <p
            className={cn(
              "text-sm mt-3",
              highlighted ? "text-ivory-300" : "text-ink-600",
            )}
          >
            {description}
          </p>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  "h-5 w-5 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5",
                  highlighted ? "bg-rouge-500 text-ivory-50" : "bg-ink-900 text-rouge-400",
                )}
              >
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span className={highlighted ? "text-ivory-50" : "text-ink-800"}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto">{cta}</div>
      </div>
    </article>
  );
}
