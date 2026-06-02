"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RefreshCw,
  AlertCircle,
  Download,
  Loader2,
  Play,
  Plus,
  ArrowDownUp,
  RotateCcw,
  Save,
  Check,
} from "lucide-react";
import type { Video } from "@/lib/supabase/types";
import {
  getVideoStatus,
  deleteVideo,
  retryVideo,
  saveTranscriptionTarget,
  saveSubtitleStyle,
  regenerateLine,
} from "@/lib/video-actions";
import { langLabel, langShort, isTranslation } from "@/lib/langs";
import { VideoStatusBadge, stageLabel } from "@/components/app/video-status";
import {
  SubtitlePlayer,
  type SubtitlePlayerHandle,
} from "@/components/app/subtitle-player";
import { formatDuration } from "@/lib/storage";
import { STAGE_PROGRESS, type Segment } from "@/lib/mock-worker";
import {
  normalizeSubtitleStyle,
  subtitleColorHex,
  FONT_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  type SubtitleStyle,
} from "@/lib/subtitle-style";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const PROCESSING_STATES = [
  "queued",
  "extracting_audio",
  "transcribing",
  "translating",
  "aligning",
  "generating_subtitles",
  "burning_in",
];

/**
 * Espace de travail vidéo unifié : statut/pipeline, puis — une fois la vidéo
 * prête — l'aperçu (lecteur + sous-titres) ET l'édition directement sur la même
 * page (fusion détail + éditeur, un clic en moins). Sauvegarde auto.
 */
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

  // ─── Polling du statut RÉEL (mis à jour par le worker) ───
  const poll = useCallback(async () => {
    const result = await getVideoStatus(initialVideo.id);
    if (!result) return;
    setStatus(result.status);
    setProgress(
      STAGE_PROGRESS[result.status as keyof typeof STAGE_PROGRESS] ?? 0,
    );
    if (result.errorMessage) setErrorMessage(result.errorMessage);
    if (result.status === "done") router.refresh();
  }, [initialVideo.id, router]);

  useEffect(() => {
    if (!isProcessing) return;
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [isProcessing, poll]);

  // ─── Édition des sous-titres ───
  const playerRef = useRef<SubtitlePlayerHandle>(null);
  const activeRowRef = useRef<HTMLElement>(null);
  const dirtyRef = useRef(false);
  const [segments, setSegments] = useState<Segment[]>(
    (initialVideo.transcription_target as Segment[]) || [],
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const sourceLang = initialVideo.source_lang || "fr";
  const targetLang = initialVideo.target_lang || "en";
  const translationMode = isTranslation(sourceLang, targetLang);
  // Référence source (italique) uniquement en mode traduction (sinon = doublon).
  const segmentsSource = translationMode
    ? (initialVideo.transcription_source as Segment[]) || []
    : [];

  // Style des sous-titres (perso, persisté par vidéo, sauvegarde différée).
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(
    normalizeSubtitleStyle(initialVideo.subtitle_style),
  );
  const styleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateStyle = useCallback(
    (patch: Partial<SubtitleStyle>) => {
      setSubtitleStyle((prev) => {
        const next = { ...prev, ...patch };
        if (styleTimer.current) clearTimeout(styleTimer.current);
        styleTimer.current = setTimeout(() => {
          saveSubtitleStyle(initialVideo.id, next);
        }, 700);
        return next;
      });
    },
    [initialVideo.id],
  );
  useEffect(
    () => () => {
      if (styleTimer.current) clearTimeout(styleTimer.current);
    },
    [],
  );

  // Quand la transcription arrive (ex. transition live "en cours → terminé"),
  // on recharge les segments — sauf si l'utilisateur a des modifs non sauvées.
  useEffect(() => {
    if (!dirtyRef.current) {
      setSegments((initialVideo.transcription_target as Segment[]) || []);
    }
  }, [initialVideo.transcription_target]);

  const activeIndex = useMemo(
    () =>
      segments.findIndex((s) => currentTime >= s.start && currentTime < s.end),
    [segments, currentTime],
  );

  useEffect(() => {
    if (isPlaying && activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIndex, isPlaying]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("dirty");
  }, []);

  const save = useCallback(async () => {
    if (!dirtyRef.current) return;
    setSaveState("saving");
    const result = await saveTranscriptionTarget(initialVideo.id, segmentsRef.current);
    if (result.ok) {
      dirtyRef.current = false;
      setSaveState("saved");
      setTimeout(() => {
        if (!dirtyRef.current) setSaveState("idle");
      }, 2500);
    } else {
      setSaveState("error");
    }
  }, [initialVideo.id]);

  // Auto-save toutes les 10 s, et sauvegarde avant de quitter.
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) save();
    }, 10000);
    return () => clearInterval(interval);
  }, [save]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const updateText = (idx: number, text: string) => {
    setSegments((prev) => prev.map((s, i) => (i === idx ? { ...s, text } : s)));
    markDirty();
  };
  const updateTiming = (idx: number, field: "start" | "end", value: number) => {
    setSegments((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    );
    markDirty();
  };
  const addLineAfter = (idx: number) => {
    setSegments((prev) => {
      const cur = prev[idx];
      const next = prev[idx + 1];
      const newStart = cur ? cur.end : 0;
      const newEnd = next ? next.start : newStart + 2;
      const newSeg: Segment = {
        start: newStart,
        end: Math.max(newEnd, newStart + 0.5),
        text: "",
      };
      return [...prev.slice(0, idx + 1), newSeg, ...prev.slice(idx + 1)];
    });
    markDirty();
  };
  const deleteLine = (idx: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== idx));
    markDirty();
  };
  const mergeWithNext = (idx: number) => {
    setSegments((prev) => {
      const a = prev[idx];
      const b = prev[idx + 1];
      if (!a || !b) return prev;
      const merged: Segment = {
        start: a.start,
        end: b.end,
        text: `${a.text} ${b.text}`.trim(),
      };
      return [...prev.slice(0, idx), merged, ...prev.slice(idx + 2)];
    });
    markDirty();
  };
  const regenerate = async (idx: number) => {
    setRegeneratingIdx(idx);
    setErrorMessage(null);
    const result = await regenerateLine(initialVideo.id, idx);
    if (result.ok && result.text) {
      updateText(idx, result.text);
    } else if (result.error) {
      setErrorMessage(result.error);
    }
    setRegeneratingIdx(null);
  };

  // Export : on sauvegarde d'abord (si modifs), puis on télécharge la version à jour.
  const downloadExport = useCallback(
    async (fmt: "srt" | "vtt" | "txt") => {
      if (dirtyRef.current) await save();
      const a = document.createElement("a");
      a.href = `/app/videos/${initialVideo.id}/export?format=${fmt}`;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    [initialVideo.id, save],
  );

  // ─── Actions vidéo ───
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

  const activeText = activeIndex >= 0 ? segments[activeIndex]?.text : "";

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="annotation">§ Vidéo</span>
            <VideoStatusBadge status={status} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500 border border-ivory-300 rounded-sm px-2 py-1">
              {isTranslation(
                initialVideo.source_lang || "fr",
                initialVideo.target_lang || "en",
              )
                ? `${langShort(initialVideo.source_lang || "fr")} → ${langShort(initialVideo.target_lang || "en")}`
                : `${langShort(initialVideo.target_lang || "en")} · transcription`}
            </span>
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
        <div className="bg-ink-900 text-ivory-50 rounded-sm p-6 md:p-8 mb-8 max-w-3xl">
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
        <div className="bg-rouge-50 border border-rouge-200 rounded-sm p-6 mb-8 max-w-3xl">
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
                {errorMessage || "Une erreur est survenue pendant le traitement."}
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

      {/* Terminé : espace de travail pleine largeur — aperçu/style/exports à
          gauche, volet d'édition docké à droite (scroll indépendant sur PC). */}
      {status === "done" && (
        <>
          {/* Barre d'outils */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="font-display font-medium text-xl text-ink-900">
              {translationMode
                ? `Sous-titres ${langLabel(targetLang)}`
                : `Transcription ${langLabel(targetLang)}`}
            </h2>
            <div className="flex items-center gap-3">
              <SaveIndicator state={saveState} />
              <button
                onClick={save}
                disabled={
                  saveState === "saving" ||
                  saveState === "idle" ||
                  saveState === "saved"
                }
                className="btn-pen text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveState === "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                Enregistrer
              </button>
            </div>
          </div>

          {/* Deux panneaux. En dessous de lg : empilés (flux naturel, scroll page).
              À partir de lg : côte à côte, hauteur ~écran, chaque panneau défile
              indépendamment (sticky inutilisable car <main> a overflow-x-hidden). */}
          <div className="lg:flex lg:gap-6 lg:items-stretch lg:h-[calc(100dvh-12rem)]">
            {/* Gauche : aperçu + style + exports + suppression */}
            <div className="lg:flex-1 lg:min-w-0 lg:overflow-y-auto lg:pr-2 ml-scroll">
              <SubtitlePlayer
                ref={playerRef}
                videoUrl={videoUrl}
                activeText={activeText}
                subtitleStyle={subtitleStyle}
                onTimeUpdate={setCurrentTime}
                onPlayingChange={setIsPlaying}
              />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                {segments.length} sous-titres · modifiez le texte, cliquez «&nbsp;Lire&nbsp;» pour vous y rendre
              </p>

              {/* Panneau : style des sous-titres */}
              <SubtitleStylePanel style={subtitleStyle} onChange={updateStyle} />

              {/* Exports */}
              <div className="mt-4 bg-ivory-100 border border-ivory-200 rounded-sm p-6">
                <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-4">
                  Exports
                </h3>
                <div className="flex flex-wrap gap-3">
                  {(["srt", "vtt", "txt"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => downloadExport(fmt)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
                    >
                      <Download className="h-4 w-4" aria-hidden />.{fmt}
                    </button>
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
                  › les exports reprennent vos dernières modifications (enregistrées
                  automatiquement)
                </p>
              </div>

              {/* Suppression */}
              <div className="mt-6 pt-6 border-t border-ivory-200">
                <DeleteControl
                  confirmDelete={confirmDelete}
                  setConfirmDelete={setConfirmDelete}
                  onDelete={handleDelete}
                  isPending={isPending}
                />
              </div>
            </div>

            {/* Droite : volet d'édition docké, défilant */}
            <aside className="mt-6 lg:mt-0 lg:w-[460px] xl:w-[560px] lg:flex-shrink-0 lg:border-l lg:border-ivory-200 lg:pl-6 lg:overflow-y-auto ml-scroll">
              <div className="space-y-3">
                {segments.map((seg, idx) => (
                  <SegmentRow
                    key={idx}
                    index={idx}
                    segment={seg}
                    frText={segmentsSource[idx]?.text}
                    rowRef={idx === activeIndex ? activeRowRef : undefined}
                    isActive={idx === activeIndex}
                    isRegenerating={regeneratingIdx === idx}
                    canMerge={idx < segments.length - 1}
                    onSeek={() => playerRef.current?.seekTo(seg.start)}
                    onTextChange={(t) => updateText(idx, t)}
                    onTimingChange={(f, v) => updateTiming(idx, f, v)}
                    onAdd={() => addLineAfter(idx)}
                    onDelete={() => deleteLine(idx)}
                    onMerge={() => mergeWithNext(idx)}
                    onRegenerate={() => regenerate(idx)}
                  />
                ))}

                {segments.length === 0 && (
                  <div className="text-center py-12 text-ink-500">
                    <p className="mb-4">Aucun segment.</p>
                    <button
                      onClick={() => addLineAfter(-1)}
                      className="btn-outline text-sm"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                      Ajouter une ligne
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Actions (états non terminés : la suppression est dans le panneau gauche en mode terminé) */}
      {status !== "done" && (
        <div className="mt-10 pt-6 border-t border-ivory-200 max-w-3xl">
          <DeleteControl
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            onDelete={handleDelete}
            isPending={isPending}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Contrôle de suppression (réutilisé dans tous les états)
// ─────────────────────────────────────────────────────────────────
function DeleteControl({
  confirmDelete,
  setConfirmDelete,
  onDelete,
  isPending,
}: {
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  if (!confirmDelete) {
    return (
      <button
        onClick={() => setConfirmDelete(true)}
        className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rouge-600 transition-colors"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Supprimer cette vidéo
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-700">Confirmer la suppression ?</span>
      <button
        onClick={onDelete}
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
  );
}

// ─────────────────────────────────────────────────────────────────
//  Ligne de segment éditable
// ─────────────────────────────────────────────────────────────────
function SegmentRow({
  index,
  segment,
  frText,
  rowRef,
  isActive,
  isRegenerating,
  canMerge,
  onSeek,
  onTextChange,
  onTimingChange,
  onAdd,
  onDelete,
  onMerge,
  onRegenerate,
}: {
  index: number;
  segment: Segment;
  frText?: string;
  rowRef?: React.Ref<HTMLElement>;
  isActive: boolean;
  isRegenerating: boolean;
  canMerge: boolean;
  onSeek: () => void;
  onTextChange: (t: string) => void;
  onTimingChange: (field: "start" | "end", value: number) => void;
  onAdd: () => void;
  onDelete: () => void;
  onMerge: () => void;
  onRegenerate: () => void;
}) {
  return (
    <article
      ref={rowRef}
      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 210px" }}
      className={`rounded-sm border-2 transition-colors ${
        isActive
          ? "border-rouge-500 bg-rouge-50"
          : "border-ink-200 bg-ivory-50 hover:border-ink-400"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] text-ink-400 tabular-nums w-6">
            {String(index + 1).padStart(2, "0")}
          </span>
          <TimecodeInput
            value={segment.start}
            onChange={(v) => onTimingChange("start", v)}
            aria-label={`Début segment ${index + 1}`}
          />
          <span className="text-ink-300">→</span>
          <TimecodeInput
            value={segment.end}
            onChange={(v) => onTimingChange("end", v)}
            aria-label={`Fin segment ${index + 1}`}
          />
          <button
            onClick={onSeek}
            className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-encre-500 hover:text-rouge-500 transition-colors"
            title="Aller à ce moment dans la vidéo"
          >
            <Play className="h-3 w-3" aria-hidden />
            Lire
          </button>
        </div>

        <textarea
          value={segment.text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={3}
          className="ml-scroll w-full min-h-[4.75rem] bg-white border border-ink-200 rounded-sm px-3 py-2.5 text-ink-900 leading-relaxed resize-y focus:outline-none focus:border-rouge-500 focus-visible:ring-2 focus-visible:ring-rouge-500/30"
          placeholder="Sous-titre…"
        />

        {frText && <p className="mt-2 text-sm text-ink-400 italic">{frText}</p>}

        <div className="flex items-center gap-1 mt-3">
          <RowAction
            onClick={onRegenerate}
            disabled={isRegenerating}
            title="Régénérer la traduction de cette ligne"
          >
            {isRegenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            )}
            Régénérer
          </RowAction>
          <RowAction onClick={onAdd} title="Ajouter une ligne après">
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Ajouter
          </RowAction>
          {canMerge && (
            <RowAction onClick={onMerge} title="Fusionner avec la ligne suivante">
              <ArrowDownUp className="h-3.5 w-3.5" aria-hidden />
              Fusionner
            </RowAction>
          )}
          <RowAction onClick={onDelete} title="Supprimer cette ligne" danger>
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Supprimer
          </RowAction>
        </div>
      </div>
    </article>
  );
}

function RowAction({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest transition-colors disabled:opacity-50 ${
        danger
          ? "text-ink-500 hover:text-rouge-600 hover:bg-rouge-50"
          : "text-ink-500 hover:text-ink-900 hover:bg-ivory-200"
      }`}
    >
      {children}
    </button>
  );
}

function TimecodeInput({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (seconds: number) => void;
  "aria-label": string;
}) {
  const [text, setText] = useState(formatTimecode(value));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) setText(formatTimecode(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseTimecode(text);
    if (parsed !== null) {
      onChange(parsed);
      setText(formatTimecode(parsed));
    } else {
      setText(formatTimecode(value));
    }
  };

  return (
    <input
      type="text"
      value={text}
      aria-label={ariaLabel}
      onFocus={() => setEditing(true)}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="w-24 bg-white border border-ink-200 rounded-sm px-2 py-1 font-mono text-xs tabular-nums text-ink-900 text-center focus:outline-none focus:border-rouge-500"
    />
  );
}

function formatTimecode(seconds: number): string {
  const cs = Math.round((seconds % 1) * 100);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function parseTimecode(str: string): number | null {
  const trimmed = str.trim();
  const full = trimmed.match(/^(\d+):(\d{1,2})(?:\.(\d{1,2}))?$/);
  if (full) {
    const m = parseInt(full[1]!, 10);
    const s = parseInt(full[2]!, 10);
    const cs = full[3] ? parseInt(full[3].padEnd(2, "0"), 10) : 0;
    if (s >= 60) return null;
    return m * 60 + s + cs / 100;
  }
  const simple = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (simple) {
    const s = parseInt(simple[1]!, 10);
    const cs = simple[2] ? parseInt(simple[2].padEnd(2, "0"), 10) : 0;
    return s + cs / 100;
  }
  return null;
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const config: Record<
    Exclude<SaveState, "idle">,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    dirty: {
      label: "Modifications non enregistrées",
      className: "text-ink-500",
      icon: <span className="h-1.5 w-1.5 rounded-full bg-rouge-500" />,
    },
    saving: {
      label: "Enregistrement…",
      className: "text-ink-500",
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    saved: {
      label: "Enregistré",
      className: "text-success-600",
      icon: <Check className="h-3.5 w-3.5" />,
    },
    error: {
      label: "Erreur d'enregistrement",
      className: "text-rouge-600",
      icon: <span className="h-1.5 w-1.5 rounded-full bg-rouge-600" />,
    },
  };
  const c = config[state];
  return (
    <span
      className={`hidden sm:inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Panneau de style des sous-titres
// ─────────────────────────────────────────────────────────────────
const chipCls = (active: boolean) =>
  `px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
    active
      ? "border-rouge-500 bg-rouge-50 text-ink-900"
      : "border-ivory-300 text-ink-600 hover:border-ink-400"
  }`;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block font-mono text-[9px] uppercase tracking-widest text-ink-400 mb-1.5">
      {children}
    </span>
  );
}

function SubtitleStylePanel({
  style,
  onChange,
}: {
  style: SubtitleStyle;
  onChange: (patch: Partial<SubtitleStyle>) => void;
}) {
  return (
    <div className="mt-4 rounded-sm border border-ivory-200 bg-ivory-50 p-4 space-y-4">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-600">
          Style des sous-titres
        </span>
        <span className="font-mono text-[9px] text-ink-400">
          aperçu · sera gravé avec le rendu MP4
        </span>
      </div>

      {/* Police */}
      <div>
        <FieldLabel>Police</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => onChange({ font: f.id })}
              style={{ fontFamily: `var(--font-${f.id})` }}
              className={chipCls(style.font === f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 flex-wrap">
        {/* Mode */}
        <div>
          <FieldLabel>Style</FieldLabel>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ mode: "background" })}
              className={chipCls(style.mode === "background")}
            >
              Fond
            </button>
            <button
              onClick={() => onChange({ mode: "outline" })}
              className={chipCls(style.mode === "outline")}
            >
              Contour
            </button>
          </div>
        </div>

        {/* Taille */}
        <div>
          <FieldLabel>Taille</FieldLabel>
          <div className="flex gap-1.5">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => onChange({ size: s.id })}
                className={chipCls(style.size === s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Couleur */}
      <div>
        <FieldLabel>
          Couleur du {style.mode === "background" ? "fond" : "contour"}
        </FieldLabel>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange({ color: c.id })}
              title={c.label}
              aria-label={c.label}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                style.color === c.id
                  ? "border-ink-900 scale-110"
                  : "border-ivory-300 hover:scale-105"
              }`}
              style={{ backgroundColor: subtitleColorHex(c.id) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
