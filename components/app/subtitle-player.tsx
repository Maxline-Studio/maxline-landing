"use client";

import {
  forwardRef,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  VideoOff,
  AudioLines,
  Languages,
  Check,
  Loader2,
} from "lucide-react";
import {
  overlayStyleCss,
  speakerOverrideCss,
  highlightHex,
  DEFAULT_SUBTITLE_STYLE,
  type SubtitleStyle,
} from "@/lib/subtitle-style";
import { speakerColor } from "@/lib/speakers";
import type { WordTiming } from "@/lib/video-types";
import type { PlaybackClock } from "@/app/app/videos/[id]/editor/playback-clock";

export type SubtitlePlayerHandle = {
  /** Place la lecture à `seconds` et démarre (sauf `{ play: false }` :
   * simple déplacement, utilisé par le scrub de la timeline). */
  seekTo: (seconds: number, opts?: { play?: boolean }) => void;
  /** Lecture/pause (raccourci clavier de l'éditeur). */
  togglePlay: () => void;
};

/** secondes → "m:ss". */
function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * Plus grande boîte de rapport `ratio` tenant dans `cw × ch`.
 *
 * ─── Pourquoi on mesure au lieu de faire du CSS ───────────────────────────────
 * Le lecteur se dimensionnait en `max-h-[42vh] md:max-h-[70vh]`, c'est-à-dire en
 * fraction de la HAUTEUR DE FENÊTRE. Or il vit dans une colonne flex à hauteur
 * contrainte : sur un portable 1366×768, une fois la barre du haut, la barre
 * d'outils, la timeline et la barre d'actions déduites, il ne reste que ~280 px
 * — mais le lecteur en réclamait 537 (70vh). D'où la vidéo qui débordait, se
 * faisait rogner et paraissait « mal ancrée ».
 *
 * Dans un layout flex à hauteur contrainte, on ne dimensionne jamais en `vh`.
 * On mesure le conteneur réel et on calcule la boîte ajustée : c'est
 * déterministe, ça ne déborde jamais, et ça marche identiquement en plein
 * écran, en fenêtre, en vertical 9:16 comme en 16:9.
 */
function fitBox(
  cw: number,
  ch: number,
  ratio: number,
): { width: number; height: number } {
  if (cw <= 0 || ch <= 0 || !isFinite(ratio) || ratio <= 0) {
    return { width: 0, height: 0 };
  }
  let width = cw;
  let height = cw / ratio;
  if (height > ch) {
    height = ch;
    width = ch * ratio;
  }
  return { width: Math.floor(width), height: Math.floor(height) };
}

/**
 * Lecteur vidéo **maison** aux couleurs de l'Atelier (aucun contrôle natif, zéro
 * librairie). Cadre **adaptatif au format réel** (16:9, 9:16 vertical, 1:1…),
 * calculé sur la place réellement disponible.
 *
 * ─── Le temps ne passe pas par React ──────────────────────────────────────────
 * Pendant la lecture, la position courante est publiée dans une `PlaybackClock`
 * (module hors React) et écrite DIRECTEMENT dans le DOM pour la barre de
 * progression et l'horloge. Le seul état React rafraîchi en lecture est l'index
 * du mot karaoké courant — qui change deux ou trois fois par seconde, pas
 * soixante. Voir `editor/playback-clock.ts` pour le détail du problème résolu.
 */
export const SubtitlePlayer = forwardRef<
  SubtitlePlayerHandle,
  {
    videoUrl: string | null;
    /** Source audio (podcast) : pas de piste vidéo → fond audio + pas de MP4. */
    isAudio?: boolean;
    activeText?: string;
    /** Timings par mot du sous-titre actif (karaoké) — si présents et animation
     * activée, le mot courant est surligné en suivant la lecture. */
    activeWords?: WordTiming[];
    /** Locuteur du sous-titre actif (diarisation) → couleur par voix. */
    activeSpeaker?: number;
    /** true si la vidéo a plusieurs locuteurs (active la couleur par voix). */
    multiSpeaker?: boolean;
    /** true si la langue des sous-titres s'écrit de droite à gauche (arabe…). */
    rtl?: boolean;
    subtitleStyle?: SubtitleStyle;
    /** Horloge partagée : le lecteur y publie la position à chaque image, sans
     * provoquer le moindre rendu React. C'est le chemin utilisé par l'éditeur
     * (tête de lecture, suivi de timeline, cue actif). */
    clock?: PlaybackClock;
    /** Position (s) — appelée au rythme NATIF (~4 Hz) et à chaque saut, jamais à
     * 60 Hz. Pour un suivi fluide, s'abonner à `clock`. */
    onTimeUpdate?: (seconds: number) => void;
    onPlayingChange?: (playing: boolean) => void;
    /** Menu « Sous-titres » dans le lecteur : les 10 langues + leur état. */
    langs?: { id: string; label: string; ready: boolean }[];
    currentLang?: string;
    onLangChange?: (lang: string) => void;
    /** true pendant la génération à la demande d'une langue pas encore prête. */
    switchingLang?: boolean;
  }
>(function SubtitlePlayer(
  {
    videoUrl,
    isAudio = false,
    activeText,
    activeWords,
    activeSpeaker,
    multiSpeaker,
    rtl,
    subtitleStyle,
    clock,
    onTimeUpdate,
    onPlayingChange,
    langs,
    currentLang,
    onLangChange,
    switchingLang,
  },
  ref,
) {
  const style = subtitleStyle ?? DEFAULT_SUBTITLE_STYLE;
  const speakerHex = multiSpeaker ? speakerColor(activeSpeaker) : null;
  const speakerCss = speakerOverrideCss(style, speakerHex);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Éléments rafraîchis en DOM direct pendant la lecture (aucun rendu React).
  const seekBarRef = useRef<HTMLInputElement>(null);
  const clockLabelRef = useRef<HTMLSpanElement>(null);

  const [ratio, setRatio] = useState(16 / 9);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [ccOpen, setCcOpen] = useState(false);
  /** Index du mot karaoké courant (-1 = aucun). SEUL état rafraîchi en lecture,
   * et seulement quand il CHANGE : deux ou trois fois par seconde. */
  const [wordIdx, setWordIdx] = useState(-1);

  // ─── Cadre : mesure du conteneur réel (jamais de vh) ───
  const frame = useMemo(
    () => fitBox(stage.width, stage.height, ratio),
    [stage.width, stage.height, ratio],
  );

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setStage((prev) =>
        Math.abs(prev.width - r.width) < 1 && Math.abs(prev.height - r.height) < 1
          ? prev
          : { width: r.width, height: r.height },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [videoUrl, error]);

  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds: number, opts?: { play?: boolean }) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = seconds;
        clock?.set(seconds);
        if (opts?.play !== false) v.play().catch(() => {});
      },
      togglePlay: () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) v.play().catch(() => {});
        else v.pause();
      },
    }),
    [clock],
  );

  useEffect(() => {
    const onFs = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  // ─── Diffusion du temps ───
  // `activeWords` change à chaque cue : on le garde dans une ref pour que la
  // boucle d'animation n'ait pas à être recréée (et donc annulée/relancée) à
  // chaque sous-titre.
  const wordsRef = useRef(activeWords);
  wordsRef.current = activeWords;
  const wordIdxRef = useRef(-1);
  const animatedRef = useRef(style.animation !== "none");
  animatedRef.current = style.animation !== "none";

  /** Publie une position : horloge + DOM direct + index de mot si besoin. */
  const publish = useCallback(
    (t: number) => {
      clock?.set(t);

      const bar = seekBarRef.current;
      // On ne touche pas la barre pendant que l'utilisateur la manipule.
      if (bar && document.activeElement !== bar) bar.value = String(t);
      const label = clockLabelRef.current;
      if (label) label.textContent = fmt(t);

      // Karaoké : index du mot courant. `setWordIdx` n'est appelé QUE si l'index
      // change réellement → quelques rendus par seconde au lieu de soixante.
      const words = wordsRef.current;
      let next = -1;
      if (animatedRef.current && words && words.length > 0) {
        // Chemin rapide : on est encore sur le même mot, ou sur le suivant.
        const cur = wordIdxRef.current;
        if (cur >= 0 && cur < words.length && t >= words[cur]!.start && t < words[cur]!.end) {
          next = cur;
        } else if (
          cur + 1 < words.length &&
          t >= words[cur + 1]!.start &&
          t < words[cur + 1]!.end
        ) {
          next = cur + 1;
        } else {
          for (let i = 0; i < words.length; i++) {
            if (t >= words[i]!.start && t < words[i]!.end) {
              next = i;
              break;
            }
          }
          // Après le dernier mot (fin de cue) : on garde le dernier allumé en
          // mode « remplissage », rien en mode « mot ».
          if (next === -1 && t >= words[words.length - 1]!.end) {
            next = words.length - 1;
          }
        }
      }
      if (next !== wordIdxRef.current) {
        wordIdxRef.current = next;
        setWordIdx(next);
      }
    },
    [clock],
  );

  // Boucle d'animation : ACTIVE UNIQUEMENT PENDANT LA LECTURE. Elle n'écrit rien
  // dans l'état React (hors changement de mot), donc son coût par image est de
  // l'ordre de la microseconde.
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) publish(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, publish]);

  // À l'arrêt, un changement de cue/animation doit quand même recaler le mot
  // surligné (ex. on se déplace sur la timeline, vidéo en pause).
  useEffect(() => {
    if (isPlaying) return;
    const v = videoRef.current;
    publish(v ? v.currentTime : clock?.time ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWords, style.animation, isPlaying]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else containerRef.current?.requestFullscreen?.();
  }, []);

  /** Révèle les contrôles puis les masque après inactivité (uniquement en lecture). */
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
    }, 2600);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const v = videoRef.current;
    if (!v) return;
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "ArrowRight") {
      v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
      publish(v.currentTime);
    } else if (e.key === "ArrowLeft") {
      v.currentTime = Math.max(0, v.currentTime - 5);
      publish(v.currentTime);
    } else if (e.key === "f") {
      toggleFullscreen();
    } else if (e.key === "m") {
      toggleMute();
    }
    revealControls();
  };

  const showVolumeMuted = muted || volume === 0;

  // Karaoké : actif si l'animation est demandée ET que des timings par mot sont
  // disponibles (sinon repli sur le texte simple — CJK, vidéos anciennes).
  const karaokeOn =
    style.animation !== "none" &&
    !!activeWords &&
    activeWords.length > 0 &&
    !!activeText;

  return (
    <div
      ref={containerRef}
      className={`ml-player relative flex items-center justify-center w-full h-full min-h-0 bg-ink-900 rounded-sm border-2 border-ink-900 overflow-hidden ${
        !controlsVisible && isPlaying ? "cursor-none" : ""
      }`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {videoUrl && !error ? (
        // Scène = toute la place disponible. On la MESURE, on n'en déduit rien
        // en vh : c'est elle qui décide de la taille du cadre.
        <div
          ref={stageRef}
          className="relative flex items-center justify-center w-full h-full min-h-0"
        >
          <div
            className="ml-player-inner relative"
            style={{
              width: frame.width || undefined,
              height: frame.height || undefined,
              // Repli tant que la mesure n'a pas eu lieu (1re image) : on garde
              // le format sans jamais dépasser la scène.
              ...(frame.width
                ? null
                : { aspectRatio: String(ratio), maxWidth: "100%", maxHeight: "100%" }),
              containerType: "inline-size",
            }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              preload="metadata"
              className="w-full h-full object-contain bg-ink-900 cursor-pointer"
              onClick={togglePlay}
              onLoadedMetadata={(e) => {
                const el = e.currentTarget;
                if (el.videoWidth > 0 && el.videoHeight > 0) {
                  setRatio(el.videoWidth / el.videoHeight);
                }
                setDuration(el.duration || 0);
              }}
              onDurationChange={(e) => setDuration(e.currentTarget.duration || 0)}
              onTimeUpdate={(e) => {
                const t = e.currentTarget.currentTime;
                // Événement natif (~4 Hz) : suffit à l'arrêt et pour les hôtes
                // qui n'utilisent pas l'horloge. Pendant la lecture, la boucle
                // d'animation publie déjà à la fréquence d'affichage.
                if (!isPlaying) publish(t);
                onTimeUpdate?.(t);
              }}
              onSeeked={(e) => {
                const t = e.currentTarget.currentTime;
                publish(t);
                onTimeUpdate?.(t);
              }}
              onPlay={() => {
                setIsPlaying(true);
                onPlayingChange?.(true);
                revealControls();
              }}
              onPause={() => {
                setIsPlaying(false);
                onPlayingChange?.(false);
                setControlsVisible(true);
              }}
              onEnded={() => {
                setIsPlaying(false);
                onPlayingChange?.(false);
                setControlsVisible(true);
              }}
              onVolumeChange={(e) => {
                setMuted(e.currentTarget.muted);
                setVolume(e.currentTarget.volume);
              }}
              onError={() => setError(true)}
            />

            {/* Fond « audio » (podcast) : pas de piste vidéo → visuel sobre, les
                sous-titres (et le karaoké) s'affichent par-dessus. */}
            {isAudio && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-900 pointer-events-none">
                <AudioLines
                  className={`h-14 w-14 text-ivory-50/35 ${isPlaying ? "animate-pulse" : ""}`}
                  strokeWidth={1.25}
                  aria-hidden
                />
              </div>
            )}

            {/* Sous-titre (overlay maison, au-dessus des contrôles) */}
            {activeText && (
              <div
                aria-live="polite"
                className={`absolute inset-x-0 flex justify-center px-3 pointer-events-none transition-[bottom] duration-200 ${
                  style.position === "center"
                    ? "top-1/2 -translate-y-1/2"
                    : style.position === "top"
                      ? "top-6"
                      : controlsVisible
                        ? "bottom-16"
                        : "bottom-6"
                }`}
              >
                <span
                  dir={rtl ? "rtl" : undefined}
                  className="ml-subtitle text-center whitespace-pre-line"
                  style={{ ...overlayStyleCss(style), ...speakerCss }}
                >
                  <SubtitleBody
                    text={activeText}
                    karaoke={karaokeOn}
                    wordIdx={wordIdx}
                    mode={style.animation}
                    highlight={highlightHex(style.highlight)}
                  />
                </span>
              </div>
            )}

            {/* Gros bouton lecture central (en pause) */}
            {!isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Lecture"
                className="absolute inset-0 m-auto h-16 w-16 inline-flex items-center justify-center rounded-full bg-rouge-500/90 text-ivory-50 hover:bg-rouge-500 transition-colors shadow-lg"
              >
                <Play className="h-7 w-7 translate-x-0.5" aria-hidden />
              </button>
            )}

            {/* Barre de contrôles maison */}
            <div
              className={`absolute inset-x-0 bottom-0 px-3 pb-2 pt-8 bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-transparent transition-opacity duration-200 ${
                controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Barre de progression : `defaultValue` + écriture DOM directe
                  (composant NON contrôlé). Contrôlée, elle imposait un rendu
                  React à chaque image de lecture. */}
              <input
                ref={seekBarRef}
                type="range"
                min={0}
                max={duration || 0}
                step="0.01"
                defaultValue={0}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (!v) return;
                  const t = Number(e.target.value);
                  v.currentTime = t;
                  publish(t);
                }}
                aria-label="Progression"
                className="w-full h-1 cursor-pointer"
                style={{ accentColor: "#C8392F" }}
              />
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause" : "Lecture"}
                  className="text-ivory-50 hover:text-rouge-400 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" aria-hidden />
                  ) : (
                    <Play className="h-5 w-5" aria-hidden />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={showVolumeMuted ? "Activer le son" : "Couper le son"}
                  className="text-ivory-50 hover:text-rouge-400 transition-colors"
                >
                  {showVolumeMuted ? (
                    <VolumeX className="h-5 w-5" aria-hidden />
                  ) : (
                    <Volume2 className="h-5 w-5" aria-hidden />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step="0.05"
                  value={showVolumeMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = videoRef.current;
                    if (v) {
                      const nv = Number(e.target.value);
                      v.volume = nv;
                      v.muted = nv === 0;
                    }
                  }}
                  aria-label="Volume"
                  className="w-16 h-1 cursor-pointer hidden sm:block"
                  style={{ accentColor: "#C8392F" }}
                />

                <span className="font-mono text-[11px] text-ivory-50 tabular-nums ml-0.5">
                  <span ref={clockLabelRef}>0:00</span> / {fmt(duration)}
                </span>

                <div className="ml-auto flex items-center gap-3">
                  {/* Menu « Sous-titres » : choix de la langue dans le lecteur */}
                  {langs && langs.length > 0 && onLangChange && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setCcOpen((o) => !o)}
                        aria-label="Langue des sous-titres"
                        aria-expanded={ccOpen}
                        className={`inline-flex items-center gap-1 transition-colors ${
                          ccOpen ? "text-rouge-400" : "text-ivory-50 hover:text-rouge-400"
                        }`}
                      >
                        {switchingLang ? (
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                        ) : (
                          <Languages className="h-5 w-5" aria-hidden />
                        )}
                        <span className="font-mono text-[10px] uppercase tracking-wide hidden sm:inline">
                          {currentLang ?? ""}
                        </span>
                      </button>
                      {ccOpen && (
                        <div
                          className="absolute bottom-full right-0 mb-2 w-52 max-h-64 overflow-y-auto rounded-sm border border-ink-700 bg-ink-900/95 backdrop-blur py-1 shadow-xl"
                          role="menu"
                        >
                          {langs.map((l) => {
                            const active = l.id === currentLang;
                            return (
                              <button
                                key={l.id}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onClick={() => {
                                  setCcOpen(false);
                                  if (!active) onLangChange(l.id);
                                }}
                                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                                  active
                                    ? "text-rouge-400"
                                    : "text-ivory-100 hover:bg-ink-800"
                                }`}
                              >
                                <span>{l.label}</span>
                                {active ? (
                                  <Check className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                                ) : l.ready ? (
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-success-500 flex-shrink-0"
                                    title="Prête"
                                  />
                                ) : (
                                  <span className="font-mono text-[9px] uppercase tracking-wide text-ink-400 flex-shrink-0">
                                    générer
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                    className="text-ivory-50 hover:text-rouge-400 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" aria-hidden />
                    ) : (
                      <Maximize className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-video w-full flex flex-col items-center justify-center text-ink-400 gap-3">
          <VideoOff className="h-8 w-8" strokeWidth={1.5} aria-hidden />
          <p className="text-sm font-mono uppercase tracking-widest">
            Aperçu vidéo indisponible
          </p>
        </div>
      )}
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
/**
 * Corps du sous-titre : texte simple, ou tokens surlignés (karaoké).
 * Mémoïsé et piloté par le SEUL index du mot courant → il ne se re-rend que
 * lorsque le mot change (deux ou trois fois par seconde).
 */
const SubtitleBody = memo(function SubtitleBody({
  text,
  karaoke,
  wordIdx,
  mode,
  highlight,
}: {
  text: string;
  karaoke: boolean;
  wordIdx: number;
  mode: SubtitleStyle["animation"];
  highlight: string;
}) {
  if (!karaoke) return <>{text}</>;

  const lines = text.split("\n");
  let idx = 0;
  return (
    <>
      {lines.map((line, li) => {
        const toks = line.trim().split(/\s+/).filter(Boolean);
        return (
          <Fragment key={li}>
            {li > 0 && <br />}
            {toks.map((tok, ti) => {
              const i = idx++;
              // « mot » : seul le mot courant est allumé.
              // « remplissage » : tous les mots déjà dits restent allumés.
              const on = mode === "word" ? i === wordIdx : wordIdx >= 0 && i <= wordIdx;
              const tokenStyle: CSSProperties = !on
                ? {}
                : mode === "word"
                  ? {
                      color: highlight,
                      display: "inline-block",
                      transform: "scale(1.06)",
                      transition: "transform 90ms ease-out",
                    }
                  : { color: highlight };
              return (
                <span key={ti} style={tokenStyle}>
                  {tok}
                  {ti < toks.length - 1 ? " " : ""}
                </span>
              );
            })}
          </Fragment>
        );
      })}
    </>
  );
});
