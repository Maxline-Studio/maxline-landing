import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Capture du parrainage (Atelier).
 *
 * Le code de parrainage est stocké dans un cookie `ml_ref` posé soit par la
 * route /r/[code], soit par signUpAction quand on arrive via /signup?ref=CODE.
 * Une fois l'utilisateur authentifié (confirmation email ou callback OAuth),
 * claimPendingReferral() appelle la fonction SQL claim_referral qui pose
 * referred_by + crée la ligne referrals 'pending'. Le crédit des +30 min est
 * différé à la 1re souscription payante (process_referral_conversion, Sprint 5).
 */

export const REF_COOKIE = "ml_ref";
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

/** Normalise un code de parrainage (alphanum minuscule, borné). */
export function sanitizeReferralCode(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 32);
}

/**
 * À appeler depuis un route handler après l'établissement de la session.
 * No-op si pas de cookie, pas d'utilisateur, ou parrainage déjà posé.
 */
export async function claimPendingReferral(): Promise<void> {
  const cookieStore = await cookies();
  const code = cookieStore.get(REF_COOKIE)?.value;
  if (!code) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // claim_referral est idempotent : si referred_by est déjà posé, no-op côté SQL.
  await supabase.rpc("claim_referral", { p_code: code });

  // Quel que soit le résultat, on retire le cookie (tentative consommée).
  cookieStore.delete(REF_COOKIE);
}
