import type { Metadata } from "next";
import Link from "next/link";
import { Upload, Video as VideoIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Video } from "@/lib/supabase/types";
import { VideoStatusBadge } from "@/components/app/video-status";
import { formatDuration } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Mes vidéos",
  robots: { index: false, follow: false },
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = params.filter || "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (filter === "processing") {
    query = query.not("status", "in", "(done,failed,cancelled,queued)");
  } else if (filter === "done") {
    query = query.eq("status", "done");
  } else if (filter === "failed") {
    query = query.eq("status", "failed");
  }

  const { data: videos } = await query;
  const list = (videos as Video[]) || [];

  const filters = [
    { key: "all", label: "Toutes" },
    { key: "processing", label: "En cours" },
    { key: "done", label: "Terminées" },
    { key: "failed", label: "Échecs" },
  ];

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="annotation">§ Mes vidéos</span>
          </div>
          <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900">
            Toutes vos traductions.
          </h1>
        </div>
        <Link href="/app/upload" className="btn-pen text-sm">
          <Upload className="h-4 w-4" aria-hidden />
          Nouvelle vidéo
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-ivory-200 pb-4">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/app/videos" : `/app/videos?filter=${f.key}`}
            className={`px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest transition-colors ${
              filter === f.key
                ? "bg-ink-900 text-ivory-50"
                : "bg-ivory-100 text-ink-600 hover:bg-ivory-200"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="bg-ivory-100 border-2 border-dashed border-ivory-300 rounded-sm p-12 text-center">
          <div className="inline-flex h-12 w-12 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center mb-4">
            <VideoIcon className="h-5 w-5 text-ink-900" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="font-display font-medium text-lg text-ink-900 mb-2">
            {filter === "all"
              ? "Aucune vidéo pour l'instant."
              : "Aucune vidéo dans ce filtre."}
          </p>
          {filter === "all" && (
            <Link href="/app/upload" className="link-pen text-sm">
              Traduire ma première vidéo
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((video) => (
            <li key={video.id}>
              <Link
                href={`/app/videos/${video.id}`}
                className="flex items-center gap-4 bg-ivory-50 border-2 border-ink-900 rounded-sm p-4 hover:shadow-[4px_4px_0_0_rgba(26,24,20,1)] transition-shadow"
              >
                <div className="flex-shrink-0 h-12 w-12 rounded-sm bg-ink-900 flex items-center justify-center">
                  <VideoIcon
                    className="h-5 w-5 text-rouge-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-ink-900 truncate">
                    {video.original_filename}
                  </p>
                  <p className="text-xs text-ink-500 font-mono tabular-nums mt-0.5">
                    {video.duration_minutes
                      ? formatDuration(Number(video.duration_seconds))
                      : "—"}{" "}
                    ·{" "}
                    {new Date(video.uploaded_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <VideoStatusBadge status={video.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
