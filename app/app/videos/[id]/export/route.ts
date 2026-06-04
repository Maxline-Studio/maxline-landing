import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateSubtitles,
  exportFilename,
  SUBTITLE_MIME,
  type SubtitleFormat,
  type SubtitleSegment,
} from "@/lib/subtitles";
import { buildFcpxml } from "@/lib/fcpxml";

const FORMATS: SubtitleFormat[] = ["srt", "vtt", "txt"];
// Formats d'export montage (perk) : réservés au plan Plus (perk qui s'achète).
const PRO_FORMATS = ["fcpxml"] as const;
type ProFormat = (typeof PRO_FORMATS)[number];

/**
 * Export des sous-titres d'une vidéo terminée.
 * /app/videos/[id]/export?format=srt|vtt|txt|fcpxml
 * fcpxml = export montage (DaVinci/Premiere/FCP), réservé au plan Plus.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");
  const isStandard = !!format && (FORMATS as string[]).includes(format);
  const isPro = !!format && (PRO_FORMATS as readonly string[]).includes(format);

  if (!format || (!isStandard && !isPro)) {
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

  // Gating des formats montage (perk) : réservé au plan Plus.
  if (isPro) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    if (profile?.plan !== "plus") {
      return NextResponse.json(
        { error: "Export montage .fcpxml réservé au plan Plus." },
        { status: 403 },
      );
    }
  }

  const segments = (video.transcription_target as SubtitleSegment[] | null) ?? [];
  if (segments.length === 0) {
    return NextResponse.json(
      { error: "Aucun sous-titre disponible." },
      { status: 404 },
    );
  }

  let content: string;
  let mime: string;
  let ext: string;
  if (isPro && format === "fcpxml") {
    content = buildFcpxml(segments, {
      title:
        video.original_filename?.replace(/\.[^.]+$/, "") || "Maxline Studio",
    });
    mime = "application/xml; charset=utf-8";
    ext = "fcpxml";
  } else {
    const fmt = format as SubtitleFormat;
    content = generateSubtitles(segments, fmt);
    mime = SUBTITLE_MIME[fmt];
    ext = fmt;
  }

  const filename = exportFilename(video.original_filename, ext);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
