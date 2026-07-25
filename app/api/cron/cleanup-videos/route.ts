import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STORAGE_BUCKET,
  videoFolder,
  burnedKey,
  previewKey,
  asrAudioKey,
} from "@/lib/storage";
import { deleteObjects } from "@/lib/r2";

/**
 * Cron de suppression RGPD : efface les vidéos (fichiers + ligne) dont la date de
 * rétention `delete_at` est dépassée. Déclenché une fois par jour (vercel.json).
 *
 * Refonte 2026-07-25 — la version séquentielle ne tenait pas dans son budget :
 * 200 vidéos × 4 allers-retours réseau enchaînés dépassaient largement les 60 s
 * de `maxDuration`, donc la purge ne finissait jamais au-delà d'une cinquantaine
 * d'expirations par jour (et la promesse de rétention n'était pas tenue).
 * Ici, les suppressions avancent par vagues de CONCURRENCY, et on s'arrête
 * proprement avant l'expiration de la fonction — le reste passe au tour suivant.
 *
 * Protégé par CRON_SECRET : Vercel envoie automatiquement l'en-tête
 * `Authorization: Bearer <CRON_SECRET>` quand la variable est définie.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Suppressions menées en parallèle. */
const CONCURRENCY = 10;
/** Marge de sécurité : on rend la main avant que la fonction ne soit coupée. */
const TIME_BUDGET_MS = 50_000;
/** Plafond par exécution (au-delà, le cron du lendemain reprend la suite). */
const BATCH = 400;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const admin = createAdminClient();

  const { data: videos, error } = await admin
    .from("videos")
    .select("id, user_id, storage_key_source, storage_key_burned, storage_key_preview")
    .lt("delete_at", new Date().toISOString())
    .not("delete_at", "is", null)
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!videos || videos.length === 0) {
    return NextResponse.json({ deleted: 0, scanned: 0, remaining: 0 });
  }

  let deleted = 0;
  let skipped = 0;
  const failures: string[] = [];

  /** Supprime UNE vidéo : objets R2, sous-titres Supabase, puis la ligne. */
  const purge = async (video: (typeof videos)[number]) => {
    try {
      // 1a. Objets R2 (source, MP4 incrusté, proxy d'aperçu). On ne demande la
      // suppression que des clés réellement connues — plus de DELETE à l'aveugle.
      await deleteObjects([
        video.storage_key_source,
        video.storage_key_burned ?? burnedKey(video.user_id, video.id),
        video.storage_key_preview ?? previewKey(video.user_id, video.id),
        asrAudioKey(video.user_id, video.id),
      ]);

      // 1b. Sous-titres (.srt/.vtt) → Supabase Storage.
      const folder = videoFolder(video.user_id, video.id);
      const { data: files } = await admin.storage
        .from(STORAGE_BUCKET)
        .list(folder);
      if (files && files.length > 0) {
        await admin.storage
          .from(STORAGE_BUCKET)
          .remove(files.map((f) => `${folder}/${f.name}`));
      }

      // 2. Supprime la ligne (video_subtitles cascade).
      const { error: delError } = await admin
        .from("videos")
        .delete()
        .eq("id", video.id);
      if (delError) failures.push(`${video.id}: ${delError.message}`);
      else deleted++;
    } catch (e) {
      failures.push(`${video.id}: ${e instanceof Error ? e.message : "inconnue"}`);
    }
  };

  // Vagues parallèles, avec garde-fou de temps.
  for (let i = 0; i < videos.length; i += CONCURRENCY) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      skipped = videos.length - i;
      break;
    }
    await Promise.all(videos.slice(i, i + CONCURRENCY).map(purge));
  }

  return NextResponse.json({
    deleted,
    scanned: videos.length,
    // Reporté au prochain passage (budget de temps atteint, ou lot plein).
    remaining: skipped + (videos.length === BATCH ? 1 : 0),
    ms: Date.now() - startedAt,
    failures: failures.length ? failures.slice(0, 20) : undefined,
  });
}
