import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimPendingReferral } from "@/lib/referral";

/**
 * Callback OAuth (Google, etc.) — appelé par Supabase après authentification
 * chez le provider. Échange le code contre une session puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app/dashboard";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Callback OAuth invalide.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Applique un éventuel parrainage capturé avant l'OAuth.
  await claimPendingReferral();

  return NextResponse.redirect(`${origin}${next}`);
}
