"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileVideo,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
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

type Phase =
  | "idle"
  | "validating"
  | "configure"
  | "uploading"
  | "finalizing"
  | "done";

export function UploadClient({
  minutesAvailable,
}: {
  minutesAvailable: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  // Cible : "same" = sous-titres dans la langue parlée (transcription) = défaut.
  const [targetLang, setTargetLang] = useState<Lang | "same">("same");
  // Langue parlée : "auto" (détection) par défaut. Override via « Avancé ».
  const [sourceLang, setSourceLang] = useState<Lang | "auto">("auto");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    duration: number;
    size: number;
  } | null>(null);

  // ── 1. Sélection du fichier (validation + durée), AVANT tout choix de langue ──
  const handleSelect = useCallback(
    async (f: File) => {
      setError(null);
      setPhase("validating");

      const validationError = validateVideoFile(f);
      if (validationError) {
        setError(validationError);
        setPhase("idle");
        return;
      }

      const duration = await readVideoDuration(f);
      if (duration === null) {
        setError(
          "Impossible de lire cette vidéo. Le fichier est peut-être corrompu.",
        );
        setPhase("idle");
        return;
      }
      if (duration > MAX_DURATION_SECONDS) {
        setError(
          `Vidéo trop longue (${formatDuration(duration)}). Maximum : 30 minutes.`,
        );
        setPhase("idle");
        return;
      }

      const neededMin = duration / 60;
      if (neededMin > minutesAvailable) {
        setError(
          `Quota insuffisant : ${minutesAvailable.toFixed(1)} min disponibles, cette vidéo en demande ${neededMin.toFixed(1)}.`,
        );
        setPhase("idle");
        return;
      }

      setFile(f);
      setFileInfo({ name: f.name, duration, size: f.size });
      setPhase("configure");
    },
    [minutesAvailable],
  );

  // ── 2. Lancement : création de la ligne + upload R2 + déclenchement worker ──
  const handleGenerate = useCallback(async () => {
    if (!file || !fileInfo || submitting) return; // garde anti double-soumission
    setSubmitting(true);
    setError(null);

    const ext = fileExtension(file.name);
    const result = await createVideoUpload({
      filename: file.name,
      durationSeconds: fileInfo.duration,
      sizeBytes: file.size,
      format: ext,
      sourceLang,
      targetLang,
    });
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return; // reste en "configure" pour réessayer
    }

    setPhase("uploading");
    setProgress(0);

    const urlResult = await createSourceUploadUrl(result.videoId);
    if (!urlResult.ok) {
      setError(`Préparation de l'upload échouée : ${urlResult.error}`);
      setPhase("configure");
      setSubmitting(false);
      return;
    }

    try {
      await uploadWithProgress(file, urlResult.url, (pct) => setProgress(pct));
    } catch (e) {
      setError(
        e instanceof Error
          ? `Échec de l'upload : ${e.message}`
          : "Échec de l'upload.",
      );
      setPhase("configure");
      setSubmitting(false);
      return;
    }

    setPhase("finalizing");
    await markVideoUploaded(result.videoId);

    setPhase("done");
    setTimeout(() => {
      router.push(`/app/videos/${result.videoId}`);
    }, 900);
  }, [file, fileInfo, sourceLang, targetLang, submitting, router]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSelect(f);
  };

  const reset = () => {
    setPhase("idle");
    setProgress(0);
    setError(null);
    setFile(null);
    setFileInfo(null);
    setAdvancedOpen(false);
    setSubmitting(false);
  };

  const busy = phase === "uploading" || phase === "finalizing";

  // Phrase explicative selon les choix.
  const helperText =
    targetLang === "same"
      ? "Sous-titres dans la langue parlée — parfait pour rendre votre vidéo accessible."
      : sourceLang === "auto"
        ? `Traduction vers ${langLabel(targetLang)} — la langue parlée est détectée automatiquement.`
        : sourceLang === targetLang
          ? `Transcription en ${langLabel(targetLang)}.`
          : `Traduction ${langLabel(sourceLang)} → ${langLabel(targetLang)}.`;

  // ─── Rendu ───
  return (
    <div>
      {/* Étape 1 — Dépôt (le premier geste). */}
      {(phase === "idle" || phase === "validating") && (
        <div>
          <div
            role="button"
            tabIndex={0}
            aria-busy={phase === "validating"}
            onClick={() => phase === "idle" && inputRef.current?.click()}
            onKeyDown={(e) => {
              if (phase === "idle" && (e.key === "Enter" || e.key === " "))
                inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative flex flex-col items-center justify-center min-h-[360px] lg:min-h-[440px] cursor-pointer rounded-sm border-2 border-dashed transition-colors p-10 text-center ${
              dragOver
                ? "border-rouge-500 bg-rouge-50"
                : "border-ink-300 bg-ivory-100 hover:border-ink-900"
            }`}
          >
            {phase === "validating" ? (
              <>
                <Loader2
                  className="h-7 w-7 text-rouge-500 animate-spin mb-4"
                  aria-hidden
                />
                <p className="font-display font-medium text-lg text-ink-900">
                  Lecture de la vidéo…
                </p>
              </>
            ) : (
              <>
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
                <p className="mt-1 text-xs text-ink-400">
                  Vous choisirez la langue des sous-titres juste après.
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleSelect(f);
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
      )}

      {/* Étape 2 — Configuration (après dépôt) : une seule décision visible. */}
      {phase === "configure" && fileInfo && (
        <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-8">
          {/* Fichier déposé */}
          <div className="flex items-start gap-4 mb-7">
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
            <button
              onClick={reset}
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Changer
            </button>
          </div>

          {/* Langue des sous-titres (l'unique vraie décision) */}
          <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
            Sous-titres en
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTargetLang("same")}
              className={`px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
                targetLang === "same"
                  ? "border-rouge-500 bg-rouge-50 text-ink-900"
                  : "border-ivory-300 text-ink-600 hover:border-ink-400"
              }`}
            >
              Dans la langue parlée
            </button>
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

          <p className="text-xs text-ink-500 mt-3">{helperText}</p>

          {/* Avancé — préciser la langue parlée (rare, replié par défaut) */}
          <div className="mt-5 pt-5 border-t border-ivory-300">
            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-900 transition-colors"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
              Avancé · préciser la langue parlée
            </button>

            {advancedOpen && (
              <div className="mt-3">
                <p className="text-xs text-ink-500 mb-2">
                  Par défaut, la langue parlée est détectée automatiquement.
                  Précisez-la seulement si la détection se trompe (clip très
                  court, fort accent…).
                </p>
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
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          {/* Action */}
          <div className="mt-7 flex items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-ink-900 text-ivory-50 px-5 py-2.5 rounded-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <UploadCloud className="h-4 w-4" aria-hidden />
              )}
              Générer les sous-titres
            </button>
            <span className="text-xs text-ink-400 font-mono tabular-nums">
              {Math.ceil(fileInfo.duration / 60)} min
            </span>
          </div>
        </div>
      )}

      {/* Étape 3 — Envoi / finalisation. */}
      {(busy || phase === "done") && (
        <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-8">
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

          {busy && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
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
              Vidéo envoyée. Traitement en cours — redirection…
            </div>
          )}
        </div>
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
