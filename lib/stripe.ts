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

/** Quota mensuel inclus par plan payant. */
export const PLAN_MINUTES: Record<PaidPlan, number> = {
  starter: 120,
  plus: 360,
};

export const PLAN_LABELS: Record<PaidPlan, string> = {
  starter: "Starter",
  plus: "Plus",
};

export const PLAN_PRICE_EUR: Record<PaidPlan, number> = {
  starter: 12,
  plus: 24,
};

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

/** Price ID des plans payants (depuis l'env). */
export function planPriceId(plan: PaidPlan): string {
  const id =
    plan === "starter"
      ? process.env.STRIPE_PRICE_STARTER_MONTHLY
      : process.env.STRIPE_PRICE_PLUS_MONTHLY;
  if (!id) throw new Error(`Price ID manquant pour le plan ${plan}`);
  return id;
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

/** Résout un Price ID vers un plan payant (webhook). */
export function planForPriceId(priceId: string): PaidPlan | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER_MONTHLY) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PLUS_MONTHLY) return "plus";
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
