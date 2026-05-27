import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";
import { Resend } from "resend";
import { welcomeEmail, adminNotificationEmail } from "@/lib/email-templates";

const subscribeSchema = z.object({
  email: z.string().email(),
  source: z.string().optional().default("landing"),
});

// Rate limiting très basique en mémoire (suffisant pour MVP landing)
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure
const RATE_LIMIT_MAX = 5; // 5 inscriptions max par IP par heure

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = ipAttempts.get(ip);

  if (!attempt || attempt.resetAt < now) {
    ipAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (attempt.count >= RATE_LIMIT_MAX) {
    return false;
  }

  attempt.count++;
  return true;
}

export async function POST(request: Request) {
  // Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Trop d'inscriptions depuis cette adresse. Reessayez plus tard." },
      { status: 429 },
    );
  }

  // Parse + validate
  let payload;
  try {
    const body = await request.json();
    payload = subscribeSchema.parse(body);
  } catch {
    return NextResponse.json(
      { error: "Donnees invalides." },
      { status: 400 },
    );
  }

  // Stockage Supabase
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("waitlist").insert({
      email: payload.email,
      source: payload.source,
      ip_hash: simpleHash(ip),
      user_agent: request.headers.get("user-agent") || "unknown",
    });

    if (error) {
      // Email deja inscrit ? On renvoie un succes (anti-enumeration)
      if (error.code === "23505") {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      console.error("[subscribe] supabase error:", error);
      throw error;
    }
  } catch (err) {
    console.error("[subscribe] DB error:", err);
    return NextResponse.json(
      { error: "Erreur serveur, reessayez dans quelques instants." },
      { status: 500 },
    );
  }

  // Envoi emails (non-bloquant : si Resend echoue, l'inscription est quand meme OK)
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;

    if (apiKey && fromEmail) {
      const resend = new Resend(apiKey);

      // Email 1 : bienvenue a l'utilisateur
      // L'expediteur est contact@maxlinestudio.fr (Resend), mais replyTo pointe vers
      // l'admin (Gmail) car la boite contact@ n'existe pas physiquement.
      const welcome = welcomeEmail();
      await resend.emails.send({
        from: fromEmail,
        to: payload.email,
        replyTo: adminEmail,
        subject: "Bienvenue dans la liste Maxline Studio 👋",
        html: welcome.html,
        text: welcome.text,
      });

      // Email 2 : notification a l'admin
      // replyTo = email de l'inscrit, ce qui permet de repondre directement.
      if (adminEmail) {
        const notif = adminNotificationEmail({
          email: payload.email,
          source: payload.source,
          ipHash: simpleHash(ip),
        });
        await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          replyTo: payload.email,
          subject: `🎉 Nouvelle inscription Maxline : ${payload.email}`,
          html: notif.html,
          text: notif.text,
        });
      }
    }
  } catch (err) {
    // Email failed, mais on a quand meme l'email en DB
    console.error("[subscribe] email error (non-blocking):", err);
  }

  return NextResponse.json({ success: true });
}

/**
 * Hash simple pour anonymiser l'IP avant stockage (RGPD).
 * Pas un vrai hash crypto, juste pour eviter de stocker l'IP en clair.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
