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
import { countSpeakers, speakerColor, speakerLabel } from "@/lib/speakers";
import {
  SubtitlePlayer,
  type SubtitlePlayerHandle,
} from "@/components/app/subtitle-player";
import { formatDuration } from "@/lib/storage";
import { STAGE_PROGRESS, type Segment } from "@/lib/video-types";
import {
  normalizeSubtitleStyle,
  subtitleColorHex,
  FONT_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  SPEAKER_MODE_OPTIONS,
  type SubtitleStyle,
} from "@/lib/subtitle-style";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

// Cue = segment + identifiant STABLE (clé React). Indispensable : sans clé
// stable, insérer/supprimer une ligne décale toutes les clés par index et React
// réutilise les mauvais composants (timecodes faux). L'id ne vit que côté client
// (on le retire avant d'enregistrer/exporter).
type Cue = Segment & { id: string };
let cueIdSeq = 0;
const nextCueId = () => `c${cueIdSeq++}`;
const withIds = (segs: Segment[]): Cue[] =>
  segs.map((s) => ({ ...s, id: nextCueId() }));
const stripIds = (cues: Cue[]): Segment[] =>
  cues.map(({ id: _id, ...s }) => s);

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

  // ─── Édition des sous-titres (multi-langue) ───
  const playerRef = useRef<SubtitlePlayerHandle>(null);
  const activeRowRef = useRef<HTMLElement>(null);
  const dirtyRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [burnStatus, setBurnStatus] = useState<BurnStatus>(
    (initialVideo.burn_status as BurnStatus) || "idle",
  );

  const sourceLang = initialVideo.source_lang || "fr";
  const [targetLang, setTargetLang] = useState<Lang>(
    isLang(initialVideo.target_lang) ? initialVideo.target_lang : "en",
  );

  // Sous-titres de TOUTES les langues prêtes, indexés par langue (bascule
  // instantanée sans réseau). Le worker pré-génère les 10 langues en tâche de
  // fond ; on les complète par polling (cf. plus bas). Repli legacy pour la
  // langue active si la table n'a encore rien (vidéos d'avant la migration).
  const [segmentsByLang, setSegmentsByLang] = useState<Record<string, Cue[]>>(
    () => {
      const init: Record<string, Cue[]> = {};
      for (const [lang, segs] of Object.entries(initialSegments)) {
        init[lang] = withIds(segs);
      }
      // Repli legacy pour la langue active UNIQUEMENT si elle a du contenu (vidéos
      // d'avant la migration). On ne crée JAMAIS de tableau vide : un placeholder
      // vide écraserait la vraie langue à l'arrivée des données (cf. fusion).
      const tl = isLang(initialVideo.target_lang) ? initialVideo.target_lang : "en";
      const tt = initialVideo.transcription_target as Segment[] | null;
      if (!init[tl] && Array.isArray(tt) && tt.length > 0) init[tl] = withIds(tt);
      return init;
    },
  );
  const segments = segmentsByLang[targetLang] ?? [];
  const setSegments = useCallback(
    (updater: Cue[] | ((prev: Cue[]) => Cue[])) => {
      setSegmentsByLang((prev) => {
        const cur = prev[targetLang] ?? [];
        const next =
          typeof updater === "function"
            ? (updater as (p: Cue[]) => Cue[])(cur)
            : updater;
        return { ...prev, [targetLang]: next };
      });
    },
    [targetLang],
  );

  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  // Langues déjà générées (✓ dans le menu). La langue active est toujours présente.
  const [readyLangs, setReadyLangs] = useState<Set<Lang>>(() => {
    const s = new Set<Lang>(availableLangs.map((l) => l.lang));
    for (const l of Object.keys(initialSegments)) if (isLang(l)) s.add(l);
    if (isLang(initialVideo.target_lang)) s.add(initialVideo.target_lang);
    return s;
  });
  const translationMode = isTranslation(sourceLang, targetLang);
  // Sens d'écriture : l'arabe (et autres langues RTL) s'affiche de droite à gauche.
  const targetRtl = isRtl(targetLang);
  const sourceRtl = isRtl(sourceLang);
  // Référence source (italique) uniquement en mode traduction (sinon = doublon).
  const segmentsSource = translationMode
    ? segmentsByLang[sourceLang] ??
      (initialVideo.transcription_source as Segment[]) ??
      []
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

  // Le worker pré-génère les 10 langues en arrière-plan après 'done'. On
  // complète la liste par polling court : les langues « s'allument » dans le
  // menu et la bascule reste instantanée (cache client). On n'écrase JAMAIS une
  // langue déjà chargée (préserve les éditions locales). Stop dès les 10 prêtes.
  // Fusion serveur → état local : le serveur REMPLIT toute langue absente ou
  // vide ; seul un contenu non vide local (= édité par l'utilisateur) est
  // préservé. (Évite qu'un placeholder vide écrase la vraie langue à l'arrivée.)
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

  // Synchro depuis les props serveur dès que la vidéo est 'done' (y compris la
  // transition live « en cours → terminé » via router.refresh). Remplit la
  // langue affichée immédiatement, sans attendre le 1er polling.
  const didAlignRef = useRef(false);
  useEffect(() => {
    if (status !== "done") return;
    // Une seule fois : aligne la langue affichée sur la langue principale réelle
    // (en auto-détection, target_lang n'est résolu par le worker qu'après coup —
    // le placeholder du montage peut différer de la langue détectée).
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
    // Garde-fou : on arrête après ~2 min même si une langue a échoué (best-effort
    // côté worker). Les langues manquantes restent générables à la demande.
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
    const result = await saveTranscriptionTarget(
      initialVideo.id,
      stripIds(segmentsRef.current),
    );
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
      const newSeg: Cue = {
        id: nextCueId(),
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
      const merged: Cue = {
        id: a.id,
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

  // Bascule de la langue des sous-titres. Si la langue est déjà en cache client
  // (worker l'a pré-générée), la bascule est INSTANTANÉE ; sinon on la génère à
  // la demande. Modèle éco « tout inclus » : toutes les langues sont gratuites.
  const handleLanguageChange = async (newLang: Lang) => {
    if (newLang === targetLang || switching) return;
    setSwitchError(null);
    // Sauvegarde des modifs de la langue courante avant de basculer (save lit
    // la langue active côté serveur, donc AVANT de poser la nouvelle active).
    if (dirtyRef.current) await save();

    const cached = segmentsByLang[newLang];
    if (cached && cached.length > 0) {
      // Bascule instantanée (zéro réseau côté affichage).
      setTargetLang(newLang);
      dirtyRef.current = false;
      setSaveState("idle");
      setBurnStatus("idle");
      // En arrière-plan : pose la langue active (miroir legacy + reset burn).
      void setSubtitleLanguage(initialVideo.id, newLang);
      return;
    }

    // Pas encore générée (pré-génération worker en cours) → génère puis bascule.
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
    setBurnStatus("idle");
    dirtyRef.current = false;
    setSaveState("idle");
  };

  const triggerDownload = (href: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Export d'une langue : on sauvegarde d'abord (si modifs), puis on télécharge
  // la langue AFFICHÉE à jour.
  const downloadExport = useCallback(
    async (fmt: "srt" | "vtt" | "txt" | "fcpxml") => {
      if (dirtyRef.current) await save();
      triggerDownload(
        `/app/videos/${initialVideo.id}/export?format=${fmt}&lang=${targetLang}`,
      );
    },
    [initialVideo.id, save, targetLang],
  );

  // Export « toutes les langues » : .zip avec un .srt + .vtt par langue prête.
  const downloadAll = useCallback(async () => {
    if (dirtyRef.current) await save();
    triggerDownload(`/app/videos/${initialVideo.id}/export-all`);
  }, [initialVideo.id, save]);

  // ─── Incrustation MP4 (burn-in) à la demande ───
  const burnInProgress = burnStatus === "queued" || burnStatus === "burning";

  // Polling de l'état du burn tant qu'il est en cours.
  useEffect(() => {
    if (!burnInProgress) return;
    let stop = false;
    const check = async () => {
      const res = await getBurnStatus(initialVideo.id);
      if (stop || !res) return;
      setBurnStatus(res.status);
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
      // Lien de téléchargement (l'URL présignée porte déjà Content-Disposition:
      // attachment) → ne quitte pas la page de l'éditeur.
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

  const activeText = activeIndex >= 0 ? segments[activeIndex]?.text : "";
  const activeSpeaker =
    activeIndex >= 0 ? segments[activeIndex]?.speaker : undefined;
  // Plusieurs voix détectées (diarisation) → on colore par locuteur.
  const multiSpeaker = countSpeakers(segments) > 1;

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="annotation">§ Vidéo</span>
            <VideoStatusBadge status={status} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500 border border-ivory-300 rounded-sm px-2 py-1">
              {initialVideo.source_lang_auto && status !== "done"
                ? initialVideo.target_same_as_source
                  ? "détection…"
                  : `détection… → ${langShort(initialVideo.target_lang || "en")}`
                : isTranslation(
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
          {initialVideo.source_lang_auto && status === "done" && (
            <p className="annotation mt-2">
              Langue détectée : {langLabel(sourceLang)}
            </p>
          )}
        </div>
      </div>

      {/* État du pipeline */}
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
              })}…
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

          {/* Langue des sous-titres : les 10 langues, générées à la demande + cache */}
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                Langue des sous-titres
              </span>
              <select
                value={targetLang}
                onChange={(e) => handleLanguageChange(e.target.value as Lang)}
                disabled={switching}
                aria-label="Changer la langue des sous-titres"
                className="rounded-sm border border-ivory-300 bg-ivory-50 px-2.5 py-1 text-sm text-ink-900 disabled:opacity-50"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {readyLangs.has(o.id) ? `${o.label} ✓` : `${o.label} — à générer`}
                  </option>
                ))}
              </select>
              {switching ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Génération…
                </span>
              ) : switchError ? (
                <span className="text-xs text-rouge-600">{switchError}</span>
              ) : (
                <span className="text-xs text-ink-400">
                  Les 10 langues sont incluses · générées au 1ᵉʳ choix, puis instantanées
                </span>
              )}
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
                activeSpeaker={activeSpeaker}
                multiSpeaker={multiSpeaker}
                rtl={targetRtl}
                subtitleStyle={subtitleStyle}
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
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                {segments.length} sous-titres · modifiez le texte, cliquez «&nbsp;Lire&nbsp;» pour vous y rendre
              </p>

              {/* Panneau : style des sous-titres */}
              <SubtitleStylePanel
                style={subtitleStyle}
                onChange={updateStyle}
                multiSpeaker={multiSpeaker}
              />

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
                  {canExportPro && (
                    <button
                      onClick={() => downloadExport("fcpxml")}
                      title="Pour DaVinci Resolve, Premiere Pro, Final Cut"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-encre-500 border-2 border-encre-500 rounded-sm text-sm font-semibold text-ivory-50 hover:bg-encre-600 transition-colors"
                    >
                      <Download className="h-4 w-4" aria-hidden />.fcpxml
                    </button>
                  )}
                  {burnStatus === "done" ? (
                    <button
                      onClick={downloadBurned}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-rouge-500 border-2 border-rouge-500 rounded-sm text-sm font-semibold text-ivory-50 hover:bg-rouge-600 transition-colors"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      MP4 sous-titré
                    </button>
                  ) : burnInProgress ? (
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border-2 border-ink-300 rounded-sm text-sm font-semibold text-ink-500">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Génération MP4…
                    </span>
                  ) : (
                    <button
                      onClick={requestBurnVideo}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      {burnStatus === "failed" ? "Réessayer le MP4" : "Générer le MP4 sous-titré"}
                    </button>
                  )}
                  <button
                    onClick={downloadAll}
                    title="Un .srt + .vtt par langue, regroupés dans un .zip"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-ink-900 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ivory-50 hover:bg-ink-800 transition-colors"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Toutes les langues (.zip)
                  </button>
                </div>
                <p className="text-xs text-ink-500 mt-3 font-mono">
                  › .srt/.vtt/.txt = la langue affichée ({langShort(targetLang)}).
                  Le .zip regroupe un fichier par langue.
                </p>
                <p className="text-xs text-ink-500 mt-1 font-mono">
                  › les exports reprennent vos dernières modifications (enregistrées
                  automatiquement)
                </p>
                {burnStatus === "done" && (
                  <p className="text-xs text-ink-500 mt-1 font-mono">
                    › le MP4 grave le texte et le style actuels. Régénérez après
                    modification pour les répercuter.
                  </p>
                )}
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
                    key={seg.id}
                    index={idx}
                    segment={seg}
                    frText={segmentsSource[idx]?.text}
                    multiSpeaker={multiSpeaker}
                    targetRtl={targetRtl}
                    sourceRtl={sourceRtl}
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
  multiSpeaker,
  targetRtl,
  sourceRtl,
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
  multiSpeaker?: boolean;
  targetRtl?: boolean;
  sourceRtl?: boolean;
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
          {multiSpeaker && typeof segment.speaker === "number" && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-ink-600"
              title="Locuteur détecté"
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-ink-300"
                style={{ backgroundColor: speakerColor(segment.speaker) ?? "#C8C2B6" }}
              />
              {speakerLabel(segment.speaker)}
            </span>
          )}
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
          dir={targetRtl ? "rtl" : undefined}
          rows={3}
          className={`ml-scroll w-full min-h-[4.75rem] bg-white border border-ink-200 rounded-sm px-3 py-2.5 text-ink-900 leading-relaxed resize-y focus:outline-none focus:border-rouge-500 focus-visible:ring-2 focus-visible:ring-rouge-500/30 ${
            targetRtl ? "text-right" : ""
          }`}
          placeholder="Sous-titre…"
        />

        {frText && (
          <p
            dir={sourceRtl ? "rtl" : undefined}
            className={`mt-2 text-sm text-ink-400 italic ${sourceRtl ? "text-right" : ""}`}
          >
            {frText}
          </p>
        )}

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
  multiSpeaker,
}: {
  style: SubtitleStyle;
  onChange: (patch: Partial<SubtitleStyle>) => void;
  multiSpeaker?: boolean;
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

      {/* Distinction des voix (diarisation) — visible seulement si plusieurs voix.
          Par défaut « Aucune » : texte blanc, mais lignes déjà séparées par voix. */}
      {multiSpeaker && (
        <div>
          <FieldLabel>Distinction des voix</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {SPEAKER_MODE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => onChange({ speakerMode: o.id })}
                className={chipCls(style.speakerMode === o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[9px] text-ink-400">
            Plusieurs voix détectées · chaque voix est déjà sur sa propre ligne.
          </p>
        </div>
      )}
    </div>
  );
}
