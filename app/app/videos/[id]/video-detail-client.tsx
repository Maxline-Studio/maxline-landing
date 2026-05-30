"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RefreshCw,
  AlertCircle,
  Download,
  Loader2,
  Pencil,
  Play,
} from "lucide-react";
import type { Video } from "@/lib/supabase/types";
import {
  getVideoStatus,
  deleteVideo,
  retryVideo,
} from "@/lib/video-actions";
import { VideoStatusBadge, stageLabel } from "@/components/app/video-status";
import {
  SubtitlePlayer,
  type SubtitlePlayerHandle,
} from "@/components/app/subtitle-player";
import { formatDuration } from "@/lib/storage";
import { STAGE_PROGRESS, type Segment } from "@/lib/mock-worker";

const PROCESSING_STATES = [
  "queued",
  "extracting_audio",
  "transcribing",
  "translating",
  "aligning",
  "generating_subtitles",
  "burning_in",
];

export function VideoDetailClient({
  initialVideo,
  videoUrl,
}: {
  initialVideo: Video;
  videoUrl: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialVideo.status);
  const [progress, setProgress] = useState(
    STAGE_PROGRESS[initialVideo.status as keyof typeof STAGE_PROGRESS] ?? 0,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialVideo.error_message ?? null,
  );
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isProcessing = PROCESSING_STATES.includes(status);

  // Polling du statut RÉEL (mis à jour par le worker sur la VM).
  const poll = useCallback(async () => {
    const result = await getVideoStatus(initialVideo.id);
    if (!result) return;
    setStatus(result.status);
    setProgress(
      STAGE_PROGRESS[result.status as keyof typeof STAGE_PROGRESS] ?? 0,
    );
    if (result.errorMessage) setErrorMessage(result.errorMessage);
    if (result.status === "done") {
      // Recharge pour afficher la transcription finale + clés sous-titres
      router.refresh();
    }
  }, [initialVideo.id, router]);

  useEffect(() => {
    if (!isProcessing) return;
    // Premier tick immédiat puis toutes les 2s
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [isProcessing, poll]);

  const handleDelete = () => {
    startTransition(async () => {
      await deleteVideo(initialVideo.id);
      router.push("/app/videos");
    });
  };

  const handleRetry = () => {
    startTransition(async () => {
      await retryVideo(initialVideo.id);
      setErrorMessage(null);
      setStatus("queued");
      setProgress(STAGE_PROGRESS.queued);
      router.refresh();
    });
  };

  const transcriptionEn = (initialVideo.transcription_en as Segment[]) || [];
  const transcriptionFr = (initialVideo.transcription_fr as Segment[]) || [];

  // ─── Aperçu vidéo : lecteur + déroulé synchronisé ───
  const playerRef = useRef<SubtitlePlayerHandle>(null);
  const activeRowRef = useRef<HTMLButtonElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeIndex = useMemo(
    () =>
      transcriptionEn.findIndex(
        (s) => currentTime >= s.start && currentTime < s.end,
      ),
    [transcriptionEn, currentTime],
  );

  // Auto-défilement : centre la ligne active quand la vidéo joue (sans gêner
  // le défilement manuel de l'utilisateur quand elle est en pause).
  useEffect(() => {
    if (isPlaying && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    // (le conteneur de liste a son propre overflow → ne scrolle que lui)
  }, [activeIndex, isPlaying]);

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="annotation">§ Vidéo</span>
            <VideoStatusBadge status={status} />
          </div>
          <h1 className="font-display font-medium text-2xl md:text-3xl leading-tight tracking-[-0.015em] text-ink-900 break-words">
            {initialVideo.original_filename}
          </h1>
          <p className="text-xs text-ink-500 font-mono tabular-nums mt-2">
            {initialVideo.duration_seconds
              ? formatDuration(Number(initialVideo.duration_seconds))
              : "—"}{" "}
            ·{" "}
            {new Date(initialVideo.uploaded_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* État du pipeline */}
      {isProcessing && (
        <div className="bg-ink-900 text-ivory-50 rounded-sm p-6 md:p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="h-5 w-5 text-rouge-400 animate-spin" aria-hidden />
            <span className="font-display font-medium text-lg">
              {stageLabel(status)}…
            </span>
          </div>
          <div className="h-2 bg-ink-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-rouge-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
            {progress}% · traitement en cours
          </p>
        </div>
      )}

      {/* Échec */}
      {status === "failed" && (
        <div className="bg-rouge-50 border border-rouge-200 rounded-sm p-6 mb-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle
              className="h-5 w-5 text-rouge-600 flex-shrink-0 mt-0.5"
              aria-hidden
            />
            <div>
              <h2 className="font-display font-semibold text-ink-900 mb-1">
                Le traitement a échoué
              </h2>
              <p className="text-sm text-ink-700">
                {errorMessage ||
                  "Une erreur est survenue pendant le traitement."}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={isPending}
            className="btn-pen text-sm disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Réessayer (gratuit)
          </button>
        </div>
      )}

      {/* Terminé : aperçu transcription + exports */}
      {status === "done" && (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display font-medium text-xl text-ink-900">
                Sous-titres anglais
              </h2>
              <Link
                href={`/app/videos/${initialVideo.id}/edit`}
                className="btn-pen text-sm shrink-0"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Éditer
              </Link>
            </div>

            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
              {/* Lecteur : reste visible (le déroulé défile dans son propre cadre) */}
              <div>
                <SubtitlePlayer
                  ref={playerRef}
                  videoUrl={videoUrl}
                  activeText={
                    activeIndex >= 0 ? transcriptionEn[activeIndex]?.text : ""
                  }
                  onTimeUpdate={setCurrentTime}
                  onPlayingChange={setIsPlaying}
                />
                <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  {transcriptionEn.length} sous-titres · cliquez une ligne pour
                  vous y rendre
                </p>
              </div>

              {/* Déroulé synchronisé (lecture seule), dans son propre cadre défilant */}
              <div className="max-h-[70vh] overflow-y-auto rounded-sm border border-ivory-200 bg-ivory-50 divide-y divide-ivory-200">
                {transcriptionEn.map((seg, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={i}
                      ref={isActive ? activeRowRef : undefined}
                      onClick={() => playerRef.current?.seekTo(seg.start)}
                      style={{
                        contentVisibility: "auto",
                        containIntrinsicSize: "auto 76px",
                      }}
                      className={`group w-full text-left flex gap-3 px-4 py-3 transition-colors ${
                        isActive ? "bg-rouge-50" : "hover:bg-ivory-100"
                      }`}
                    >
                      <span
                        className={`font-mono text-[10px] tabular-nums pt-0.5 w-14 flex-shrink-0 inline-flex items-center gap-1 ${
                          isActive ? "text-rouge-600" : "text-ink-400"
                        }`}
                      >
                        {isActive && <Play className="h-3 w-3" aria-hidden />}
                        {formatDuration(seg.start)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-ink-900 font-medium whitespace-pre-line">
                          {seg.text}
                        </span>
                        {transcriptionFr[i] && (
                          <span className="block text-sm text-ink-400 italic mt-0.5 whitespace-pre-line">
                            {transcriptionFr[i].text}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Exports */}
          <div className="bg-ivory-100 border border-ivory-200 rounded-sm p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-4">
              Exports
            </h3>
            <div className="flex flex-wrap gap-3">
              {(["srt", "vtt", "txt"] as const).map((fmt) => (
                <a
                  key={fmt}
                  href={`/app/videos/${initialVideo.id}/export?format=${fmt}`}
                  download
                  className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden />.{fmt}
                </a>
              ))}
              <span
                className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border border-ink-300 rounded-sm text-sm text-ink-400"
                title="Disponible avec le rendu vidéo (à venir)"
              >
                <Download className="h-4 w-4" aria-hidden />
                MP4 sous-titré
              </span>
            </div>
            <p className="text-xs text-ink-500 mt-3 font-mono">
              › .srt / .vtt / .txt prêts · MP4 incrusté à l&apos;arrivée du rendu vidéo
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="mt-10 pt-6 border-t border-ivory-200">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rouge-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Supprimer cette vidéo
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-700">Confirmer la suppression ?</span>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rouge-500 text-ivory-50 rounded-sm text-sm font-semibold hover:bg-rouge-600 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
              Oui, supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm text-ink-500 hover:text-ink-900"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
