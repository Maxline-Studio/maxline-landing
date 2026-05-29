import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Upload, Video, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Video as VideoRow } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

const RANK_NEXT_THRESHOLDS = {
  apprenti: { next: "Correcteur", threshold: 300 },
  correcteur: { next: "Éditeur en chef", threshold: 1200 },
  editeur_en_chef: { next: "Maître d'œuvre", threshold: 5000 },
  maitre_doeuvre: { next: null, threshold: null },
} as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const { data: recentVideos, count: totalVideos } = await supabase
    .from("videos")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false })
    .limit(3);

  if (!profile) return null;

  const minutesAvailable =
    Math.max(profile.quota_minutes_total - profile.quota_minutes_used, 0) +
    profile.credits_minutes;

  const rankInfo =
    RANK_NEXT_THRESHOLDS[profile.rank as keyof typeof RANK_NEXT_THRESHOLDS];

  return (
    <div className="px-6 md:px-10 py-8 md:py-12 max-w-6xl">
      {/* Salutation */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="annotation">§ Tableau de bord</span>
        </div>
        <h1 className="font-display font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-ink-900">
          Bonjour,{" "}
          <span className="font-display italic font-light text-rouge-500">
            {profile.display_name || profile.email.split("@")[0]}
          </span>
          .
        </h1>
      </div>

      {/* Grille 3 cartes : quota / atelier / nouvelle vidéo */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Quota */}
        <article className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
            Minutes disponibles
          </div>
          <div className="font-display font-extrabold text-5xl text-ink-900 tabular-nums leading-none mb-2">
            {minutesAvailable.toFixed(0)}
          </div>
          <div className="text-sm text-ink-600 mb-4">
            sur {profile.quota_minutes_total.toFixed(0)} min ce mois
            {profile.credits_minutes > 0 && (
              <span className="block">
                + {profile.credits_minutes.toFixed(0)} min de crédits
              </span>
            )}
          </div>
          <Link
            href="/app/billing"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-rouge-500 hover:gap-2 transition-all"
          >
            Gérer mon plan
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>

        {/* Atelier */}
        <article className="bg-ink-900 text-ivory-50 border-2 border-ink-900 rounded-sm p-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-rouge-400 mb-3">
            Votre rang
          </div>
          <div className="font-display italic font-light text-3xl text-ivory-50 leading-none mb-2">
            {formatRank(profile.rank)}
          </div>
          <div className="text-sm text-ink-300 mb-4">
            {profile.lifetime_minutes_used.toFixed(0)} min cumulées à vie
          </div>
          {rankInfo.next && (
            <>
              <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-rouge-500 transition-all"
                  style={{
                    width: `${Math.min((profile.lifetime_minutes_used / rankInfo.threshold!) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
                {Math.max(rankInfo.threshold! - profile.lifetime_minutes_used, 0).toFixed(0)} min avant{" "}
                <span className="text-rouge-400">{rankInfo.next}</span>
              </div>
            </>
          )}
        </article>

        {/* Nouvelle vidéo (CTA) */}
        <article className="bg-rouge-500 text-ivory-50 border-2 border-rouge-500 rounded-sm p-6 flex flex-col">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ivory-50/80 mb-3">
            Action
          </div>
          <div className="font-display font-medium text-2xl leading-tight mb-2">
            Traduire une vidéo
          </div>
          <div className="text-sm text-ivory-50/90 mb-6 flex-1">
            Glissez votre fichier MP4. Sous-titres anglais en ~10 minutes.
          </div>
          <Link
            href="/app/upload"
            className="inline-flex items-center justify-center gap-2 bg-ivory-50 text-ink-900 px-4 py-2.5 rounded-sm font-bold hover:bg-ivory-100 transition-colors"
          >
            <Upload className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Démarrer
          </Link>
        </article>
      </div>

      {/* Vidéos récentes */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display font-medium text-2xl text-ink-900">
            Vidéos récentes
          </h2>
          {totalVideos && totalVideos > 0 && (
            <Link
              href="/app/videos"
              className="text-sm font-medium text-encre-500 hover:text-rouge-500 transition-colors"
            >
              Voir tout ({totalVideos})
            </Link>
          )}
        </div>

        {!recentVideos || recentVideos.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
              <VideoCard key={video.id} video={video as VideoRow} />
            ))}
          </div>
        )}
      </section>

      {/* Petit memo bas */}
      <footer className="border-t border-ivory-200 pt-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-500 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-rouge-500" aria-hidden />
          MVP en cours de construction · merci d&apos;être ici
        </p>
      </footer>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-ivory-100 border-2 border-dashed border-ivory-300 rounded-sm p-10 md:p-14 text-center">
      <div className="inline-flex h-12 w-12 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center mb-4">
        <Video className="h-5 w-5 text-ink-900" strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="font-display font-medium text-xl text-ink-900 mb-2">
        Votre atelier est vide.
      </h3>
      <p className="text-sm text-ink-600 mb-6 max-w-md mx-auto">
        Traduisez votre première vidéo française en anglais — c&apos;est{" "}
        <span className="font-semibold">offert au lancement</span>, sans carte
        demandée.
      </p>
      <Link href="/app/upload" className="btn-pen inline-flex">
        <Upload className="h-4 w-4" aria-hidden />
        Ma première vidéo
      </Link>
    </div>
  );
}

function VideoCard({ video }: { video: VideoRow }) {
  return (
    <Link
      href={`/app/videos/${video.id}`}
      className="block bg-ivory-50 border-2 border-ink-900 rounded-sm p-5 hover:shadow-[4px_4px_0_0_rgba(26,24,20,1)] transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={video.status} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {video.duration_minutes
            ? `${video.duration_minutes.toFixed(1)} min`
            : "—"}
        </span>
      </div>
      <h4 className="font-display font-semibold text-base text-ink-900 line-clamp-2 mb-1">
        {video.original_filename}
      </h4>
      <p className="text-xs text-ink-500 font-mono tabular-nums">
        {new Date(video.uploaded_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    done: { label: "Terminé", className: "bg-rouge-500 text-ivory-50" },
    failed: { label: "Échec", className: "bg-ink-900 text-rouge-400" },
    queued: { label: "En attente", className: "bg-ivory-200 text-ink-900" },
    cancelled: { label: "Annulé", className: "bg-ivory-200 text-ink-700" },
  }[status] || {
    label: "En cours",
    className: "bg-encre-500 text-ivory-50",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function formatRank(rank: string): string {
  return (
    {
      apprenti: "Apprenti",
      correcteur: "Correcteur",
      editeur_en_chef: "Éditeur en chef",
      maitre_doeuvre: "Maître d'œuvre",
    }[rank] || rank
  );
}
