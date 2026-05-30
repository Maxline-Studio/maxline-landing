"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { VideoOff } from "lucide-react";

export type SubtitlePlayerHandle = {
  /** Place la lecture à `seconds` et démarre. */
  seekTo: (seconds: number) => void;
};

/**
 * Lecteur vidéo **adaptatif au format réel** (16:9, 9:16 vertical, 1:1…) avec
 * sous-titres **natifs** (piste WebVTT). Les sous-titres natifs se placent
 * automatiquement au-dessus de la barre de contrôles ET s'affichent en plein
 * écran (contrairement à un overlay HTML). Style des sous-titres : voir la règle
 * `video::cue` dans globals.css (couleurs Atelier). Composant partagé entre la
 * page détail (aperçu) et l'éditeur.
 *
 * La piste VTT est générée côté client (prop `vtt`) à partir des segments, donc
 * elle reste synchronisée avec les retouches dans l'éditeur.
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ratio, setRatio] = useState(16 / 9);
  const [error, setError] = useState(false);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);

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

  // URL blob VTT pour la piste de sous-titres native (régénérée si le texte change).
  useEffect(() => {
    if (!vtt) {
      setTrackUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
    setTrackUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [vtt]);

  /** Force l'affichage de la piste (les pistes ajoutées dynamiquement sont
   * parfois en mode "disabled" par défaut). */
  const showTrack = () => {
    const v = videoRef.current;
    if (v && v.textTracks.length > 0) {
      v.textTracks[0]!.mode = "showing";
    }
  };

  // Réaffirme l'affichage quand la piste change.
  useEffect(() => {
    if (!trackUrl) return;
    const t = setTimeout(showTrack, 50);
    return () => clearTimeout(t);
  }, [trackUrl]);

  return (
    <div className="flex justify-center bg-ink-900 rounded-sm border-2 border-ink-900 overflow-hidden">
      {videoUrl && !error ? (
        <div
          className="relative w-full max-h-[42vh] md:max-h-[70vh]"
          style={{
            aspectRatio: String(ratio),
            // Empêche une vidéo verticale de s'étaler sur toute la largeur.
            maxWidth: ratio < 1 ? `calc(70vh * ${ratio})` : undefined,
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            controls
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
