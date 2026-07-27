import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

/**
 * Surveillance du traitement, refonte 2026-07-25.
 *
 * La version précédente prétendait couvrir « le worker est complètement down »…
 * sans pouvoir le détecter :
 *   - elle ne comptait que les états EN COURS. Or si le worker est mort, rien
 *     n'est en cours : tout stagne en 'queued' → zéro anomalie → « ok ».
 *   - son compteur d'échecs filtrait sur `processing_completed_at`, une colonne
 *     que la branche d'erreur du worker n'écrivait jamais → toujours zéro.
 *
 * Cette version regarde les trois vrais signaux :
 *   1. BACKLOG, des vidéos prêtes à traiter (storage_key_source renseigné) qui
 *      attendent depuis trop longtemps. C'est LE symptôme d'un worker à l'arrêt.
 *   2. BATTEMENT DE CŒUR, la table worker_health, écrite à chaque tick du
 *      worker. Silence prolongé = worker mort, même sans backlog.
 *   3. ANOMALIES, échecs récents (via `failed_at`), jobs sans signe de vie,
 *      incrustations bloquées.
 *
 * Protégé par CRON_SECRET. Peut être appelé aussi souvent qu'on veut (par Vercel
 * Cron une fois par jour sur le palier Hobby, et/ou par une surveillance externe
 * toutes les 10 min, cf. .github/workflows/health-check.yml).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Une vidéo prête à traiter ne devrait jamais attendre plus longtemps. */
const BACKLOG_MINUTES = 15;
/** Sans battement du worker depuis ce délai, on considère qu'il est tombé. */
const HEARTBEAT_MINUTES = 5;
/** Un job sans signe de vie depuis ce délai est anormal (le worker auto-répare avant). */
const NO_HEARTBEAT_MINUTES = 45;
/** Une incrustation qui dépasse ce délai est bloquée. */
const BURN_STUCK_MINUTES = 120;

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
  const iso = (minutesAgo: number) =>
    new Date(now - minutesAgo * 60_000).toISOString();

  const [backlogRes, heartbeatRes, staleRes, burnRes, failedRes] =
    await Promise.all([
      // 1. Vidéos prêtes à traiter, en attente depuis trop longtemps.
      admin
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("status", "queued")
        .not("storage_key_source", "is", null)
        .lt("uploaded_at", iso(BACKLOG_MINUTES)),

      // 2. Battement de cœur du worker.
      admin
        .from("worker_health")
        .select("last_seen_at, in_flight, burns_in_flight")
        .eq("id", "worker")
        .maybeSingle(),

      // 3a. Jobs sans signe de vie (le worker aurait dû les auto-réparer).
      admin
        .from("videos")
        .select("id", { count: "exact", head: true })
        .in("status", PROCESSING_STATES)
        .lt("last_heartbeat_at", iso(NO_HEARTBEAT_MINUTES)),

      // 3b. Incrustations bloquées.
      admin
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("burn_status", "burning")
        .lt("burn_requested_at", iso(BURN_STUCK_MINUTES)),

      // 3c. Échecs des dernières 24 h (via failed_at, désormais renseigné).
      admin
        .from("videos")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("failed_at", iso(24 * 60)),
    ]);

  const backlog = backlogRes.count ?? 0;
  const stuck = staleRes.count ?? 0;
  const burnStuck = burnRes.count ?? 0;
  const failed = failedRes.count ?? 0;

  const heartbeat = heartbeatRes.data;
  const lastSeenMs = heartbeat?.last_seen_at
    ? now - new Date(heartbeat.last_seen_at).getTime()
    : null;
  // `null` = la table n'a jamais été alimentée (worker pas encore redéployé) :
  // on ne crie pas au loup, le backlog reste le signal de secours.
  const workerSilent =
    lastSeenMs !== null && lastSeenMs > HEARTBEAT_MINUTES * 60_000;

  const summary = {
    backlog,
    worker_last_seen_seconds: lastSeenMs !== null ? Math.round(lastSeenMs / 1000) : null,
    worker_in_flight: heartbeat?.in_flight ?? null,
    worker_burns_in_flight: heartbeat?.burns_in_flight ?? null,
    stuck_no_heartbeat: stuck,
    burn_stuck: burnStuck,
    failed_24h: failed,
  };

  // Sévérité : un worker muet ou un backlog = panne. Le reste = à surveiller.
  const down = workerSilent || backlog > 0;
  const anomalies = (down ? 1 : 0) + stuck + burnStuck + failed;

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
        workerSilent
          ? `🚨 Le worker ne donne plus signe de vie depuis ${Math.round((lastSeenMs ?? 0) / 60_000)} min.`
          : null,
        backlog > 0
          ? `🚨 ${backlog} vidéo(s) prête(s) à traiter attendent depuis plus de ${BACKLOG_MINUTES} min, le worker tourne-t-il ?`
          : null,
        stuck > 0
          ? `⚠️ ${stuck} vidéo(s) sans signe de vie depuis > ${NO_HEARTBEAT_MINUTES} min.`
          : null,
        burnStuck > 0 ? `⚠️ ${burnStuck} incrustation(s) MP4 bloquée(s).` : null,
        failed > 0 ? `• ${failed} vidéo(s) en échec sur 24 h.` : null,
      ].filter(Boolean);

      await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: down
          ? `[Maxline] 🚨 PANNE probable du worker`
          : `[Maxline] Alerte traitement, ${anomalies} anomalie(s)`,
        text:
          `Surveillance Maxline Studio.\n\n${lines.join("\n")}\n\n` +
          `Détail : ${JSON.stringify(summary, null, 2)}\n\n` +
          `Vérifier le worker :\n` +
          `  gcloud compute ssh maxline-worker --zone us-west1-a\n` +
          `  sudo systemctl status maxline-worker\n` +
          `  journalctl -u maxline-worker -n 80 --no-pager`,
      });
      emailSent = true;
    } catch {
      /* best-effort : l'anomalie reste visible dans la réponse JSON */
    }
  }

  // 503 quand le service est réellement en panne : une surveillance externe
  // (UptimeRobot, GitHub Actions…) peut se déclencher sur le seul code HTTP.
  return NextResponse.json(
    { ok: false, alert: true, down, emailSent, ...summary },
    { status: down ? 503 : 200 },
  );
}
