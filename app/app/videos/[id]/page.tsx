import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { presignGet } from "@/lib/r2";
import { listLanguages, getSubtitle } from "@/lib/subtitles-store";
import { isLang } from "@/lib/langs";
import {
  VIDEO_DETAIL_COLUMNS,
  type VideoDetail,
  type Segment,
} from "@/lib/video-types";
import { EditorClient } from "./editor/editor-client";

export const metadata: Metadata = {
  title: "Vidéo",
  robots: { index: false, follow: false },
};

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();

  // Colonnes explicites : on n'embarque plus les deux colonnes jsonb
  // `transcription_source` / `transcription_target` (≈ 110 Ko par langue). Les
  // sous-titres viennent de `video_subtitles`, langue par langue.
  // La lecture du profil (droit d'export montage) est indépendante → en parallèle.
  const [videoRes, profileRes] = await Promise.all([
    supabase
      .from("videos")
      .select(VIDEO_DETAIL_COLUMNS)
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
  ]);

  if (!videoRes.data) notFound();
  const v = videoRes.data as unknown as VideoDetail;

  // Accès export montage (.fcpxml) : réservé au plan Plus (perk qui s'achète).
  const canExportPro = profileRes.data?.plan === "plus";

  // ── Aperçu vidéo ────────────────────────────────────────────────────────
  // On sert le PROXY léger (MP4 H.264 480p produit par le worker) dès qu'il
  // existe : chargement quasi instantané, scrub fluide, et surtout lisible par
  // le navigateur même quand la source est un .mkv ou un .avi. Repli sur la
  // source pour les vidéos traitées avant l'arrivée du proxy.
  const previewKey = v.storage_key_preview || v.storage_key_source;
  let videoUrl: string | null = null;
  if (v.status === "done" && previewKey) {
    try {
      videoUrl = await presignGet(previewKey, 3600);
    } catch {
      videoUrl = null;
    }
  }

  // ── Sous-titres ─────────────────────────────────────────────────────────
  // On ne monte QUE la langue active. Les autres se chargent à la demande au
  // moment de la bascule (l'éditeur garde un cache client). Avant, la page
  // sérialisait les 10 langues d'un coup (jusqu'à ~1,1 Mo pour 10 min de vidéo).
  const activeLang = isLang(v.target_lang) ? v.target_lang : "en";
  const [availableLangs, activeSegments] =
    v.status === "done"
      ? await Promise.all([
          listLanguages(supabase, v.id),
          getSubtitle(supabase, v.id, activeLang),
        ])
      : [[], null];

  const initialSegments: Record<string, Segment[]> = activeSegments?.length
    ? { [activeLang]: activeSegments }
    : {};

  return (
    <EditorClient
      initialVideo={v}
      videoUrl={videoUrl}
      canExportPro={canExportPro}
      availableLangs={availableLangs}
      initialSegments={initialSegments}
    />
  );
}
