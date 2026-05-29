"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RefreshCw,
  AlertCircle,
  Download,
  Loader2,
} from "lucide-react";
import type { Video } from "@/lib/supabase/types";
import {
  tickVideoProcessing,
  deleteVideo,
  retryVideo,
} from "@/lib/video-actions";
import { VideoStatusBadge, stageLabel } from "@/components/app/video-status";
import { formatDuration } from "@/lib/storage";
import { MOCK_TOTAL_SECONDS, type Segment } from "@/lib/mock-worker";

const PROCESSING_STATES = [
  "queued",
  "extracting_audio",
  "transcribing",
  "translating",
  "aligning",
  "generating_subtitles",
  "burning_in",
];

export function VideoDetailClient({ initialVideo }: { initialVideo: Video }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialVideo.status);
  const [progress, setProgress] = useState(
    initialVideo.status === "done" ? 100 : 0,
  );
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isProcessing = PROCESSING_STATES.includes(status);

  // Polling de la state machine mock pendant le traitement
  const poll = useCallback(async () => {
    const result = await tickVideoProcessing(initialVideo.id);
    if (result) {
      setStatus(result.status);
      setProgress(result.progress);
      if (result.status === "done") {
        // Recharge pour afficher la transcription finale + clés sous-titres
        router.refresh();
      }
    }
  }, [initialVideo.id, router]);

  useEffect(() => {
    if (!isProcessing) return;
    // Premier tick immédiat puis toutes les 1.5s
    poll();
    const interval = setInterval(poll, 1500);
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
      setStatus("extracting_audio");
      setProgress(0);
      router.refresh();
    });
  };

  const transcriptionEn = (initialVideo.transcription_en as Segment[]) || [];
  const transcriptionFr = (initialVideo.transcription_fr as Segment[]) || [];

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
            {progress}% · estimation ~{MOCK_TOTAL_SECONDS}s (démo)
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
                {initialVideo.error_message ||
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
          <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-medium text-xl text-ink-900">
                Sous-titres anglais
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                {transcriptionEn.length} segments
              </span>
            </div>

            {/* Aperçu transcription EN avec original FR en dessous */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {transcriptionEn.map((seg, i) => (
                <div
                  key={i}
                  className="flex gap-4 pb-4 border-b border-ivory-200 last:border-0"
                >
                  <span className="font-mono text-[10px] text-ink-400 tabular-nums pt-1 w-16 flex-shrink-0">
                    {formatDuration(seg.start)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink-900 font-medium">{seg.text}</p>
                    {transcriptionFr[i] && (
                      <p className="text-sm text-ink-400 italic mt-0.5">
                        {transcriptionFr[i].text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exports (Sprint 5 pour le vrai téléchargement ; ici placeholders) */}
          <div className="bg-ivory-100 border border-ivory-200 rounded-sm p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-4">
              Exports
            </h3>
            <div className="flex flex-wrap gap-3">
              {[".srt", ".vtt", ".txt", "MP4 sous-titré"].map((fmt) => (
                <span
                  key={fmt}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border border-ink-300 rounded-sm text-sm text-ink-400"
                  title="Téléchargement disponible au Sprint 5"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  {fmt}
                </span>
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-3 font-mono">
              › téléchargements actifs au Sprint 5 · éditeur de sous-titres au Sprint 4
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
