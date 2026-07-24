"use client";

/**
 * Éditeur de sous-titres v2 — timeline horizontale, MOBILE-FIRST.
 *
 * Layout (3 paliers) :
 *  - mobile <lg : aperçu compact / timeline / barre d'actions ; l'inspecteur
 *    est une feuille du bas.
 *  - desktop lg+ : aperçu + inspecteur docké à droite, timeline pleine
 *    largeur en bas, raccourcis clavier.
 *
 * TOUTE la plomberie données vient de l'ancien éditeur (éprouvée en prod) :
 * cache multi-langues `segmentsByLang`, sauvegarde SYNCHRONE via
 * `segmentsRef` (les exports lisent toujours la dernière édition), polling
 * statut/langues/burn. Ne pas « simplifier » ces mécanismes.
 * L'ancien éditeur reste accessible via ?classic=1 (filet de sécurité).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  Loader2,
  Magnet,
  Minus,
  Plus,
  RefreshCw,
  Redo2,
  Undo2,
  Check,
  Save,
} from "lucide-react";
import type { Video } from "@/lib/supabase/types";
import {
  getVideoStatus,
  deleteVideo,
  retryVideo,
  saveTranscriptionTarget,
  saveSubtitleStyle,
  regenerateLine,
  setSubtitleLanguage,
  loadSubtitles,
  requestBurn,
  getBurnStatus,
  getBurnedUrl,
  type BurnStatus,
} from "@/lib/video-actions";
import type { SubtitleLang } from "@/lib/subtitles-store";
import {
  langLabel,
  langShort,
  isTranslation,
  isLang,
  isRtl,
  LANG_OPTIONS,
  type Lang,
} from "@/lib/langs";
import { VideoStatusBadge, stageLabel } from "@/components/app/video-status";
import { countSpeakers } from "@/lib/speakers";
import {
  SubtitlePlayer,
  type SubtitlePlayerHandle,
} from "@/components/app/subtitle-player";
import { formatDuration, isAudioExtension, fileExtension } from "@/lib/storage";
import { STAGE_PROGRESS, type Segment } from "@/lib/video-types";
import {
  normalizeSubtitleStyle,
  type SubtitleStyle,
} from "@/lib/subtitle-style";
import { prorateWordTimings } from "@/lib/karaoke";
import {
  withIds,
  stripIds,
  nextCueId,
  MIN_CUE_DURATION,
  formatClock,
  type Cue,
} from "./types";
import { useHistory } from "./use-history";
import { Timeline } from "./timeline";
import { Inspector, type InspectorTab } from "./inspector";
import { ActionBar, type ActionBarAction } from "./action-bar";

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

export function EditorClient({
  initialVideo,
  videoUrl,
  canExportPro,
  availableLangs,
  initialSegments,
}: {
  initialVideo: Video;
  videoUrl: string | null;
  canExportPro: boolean;
  availableLangs: SubtitleLang[];
  initialSegments: Record<string, Segment[]>;
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

  const isProcessing = PROCESSING_STATES.includes(status);

  // ─── Polling du statut (worker) ───
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

  // ─── Lecture / temps ───
  const playerRef = useRef<SubtitlePlayerHandle>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // ─── Sauvegarde ───
  const dirtyRef = useRef(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [burnStatus, setBurnStatus] = useState<BurnStatus>(
    (initialVideo.burn_status as BurnStatus) || "idle",
  );
  const [burnProgress, setBurnProgress] = useState(0);

  const isAudio = isAudioExtension(fileExtension(initialVideo.original_filename));
  const sourceLang = initialVideo.source_lang || "fr";
  const [targetLang, setTargetLang] = useState<Lang>(
    isLang(initialVideo.target_lang) ? initialVideo.target_lang : "en",
  );

  // ─── Cache des sous-titres par langue (bascule instantanée) ───
  const [segmentsByLang, setSegmentsByLang] = useState<Record<string, Cue[]>>(
    () => {
      const init: Record<string, Cue[]> = {};
      for (const [lang, segs] of Object.entries(initialSegments)) {
        init[lang] = withIds(segs);
      }
      // Repli legacy UNIQUEMENT si contenu (jamais de tableau vide : il
      // écraserait la vraie langue à l'arrivée des données).
      const tl = isLang(initialVideo.target_lang) ? initialVideo.target_lang : "en";
      const tt = initialVideo.transcription_target as Segment[] | null;
      if (!init[tl] && Array.isArray(tt) && tt.length > 0) init[tl] = withIds(tt);
      return init;
    },
  );
  const segments = useMemo(
    () => segmentsByLang[targetLang] ?? [],
    [segmentsByLang, targetLang],
  );
  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [readyLangs, setReadyLangs] = useState<Set<Lang>>(() => {
    const s = new Set<Lang>(availableLangs.map((l) => l.lang));
    for (const l of Object.keys(initialSegments)) if (isLang(l)) s.add(l);
    if (isLang(initialVideo.target_lang)) s.add(initialVideo.target_lang);
    return s;
  });
  const translationMode = isTranslation(sourceLang, targetLang);
  const targetRtl = isRtl(targetLang);
  const sourceRtl = isRtl(sourceLang);
  const segmentsSource = useMemo<Segment[]>(
    () =>
      translationMode
        ? segmentsByLang[sourceLang] ??
          (initialVideo.transcription_source as Segment[]) ??
          []
        : [],
    [translationMode, segmentsByLang, sourceLang, initialVideo.transcription_source],
  );

  // ─── Style ───
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

  // ─── Fusion serveur → cache local (ne JAMAIS écraser une langue éditée) ───
  const mergeServer = useCallback((srv: Record<string, Segment[]>) => {
    setSegmentsByLang((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const [lang, segs] of Object.entries(srv)) {
        const cur = next[lang];
        if ((!cur || cur.length === 0) && segs.length > 0) {
          next[lang] = withIds(segs);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const didAlignRef = useRef(false);
  useEffect(() => {
    if (status !== "done") return;
    if (!didAlignRef.current) {
      didAlignRef.current = true;
      if (isLang(initialVideo.target_lang) && initialVideo.target_lang !== targetLang) {
        setTargetLang(initialVideo.target_lang);
      }
    }
    mergeServer(initialSegments);
    const tl = isLang(initialVideo.target_lang) ? initialVideo.target_lang : "en";
    const legacy = initialVideo.transcription_target as Segment[] | null;
    if (Array.isArray(legacy) && legacy.length > 0) mergeServer({ [tl]: legacy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, initialSegments, initialVideo.transcription_target]);

  const pollAttemptsRef = useRef(0);
  useEffect(() => {
    if (status !== "done") return;
    if (readyLangs.size >= 10) return;
    if (pollAttemptsRef.current >= 30) return;
    let stop = false;
    const tick = async () => {
      pollAttemptsRef.current += 1;
      const res = await loadSubtitles(initialVideo.id);
      if (stop || !res.ok) return;
      if (res.segments) mergeServer(res.segments);
      if (res.langs) {
        const ready = res.langs;
        setReadyLangs((prev) => {
          const n = new Set(prev);
          for (const l of ready) if (l.status === "ready") n.add(l.lang);
          return n;
        });
      }
    };
    tick();
    const interval = setInterval(tick, 4000);
    return () => {
      stop = true;
      clearInterval(interval);
    };
  }, [status, readyLangs.size, initialVideo.id, mergeServer]);

  // ─── Édition (mutations + dirty + historique) ───
  const history = useHistory();

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setSaveState("dirty");
    // Un MP4 gravé devient périmé dès la 1re édition → invalidé.
    setBurnStatus((b) => (b === "done" ? "idle" : b));
  }, []);

  const applyEdit = useCallback(
    (fn: (prev: Cue[]) => Cue[]) => {
      const next = fn(segmentsRef.current);
      segmentsRef.current = next;
      setSegmentsByLang((prev) => ({ ...prev, [targetLang]: next }));
      markDirty();
    },
    [targetLang, markDirty],
  );

  const save = useCallback(async () => {
    if (!dirtyRef.current) return;
    setSaveState("saving");
    const result = await saveTranscriptionTarget(
      initialVideo.id,
      stripIds(segmentsRef.current),
    );
    if (result.ok) {
      dirtyRef.current = false;
      setLastSavedAt(Date.now());
      setSaveState("saved");
      setTimeout(() => {
        if (!dirtyRef.current) setSaveState("idle");
      }, 2500);
    } else {
      setSaveState("error");
    }
  }, [initialVideo.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current) save();
    }, 10000);
    return () => clearInterval(interval);
  }, [save]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const t = setTimeout(() => {
      if (dirtyRef.current) save();
    }, 1200);
    return () => clearTimeout(t);
  }, [saveState, save]);

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

  // ─── Sélection / UI éditeur ───
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<InspectorTab>("selection");
  const [pxPerSec, setPxPerSec] = useState(40);
  const [snap, setSnap] = useState(true);
  const [follow, setFollow] = useState(true);
  const zoomInitRef = useRef(false);

  const duration = useMemo(() => {
    const d = Number(initialVideo.duration_seconds);
    if (Number.isFinite(d) && d > 0) return d;
    const last = segments[segments.length - 1];
    return last ? last.end + 1 : 60;
  }, [initialVideo.duration_seconds, segments]);

  // Garde la sélection dans les bornes quand la liste change.
  useEffect(() => {
    if (selectedIdx >= segments.length) {
      setSelectedIdx(Math.max(0, segments.length - 1));
    }
  }, [segments.length, selectedIdx]);

  const isDesktop = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches;

  const openSheet = useCallback((t: InspectorTab) => {
    setTab(t);
    if (!isDesktop()) setSheetOpen(true);
  }, []);

  const activeIndex = useMemo(
    () =>
      segments.findIndex((s) => currentTime >= s.start && currentTime < s.end),
    [segments, currentTime],
  );

  // ─── Opérations d'édition ───
  const commitHistory = useCallback(() => {
    history.commit(segmentsRef.current);
  }, [history]);

  // Snapshot pris au focus du textarea ; commité au 1er caractère tapé
  // (une entrée d'historique par « session » de frappe, pas par lettre).
  const textSnapshotRef = useRef<Cue[] | null>(null);
  const onTextFocus = useCallback(() => {
    textSnapshotRef.current = segmentsRef.current.map((c) => ({ ...c }));
  }, []);
  const updateText = useCallback(
    (idx: number, text: string) => {
      if (textSnapshotRef.current) {
        history.commit(textSnapshotRef.current);
        textSnapshotRef.current = null;
      }
      applyEdit((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, text } : s)),
      );
    },
    [applyEdit, history],
  );

  const clampTiming = useCallback(
    (idx: number, field: "start" | "end", value: number): number => {
      const c = segmentsRef.current[idx];
      if (!c) return value;
      // Bornes SOUPLES (éditeur libre) : un cue peut passer devant/derrière ses
      // voisins. Seules contraintes : rester dans [0, durée] et garder start<end.
      if (field === "start") {
        return Math.max(0, Math.min(c.end - MIN_CUE_DURATION, value));
      }
      return Math.min(duration, Math.max(c.start + MIN_CUE_DURATION, value));
    },
    [duration],
  );

  /** Recalcule les timings karaoké (par mot) d'un cue au prorata de sa NOUVELLE
   * fenêtre. Sans ça, déplacer/redimensionner un cue laisse des timings de mots
   * périmés (karaoké désynchronisé + gravé faux dans le MP4). N'affecte que les
   * cues qui portent des `words` (animation karaoké active). */
  const reproWords = useCallback(
    (seg: Cue): Cue => {
      if (!seg.words || seg.words.length === 0) return seg;
      const w = prorateWordTimings(seg.text, seg.start, seg.end, targetLang);
      return w && w.length ? { ...seg, words: w } : seg;
    },
    [targetLang],
  );

  /** Réordonne les cues par temps de début (après un déplacement qui a fait
   * passer un cue devant/derrière un autre) et fait suivre la sélection au cue
   * qu'on manipulait (repérage par id stable). No-op si l'ordre est déjà bon. */
  const resortAndRemap = useCallback(() => {
    const list = segmentsRef.current;
    const disordered = list.some((c, i) => i > 0 && list[i - 1]!.start > c.start);
    if (!disordered) return;
    const selId = list[selectedIdx]?.id;
    const sorted = [...list].sort((a, b) => a.start - b.start || a.end - b.end);
    segmentsRef.current = sorted;
    setSegmentsByLang((prev) => ({ ...prev, [targetLang]: sorted }));
    if (selId) {
      const ni = sorted.findIndex((c) => c.id === selId);
      if (ni >= 0) setSelectedIdx(ni);
    }
  }, [selectedIdx, targetLang]);

  const updateTiming = useCallback(
    (idx: number, field: "start" | "end", value: number) => {
      const v = clampTiming(idx, field, value);
      commitHistory();
      applyEdit((prev) =>
        prev.map((s, i) => (i === idx ? reproWords({ ...s, [field]: v }) : s)),
      );
      resortAndRemap();
    },
    [applyEdit, clampTiming, commitHistory, reproWords, resortAndRemap],
  );

  /** Rognage/déplacement depuis la timeline (l'historique est pris au 1er
   * mouvement via onEditStart — pas à chaque pixel). Pas de reprorata ici :
   * c'est fait une seule fois au relâcher (finalizeTiming). */
  const setTimingLive = useCallback(
    (idx: number, start: number, end: number) => {
      applyEdit((prev) =>
        prev.map((s, i) => (i === idx ? { ...s, start, end } : s)),
      );
    },
    [applyEdit],
  );

  /** Fin d'un glissement/rognage timeline : recale le karaoké du cue déplacé
   * puis réordonne si besoin. */
  const finalizeTiming = useCallback(
    (idx: number) => {
      applyEdit((prev) => prev.map((s, i) => (i === idx ? reproWords(s) : s)));
      resortAndRemap();
    },
    [applyEdit, reproWords, resortAndRemap],
  );

  const addLineAfter = useCallback(
    (idx: number) => {
      const list = segmentsRef.current;
      const cur = list[idx];
      const newStart = cur ? cur.end : currentTime;
      if (newStart >= duration - 0.3) return;
      commitHistory();
      const next = list[idx + 1];
      const newEnd = next ? next.start : Math.min(newStart + 2, duration);
      const newSeg: Cue = {
        id: nextCueId(),
        start: newStart,
        end: Math.max(newEnd, newStart + 0.5),
        text: "",
      };
      applyEdit((prev) => [
        ...prev.slice(0, idx + 1),
        newSeg,
        ...prev.slice(idx + 1),
      ]);
      setSelectedIdx(idx + 1);
      openSheet("selection");
    },
    [applyEdit, commitHistory, currentTime, duration, openSheet],
  );

  const deleteLine = useCallback(
    (idx: number) => {
      commitHistory();
      applyEdit((prev) => prev.filter((_, i) => i !== idx));
      setSelectedIdx((s) => Math.max(0, Math.min(s, segmentsRef.current.length - 1)));
    },
    [applyEdit, commitHistory],
  );

  const mergeWithNext = useCallback(
    (idx: number) => {
      const list = segmentsRef.current;
      if (!list[idx] || !list[idx + 1]) return;
      commitHistory();
      applyEdit((prev) => {
        const a = prev[idx];
        const b = prev[idx + 1];
        if (!a || !b) return prev;
        const merged: Cue = {
          id: a.id,
          start: a.start,
          end: b.end,
          text: `${a.text} ${b.text}`.trim(),
          ...(typeof a.speaker === "number" ? { speaker: a.speaker } : {}),
        };
        return [...prev.slice(0, idx), merged, ...prev.slice(idx + 2)];
      });
    },
    [applyEdit, commitHistory],
  );

  /** Divise la ligne sélectionnée à la tête de lecture (ou au milieu), en
   * répartissant les mots au prorata du temps. */
  const splitSelected = useCallback(() => {
    const idx = selectedIdx;
    const c = segmentsRef.current[idx];
    if (!c) return;
    const words = c.text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (words.length < 2) return;
    const inside =
      currentTime > c.start + MIN_CUE_DURATION &&
      currentTime < c.end - MIN_CUE_DURATION;
    const t = inside ? currentTime : (c.start + c.end) / 2;
    const ratio = (t - c.start) / (c.end - c.start);
    const cut = Math.min(
      words.length - 1,
      Math.max(1, Math.round(words.length * ratio)),
    );
    commitHistory();
    applyEdit((prev) => {
      const cur = prev[idx];
      if (!cur) return prev;
      const { words: _w, ...rest } = cur;
      const a: Cue = { ...rest, end: t, text: words.slice(0, cut).join(" ") };
      const b: Cue = {
        ...rest,
        id: nextCueId(),
        start: t,
        text: words.slice(cut).join(" "),
      };
      return [...prev.slice(0, idx), a, b, ...prev.slice(idx + 2)];
    });
  }, [applyEdit, commitHistory, currentTime, selectedIdx]);

  const regenerate = useCallback(
    async (idx: number) => {
      setRegeneratingIdx(idx);
      setErrorMessage(null);
      const result = await regenerateLine(initialVideo.id, idx);
      if (result.ok && result.text) {
        const text = result.text;
        commitHistory();
        applyEdit((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, text } : s)),
        );
      } else if (result.error) {
        setErrorMessage(result.error);
      }
      setRegeneratingIdx(null);
    },
    [applyEdit, commitHistory, initialVideo.id],
  );

  const undo = useCallback(() => {
    const prev = history.undo(segmentsRef.current);
    if (!prev) return;
    segmentsRef.current = prev;
    setSegmentsByLang((p) => ({ ...p, [targetLang]: prev }));
    markDirty();
  }, [history, markDirty, targetLang]);

  const redo = useCallback(() => {
    const next = history.redo(segmentsRef.current);
    if (!next) return;
    segmentsRef.current = next;
    setSegmentsByLang((p) => ({ ...p, [targetLang]: next }));
    markDirty();
  }, [history, markDirty, targetLang]);

  // ─── Bascule de langue ───
  const handleLanguageChange = async (newLang: Lang) => {
    if (newLang === targetLang || switching) return;
    setSwitchError(null);
    if (dirtyRef.current) await save();

    const finishSwitch = () => {
      history.reset();
      setSelectedIdx(0);
      dirtyRef.current = false;
      setSaveState("idle");
      setBurnStatus("idle");
    };

    const cached = segmentsByLang[newLang];
    if (cached && cached.length > 0) {
      setTargetLang(newLang);
      finishSwitch();
      void setSubtitleLanguage(initialVideo.id, newLang);
      return;
    }

    setSwitching(true);
    const res = await setSubtitleLanguage(initialVideo.id, newLang);
    setSwitching(false);
    if (!res.ok || !res.segments) {
      setSwitchError(res.error || "Changement de langue impossible.");
      return;
    }
    const segs = res.segments;
    setSegmentsByLang((prev) => ({ ...prev, [newLang]: withIds(segs) }));
    setReadyLangs((prev) => new Set(prev).add(newLang));
    setTargetLang(newLang);
    finishSwitch();
  };

  // ─── Exports ───
  const triggerDownload = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadExport = useCallback(
    async (fmt: "srt" | "vtt" | "txt" | "fcpxml") => {
      if (dirtyRef.current) await save();
      triggerDownload(
        `/app/videos/${initialVideo.id}/export?format=${fmt}&lang=${targetLang}`,
      );
    },
    [initialVideo.id, save, targetLang],
  );

  const downloadAll = useCallback(async () => {
    if (dirtyRef.current) await save();
    triggerDownload(`/app/videos/${initialVideo.id}/export-all`);
  }, [initialVideo.id, save]);

  const copyTranscript = useCallback(async (): Promise<boolean> => {
    try {
      const text = segmentsRef.current
        .map((s) => s.text.trim())
        .filter(Boolean)
        .join("\n");
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  // ─── Burn MP4 ───
  const burnInProgress = burnStatus === "queued" || burnStatus === "burning";
  useEffect(() => {
    if (!burnInProgress) return;
    let stop = false;
    const check = async () => {
      const res = await getBurnStatus(initialVideo.id);
      if (stop || !res) return;
      setBurnStatus(res.status);
      setBurnProgress(res.progress);
      if (res.status === "failed" && res.error) setErrorMessage(res.error);
    };
    const interval = setInterval(check, 3000);
    return () => {
      stop = true;
      clearInterval(interval);
    };
  }, [burnInProgress, initialVideo.id]);

  const requestBurnVideo = async () => {
    setErrorMessage(null);
    setBurnProgress(0);
    setBurnStatus("queued");
    const res = await requestBurn(
      initialVideo.id,
      stripIds(segmentsRef.current),
      subtitleStyle,
    );
    if (!res.ok) {
      setBurnStatus("idle");
      if (res.error) setErrorMessage(res.error);
    }
  };

  const downloadBurned = async () => {
    const res = await getBurnedUrl(initialVideo.id);
    if (res.ok && res.url) {
      const a = document.createElement("a");
      a.href = res.url;
      a.download = "";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

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

  // ─── Raccourcis clavier (desktop) ───
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (target?.isContentEditable) return;
      if (e.key === " ") {
        e.preventDefault();
        playerRef.current?.togglePlay();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "s" || e.key === "S") {
        splitSelected();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        deleteLine(selectedIdx);
      } else if (e.key === "ArrowRight") {
        const step = e.shiftKey ? 0.1 : 1;
        playerRef.current?.seekTo(Math.min(duration, currentTime + step), {
          play: false,
        });
      } else if (e.key === "ArrowLeft") {
        const step = e.shiftKey ? 0.1 : 1;
        playerRef.current?.seekTo(Math.max(0, currentTime - step), {
          play: false,
        });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [currentTime, deleteLine, duration, redo, selectedIdx, splitSelected, undo]);

  // ─── Barre d'actions mobile ───
  const onAction = (action: ActionBarAction) => {
    if (action === "text") openSheet("selection");
    else if (action === "style") openSheet("style");
    else if (action === "split") splitSelected();
    else if (action === "add") addLineAfter(selectedIdx);
    else if (action === "delete") deleteLine(selectedIdx);
    else if (action === "export") openSheet("export");
  };

  // ─── Aperçu (données du lecteur) ───
  const activeText = activeIndex >= 0 ? segments[activeIndex]?.text : "";
  const activeWords =
    activeIndex >= 0 ? segments[activeIndex]?.words : undefined;
  const activeSpeaker =
    activeIndex >= 0 ? segments[activeIndex]?.speaker : undefined;
  const multiSpeaker = countSpeakers(segments) > 1;

  const selectedCue = segments[selectedIdx] ?? null;

  const metaLine = [
    initialVideo.duration_seconds
      ? formatDuration(Number(initialVideo.duration_seconds))
      : null,
    new Date(initialVideo.uploaded_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    initialVideo.source_lang_auto
      ? `langue détectée : ${langLabel(sourceLang)}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // ═══════════════ États non terminés (flux normal, avec padding) ═══════════════
  if (status !== "done") {
    return (
      <div className="w-full">
        <Link
          href="/app/videos"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Mes vidéos
        </Link>

        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span className="annotation">§ Vidéo</span>
          <VideoStatusBadge status={status} />
        </div>
        <h1 className="font-display font-medium text-2xl md:text-3xl leading-tight tracking-[-0.015em] text-ink-900 break-words mb-6">
          {initialVideo.original_filename}
        </h1>

        {isProcessing && (
          <div className="bg-ink-900 text-ivory-50 rounded-sm p-6 md:p-8 mb-8 max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 text-rouge-400 animate-spin" aria-hidden />
              <span className="font-display font-medium text-lg">
                {stageLabel(status, {
                  sourceLang: initialVideo.source_lang_auto
                    ? undefined
                    : initialVideo.source_lang,
                  targetLang:
                    initialVideo.target_same_as_source &&
                    initialVideo.source_lang_auto
                      ? undefined
                      : initialVideo.target_lang,
                })}
                …
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

        <div className="mt-10 pt-6 border-t border-ivory-200 max-w-3xl">
          <DeleteInline onDelete={handleDelete} isPending={isPending} />
        </div>
      </div>
    );
  }

  // ═══════════════ Éditeur (statut done) — plein écran, app-like ═══════════════
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-10 -my-8 md:-my-12 h-[calc(100dvh-3.5rem)] lg:h-dvh flex flex-col bg-ivory-50 overflow-hidden">
      {/* Barre du haut */}
      <header className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 min-h-[52px] border-b border-ivory-200 bg-ivory-50 flex-shrink-0">
        <Link
          href="/app/videos"
          aria-label="Retour à mes vidéos"
          className="inline-flex items-center justify-center h-10 w-10 rounded-sm text-ink-500 hover:bg-ivory-200 hover:text-ink-900 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <span
          className="font-display font-medium text-sm text-ink-900 truncate min-w-0"
          title={initialVideo.original_filename}
        >
          {initialVideo.original_filename}
        </span>
        <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
        <button
          onClick={save}
          disabled={
            saveState === "saving" || saveState === "idle" || saveState === "saved"
          }
          aria-label="Enregistrer"
          title="Enregistrer maintenant (sauvegarde automatique active)"
          className="hidden md:inline-flex items-center justify-center h-10 w-10 rounded-sm text-ink-500 hover:bg-ivory-200 hover:text-ink-900 transition-colors disabled:opacity-35 flex-shrink-0"
        >
          {saveState === "saving" ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
          ) : (
            <Save className="h-[18px] w-[18px]" aria-hidden />
          )}
        </button>
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          <button
            onClick={undo}
            disabled={!history.canUndo}
            aria-label="Annuler"
            title="Annuler (Ctrl+Z)"
            className="inline-flex items-center justify-center h-10 w-10 rounded-sm text-ink-500 hover:bg-ivory-200 hover:text-ink-900 transition-colors disabled:opacity-35"
          >
            <Undo2 className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <button
            onClick={redo}
            disabled={!history.canRedo}
            aria-label="Rétablir"
            title="Rétablir (Ctrl+Maj+Z)"
            className="inline-flex items-center justify-center h-10 w-10 rounded-sm text-ink-500 hover:bg-ivory-200 hover:text-ink-900 transition-colors disabled:opacity-35"
          >
            <Redo2 className="h-[18px] w-[18px]" aria-hidden />
          </button>
          <select
            value={targetLang}
            onChange={(e) => handleLanguageChange(e.target.value as Lang)}
            disabled={switching}
            aria-label="Langue des sous-titres"
            className="ml-1 rounded-sm border border-ink-900 bg-ivory-50 px-2 py-2 min-h-[40px] max-w-[110px] sm:max-w-none font-mono text-xs uppercase text-ink-900 disabled:opacity-50"
          >
            {LANG_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {readyLangs.has(o.id) ? `${o.label} ✓` : `${o.label} — à générer`}
              </option>
            ))}
          </select>
          {switching && (
            <Loader2 className="h-4 w-4 animate-spin text-ink-500" aria-hidden />
          )}
        </div>
      </header>

      {/* Bandeau d'erreur (regen/burn/langue) */}
      {(errorMessage || switchError) && (
        <div className="flex-shrink-0 px-3 py-2 bg-rouge-50 border-b border-rouge-200 text-xs text-rouge-700">
          {switchError || errorMessage}
        </div>
      )}

      {/* Rangée centrale : aperçu (+ inspecteur docké en desktop) */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 min-h-0 bg-ink-900 flex items-center justify-center px-2 py-2 sm:px-4">
          <div className="w-full max-w-[1100px]">
            <SubtitlePlayer
              ref={playerRef}
              videoUrl={videoUrl}
              isAudio={isAudio}
              activeText={activeText}
              activeWords={activeWords}
              activeSpeaker={activeSpeaker}
              multiSpeaker={multiSpeaker}
              rtl={targetRtl}
              subtitleStyle={subtitleStyle}
              smoothTime
              onTimeUpdate={setCurrentTime}
              onPlayingChange={setIsPlaying}
              langs={LANG_OPTIONS.map((o) => ({
                id: o.id,
                label: o.label,
                ready: readyLangs.has(o.id),
              }))}
              currentLang={targetLang}
              onLangChange={(l) => handleLanguageChange(l as Lang)}
              switchingLang={switching}
            />
          </div>
        </div>

        <Inspector
          open={sheetOpen}
          tab={tab}
          onTab={setTab}
          onClose={() => setSheetOpen(false)}
          selection={{
            cue: selectedCue,
            index: selectedIdx,
            total: segments.length,
            sourceText: segmentsSource[selectedIdx]?.text,
            targetRtl,
            sourceRtl,
            multiSpeaker,
            regenerating: regeneratingIdx === selectedIdx,
            canMerge: selectedIdx < segments.length - 1,
            onText: (v) => updateText(selectedIdx, v),
            onTextFocus,
            onTiming: (f, v) => updateTiming(selectedIdx, f, v),
            onSeek: () => {
              if (selectedCue) playerRef.current?.seekTo(selectedCue.start);
              setSheetOpen(false);
            },
            onRegenerate: () => regenerate(selectedIdx),
            onSplit: splitSelected,
            onMerge: () => mergeWithNext(selectedIdx),
            onAdd: () => addLineAfter(selectedIdx),
            onDelete: () => deleteLine(selectedIdx),
          }}
          style={subtitleStyle}
          onStyle={updateStyle}
          exportApi={{
            canExportPro,
            isAudio,
            burnStatus,
            burnProgress,
            metaLine,
            targetLangShort: langShort(targetLang),
            onExport: downloadExport,
            onExportAll: downloadAll,
            onBurn: requestBurnVideo,
            onDownloadBurned: downloadBurned,
            onCopyTranscript: copyTranscript,
            onDeleteVideo: handleDelete,
            deleting: isPending,
          }}
        />
      </div>

      {/* Outils timeline */}
      <div className="flex items-center gap-1 px-2 min-h-[40px] border-t border-ivory-200 bg-ivory-100 flex-shrink-0 overflow-x-auto ml-scroll">
        <span className="font-mono text-[9px] uppercase tracking-widest text-ink-400 mr-1 flex-shrink-0">
          Timeline
        </span>
        <button
          onClick={() => setPxPerSec((z) => Math.max(6, z / 1.35))}
          aria-label="Zoom arrière"
          className="inline-flex items-center justify-center h-8 w-9 rounded-sm text-ink-500 hover:bg-ivory-200 hover:text-ink-900 flex-shrink-0"
        >
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <button
          onClick={() => setPxPerSec((z) => Math.min(160, z * 1.35))}
          aria-label="Zoom avant"
          className="inline-flex items-center justify-center h-8 w-9 rounded-sm text-ink-500 hover:bg-ivory-200 hover:text-ink-900 flex-shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <button
          onClick={() => setSnap((s) => !s)}
          aria-pressed={snap}
          title="Aimantation aux bords voisins et à la tête de lecture"
          className={`inline-flex items-center gap-1 h-8 px-2 rounded-sm font-mono text-[10px] uppercase tracking-wide flex-shrink-0 border transition-colors ${
            snap
              ? "border-rouge-500 text-rouge-600 bg-rouge-50"
              : "border-transparent text-ink-500 hover:bg-ivory-200"
          }`}
        >
          <Magnet className="h-3.5 w-3.5" aria-hidden />
          Aimant
        </button>
        <button
          onClick={() => setFollow((f) => !f)}
          aria-pressed={follow}
          title="La timeline suit la lecture"
          className={`inline-flex items-center h-8 px-2 rounded-sm font-mono text-[10px] uppercase tracking-wide flex-shrink-0 border transition-colors ${
            follow
              ? "border-rouge-500 text-rouge-600 bg-rouge-50"
              : "border-transparent text-ink-500 hover:bg-ivory-200"
          }`}
        >
          Suivi
        </button>
        <span className="ml-2 font-mono text-[10px] text-ink-500 tabular-nums flex-shrink-0">
          {formatClock(currentTime)} / {formatClock(duration)}
        </span>
        <span className="hidden lg:block ml-auto font-mono text-[9.5px] text-ink-400 flex-shrink-0 pr-2">
          espace lecture · S diviser · Suppr supprimer · ←→ naviguer · Ctrl+Z annuler
        </span>
      </div>

      {/* Timeline */}
      <div className="flex-shrink-0">
        <Timeline
          cues={segments}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          selectedIdx={selectedIdx}
          pxPerSec={pxPerSec}
          snap={snap}
          follow={follow}
          isAudio={isAudio}
          rtl={targetRtl}
          onSelect={(idx, fromTap) => {
            setSelectedIdx(idx);
            if (fromTap) {
              // Aligne l'aperçu sur le cue sélectionné (sauf en pleine lecture,
              // pour ne pas interrompre le visionnage).
              const c = segments[idx];
              if (c && !isPlaying) {
                playerRef.current?.seekTo(c.start, { play: false });
                setCurrentTime(c.start);
              }
              if (!isDesktop()) openSheet("selection");
              else setTab("selection");
            }
          }}
          onScrub={(t) => {
            playerRef.current?.seekTo(t, { play: false });
            setCurrentTime(t);
          }}
          onEditStart={commitHistory}
          onTiming={setTimingLive}
          onEditEnd={finalizeTiming}
          onReady={(width) => {
            if (zoomInitRef.current) return;
            zoomInitRef.current = true;
            // Zoom initial : ~20 s visibles (borné), toute la vidéo si courte.
            const fit = width / Math.min(Math.max(duration, 5), 20);
            setPxPerSec(Math.max(6, Math.min(120, fit)));
          }}
        />
      </div>

      {/* Barre d'actions mobile */}
      <ActionBar onAction={onAction} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
function SaveIndicator({
  state,
  lastSavedAt,
}: {
  state: SaveState;
  lastSavedAt: number | null;
}) {
  const savedTime =
    lastSavedAt != null
      ? new Date(lastSavedAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  let label: string;
  let className: string;
  let icon: React.ReactNode;
  if (state === "saving") {
    label = "Enregistrement…";
    className = "text-ink-500";
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />;
  } else if (state === "dirty") {
    label = "Modifications…";
    className = "text-ink-500";
    icon = <span className="h-1.5 w-1.5 rounded-full bg-rouge-500" />;
  } else if (state === "error") {
    label = "Échec de l'enregistrement";
    className = "text-rouge-600";
    icon = <span className="h-1.5 w-1.5 rounded-full bg-rouge-600" />;
  } else {
    label = savedTime ? `Enregistré à ${savedTime}` : "À jour";
    className = "text-success-600";
    icon = <Check className="h-3.5 w-3.5" />;
  }
  return (
    <span
      className={`hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap flex-shrink min-w-0 overflow-hidden ${className}`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

function DeleteInline({
  onDelete,
  isPending,
}: {
  onDelete: () => void;
  isPending: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-rouge-600 transition-colors"
      >
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
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Oui, supprimer
      </button>
      <button
        onClick={() => setConfirm(false)}
        className="text-sm text-ink-500 hover:text-ink-900"
      >
        Annuler
      </button>
    </div>
  );
}
