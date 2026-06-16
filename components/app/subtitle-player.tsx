"use client";

import {
  forwardRef,
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
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

export type SubtitlePlayerHandle = {
  /** Place la lecture à `seconds` et démarre. */
  seekTo: (seconds: number) => void;
};

/** secondes → "m:ss". */
function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * Lecteur vidéo **maison** aux couleurs de l'Atelier (aucun contrôle natif, zéro
 * librairie). Cadre **adaptatif au format réel** (16:9, 9:16 vertical, 1:1…).
 * Sous-titres en overlay maison positionné au-dessus de la barre de contrôles.
 *
 * Plein écran : on met en plein écran le **conteneur** (pas l'élément <video>),
 * et la vidéo garde son format réel centré → l'overlay des sous-titres et les
 * contrôles restent dans le cadre de la vidéo, même pour une vidéo verticale.
 */
export const SubtitlePlayer = forwardRef<
  SubtitlePlayerHandle,
  {
    videoUrl: string | null;
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
    activeText,
    activeWords,
    activeSpeaker,
    multiSpeaker,
    rtl,
    subtitleStyle,
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ratio, setRatio] = useState(16 / 9);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [ccOpen, setCcOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      seekTo: (seconds: number) => {
        const v = videoRef.current;
        if (v) {
          v.currentTime = seconds;
          v.play().catch(() => {});
        }
      },
    }),
    [],
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

  // Karaoké : suivi du temps à la fréquence d'affichage (rAF) pendant la lecture,
  // pour un surlignage fluide (l'événement natif `timeupdate` n'est émis que
  // ~4 fois/s → mot-à-mot saccadé). Actif uniquement si une animation est demandée.
  useEffect(() => {
    if (!isPlaying || (subtitleStyle?.animation ?? "none") === "none") return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v) setCurrent(v.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, subtitleStyle?.animation]);

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
    } else if (e.key === "ArrowLeft") {
      v.currentTime = Math.max(0, v.currentTime - 5);
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

  /** Rend le sous-titre actif : tokens surlignés (karaoké) ou texte simple. */
  const renderSubtitle = () => {
    if (!karaokeOn) return activeText;
    const hl = highlightHex(style.highlight);
    const lines = activeText!.split("\n");
    let idx = 0;
    return lines.map((line, li) => {
      const toks = line.trim().split(/\s+/).filter(Boolean);
      return (
        <Fragment key={li}>
          {li > 0 && <br />}
          {toks.map((tok, ti) => {
            const w = activeWords![idx++];
            const on =
              !!w &&
              (style.animation === "word"
                ? current >= w.start && current < w.end
                : current >= w.start);
            const tokenStyle: CSSProperties = !on
              ? {}
              : style.animation === "word"
                ? {
                    color: hl,
                    display: "inline-block",
                    transform: "scale(1.06)",
                    transition: "transform 90ms ease-out",
                  }
                : { color: hl };
            return (
              <span key={ti} style={tokenStyle}>
                {tok}
                {ti < toks.length - 1 ? " " : ""}
              </span>
            );
          })}
        </Fragment>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className={`ml-player relative flex items-center justify-center bg-ink-900 rounded-sm border-2 border-ink-900 overflow-hidden ${
        !controlsVisible && isPlaying ? "cursor-none" : ""
      }`}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      {videoUrl && !error ? (
        <div
          className="ml-player-inner relative w-full max-h-[42vh] md:max-h-[70vh]"
          style={{
            aspectRatio: String(ratio),
            maxWidth: ratio < 1 ? `calc(70vh * ${ratio})` : undefined,
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
              setCurrent(t);
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
                style={{
                  ...overlayStyleCss(style),
                  ...speakerCss,
                }}
              >
                {renderSubtitle()}
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
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="0.01"
              value={current}
              onChange={(e) => {
                const v = videoRef.current;
                if (v) v.currentTime = Number(e.target.value);
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
                {fmt(current)} / {fmt(duration)}
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
