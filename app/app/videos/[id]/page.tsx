import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { presignGet } from "@/lib/r2";
import type { Video } from "@/lib/supabase/types";
import { listLanguages, getAllSubtitles } from "@/lib/subtitles-store";
import { VideoDetailClient } from "./video-detail-client";
import { EditorClient } from "./editor/editor-client";

export const metadata: Metadata = {
  title: "Vidéo",
  robots: { index: false, follow: false },
};

export default async function VideoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ classic?: string }>;
}) {
  const { id } = await params;
  // Filet de sécurité pendant la bascule vers l'éditeur timeline : ?classic=1
  // rend l'ANCIEN éditeur (liste verticale). À retirer après 1-2 semaines de
  // prod calme.
  const { classic } = await searchParams;
  const useClassic = classic === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!video) notFound();

  const v = video as Video;

  // Accès export montage (.fcpxml) : réservé au plan Plus (perk qui s'achète).
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const canExportPro = profile?.plan === "plus";

  // URL présignée R2 (1h) pour l'aperçu vidéo, uniquement si traitée + fichier
  // présent. La page ne charge que la vidéo de l'utilisateur → propriété garantie.
  let videoUrl: string | null = null;
  if (v.status === "done" && v.storage_key_source) {
    try {
      videoUrl = await presignGet(v.storage_key_source, 3600);
    } catch {
      videoUrl = null;
    }
  }

  // Langues déjà générées (menu) + leurs segments (bascule instantanée dans le
  // lecteur, sans aller-retour réseau). Les autres langues se chargeront en
  // polling au fur et à mesure que le worker les pré-génère.
  const [availableLangs, allSegments] =
    v.status === "done"
      ? await Promise.all([
          listLanguages(supabase, v.id),
          getAllSubtitles(supabase, v.id),
        ])
      : [[], {}];

  if (useClassic) {
    return (
      <div className="w-full">
        <Link
          href="/app/videos"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Mes vidéos
        </Link>

        <VideoDetailClient
          initialVideo={v}
          videoUrl={videoUrl}
          canExportPro={canExportPro}
          availableLangs={availableLangs}
          initialSegments={allSegments}
        />
      </div>
    );
  }

  return (
    <EditorClient
      initialVideo={v}
      videoUrl={videoUrl}
      canExportPro={canExportPro}
      availableLangs={availableLangs}
      initialSegments={allSegments}
    />
  );
}
