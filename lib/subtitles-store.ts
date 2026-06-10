// Accès partagé à la table `video_subtitles` (sous-titres PAR LANGUE).
// Source unique de vérité du multilingue : la page détail, l'éditeur, les exports
// et la génération à la demande lisent/écrivent ici. Le worker écrit la langue
// source + la langue principale à l'upload ; les langues additionnelles sont
// générées côté app (generateLanguage).
//
// Toutes les fonctions reçoivent un client Supabase déjà authentifié (RLS :
// l'utilisateur ne voit que les sous-titres de ses propres vidéos).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { Segment } from "@/lib/video-types";
import { isLang, type Lang } from "@/lib/langs";

type Client = SupabaseClient<Database>;

export type SubtitleLang = {
  lang: Lang;
  status: "ready" | "generating" | "failed";
  userEdited: boolean;
};

/** Segments d'une langue donnée (null si absente / non générée). */
export async function getSubtitle(
  supabase: Client,
  videoId: string,
  lang: string,
): Promise<Segment[] | null> {
  const { data } = await supabase
    .from("video_subtitles")
    .select("segments")
    .eq("video_id", videoId)
    .eq("lang", lang)
    .maybeSingle();
  if (!data) return null;
  return (data.segments as Segment[]) ?? null;
}

/** Langues présentes pour une vidéo (pour cocher le menu de l'éditeur). */
export async function listLanguages(
  supabase: Client,
  videoId: string,
): Promise<SubtitleLang[]> {
  const { data } = await supabase
    .from("video_subtitles")
    .select("lang, status, user_edited")
    .eq("video_id", videoId);
  if (!data) return [];
  return data
    .filter((r) => isLang(r.lang))
    .map((r) => ({
      lang: r.lang as Lang,
      status: (r.status as SubtitleLang["status"]) ?? "ready",
      userEdited: !!r.user_edited,
    }));
}

/** Insère/met à jour les sous-titres d'une langue (cache après génération/édition). */
export async function upsertSubtitle(
  supabase: Client,
  videoId: string,
  lang: string,
  segments: Segment[],
  opts?: { userEdited?: boolean; status?: SubtitleLang["status"] },
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("video_subtitles").upsert(
    {
      video_id: videoId,
      lang,
      segments: segments as unknown as Database["public"]["Tables"]["video_subtitles"]["Insert"]["segments"],
      status: opts?.status ?? "ready",
      user_edited: opts?.userEdited ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "video_id,lang" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
