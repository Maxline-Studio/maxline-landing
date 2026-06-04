import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimPendingReferral } from "@/lib/referral";
import { billingResumeUrl } from "@/lib/checkout-intent";
import { sendAccountWelcomeEmail } from "@/lib/transactional-email";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Confirmation d'email (inscription) ou de réinitialisation de mot de passe.
 *
 * Gère les DEUX formats de lien Supabase, pour être robuste quel que soit le
 * template d'email configuré :
 *   - token_hash + type  → template personnalisé (verifyOtp)
 *   - code (PKCE)         → template par défaut Supabase (exchangeCodeForSession)
 *   - sinon, si une session est déjà posée → on poursuit quand même.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  // 1. Établir la session selon le format reçu.
  let authed = false;
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    authed = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    authed = !error;
  } else {
    // Le verify hébergé de Supabase a peut-être déjà posé la session (cookies).
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authed = Boolean(user);
  }

  if (!authed) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Lien expiré ou invalide. Réessayez ou demandez un nouveau lien.")}`,
    );
  }

  // 2. Réinitialisation de mot de passe → page dédiée (pas de parrainage/welcome).
  const isRecovery = type === "recovery";
  if (isRecovery) {
    return NextResponse.redirect(`${origin}/reset-password?step=2`);
  }

  // 3. Inscription confirmée : applique un éventuel parrainage + email de bienvenue.
  //    (/auth/confirm n'est utilisé que pour signup/recovery ; l'OAuth passe par
  //    /auth/callback. Donc ici, non-recovery = confirmation d'inscription.)
  await claimPendingReferral();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code, display_name")
        .eq("id", user.id)
        .single();
      await sendAccountWelcomeEmail({
        to: user.email,
        referralCode: profile?.referral_code,
        name: profile?.display_name,
      });
    }
  } catch (e) {
    console.error("[auth/confirm] welcome email error (non-blocking):", e);
  }

  // Intention de paiement transportée depuis la landing → on atterrit sur le
  // paiement du plan choisi plutôt que sur le tableau de bord.
  const checkout = searchParams.get("checkout");
  const dest = checkout ? billingResumeUrl(checkout) : "/app/dashboard";
  return NextResponse.redirect(`${origin}${dest}`);
}
