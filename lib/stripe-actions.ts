"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getStripe,
  planPriceId,
  creditPriceId,
  appUrl,
  type PaidPlan,
  type CreditPack,
} from "@/lib/stripe";

export type CheckoutKind = PaidPlan | `credits_${CreditPack}`;

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Crée une session Stripe Checkout pour un abonnement (starter/plus) ou un
 * pack crédits (paiement unique). Retourne l'URL de redirection.
 */
export async function createCheckoutSession(
  kind: CheckoutKind,
): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Profil introuvable." };

  const stripe = getStripe();

  // S'assure d'un client Stripe rattaché au profil (réutilisé entre achats).
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const isSubscription = kind === "starter" || kind === "plus";
  const priceId = isSubscription
    ? planPriceId(kind as PaidPlan)
    : creditPriceId(kind.replace("credits_", "") as CreditPack);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? "subscription" : "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: { user_id: user.id, kind },
      ...(isSubscription
        ? { subscription_data: { metadata: { user_id: user.id } } }
        : { payment_intent_data: { metadata: { user_id: user.id, kind } } }),
      allow_promotion_codes: true,
      success_url: `${appUrl()}/app/billing?status=success`,
      cancel_url: `${appUrl()}/app/billing?status=cancel`,
    });

    if (!session.url) return { ok: false, error: "Session Stripe sans URL." };
    return { ok: true, url: session.url };
  } catch (e) {
    return {
      ok: false,
      error: `Erreur Stripe : ${e instanceof Error ? e.message : "inconnue"}`,
    };
  }
}

/**
 * Crée une session du portail client Stripe (gérer l'abonnement, factures,
 * carte, annulation). Nécessite un client Stripe déjà créé.
 */
export async function createPortalSession(): Promise<CheckoutResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return { ok: false, error: "Aucun abonnement à gérer pour l'instant." };
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl()}/app/billing`,
    });
    return { ok: true, url: session.url };
  } catch (e) {
    return {
      ok: false,
      error: `Erreur Stripe : ${e instanceof Error ? e.message : "inconnue"}`,
    };
  }
}
