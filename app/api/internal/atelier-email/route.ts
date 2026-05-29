import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAtelierBonusEmail } from "@/lib/transactional-email";
import type { AtelierEmailType } from "@/lib/email-templates";
import type { Rank } from "@/lib/atelier";

/**
 * Endpoint interne appelé par la base (pg_net) lors d'un bonus ou d'une
 * promotion de rang Atelier → envoie l'email correspondant via Resend.
 *
 * Protégé par CRON_SECRET (même secret partagé que les crons internes).
 * Appelé par grant_bonus_minutes() et handle_rank_recalc() (migration 008).
 */
export const dynamic = "force-dynamic";

const VALID_TYPES: AtelierEmailType[] = [
  "rank_promotion",
  "streak_bonus",
  "anniversary",
  "referral_inviter",
  "referral_invitee",
  "gift_random",
  "compensation",
];

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    user_id?: string;
    type?: string;
    minutes?: number;
    to_rank?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { user_id, type, minutes, to_rank } = payload;
  if (!user_id || !type || !VALID_TYPES.includes(type as AtelierEmailType)) {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, display_name, email_notifications")
    .eq("id", user_id)
    .single();

  if (!profile?.email) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  // Respecte la préférence de notifications de l'utilisateur.
  if (profile.email_notifications === false) {
    return NextResponse.json({ skipped: "notifications disabled" });
  }

  try {
    await sendAtelierBonusEmail({
      to: profile.email,
      type: type as AtelierEmailType,
      minutes,
      toRank: to_rank as Rank | undefined,
      name: profile.display_name,
    });
  } catch (e) {
    console.error("[atelier-email] send error:", e);
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
