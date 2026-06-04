"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, Check, Loader2, Settings } from "lucide-react";
import {
  createCheckoutSession,
  createPortalSession,
  subscribeOrChangePlan,
  type CheckoutKind,
} from "@/lib/stripe-actions";

type BillingInterval = "month" | "year";

type PlanCard = {
  kind: "starter" | "plus";
  name: string;
  price: number;
  annualPrice: number;
  minutes: number;
  perks: string[];
};

const PLANS: PlanCard[] = [
  {
    kind: "starter",
    name: "Starter",
    price: 12,
    annualPrice: 115,
    minutes: 120,
    perks: ["Exports .srt + .vtt + .txt", "Éditeur en ligne", "Support FR < 24 h"],
  },
  {
    kind: "plus",
    name: "Plus",
    price: 24,
    annualPrice: 230,
    minutes: 360,
    perks: [
      "Tout Starter",
      "+ Export montage .fcpxml (DaVinci, Premiere, FCP)",
      "+ Traitement prioritaire",
    ],
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
  isSubscribed,
  annualAvailable,
  resumePlan,
  resumeInterval,
}: {
  currentPlan: string;
  hasCustomer: boolean;
  isSubscribed: boolean;
  annualAvailable: boolean;
  /** Reprise auto du paiement après inscription/connexion (depuis la landing). */
  resumePlan?: "starter" | "plus";
  resumeInterval?: BillingInterval;
}) {
  const [pending, startTransition] = useTransition();
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    resumeInterval ?? "month",
  );
  const [resuming, setResuming] = useState<boolean>(
    Boolean(resumePlan && resumeInterval),
  );
  const annual = billingInterval === "year";

  // Reprise : on relance directement le paiement du plan choisi sur la landing.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (resumedRef.current || !resumePlan || !resumeInterval) return;
    resumedRef.current = true;
    setBusyKind(resumePlan);
    startTransition(async () => {
      const res = await subscribeOrChangePlan(resumePlan, resumeInterval);
      if (res.ok) {
        window.location.href = res.url;
      } else {
        setResuming(false);
        setError(res.error || "La reprise du paiement a échoué. Réessayez.");
        setBusyKind(null);
      }
    });
  }, [resumePlan, resumeInterval]);

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
      {resuming && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 bg-ink-900 text-ivory-50 rounded-sm"
        >
          <Loader2 className="h-5 w-5 animate-spin text-rouge-400" aria-hidden />
          <span className="text-sm">
            Redirection vers le paiement sécurisé…
          </span>
        </div>
      )}
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
        <h2 className="font-display font-medium text-xl text-ink-900 mb-2">
          Abonnements
        </h2>
        {isSubscribed && (
          <p className="text-sm text-ink-600 mb-5">
            Vous êtes abonné. Changer de plan se fait via le portail sécurisé
            Stripe, au prorata — aucun double prélèvement.
          </p>
        )}
        {annualAvailable && !isSubscribed && (
          <div className="inline-flex items-center gap-1 mb-6 p-1 bg-ivory-100 border border-ivory-300 rounded-sm">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                !annual
                  ? "bg-ink-900 text-ivory-50"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-colors ${
                annual
                  ? "bg-ink-900 text-ivory-50"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Annuel{" "}
              <span
                className={annual ? "text-rouge-300" : "text-rouge-600"}
              >
                −20 %
              </span>
            </button>
          </div>
        )}
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
                    {annual ? plan.annualPrice : plan.price} €
                  </span>
                  <span className="text-sm text-ink-500">
                    {annual
                      ? ` / an · ${plan.minutes * 12} min pour l'année`
                      : ` / mois · ${plan.minutes} min`}
                  </span>
                  {annual && (
                    <p className="text-xs text-rouge-600 mt-1">
                      ≈ {Math.round(plan.annualPrice / 12)} €/mois · 2 mois
                      offerts
                    </p>
                  )}
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
                  onClick={() =>
                    go(
                      () => subscribeOrChangePlan(plan.kind, billingInterval),
                      plan.kind,
                    )
                  }
                  className="btn-pen w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyKind === plan.kind ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : isCurrent ? (
                    "Votre plan"
                  ) : isSubscribed ? (
                    <>
                      Changer pour {plan.name}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
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
