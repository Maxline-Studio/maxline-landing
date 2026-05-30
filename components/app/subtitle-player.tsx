"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { VideoOff, Maximize, Minimize } from "lucide-react";

export type SubtitlePlayerHandle = {
  /** Place la lecture à `seconds` et démarre. */
  seekTo: (seconds: number) => void;
};

/**
 * Lecteur vidéo **adaptatif au format réel** (16:9, 9:16 vertical, 1:1…) avec
 * sous-titres **natifs** (piste WebVTT). Les sous-titres natifs se placent
 * automatiquement au-dessus de la barre de contrôles ET s'affichent en plein
 * écran. Style : voir `video::cue` dans globals.css (couleurs Atelier).
 *
 * Plein écran : on met en plein écran le **conteneur** (pas l'élément <video>)
 * via un bouton maison (`controlsList="nofullscreen"` retire le bouton natif).
 * En plein écran, la vidéo garde son format réel, centrée → l'élément <video>
 * a la taille du contenu, donc les sous-titres natifs restent dans le cadre de
 * la vidéo (au lieu de déborder sur les bandes noires d'un format forcé 16:9).
 *
 * La piste VTT est générée côté client (prop `vtt`) à partir des segments.
 */
export const SubtitlePlayer = forwardRef<
  SubtitlePlayerHandle,
  {
    videoUrl: string | null;
    vtt: string | null;
    onTimeUpdate?: (seconds: number) => void;
    onPlayingChange?: (playing: boolean) => void;
  }
>(function SubtitlePlayer(
  { videoUrl, vtt, onTimeUpdate, onPlayingChange },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ratio, setRatio] = useState(16 / 9);
  const [error, setError] = useState(false);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // URL blob VTT pour la piste native (régénérée si le texte change).
  useEffect(() => {
    if (!vtt) {
      setTrackUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
    setTrackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [vtt]);

  const showTrack = () => {
    const v = videoRef.current;
    if (v && v.textTracks.length > 0) {
      v.textTracks[0]!.mode = "showing";
    }
  };

  useEffect(() => {
    if (!trackUrl) return;
    const t = setTimeout(showTrack, 50);
    return () => clearTimeout(t);
  }, [trackUrl]);

  // Suivi de l'état plein écran (du conteneur).
  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      containerRef.current?.requestFullscreen?.();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="ml-player flex items-center justify-center bg-ink-900 rounded-sm border-2 border-ink-900 overflow-hidden"
    >
      {videoUrl && !error ? (
        <div
          className="ml-player-inner relative w-full max-h-[42vh] md:max-h-[70vh]"
          style={{
            aspectRatio: String(ratio),
            maxWidth: ratio < 1 ? `calc(70vh * ${ratio})` : undefined,
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            controlsList="nofullscreen"
            playsInline
            preload="metadata"
            className="w-full h-full object-contain bg-ink-900"
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              if (el.videoWidth > 0 && el.videoHeight > 0) {
                setRatio(el.videoWidth / el.videoHeight);
              }
              showTrack();
            }}
            onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
            onPlay={() => onPlayingChange?.(true)}
            onPause={() => onPlayingChange?.(false)}
            onError={() => setError(true)}
          >
            {trackUrl && (
              <track
                default
                kind="subtitles"
                srcLang="en"
                label="English"
                src={trackUrl}
                onLoad={showTrack}
              />
            )}
          </video>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className="absolute top-2 right-2 inline-flex items-center justify-center h-8 w-8 rounded-sm bg-ink-900/70 text-ivory-50 hover:bg-ink-900 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden />
            )}
          </button>
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
