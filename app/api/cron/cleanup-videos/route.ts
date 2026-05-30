import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET, videoFolder, burnedKey } from "@/lib/storage";
import { deleteObjects } from "@/lib/r2";

/**
 * Cron de suppression RGPD : efface les vidéos (fichiers + ligne) dont la
 * date de rétention `delete_at` est dépassée. Déclenché par Vercel Cron
 * (cf. vercel.json) une fois par jour.
 *
 * Protégé par CRON_SECRET : Vercel envoie automatiquement l'en-tête
 * `Authorization: Bearer <CRON_SECRET>` aux requêtes de cron quand la variable
 * est définie. Toute requête sans ce secret est rejetée.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Vidéos arrivées à expiration (par lots pour rester dans le temps imparti).
  const { data: videos, error } = await admin
    .from("videos")
    .select("id, user_id, storage_key_source")
    .lt("delete_at", new Date().toISOString())
    .not("delete_at", "is", null)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!videos || videos.length === 0) {
    return NextResponse.json({ deleted: 0, scanned: 0 });
  }

  let deleted = 0;
  const failures: string[] = [];

  for (const video of videos) {
    try {
      // 1a. Vidéo source + MP4 incrusté → Cloudflare R2.
      await deleteObjects([
        video.storage_key_source ?? null,
        burnedKey(video.user_id, video.id),
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

      // 2. Supprime la ligne (les tables liées cascade au besoin).
      const { error: delError } = await admin
        .from("videos")
        .delete()
        .eq("id", video.id);
      if (delError) {
        failures.push(`${video.id}: ${delError.message}`);
      } else {
        deleted++;
      }
    } catch (e) {
      failures.push(`${video.id}: ${e instanceof Error ? e.message : "inconnue"}`);
    }
  }

  return NextResponse.json({
    deleted,
    scanned: videos.length,
    failures: failures.length ? failures : undefined,
  });
}
