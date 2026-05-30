"use client";

import {
  forwardRef,
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
 * Lecteur vidéo + overlay de sous-titre, **adaptatif au format réel** de la
 * vidéo (16:9, 9:16 vertical, 1:1…). Le cadre épouse le ratio détecté (plus de
 * 16:9 forcé qui écrase une vidéo verticale), borné en hauteur pour rester
 * confortable. La taille de la police de l'overlay s'adapte à la LARGEUR du
 * lecteur (unités de conteneur `cqw`) pour ne jamais déborder sur un format
 * étroit. Composant partagé entre la page détail (aperçu) et l'éditeur.
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ratio, setRatio] = useState(16 / 9);
  const [error, setError] = useState(false);

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

  return (
    <div className="flex justify-center bg-ink-900 rounded-sm border-2 border-ink-900 overflow-hidden">
      {videoUrl && !error ? (
        <div
          className="relative w-full max-h-[42vh] md:max-h-[70vh]"
          style={{
            aspectRatio: String(ratio),
            // Empêche une vidéo verticale de s'étaler sur toute la largeur.
            maxWidth: ratio < 1 ? `calc(70vh * ${ratio})` : undefined,
            containerType: "inline-size",
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
            }}
            onTimeUpdate={(e) => onTimeUpdate?.(e.currentTarget.currentTime)}
            onPlay={() => onPlayingChange?.(true)}
            onPause={() => onPlayingChange?.(false)}
            onError={() => setError(true)}
          />
          {activeText && (
            <div className="absolute bottom-[7%] inset-x-0 flex justify-center px-3 pointer-events-none">
              <span
                className="bg-ink-900/85 text-ivory-50 rounded-sm text-center font-medium whitespace-pre-line"
                style={{
                  fontSize: "clamp(0.72rem, 4.4cqw, 1.4rem)",
                  padding: "0.3em 0.6em",
                  maxWidth: "92%",
                  lineHeight: 1.25,
                }}
              >
                {activeText}
              </span>
            </div>
          )}
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
