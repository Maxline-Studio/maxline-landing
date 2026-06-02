import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { BillingActions } from "./billing-client";

export const metadata: Metadata = {
  title: "Facturation",
  robots: { index: false, follow: false },
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuit (essai)",
  starter: "Starter",
  plus: "Plus",
  credits: "Crédits",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;

  const available =
    Math.max(profile.quota_minutes_total - profile.quota_minutes_used, 0) +
    profile.credits_minutes;

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-7xl">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="annotation">§ Facturation</span>
        </div>
        <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900">
          Votre plan et vos crédits.
        </h1>
      </div>

      {status === "success" && (
        <div
          role="status"
          className="mb-8 flex items-start gap-3 p-4 bg-success-500/10 border border-success-500/40 rounded-sm"
        >
          <CheckCircle2 className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" aria-hidden />
          <p className="text-sm text-ink-700">
            Paiement confirmé. Votre compte est mis à jour en quelques secondes —
            actualisez si besoin.
          </p>
        </div>
      )}
      {status === "cancel" && (
        <div className="mb-8 p-4 bg-ivory-100 border border-ivory-300 rounded-sm text-sm text-ink-600">
          Paiement annulé. Aucun montant n&apos;a été débité.
        </div>
      )}

      {/* État actuel */}
      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <article className="bg-ink-900 text-ivory-50 border-2 border-ink-900 rounded-sm p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-rouge-400 mb-3">
            Plan actuel
          </div>
          <div className="font-display italic font-light text-3xl text-ivory-50">
            {PLAN_LABELS[profile.plan] || profile.plan}
          </div>
        </article>
        <article className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
            Minutes disponibles
          </div>
          <div className="font-display font-extrabold text-4xl text-ink-900 tabular-nums leading-none">
            {available.toFixed(0)}
          </div>
        </article>
        <article className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
            Crédits (sans expiration)
          </div>
          <div className="font-display font-extrabold text-4xl text-ink-900 tabular-nums leading-none">
            {profile.credits_minutes.toFixed(0)}
          </div>
        </article>
      </div>

      <BillingActions
        currentPlan={profile.plan}
        hasCustomer={Boolean(profile.stripe_customer_id)}
        isSubscribed={
          Boolean(profile.stripe_subscription_id) &&
          (profile.plan === "starter" || profile.plan === "plus")
        }
      />
    </div>
  );
}
