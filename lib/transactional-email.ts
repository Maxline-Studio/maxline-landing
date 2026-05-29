import { Resend } from "resend";
import { accountWelcomeEmail } from "@/lib/email-templates";

/**
 * Emails transactionnels de l'application (via API Resend).
 * Indépendant du SMTP Supabase (qui ne gère que les emails d'auth).
 *
 * No-op silencieux si RESEND_API_KEY / RESEND_FROM_EMAIL ne sont pas définis
 * (ex. environnement local) — l'appelant ne doit jamais échouer à cause d'un email.
 */

/** Email de bienvenue envoyé après confirmation de l'inscription. */
export async function sendAccountWelcomeEmail(params: {
  to: string;
  referralCode?: string | null;
  name?: string | null;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return;

  const resend = new Resend(apiKey);
  const { html, text } = accountWelcomeEmail({
    referralCode: params.referralCode ?? undefined,
    name: params.name ?? undefined,
  });

  await resend.emails.send({
    from,
    to: params.to,
    replyTo: process.env.ADMIN_NOTIFY_EMAIL,
    subject: "Votre atelier Maxline Studio est ouvert",
    html,
    text,
  });
}
