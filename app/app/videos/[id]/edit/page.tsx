import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET } from "@/lib/storage";
import type { Video } from "@/lib/supabase/types";
import type { Segment } from "@/lib/mock-worker";
import { EditorClient } from "./editor-client";

export const metadata: Metadata = {
  title: "Éditeur de sous-titres",
  robots: { index: false, follow: false },
};

export default async function EditPage({
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

  // L'éditeur n'a de sens que sur une vidéo traitée
  if (v.status !== "done") {
    redirect(`/app/videos/${id}`);
  }

  // Signed URL pour lire la vidéo source (1h). Peut être null si le fichier
  // n'existe pas encore (ex: vidéo de démo insérée sans fichier réel).
  let videoUrl: string | null = null;
  if (v.storage_key_source) {
    const { data: signed } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(v.storage_key_source, 3600);
    videoUrl = signed?.signedUrl ?? null;
  }

  const segmentsEn = (v.transcription_en as Segment[]) || [];
  const segmentsFr = (v.transcription_fr as Segment[]) || [];

  return (
    <div>
      <Link
        href={`/app/videos/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Retour à la vidéo
      </Link>

      <EditorClient
        videoId={v.id}
        filename={v.original_filename}
        videoUrl={videoUrl}
        initialSegmentsEn={segmentsEn}
        segmentsFr={segmentsFr}
      />
    </div>
  );
}
