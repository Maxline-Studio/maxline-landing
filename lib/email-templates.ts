/**
 * Templates email Maxline Studio.
 *
 * Conçus avec :
 * - Inline CSS (compatibilité Gmail / Outlook / Apple Mail)
 * - Layout en table (héritage Outlook)
 * - Width 600px max (standard email)
 * - Palette Maxline (terracotta + charbon + crème)
 * - UTF-8 natif (caractères français OK)
 *
 * Toujours fournir versions HTML + texte (fallback clients sans HTML).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://maxlinestudio.fr";

// ─────────────────────────────────────────────────────────────────
//  Couleurs (synchronisées avec app/globals.css)
// ─────────────────────────────────────────────────────────────────

const COLORS = {
  primary: "#C46A45",
  primaryDark: "#A55236",
  cream: "#FAF7F1",
  creamLight: "#FBE9E1",
  charbon: "#25241F",
  charbonLight: "#4F4E48",
  border: "#EDEDEB",
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
<body style="margin:0;padding:0;background-color:${COLORS.cream};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${COLORS.charbon};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">

          <!-- HEADER -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid ${COLORS.border};">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:${COLORS.charbon};">
                    MAXLINE <span style="font-weight:300;color:${COLORS.primary};font-style:italic;">studio</span>
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
            <td style="padding:24px 32px;background-color:${COLORS.cream};border-top:1px solid ${COLORS.border};font-size:12px;color:${COLORS.charbonLight};line-height:1.6;">
              <p style="margin:0 0 8px 0;">
                Vous recevez cet email parce que vous êtes inscrit à la liste d'attente de Maxline Studio.
              </p>
              <p style="margin:0;">
                Maxline Studio &middot; <a href="${APP_URL}" style="color:${COLORS.primary};text-decoration:none;">${APP_URL.replace("https://", "")}</a> &middot; Hébergé en France &amp; UE
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
    <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:800;letter-spacing:-0.02em;color:${COLORS.charbon};line-height:1.2;">
      Bienvenue à bord 👋
    </h1>

    <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${COLORS.charbonLight};">
      Merci pour votre inscription à la liste d'attente de Maxline Studio.
    </p>

    <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${COLORS.charbonLight};">
      Vous serez parmi les <strong style="color:${COLORS.charbon};">premiers à savoir</strong> quand la bêta privée s'ouvrira — d'ici quelques semaines. Et comme vous êtes dans les premiers inscrits, vous aurez un <strong style="color:${COLORS.charbon};">accès gratuit prolongé</strong> au lancement.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;">
      <tr>
        <td style="background-color:${COLORS.primary};border-radius:8px;">
          <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:600;color:${COLORS.white};text-decoration:none;">
            Voir la landing
          </a>
        </td>
      </tr>
    </table>

    <div style="margin:24px 0;padding:20px;background-color:${COLORS.creamLight};border-radius:8px;border-left:3px solid ${COLORS.primary};">
      <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:${COLORS.charbon};">
        En attendant, suivez l'aventure :
      </p>
      <p style="margin:0;font-size:14px;line-height:1.8;color:${COLORS.charbonLight};">
        &middot; Twitter / X : <a href="https://twitter.com/maxlinestudio" style="color:${COLORS.primary};text-decoration:none;">@maxlinestudio</a><br />
        &middot; Site : <a href="${APP_URL}" style="color:${COLORS.primary};text-decoration:none;">maxlinestudio.fr</a>
      </p>
    </div>

    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:${COLORS.charbonLight};">
      Une question ? Une suggestion ? <strong style="color:${COLORS.charbon};">Répondez à cet email</strong> — je lis tout, je réponds à tout.
    </p>

    <p style="margin:24px 0 0 0;font-size:14px;color:${COLORS.charbonLight};">
      — Maxence, fondateur de Maxline Studio
    </p>
  `);

  const text = `Bienvenue à bord 👋

Merci pour votre inscription à la liste d'attente de Maxline Studio.

Vous serez parmi les premiers à savoir quand la bêta privée s'ouvrira (d'ici quelques semaines). Et comme vous êtes dans les premiers inscrits, vous aurez un accès gratuit prolongé.

En attendant, suivez l'aventure :
- Twitter / X : https://twitter.com/maxlinestudio
- Site : ${APP_URL}

Une question ? Une suggestion ? Répondez à cet email — je lis tout, je réponds à tout.

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
    <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:${COLORS.charbon};line-height:1.3;">
      🎉 Nouvel inscrit waitlist
    </h1>

    <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${COLORS.charbonLight};">
      Une nouvelle personne s'est inscrite sur Maxline Studio.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;background-color:${COLORS.creamLight};border-radius:8px;border:1px solid ${COLORS.border};">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${COLORS.charbonLight};font-weight:600;">Email</span><br />
          <a href="mailto:${params.email}" style="font-size:16px;font-weight:600;color:${COLORS.charbon};text-decoration:none;">${params.email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${COLORS.charbonLight};font-weight:600;">Source</span><br />
          <span style="font-size:15px;color:${COLORS.charbon};">${params.source}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${COLORS.charbonLight};font-weight:600;">Date</span><br />
          <span style="font-size:15px;color:${COLORS.charbon};">${date}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 20px;">
          <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:${COLORS.charbonLight};font-weight:600;">IP (hashée)</span><br />
          <span style="font-size:13px;font-family:Menlo,Consolas,monospace;color:${COLORS.charbonLight};">${params.ipHash}</span>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.charbonLight};">
      💡 Tu peux répondre à cet email pour écrire directement à <strong style="color:${COLORS.charbon};">${params.email}</strong> (replyTo pré-configuré).
    </p>
  `);

  const text = `🎉 Nouvel inscrit waitlist Maxline

Email : ${params.email}
Source : ${params.source}
Date : ${date}
IP (hashée) : ${params.ipHash}

💡 Tu peux répondre à cet email pour écrire directement à ${params.email}.`;

  return { html, text };
}
