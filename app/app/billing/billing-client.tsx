"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Check, Loader2, Settings } from "lucide-react";
import {
  createCheckoutSession,
  createPortalSession,
  type CheckoutKind,
} from "@/lib/stripe-actions";

type PlanCard = {
  kind: "starter" | "plus";
  name: string;
  price: number;
  minutes: number;
  perks: string[];
};

const PLANS: PlanCard[] = [
  {
    kind: "starter",
    name: "Starter",
    price: 12,
    minutes: 120,
    perks: ["Exports .srt + .vtt + .txt", "Éditeur en ligne", "Support FR < 24 h"],
  },
  {
    kind: "plus",
    name: "Plus",
    price: 24,
    minutes: 360,
    perks: ["Tout Starter", "+ Exports .fcpxml / .xml", "Glossaire · Priorité"],
  },
];

const PACKS: { kind: CheckoutKind; name: string; price: number; minutes: number }[] = [
  { kind: "credits_s", name: "Pack S", price: 8, minutes: 30 },
  { kind: "credits_m", name: "Pack M", price: 22, minutes: 100 },
  { kind: "credits_l", name: "Pack L", price: 55, minutes: 300 },
];

export function BillingActions({
  currentPlan,
  hasCustomer,
}: {
  currentPlan: string;
  hasCustomer: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function go(action: () => Promise<{ ok: boolean; url?: string; error?: string }>, key: string) {
    setError(null);
    setBusyKind(key);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error || "Une erreur est survenue.");
        setBusyKind(null);
      }
    });
  }

  return (
    <div className="space-y-12">
      {error && (
        <div
          role="alert"
          className="p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
        >
          {error}
        </div>
      )}

      {/* Abonnements */}
      <section>
        <h2 className="font-display font-medium text-xl text-ink-900 mb-5">
          Abonnements mensuels
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.kind;
            return (
              <article
                key={plan.kind}
                className={
                  isCurrent
                    ? "bg-white border-2 border-rouge-500 rounded-sm p-6 shadow-[3px_3px_0_0_var(--color-rouge-500)]"
                    : "bg-white border-2 border-ink-900 rounded-sm p-6"
                }
              >
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-display italic font-light text-2xl text-ink-900">
                    {plan.name}
                  </h3>
                  {isCurrent && (
                    <span className="annotation-filled text-[9px]">Plan actuel</span>
                  )}
                </div>
                <div className="mb-4">
                  <span className="font-display font-extrabold text-3xl text-ink-900 tabular-nums">
                    {plan.price} €
                  </span>
                  <span className="text-sm text-ink-500">
                    {" "}/ mois · {plan.minutes} min
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-ink-700 mb-6">
                  {plan.perks.map((perk, i) => (
                    <li key={i} className="flex gap-2">
                      <Check className="h-4 w-4 text-rouge-500 flex-shrink-0 mt-0.5" aria-hidden />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={pending || isCurrent}
                  onClick={() => go(() => createCheckoutSession(plan.kind), plan.kind)}
                  className="btn-pen w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyKind === plan.kind ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : isCurrent ? (
                    "Votre plan"
                  ) : (
                    <>
                      Choisir {plan.name}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Packs crédits */}
      <section>
        <h2 className="font-display font-medium text-xl text-ink-900 mb-2">
          Packs crédits
        </h2>
        <p className="text-sm text-ink-600 mb-5">
          Sans expiration. Consommés après votre quota mensuel. Cumulables avec un abonnement.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {PACKS.map((pack) => (
            <article
              key={pack.kind}
              className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-5 flex flex-col"
            >
              <h3 className="font-display font-semibold text-lg text-ink-900">
                {pack.name}
              </h3>
              <div className="mb-4 flex-1">
                <span className="font-display font-extrabold text-2xl text-ink-900 tabular-nums">
                  {pack.price} €
                </span>
                <div className="text-sm text-ink-500">{pack.minutes} minutes</div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => go(() => createCheckoutSession(pack.kind), pack.kind)}
                className="btn-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busyKind === pack.kind ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  "Acheter"
                )}
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Portail client */}
      {hasCustomer && (
        <section className="border-t border-ivory-200 pt-8">
          <button
            type="button"
            disabled={pending}
            onClick={() => go(() => createPortalSession(), "portal")}
            className="inline-flex items-center gap-2 text-sm font-bold text-encre-500 hover:text-rouge-500 transition-colors disabled:opacity-50"
          >
            {busyKind === "portal" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Settings className="h-4 w-4" aria-hidden />
            )}
            Gérer mon abonnement, mes factures et ma carte
          </button>
        </section>
      )}
    </div>
  );
}
