import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/storage";
import type { Video } from "@/lib/supabase/types";
import { VideoDetailClient } from "./video-detail-client";

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

  // Signed URL (1h) pour l'aperçu vidéo, uniquement si traitée + fichier présent.
  let videoUrl: string | null = null;
  if (v.status === "done" && v.storage_key_source) {
    const { data: signed } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(v.storage_key_source, 3600);
    videoUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="max-w-7xl">
      <Link
        href="/app/videos"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Mes vidéos
      </Link>

      <VideoDetailClient initialVideo={v} videoUrl={videoUrl} />
    </div>
  );
}
