/**
 * « Intention de paiement » transportée depuis la landing à travers l'inscription
 * jusqu'à la page de facturation (paramètre `?checkout=`).
 *
 * Format : `<plan>-<interval>` (ex. « plus-year », « starter-month »).
 * Une valeur non reconnue (ex. « credits ») ne déclenche aucun paiement auto :
 * la page billing s'affiche normalement.
 */
import type { PaidPlan, BillingInterval } from "@/lib/stripe";

export type CheckoutIntent = { plan: PaidPlan; interval: BillingInterval };

/** Construit la chaîne d'intention (landing → URL). */
export function buildCheckoutIntent(
  plan: PaidPlan,
  interval: BillingInterval,
): string {
  return `${plan}-${interval}`;
}

/** Parse l'intention. Retourne null si ce n'est pas un plan/intervalle valide. */
export function parseCheckoutIntent(
  raw: string | null | undefined,
): CheckoutIntent | null {
  if (!raw) return null;
  const [plan, interval] = raw.split("-");
  if (
    (plan === "starter" || plan === "plus") &&
    (interval === "month" || interval === "year")
  ) {
    return { plan, interval };
  }
  return null;
}

/** Cible de redirection post-auth pour reprendre le paiement. */
export function billingResumeUrl(intent: string): string {
  return `/app/billing?checkout=${encodeURIComponent(intent)}`;
}
