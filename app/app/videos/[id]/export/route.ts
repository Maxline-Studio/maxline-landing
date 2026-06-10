import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateSubtitles,
  SUBTITLE_MIME,
  type SubtitleFormat,
  type SubtitleSegment,
} from "@/lib/subtitles";
import { buildFcpxml } from "@/lib/fcpxml";
import { isLang, langShort } from "@/lib/langs";
import { getSubtitle } from "@/lib/subtitles-store";
import { generateLanguage } from "@/lib/video-actions";

const FORMATS: SubtitleFormat[] = ["srt", "vtt", "txt"];
// Formats d'export montage (perk) : réservés au plan Plus (perk qui s'achète).
const PRO_FORMATS = ["fcpxml"] as const;

/**
 * Export des sous-titres d'une vidéo terminée, PAR LANGUE.
 * /app/videos/[id]/export?format=srt|vtt|txt|fcpxml&lang=es
 * - lang absent → langue actuellement affichée (videos.target_lang).
 * - langue pas encore générée → générée à la volée (gratuit) puis exportée.
 * fcpxml = export montage (DaVinci/Premiere/FCP), réservé au plan Plus.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");
  const langParam = request.nextUrl.searchParams.get("lang");
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
    .select("status, original_filename, transcription_target, target_lang")
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

  // Langue cible : paramètre validé, sinon langue affichée.
  const lang = isLang(langParam)
    ? langParam
    : isLang(video.target_lang)
      ? video.target_lang
      : "en";

  // Source de vérité = video_subtitles[lang]. Si la langue n'est pas encore
  // générée, on la génère à la volée (gratuit) puis on exporte. Repli legacy.
  let segments = await getSubtitle(supabase, id, lang);
  if (!segments || segments.length === 0) {
    const gen = await generateLanguage(id, lang);
    if (gen.ok && gen.segments) {
      segments = gen.segments;
    } else {
      segments = (video.transcription_target as SubtitleSegment[] | null) ?? [];
    }
  }
  if (!segments || segments.length === 0) {
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

  const filename = langExportFilename(video.original_filename, lang, ext);

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Nom de fichier d'export avec suffixe de langue : « base_ES.srt ». */
function langExportFilename(
  originalFilename: string,
  lang: string,
  ext: string,
): string {
  const base = (originalFilename || "sous-titres").replace(/\.[^.]+$/, "");
  const safe = base.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "sous-titres";
  return `${safe}_${langShort(lang)}.${ext}`;
}
