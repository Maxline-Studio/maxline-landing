import { NextRequest, NextResponse } from "next/server";
import {
  REF_COOKIE,
  REF_COOKIE_MAX_AGE,
  sanitizeReferralCode,
} from "@/lib/referral";

/**
 * Lien de parrainage court : /r/CODE
 * Pose le cookie de parrainage puis redirige vers l'inscription.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { origin } = new URL(request.url);

  const res = NextResponse.redirect(`${origin}/signup`);

  const clean = sanitizeReferralCode(code ?? "");
  if (clean) {
    res.cookies.set(REF_COOKIE, clean, {
      maxAge: REF_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
}
