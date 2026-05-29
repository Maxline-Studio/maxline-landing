import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimPendingReferral } from "@/lib/referral";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * Confirmation d'email (inscription) ou de réinitialisation de password.
 * Appelé via le lien dans l'email envoyé par Supabase.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Lien de confirmation invalide.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Lien expiré ou invalide : " + error.message)}`,
    );
  }

  // Pour 'recovery' (reset password) → redirect vers page mot de passe
  // Pour 'signup' / 'email' → applique un éventuel parrainage puis dashboard
  if (type !== "recovery") {
    await claimPendingReferral();
  }
  const next =
    type === "recovery" ? "/reset-password?step=2" : "/app/dashboard";
  return NextResponse.redirect(`${origin}${next}`);
}
