import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateSubtitles,
  exportFilename,
  SUBTITLE_MIME,
  type SubtitleFormat,
  type SubtitleSegment,
} from "@/lib/subtitles";

const FORMATS: SubtitleFormat[] = ["srt", "vtt", "txt"];

/**
 * Export des sous-titres d'une vidéo terminée.
 * /app/videos/[id]/export?format=srt|vtt|txt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") as SubtitleFormat | null;

  if (!format || !FORMATS.includes(format)) {
    return NextResponse.json({ error: "Format non supporté." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: video } = await supabase
    .from("videos")
    .select("status, original_filename, transcription_target")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!video) {
    return NextResponse.json({ error: "Vidéo introuvable." }, { status: 404 });
  }
  if (video.status !== "done") {
    return NextResponse.json(
      { error: "La vidéo n'est pas encore prête." },
      { status: 409 },
    );
  }

  const segments = (video.transcription_target as SubtitleSegment[] | null) ?? [];
  if (segments.length === 0) {
    return NextResponse.json(
      { error: "Aucun sous-titre disponible." },
      { status: 404 },
    );
  }

  const content = generateSubtitles(segments, format);
  const filename = exportFilename(video.original_filename, format);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": SUBTITLE_MIME[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
