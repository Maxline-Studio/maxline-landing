import Stripe from "stripe";

/**
 * Configuration Stripe — source unique des plans, packs crédits et quotas.
 *
 * Les Price ID viennent des variables d'environnement (compte test en dev,
 * compte live en prod via Vercel). Les minutes de quota/crédits sont la
 * vérité métier (cf. 02-strategie/03-pricing.md).
 */

let _stripe: Stripe | null = null;

/** Client Stripe serveur (lazy). Ne jamais importer côté client. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export type PaidPlan = "starter" | "plus";
export type CreditPack = "s" | "m" | "l";
/** Périodicité de facturation d'un abonnement. */
export type BillingInterval = "month" | "year";

/** Quota de minutes inclus PAR MOIS par plan payant. */
export const PLAN_MINUTES: Record<PaidPlan, number> = {
  starter: 120,
  plus: 360,
};

export const PLAN_LABELS: Record<PaidPlan, string> = {
  starter: "Starter",
  plus: "Plus",
};

/** Prix mensuel (€). */
export const PLAN_PRICE_EUR: Record<PaidPlan, number> = {
  starter: 12,
  plus: 24,
};

/** Prix annuel (€) — facturation annuelle à −20 % (≈ 2,4 mois offerts). */
export const PLAN_PRICE_ANNUAL_EUR: Record<PaidPlan, number> = {
  starter: 115,
  plus: 230,
};

/**
 * Multiplicateur de quota selon la périodicité. Modèle « pool annuel » : un abo
 * annuel crédite d'un coup toutes les minutes de l'année (12 × le quota mensuel),
 * à consommer librement sur l'année. La remise à zéro suit le cycle de facturation
 * (1×/an pour l'annuel, 1×/mois pour le mensuel) — gérée par le webhook invoice.paid.
 */
export function quotaMultiplier(interval: BillingInterval): number {
  return interval === "year" ? 12 : 1;
}

/** Minutes créditées par pack (sans expiration). */
export const CREDIT_PACK_MINUTES: Record<CreditPack, number> = {
  s: 30,
  m: 100,
  l: 300,
};

export const CREDIT_PACK_PRICE_EUR: Record<CreditPack, number> = {
  s: 8,
  m: 22,
  l: 55,
};

/** Price ID des plans payants (depuis l'env), selon la périodicité. */
export function planPriceId(
  plan: PaidPlan,
  interval: BillingInterval = "month",
): string {
  const env =
    interval === "year"
      ? plan === "starter"
        ? process.env.STRIPE_PRICE_STARTER_ANNUAL
        : process.env.STRIPE_PRICE_PLUS_ANNUAL
      : plan === "starter"
        ? process.env.STRIPE_PRICE_STARTER_MONTHLY
        : process.env.STRIPE_PRICE_PLUS_MONTHLY;
  if (!env) {
    throw new Error(`Price ID manquant pour le plan ${plan} (${interval}).`);
  }
  return env;
}

/** L'annuel est-il configuré (Price IDs présents) ? Sert à masquer l'option sinon. */
export function hasAnnualPricing(): boolean {
  return Boolean(
    process.env.STRIPE_PRICE_STARTER_ANNUAL &&
      process.env.STRIPE_PRICE_PLUS_ANNUAL,
  );
}

/** Price ID d'un pack crédits (depuis l'env). */
export function creditPriceId(pack: CreditPack): string {
  const map: Record<CreditPack, string | undefined> = {
    s: process.env.STRIPE_PRICE_CREDITS_S,
    m: process.env.STRIPE_PRICE_CREDITS_M,
    l: process.env.STRIPE_PRICE_CREDITS_L,
  };
  const id = map[pack];
  if (!id) throw new Error(`Price ID manquant pour le pack crédits ${pack}`);
  return id;
}

/** Résout un Price ID vers un plan payant (webhook), mensuel OU annuel. */
export function planForPriceId(priceId: string): PaidPlan | null {
  if (
    priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_STARTER_ANNUAL
  ) {
    return "starter";
  }
  if (
    priceId === process.env.STRIPE_PRICE_PLUS_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PLUS_ANNUAL
  ) {
    return "plus";
  }
  return null;
}

/** Résout un Price ID vers un nombre de minutes de crédits (webhook). */
export function creditsForPriceId(priceId: string): number | null {
  if (priceId === process.env.STRIPE_PRICE_CREDITS_S) return CREDIT_PACK_MINUTES.s;
  if (priceId === process.env.STRIPE_PRICE_CREDITS_M) return CREDIT_PACK_MINUTES.m;
  if (priceId === process.env.STRIPE_PRICE_CREDITS_L) return CREDIT_PACK_MINUTES.l;
  return null;
}

/** URL de base de l'app (redirections checkout/portail). */
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://www.maxlinestudio.fr";
}
