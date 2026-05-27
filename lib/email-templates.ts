/**
 * Templates email Maxline Studio.
 *
 * Conçus avec :
 * - Inline CSS (compatibilité Gmail / Outlook / Apple Mail)
 * - Layout en table (héritage Outlook)
 * - Width 600px max (standard email)
 * - Palette Maxline "Atelier du correcteur"
 *   (ivory + ink + rouge correcteur + encre)
 * - UTF-8 natif (caractères français OK)
 *
 * Toujours fournir versions HTML + texte (fallback clients sans HTML).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://maxlinestudio.fr";

// ─────────────────────────────────────────────────────────────────
//  Couleurs (synchronisées avec app/globals.css)
// ─────────────────────────────────────────────────────────────────

const COLORS = {
  rouge: "#C8392F",
  rougeDark: "#A12B23",
  rougeLight: "#FCE8E5",
  ivory: "#F8F4E9",
  ivoryLight: "#F0EAD8",
  ink: "#1A1814",
  inkSoft: "#5C5247",
  border: "#E5DBC1",
  white: "#FFFFFF",
};

// ─────────────────────────────────────────────────────────────────
//  Wrapper commun (layout, header, footer)
// ─────────────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Maxline Studio</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.ivory};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.ink};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${COLORS.ivory};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:4px;overflow:hidden;border:1px solid ${COLORS.border};">

          <!-- FILET ROUGE TOP (signature correcteur) -->
          <tr>
            <td style="height:4px;background-color:${COLORS.rouge};line-height:4px;font-size:0;">&nbsp;</td>
          </tr>

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid ${COLORS.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-family:Georgia,serif;font-size:22px;font-weight:900;letter-spacing:-0.02em;color:${COLORS.ink};">
                    Maxline<span style="display:inline-block;width:7px;height:7px;background-color:${COLORS.rouge};border-radius:50%;vertical-align:top;margin-left:3px;margin-top:2px;"></span>
                    <span style="font-family:'Menlo','Consolas',monospace;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.25em;color:${COLORS.inkSoft};margin-left:10px;padding-left:10px;border-left:1px solid ${COLORS.border};">studio</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 32px;background-color:${COLORS.ivoryLight};border-top:1px solid ${COLORS.border};font-size:12px;color:${COLORS.inkSoft};line-height:1.6;">
              <p style="margin:0 0 8px 0;">
                Vous recevez cet email parce que vous êtes inscrit à la liste d'attente de Maxline Studio.
              </p>
              <p style="margin:0;">
                Maxline Studio &middot; <a href="${APP_URL}" style="color:${COLORS.rouge};text-decoration:none;font-weight:600;">${APP_URL.replace("https://", "")}</a> &middot; Hébergé en France &amp; UE
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────
//  Email 1 — Bienvenue à l'utilisateur inscrit
// ─────────────────────────────────────────────────────────────────

export function welcomeEmail() {
  const html = emailWrapper(`
    <p style="margin:0 0 20px 0;font-family:'Menlo','Consolas',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${COLORS.rouge};">
      § Confirmation d'inscription
    </p>

    <h1 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:32px;font-weight:500;letter-spacing:-0.02em;color:${COLORS.ink};line-height:1.1;">
      Bienvenue à bord.
    </h1>

    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.65;color:${COLORS.inkSoft};">
      Merci pour votre inscription à la liste d'attente de Maxline Studio.
    </p>

    <p style="margin:0 0 28px 0;font-size:16px;line-height:1.65;color:${COLORS.inkSoft};">
      Vous serez parmi les <strong style="color:${COLORS.ink};">premiers prévenus</strong> quand la bêta privée s'ouvrira — d'ici quelques semaines. Et comme vous êtes dans les tout premiers inscrits, vous aurez un <strong style="color:${COLORS.ink};">accès gratuit prolongé</strong> au lancement, et le tarif d'origine à vie.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
      <tr>
        <td style="background-color:${COLORS.rouge};border-radius:3px;">
          <a href="${APP_URL}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:${COLORS.ivory};text-decoration:none;letter-spacing:0.01em;">
            Voir la landing
          </a>
        </td>
      </tr>
    </table>

    <div style="margin:28px 0;padding:20px;background-color:${COLORS.ivoryLight};border-radius:3px;border-left:3px solid ${COLORS.rouge};">
      <p style="margin:0 0 8px 0;font-family:'Menlo','Consolas',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${COLORS.rouge};">
        En attendant
      </p>
      <p style="margin:0;font-size:14px;line-height:1.8;color:${COLORS.inkSoft};">
        &middot; Le journal de construction : <a href="${APP_URL}/blog" style="color:${COLORS.rouge};text-decoration:none;font-weight:600;">${APP_URL.replace("https://", "")}/blog</a><br />
        &middot; Twitter / X : <a href="https://twitter.com/maxlinestudio" style="color:${COLORS.rouge};text-decoration:none;font-weight:600;">@maxlinestudio</a>
      </p>
    </div>

    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.65;color:${COLORS.inkSoft};">
      Une question, une suggestion, un retour ? <strong style="color:${COLORS.ink};">Répondez à cet email</strong> — je lis tout, je réponds à tout, personnellement.
    </p>

    <p style="margin:28px 0 0 0;font-family:Georgia,serif;font-style:italic;font-size:15px;color:${COLORS.ink};">
      — Maxence,<br />
      <span style="font-family:-apple-system,sans-serif;font-style:normal;font-size:13px;color:${COLORS.inkSoft};">fondateur de Maxline Studio</span>
    </p>
  `);

  const text = `Bienvenue à bord.

Merci pour votre inscription à la liste d'attente de Maxline Studio.

Vous serez parmi les premiers prévenus quand la bêta privée s'ouvrira (d'ici quelques semaines). Et comme vous êtes dans les tout premiers inscrits, vous aurez un accès gratuit prolongé au lancement, et le tarif d'origine à vie.

En attendant, suivez l'aventure :
- Le journal de construction : ${APP_URL}/blog
- Twitter / X : https://twitter.com/maxlinestudio

Une question, une suggestion, un retour ? Répondez à cet email — je lis tout, je réponds à tout, personnellement.

— Maxence, fondateur de Maxline Studio

---
Vous recevez cet email parce que vous êtes inscrit à la liste d'attente de Maxline Studio.
Maxline Studio · ${APP_URL.replace("https://", "")} · Hébergé en France & UE`;

  return { html, text };
}

// ─────────────────────────────────────────────────────────────────
//  Email 2 — Notification admin (nouvel inscrit)
// ─────────────────────────────────────────────────────────────────

export function adminNotificationEmail(params: {
  email: string;
  source: string;
  ipHash: string;
  totalCount?: number;
}) {
  const date = new Date().toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "full",
    timeStyle: "short",
  });

  const html = emailWrapper(`
    <p style="margin:0 0 16px 0;font-family:'Menlo','Consolas',monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:${COLORS.rouge};">
      § Nouvel inscrit waitlist
    </p>

    <h1 style="margin:0 0 20px 0;font-family:Georgia,serif;font-size:26px;font-weight:500;letter-spacing:-0.02em;color:${COLORS.ink};line-height:1.2;">
      Une nouvelle voix dans l'atelier.
    </h1>

    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:${COLORS.inkSoft};">
      Quelqu'un vient de s'inscrire sur Maxline Studio.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;background-color:${COLORS.ivoryLight};border-radius:3px;border:1px solid ${COLORS.border};">
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-family:'Menlo','Consolas',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${COLORS.rouge};font-weight:700;">Email</span><br />
          <a href="mailto:${params.email}" style="font-size:16px;font-weight:600;color:${COLORS.ink};text-decoration:none;">${params.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-family:'Menlo','Consolas',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${COLORS.rouge};font-weight:700;">Source</span><br />
          <span style="font-size:15px;color:${COLORS.ink};">${params.source}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-family:'Menlo','Consolas',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${COLORS.rouge};font-weight:700;">Date</span><br />
          <span style="font-size:15px;color:${COLORS.ink};">${date}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;">
          <span style="font-family:'Menlo','Consolas',monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:${COLORS.rouge};font-weight:700;">IP (hashée)</span><br />
          <span style="font-size:13px;font-family:'Menlo','Consolas',monospace;color:${COLORS.inkSoft};">${params.ipHash}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;line-height:1.65;color:${COLORS.inkSoft};">
      Tu peux répondre directement à cet email pour écrire à <strong style="color:${COLORS.ink};">${params.email}</strong> — replyTo pré-configuré.
    </p>
  `);

  const text = `§ Nouvel inscrit waitlist Maxline

Email : ${params.email}
Source : ${params.source}
Date : ${date}
IP (hashée) : ${params.ipHash}

Tu peux répondre à cet email pour écrire directement à ${params.email}.`;

  return { html, text };
}
