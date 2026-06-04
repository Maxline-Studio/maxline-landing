"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileVideo, AlertCircle, CheckCircle2, X } from "lucide-react";
import {
  validateVideoFile,
  readVideoDuration,
  fileExtension,
  formatDuration,
  MAX_DURATION_SECONDS,
} from "@/lib/storage";
import {
  createVideoUpload,
  createSourceUploadUrl,
  markVideoUploaded,
} from "@/lib/video-actions";
import { LANG_OPTIONS, langLabel, type Lang } from "@/lib/langs";

type Phase = "idle" | "validating" | "uploading" | "finalizing" | "done" | "error";

export function UploadClient({
  minutesAvailable,
}: {
  minutesAvailable: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  // "auto" = laisser le worker détecter la langue parlée (défaut).
  const [sourceLang, setSourceLang] = useState<Lang | "auto">("auto");
  const [targetLang, setTargetLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    duration: number;
    size: number;
  } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setPhase("validating");

      // 1. Validation format / taille
      const validationError = validateVideoFile(file);
      if (validationError) {
        setError(validationError);
        setPhase("error");
        return;
      }

      // 2. Lecture durée
      const duration = await readVideoDuration(file);
      if (duration === null) {
        setError(
          "Impossible de lire cette vidéo. Le fichier est peut-être corrompu.",
        );
        setPhase("error");
        return;
      }
      if (duration > MAX_DURATION_SECONDS) {
        setError(
          `Vidéo trop longue (${formatDuration(duration)}). Maximum : 30 minutes.`,
        );
        setPhase("error");
        return;
      }

      // 3. Garde quota côté client (le serveur revérifie)
      const neededMin = duration / 60;
      if (neededMin > minutesAvailable) {
        setError(
          `Quota insuffisant : ${minutesAvailable.toFixed(1)} min disponibles, cette vidéo en demande ${neededMin.toFixed(1)}.`,
        );
        setPhase("error");
        return;
      }

      setFileInfo({ name: file.name, duration, size: file.size });

      // 4. Création de la ligne video (serveur, garde quota)
      const ext = fileExtension(file.name);
      const result = await createVideoUpload({
        filename: file.name,
        durationSeconds: duration,
        sizeBytes: file.size,
        format: ext,
        sourceLang,
        targetLang,
      });

      if (!result.ok) {
        setError(result.error);
        setPhase("error");
        return;
      }

      // 5. Récupère une URL PUT présignée (Cloudflare R2) puis upload direct
      //    navigateur → R2 (avec progression XHR). Évite le plafond Supabase Free
      //    (50 Mo) et la limite de corps Vercel.
      setPhase("uploading");
      setProgress(0);

      const urlResult = await createSourceUploadUrl(result.videoId);
      if (!urlResult.ok) {
        setError(`Préparation de l'upload échouée : ${urlResult.error}`);
        setPhase("error");
        return;
      }

      try {
        await uploadWithProgress(file, urlResult.url, (pct) =>
          setProgress(pct),
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? `Échec de l'upload : ${e.message}`
            : "Échec de l'upload.",
        );
        setPhase("error");
        return;
      }

      // 6. Finalisation : déclenche le worker
      setPhase("finalizing");
      await markVideoUploaded(result.videoId);

      setPhase("done");
      // Redirige vers la page de suivi de la vidéo
      setTimeout(() => {
        router.push(`/app/videos/${result.videoId}`);
      }, 900);
    },
    [minutesAvailable, router, sourceLang, targetLang],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setPhase("idle");
    setProgress(0);
    setError(null);
    setFileInfo(null);
  };

  // ─── Rendu selon la phase ───
  const busy =
    phase === "validating" || phase === "uploading" || phase === "finalizing";

  return (
    <div>
      {phase === "idle" || phase === "error" ? (
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* Colonne gauche — choix des langues */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
                Langue parlée
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSourceLang("auto")}
                  className={`px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
                    sourceLang === "auto"
                      ? "border-rouge-500 bg-rouge-50 text-ink-900"
                      : "border-ivory-300 text-ink-600 hover:border-ink-400"
                  }`}
                >
                  Détection automatique
                </button>
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setSourceLang(o.id)}
                    className={`px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
                      sourceLang === o.id
                        ? "border-rouge-500 bg-rouge-50 text-ink-900"
                        : "border-ivory-300 text-ink-600 hover:border-ink-400"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
                Sous-titres en
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setTargetLang(o.id)}
                    className={`px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
                      targetLang === o.id
                        ? "border-rouge-500 bg-rouge-50 text-ink-900"
                        : "border-ivory-300 text-ink-600 hover:border-ink-400"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-ink-500">
              {sourceLang === "auto"
                ? `La langue parlée est détectée automatiquement → sous-titres en ${langLabel(targetLang)}.`
                : sourceLang === targetLang
                  ? `Transcription en ${langLabel(targetLang)} — sous-titres dans la langue parlée (idéal accessibilité).`
                  : `Traduction ${langLabel(sourceLang)} → ${langLabel(targetLang)}.`}
            </p>

            <p className="mt-auto pt-5 border-t border-ivory-300 text-sm text-ink-500 leading-relaxed">
              Un audio clair donne le meilleur résultat. Après le traitement, vous
              corrigez chaque ligne dans l&apos;éditeur.
            </p>
          </div>

          {/* Colonne droite — zone de dépôt (occupe toute la hauteur) */}
          <div className="flex flex-col">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative flex-1 flex flex-col items-center justify-center min-h-[340px] lg:min-h-[440px] cursor-pointer rounded-sm border-2 border-dashed transition-colors p-10 text-center ${
              dragOver
                ? "border-rouge-500 bg-rouge-50"
                : "border-ink-300 bg-ivory-100 hover:border-ink-900"
            }`}
          >
            <div className="inline-flex h-14 w-14 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center mb-5">
              <UploadCloud
                className="h-6 w-6 text-ink-900"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <p className="font-display font-medium text-xl text-ink-900 mb-2">
              Déposez votre vidéo ici
            </p>
            <p className="text-sm text-ink-600">
              ou{" "}
              <span className="text-rouge-500 font-semibold">
                cliquez pour parcourir
              </span>
            </p>
            <p className="mt-3 text-xs text-ink-400">
              MP4, MOV, AVI, MKV, WebM · jusqu&apos;à 1&nbsp;Go et 30&nbsp;min
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}
          </div>
        </div>
      ) : (
        <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-8">
          {/* Infos fichier */}
          {fileInfo && (
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 h-12 w-12 rounded-sm bg-ink-900 flex items-center justify-center">
                <FileVideo
                  className="h-6 w-6 text-rouge-400"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-ink-900 truncate">
                  {fileInfo.name}
                </p>
                <p className="text-xs text-ink-500 font-mono tabular-nums mt-0.5">
                  {formatDuration(fileInfo.duration)} ·{" "}
                  {(fileInfo.size / (1024 * 1024)).toFixed(1)} Mo
                </p>
              </div>
              {phase === "done" && (
                <CheckCircle2
                  className="h-6 w-6 text-rouge-500 flex-shrink-0"
                  aria-hidden
                />
              )}
            </div>
          )}

          {/* Barre de progression */}
          {busy && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  {phase === "validating" && "Validation…"}
                  {phase === "uploading" && "Envoi en cours…"}
                  {phase === "finalizing" && "Finalisation…"}
                </span>
                <span className="font-mono text-xs tabular-nums text-ink-900">
                  {phase === "uploading" ? `${progress}%` : ""}
                </span>
              </div>
              <div className="h-2 bg-ivory-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rouge-500 transition-all duration-200"
                  style={{
                    width:
                      phase === "uploading"
                        ? `${progress}%`
                        : phase === "finalizing"
                          ? "100%"
                          : "8%",
                  }}
                />
              </div>
            </>
          )}

          {phase === "done" && (
            <div className="flex items-center gap-2 text-sm text-rouge-700 font-medium">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Vidéo envoyée. Traduction en cours — redirection…
            </div>
          )}
        </div>
      )}

      {phase === "error" && fileInfo && (
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
        >
          <X className="h-4 w-4" aria-hidden />
          Réessayer avec une autre vidéo
        </button>
      )}
    </div>
  );
}

/**
 * Upload direct navigateur → Cloudflare R2 via XHR (pour la progression), sur une
 * URL PUT présignée (la signature est dans l'URL, aucun en-tête d'auth à fournir).
 */
async function uploadWithProgress(
  file: File,
  presignedUrl: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    if (file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${xhr.status} — ${xhr.responseText.slice(0, 120)}`));
      }
    };
    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload"));

    xhr.send(file);
  });
}
