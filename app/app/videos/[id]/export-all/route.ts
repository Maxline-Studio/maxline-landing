import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toSrt, toVtt } from "@/lib/subtitles";
import { buildZip, type ZipEntry } from "@/lib/zip";
import { getAllSubtitles } from "@/lib/subtitles-store";
import { langShort } from "@/lib/langs";

/**
 * Export « toutes les langues » en .zip : un .srt + un .vtt PAR langue prête
 * (timelines partagées). LA réponse portable universelle (YouTube/Vimeo/montage
 * acceptent un fichier de sous-titres par langue). Les 10 langues sont
 * pré-générées par le worker après 'done' ; on empaquette celles qui sont prêtes.
 *
 * /app/videos/[id]/export-all
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: video } = await supabase
    .from("videos")
    .select("status, original_filename")
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

  const byLang = await getAllSubtitles(supabase, id);
  const langs = Object.keys(byLang).filter((l) => byLang[l]!.length > 0);
  if (langs.length === 0) {
    return NextResponse.json(
      { error: "Aucun sous-titre disponible." },
      { status: 404 },
    );
  }

  const base =
    (video.original_filename || "sous-titres")
      .replace(/\.[^.]+$/, "")
      .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
      .trim() || "sous-titres";

  const entries: ZipEntry[] = [];
  for (const lang of langs.sort()) {
    const segs = byLang[lang]!;
    const suffix = langShort(lang);
    entries.push({ name: `${base}_${suffix}.srt`, content: toSrt(segs) });
    entries.push({ name: `${base}_${suffix}.vtt`, content: toVtt(segs) });
  }

  const zip = buildZip(entries);

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${base}-sous-titres.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
