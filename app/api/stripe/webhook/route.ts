import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileUpdate } from "@/lib/supabase/types";
import {
  getStripe,
  planForPriceId,
  PLAN_MINUTES,
  CREDIT_PACK_MINUTES,
  quotaMultiplier,
  type CreditPack,
  type BillingInterval,
} from "@/lib/stripe";

/**
 * Webhook Stripe — source de vérité du statut d'abonnement et des crédits.
 *
 * Utilise le client admin (service_role) pour écrire dans profiles en
 * contournant la RLS. Vérifie la signature Stripe avant tout traitement.
 *
 * Événements gérés :
 *  - checkout.session.completed  → crédits (paiement unique) + conversion parrainage
 *  - customer.subscription.created/updated → plan + quota
 *  - customer.subscription.deleted → retour au plan free, reset streak
 *  - invoice.paid (renouvellement) → reset du quota mensuel consommé
 */

// Stripe a besoin du corps brut pour vérifier la signature.
export const dynamic = "force-dynamic";

function subPeriodEnd(sub: Stripe.Subscription): string | null {
  // current_period_end est sur la subscription (anciennes API) ou sur l'item (récentes).
  const ts =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    sub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook non configuré" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Signature invalide : ${e instanceof Error ? e.message : ""}` },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  async function profileIdByCustomer(customerId: string): Promise<string | null> {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    return data?.id ?? null;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.user_id as string | undefined) ||
          session.client_reference_id ||
          null;

        if (session.mode === "payment") {
          // Achat d'un pack crédits → ajout des minutes (pas un bonus : pas de ledger)
          const kind = session.metadata?.kind as string | undefined;
          const pack = kind?.replace("credits_", "") as CreditPack | undefined;
          const minutes = pack ? CREDIT_PACK_MINUTES[pack] : null;
          if (userId && minutes) {
            const { data: p } = await admin
              .from("profiles")
              .select("credits_minutes")
              .eq("id", userId)
              .single();
            if (p) {
              await admin
                .from("profiles")
                .update({ credits_minutes: Number(p.credits_minutes) + minutes })
                .eq("id", userId);
            }
          }
        } else if (session.mode === "subscription" && userId) {
          // 1re souscription payante → valide un éventuel parrainage (+30 min aux deux)
          await admin.rpc("process_referral_conversion", { p_invitee_id: userId });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = await profileIdByCustomer(customerId);
        if (!userId) break;

        const price = sub.items.data[0]?.price;
        const priceId = price?.id;
        const plan = priceId ? planForPriceId(priceId) : null;
        // Périodicité : annuel = « pool » de 12× le quota mensuel (cf. stripe.ts).
        const interval: BillingInterval =
          price?.recurring?.interval === "year" ? "year" : "month";

        // Abonnement actif → applique le plan + quota. Sinon (canceled/unpaid)
        // on laisse la gestion à subscription.deleted.
        if (plan && (sub.status === "active" || sub.status === "trialing")) {
          const update: ProfileUpdate = {
            plan,
            stripe_subscription_id: sub.id,
            quota_minutes_total: PLAN_MINUTES[plan] * quotaMultiplier(interval),
            quota_reset_at: subPeriodEnd(sub),
          };
          if (event.type === "customer.subscription.created") {
            update.quota_minutes_used = 0;
            update.streak_anchor_date = new Date().toISOString().slice(0, 10);
          }
          await admin.from("profiles").update(update).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await profileIdByCustomer(sub.customer as string);
        if (!userId) break;
        // Retour au plan free : plus de quota mensuel, streak remis à zéro.
        // Les crédits achetés sont conservés.
        await admin
          .from("profiles")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            quota_minutes_total: 0,
            subscription_streak_months: 0,
            streak_anchor_date: null,
          })
          .eq("id", userId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // Renouvellement de cycle uniquement (pas la 1re facture de création).
        if (invoice.billing_reason !== "subscription_cycle") break;
        const userId = await profileIdByCustomer(invoice.customer as string);
        if (!userId) break;
        const periodEnd = invoice.lines?.data?.[0]?.period?.end;
        await admin
          .from("profiles")
          .update({
            quota_minutes_used: 0,
            quota_reset_at: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
          })
          .eq("id", userId);
        break;
      }

      default:
        // Événement non géré : on acquitte quand même.
        break;
    }
  } catch (e) {
    // On loggue mais on renvoie 200 pour les erreurs non critiques afin
    // d'éviter les retries en boucle ; les 500 sont réservés aux échecs durs.
    console.error("[stripe webhook]", event.type, e);
    return NextResponse.json(
      { error: "Erreur de traitement", handled: false },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
