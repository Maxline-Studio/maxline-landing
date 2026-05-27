import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";
import { Resend } from "resend";

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
      { error: "Trop d'inscriptions depuis cette adresse. Réessayez plus tard." },
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
      { error: "Données invalides." },
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
      // Email déjà inscrit ? On renvoie un succès (anti-énumération)
      if (error.code === "23505") {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      console.error("[subscribe] supabase error:", error);
      throw error;
    }
  } catch (err) {
    console.error("[subscribe] DB error:", err);
    return NextResponse.json(
      { error: "Erreur serveur, réessayez dans quelques instants." },
      { status: 500 },
    );
  }

  // Envoi email de confirmation (optionnel — n'empêche pas le succès si Resend est down)
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (apiKey && fromEmail) {
      const resend = new Resend(apiKey);

      // Email à l'utilisateur
      await resend.emails.send({
        from: fromEmail,
        to: payload.email,
        subject: "Bienvenue dans la liste Maxline Studio 👋",
        text: `Bonjour,

Merci pour votre inscription à la liste de Maxline Studio.

Vous serez parmi les premiers à savoir quand la bêta privée s'ouvrira (d'ici quelques semaines). Et comme vous êtes dans les premiers inscrits, vous aurez un accès gratuit prolongé.

En attendant, n'hésitez pas à me suivre :
- Twitter : https://twitter.com/maxlinestudio
- Site : https://maxlinestudio.fr

Si vous avez des questions ou des suggestions, répondez à cet email — je lis tout, je réponds à tout.

— Maxence, fondateur de Maxline Studio
`,
      });

      // Notification à l'admin
      const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
      if (adminEmail) {
        await resend.emails.send({
          from: fromEmail,
          to: adminEmail,
          subject: `🎉 Nouvelle inscription waitlist Maxline : ${payload.email}`,
          text: `Nouvelle inscription :

Email : ${payload.email}
Source : ${payload.source}
Date : ${new Date().toISOString()}
IP hash : ${simpleHash(ip)}
`,
        });
      }
    }
  } catch (err) {
    // Email failed, mais on a quand même l'email en DB
    console.error("[subscribe] email error (non-blocking):", err);
  }

  return NextResponse.json({ success: true });
}

/**
 * Hash simple pour anonymiser l'IP avant stockage (RGPD).
 * Pas un vrai hash crypto, juste pour éviter de stocker l'IP en clair.
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
