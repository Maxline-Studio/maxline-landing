"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  VideoOff,
} from "lucide-react";

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
    onTimeUpdate?: (seconds: number) => void;
    onPlayingChange?: (playing: boolean) => void;
  }
>(function SubtitlePlayer(
  { videoUrl, activeText, onTimeUpdate, onPlayingChange },
  ref,
) {
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
                controlsVisible ? "bottom-16" : "bottom-6"
              }`}
            >
              <span
                className="ml-subtitle bg-ink-900/85 text-ivory-50 rounded-sm text-center font-medium whitespace-pre-line"
                style={{
                  fontSize: "clamp(0.75rem, 3.2cqw, 1.05rem)",
                  padding: "0.25em 0.6em",
                  maxWidth: "92%",
                  lineHeight: 1.3,
                }}
              >
                {activeText}
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

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                className="ml-auto text-ivory-50 hover:text-rouge-400 transition-colors"
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
