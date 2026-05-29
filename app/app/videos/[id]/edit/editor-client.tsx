"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Plus,
  Trash2,
  ArrowDownUp,
  RotateCcw,
  Save,
  Check,
  Loader2,
  Play,
  VideoOff,
} from "lucide-react";
import type { Segment } from "@/lib/mock-worker";
import { saveTranscriptionEn, regenerateLine } from "@/lib/video-actions";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function EditorClient({
  videoId,
  filename,
  videoUrl,
  initialSegmentsEn,
  segmentsFr,
}: {
  videoId: string;
  filename: string;
  videoUrl: string | null;
  initialSegmentsEn: Segment[];
  segmentsFr: Segment[];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [segments, setSegments] = useState<Segment[]>(initialSegmentsEn);
  const [currentTime, setCurrentTime] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [videoError, setVideoError] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  const dirtyRef = useRef(false);
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  // Index du segment actif selon le temps de lecture
  const activeIndex = useMemo(() => {
    return segments.findIndex(
      (s) => currentTime >= s.start && currentTime < s.end,
    );
  }, [segments, currentTime]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("dirty");
  }, []);

  // ─── Sauvegarde ───
  const save = useCallback(async () => {
    if (!dirtyRef.current) return;
    setSaveState("saving");
    const result = await saveTranscriptionEn(videoId, segmentsRef.current);
    if (result.ok) {
      dirtyRef.current = false;
      setSaveState("saved");
      setTimeout(() => {
        if (!dirtyRef.current) setSaveState("idle");
      }, 2500);
    } else {
      setSaveState("error");
    }
  }, [videoId]);

  // Auto-save toutes les 10 secondes si modifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) save();
    }, 10000);
    return () => clearInterval(interval);
  }, [save]);

  // Sauvegarde avant de quitter la page
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

  // ─── Manipulation des segments ───
  const updateText = (idx: number, text: string) => {
    setSegments((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, text } : s)),
    );
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
    const result = await regenerateLine(videoId, idx);
    if (result.ok && result.text) {
      updateText(idx, result.text);
    }
    setRegeneratingIdx(null);
  };

  // ─── Lecture vidéo ───
  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const activeText = activeIndex >= 0 ? segments[activeIndex]?.text : "";

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="annotation">§ Éditeur</span>
          </div>
          <h1 className="font-display font-medium text-2xl md:text-3xl leading-tight tracking-[-0.015em] text-ink-900 break-words">
            {filename}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} />
          <button
            onClick={save}
            disabled={saveState === "saving" || saveState === "idle" || saveState === "saved"}
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

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Colonne gauche : lecteur (sticky) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="bg-ink-900 rounded-sm overflow-hidden border-2 border-ink-900">
            {videoUrl && !videoError ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full aspect-video bg-ink-900"
                  onTimeUpdate={(e) =>
                    setCurrentTime(e.currentTarget.currentTime)
                  }
                  onError={() => setVideoError(true)}
                />
                {/* Overlay sous-titre courant */}
                {activeText && (
                  <div className="absolute bottom-14 inset-x-0 flex justify-center px-4 pointer-events-none">
                    <span className="bg-ink-900/85 text-ivory-50 px-3 py-1.5 rounded-sm text-sm md:text-base font-medium text-center max-w-[90%]">
                      {activeText}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-ink-400 gap-3">
                <VideoOff className="h-8 w-8" strokeWidth={1.5} aria-hidden />
                <p className="text-sm font-mono uppercase tracking-widest">
                  Aperçu vidéo indisponible
                </p>
                <p className="text-xs text-ink-500 max-w-xs text-center px-4">
                  L&apos;édition des sous-titres reste pleinement fonctionnelle.
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            {segments.length} segments · cliquez une ligne pour vous y rendre
          </p>
        </div>

        {/* Colonne droite : liste éditable */}
        <div className="space-y-3">
          {segments.map((seg, idx) => (
            <SegmentRow
              key={idx}
              index={idx}
              segment={seg}
              frText={segmentsFr[idx]?.text}
              isActive={idx === activeIndex}
              isRegenerating={regeneratingIdx === idx}
              canMerge={idx < segments.length - 1}
              onSeek={() => seekTo(seg.start)}
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Ligne de segment
// ─────────────────────────────────────────────────────────────────
function SegmentRow({
  index,
  segment,
  frText,
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
      className={`rounded-sm border-2 transition-colors ${
        isActive
          ? "border-rouge-500 bg-rouge-50"
          : "border-ink-200 bg-ivory-50 hover:border-ink-400"
      }`}
    >
      <div className="p-4">
        {/* Ligne du haut : numéro + timecodes + seek */}
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

        {/* Texte EN éditable */}
        <textarea
          value={segment.text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={2}
          className="w-full bg-white border border-ink-200 rounded-sm px-3 py-2 text-ink-900 resize-y focus:outline-none focus:border-rouge-500 focus-visible:ring-2 focus-visible:ring-rouge-500/30"
          placeholder="Sous-titre anglais…"
        />

        {/* Référence FR (lecture seule) */}
        {frText && (
          <p className="mt-2 text-sm text-ink-400 italic">{frText}</p>
        )}

        {/* Actions */}
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
          <RowAction
            onClick={onDelete}
            title="Supprimer cette ligne"
            danger
          >
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

// ─────────────────────────────────────────────────────────────────
//  Input timecode mm:ss.cs
// ─────────────────────────────────────────────────────────────────
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

  // Resync si la valeur change de l'extérieur et qu'on n'édite pas
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
      setText(formatTimecode(value)); // revert si invalide
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
      className="w-20 bg-white border border-ink-200 rounded-sm px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-ink-900 text-center focus:outline-none focus:border-rouge-500"
    />
  );
}

/** secondes → "mm:ss.cs" (centisecondes) */
function formatTimecode(seconds: number): string {
  const cs = Math.round((seconds % 1) * 100);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** "mm:ss.cs" ou "ss.cs" → secondes, ou null si invalide */
function parseTimecode(str: string): number | null {
  const trimmed = str.trim();
  // mm:ss.cs
  const full = trimmed.match(/^(\d+):(\d{1,2})(?:\.(\d{1,2}))?$/);
  if (full) {
    const m = parseInt(full[1]!, 10);
    const s = parseInt(full[2]!, 10);
    const cs = full[3] ? parseInt(full[3].padEnd(2, "0"), 10) : 0;
    if (s >= 60) return null;
    return m * 60 + s + cs / 100;
  }
  // ss.cs simple
  const simple = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (simple) {
    const s = parseInt(simple[1]!, 10);
    const cs = simple[2] ? parseInt(simple[2].padEnd(2, "0"), 10) : 0;
    return s + cs / 100;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────
//  Indicateur de sauvegarde
// ─────────────────────────────────────────────────────────────────
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
