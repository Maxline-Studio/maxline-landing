import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

/**
 * Cron de surveillance (Phase B3). Scanne les anomalies de traitement et alerte
 * l'admin par email s'il y en a. Couvre le cas où le worker est complètement
 * down (le worker ne peut pas s'auto-signaler) : ici c'est Vercel qui observe
 * l'état de la base de l'extérieur.
 *
 * Détecte :
 *  - vidéos `failed` dans les dernières 24 h ;
 *  - vidéos coincées en traitement (processing_started_at très ancien) — ne
 *    devrait plus arriver grâce à l'auto-réparation worker, donc si ça apparaît
 *    ici c'est que le worker ne tourne pas ;
 *  - burns coincés en `burning`.
 *
 * Protégé par CRON_SECRET (en-tête Authorization: Bearer, posé par Vercel Cron).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Au-delà de ce délai, un job « en cours » est anormal (le worker auto-répare à
// ~20 min ; 40 min ici = le worker ne tourne probablement pas).
const STUCK_MINUTES = 40;

const PROCESSING_STATES = [
  "extracting_audio",
  "transcribing",
  "translating",
  "aligning",
  "generating_subtitles",
];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const since24h = new Date(now - 24 * 3600_000).toISOString();
  const stuckCutoff = new Date(now - STUCK_MINUTES * 60_000).toISOString();

  const [failedRes, stuckRes, burnRes] = await Promise.all([
    admin
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("processing_completed_at", since24h),
    admin
      .from("videos")
      .select("id", { count: "exact", head: true })
      .in("status", PROCESSING_STATES)
      .lt("processing_started_at", stuckCutoff),
    admin
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("burn_status", "burning")
      .lt("burn_requested_at", stuckCutoff),
  ]);

  const failed = failedRes.count ?? 0;
  const stuck = stuckRes.count ?? 0;
  const burnStuck = burnRes.count ?? 0;
  const anomalies = failed + stuck + burnStuck;

  const summary = { failed_24h: failed, stuck, burn_stuck: burnStuck };

  // Pas d'anomalie → rien à signaler.
  if (anomalies === 0) {
    return NextResponse.json({ ok: true, ...summary });
  }

  // Alerte email à l'admin (best-effort).
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  let emailSent = false;

  if (apiKey && fromEmail && adminEmail) {
    try {
      const resend = new Resend(apiKey);
      const lines = [
        stuck > 0
          ? `⚠️ ${stuck} vidéo(s) bloquée(s) en traitement depuis > ${STUCK_MINUTES} min — le worker tourne-t-il ?`
          : null,
        burnStuck > 0
          ? `⚠️ ${burnStuck} incrustation(s) MP4 bloquée(s).`
          : null,
        failed > 0 ? `• ${failed} vidéo(s) en échec sur les dernières 24 h.` : null,
      ].filter(Boolean);
      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: `[Maxline] Alerte traitement — ${anomalies} anomalie(s)`,
        text:
          `Surveillance Maxline Studio.\n\n${lines.join("\n")}\n\n` +
          `Détail : ${JSON.stringify(summary)}\n` +
          `Vérifier le worker : journalctl -u maxline-worker -f`,
      });
      emailSent = true;
    } catch {
      /* best-effort : l'anomalie reste visible dans la réponse JSON */
    }
  }

  return NextResponse.json({ ok: false, alert: true, emailSent, ...summary });
}
