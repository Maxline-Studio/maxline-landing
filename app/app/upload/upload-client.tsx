"use client";

/**
 * Dépôt d'une vidéo — envoi EN ARRIÈRE-PLAN dès le dépôt.
 *
 * Avant : dépôt → choix de la langue → clic « Générer » → *et seulement là*
 * l'upload démarrait. Le choix de la langue prend 5 à 20 secondes : autant de
 * bande passante offerte, puis une longue barre de progression.
 *
 * Maintenant : l'envoi part à la seconde où le fichier est déposé, pendant que
 * l'utilisateur choisit sa langue (comme Loom, Dropbox ou WeTransfer). Sur un
 * fichier de 200 Mo en fibre, l'envoi est souvent DÉJÀ TERMINÉ au moment du clic
 * — la vidéo part alors en traitement instantanément.
 *
 * Aucune minute n'est consommée tant que « Générer » n'a pas été cliqué : tant
 * que `storage_key_source` est vide, la vidéo est invisible pour le worker. Un
 * fichier déposé puis abandonné est nettoyé (cancelVideoUpload).
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileVideo,
  FileAudio,
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
  isAudioFile,
  MAX_DURATION_SECONDS,
} from "@/lib/storage";
import {
  startVideoUpload,
  finalizeVideoUpload,
  cancelVideoUpload,
} from "@/lib/video-actions";
import { LANG_OPTIONS, langLabel, type Lang } from "@/lib/langs";

type Phase = "idle" | "validating" | "configure" | "finalizing" | "done";

/** État de l'envoi de fichier, mené en tâche de fond. */
type Transfer =
  | { state: "idle" }
  | { state: "uploading"; videoId: string; pct: number }
  | { state: "uploaded"; videoId: string }
  | { state: "error"; videoId: string | null; message: string };

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
  // Noms propres à respecter (marques/prénoms/noms/URLs) — corrige l'ASR.
  const [importantTerms, setImportantTerms] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<Transfer>({ state: "idle" });
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    duration: number;
    size: number;
    audio: boolean;
  } | null>(null);

  // Miroir synchrone de `transfer` : `handleGenerate` doit pouvoir consulter
  // l'état d'envoi en cours sans dépendre d'un rendu React.
  const transferRef = useRef<Transfer>({ state: "idle" });
  const setTransferBoth = useCallback((t: Transfer) => {
    transferRef.current = t;
    setTransfer(t);
  }, []);

  // Requête d'envoi en cours (pour l'annuler si l'utilisateur change de fichier).
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  // Id de la vidéo en brouillon, pour le nettoyage.
  const draftIdRef = useRef<string | null>(null);
  // Empêche le nettoyage après un départ en traitement réussi.
  const committedRef = useRef(false);

  /** Abandonne le brouillon en cours (changement de fichier, départ de la page). */
  const discardDraft = useCallback(() => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    const id = draftIdRef.current;
    draftIdRef.current = null;
    if (id && !committedRef.current) void cancelVideoUpload(id);
  }, []);

  // Nettoyage si l'utilisateur quitte la page avec un brouillon non validé.
  useEffect(() => {
    return () => {
      if (!committedRef.current) discardDraft();
    };
  }, [discardDraft]);

  // ── 1. Sélection du fichier : validation, PUIS envoi immédiat en tâche de fond ──
  const handleSelect = useCallback(
    async (f: File) => {
      discardDraft();
      committedRef.current = false;
      setError(null);
      setTransferBoth({ state: "idle" });
      setPhase("validating");

      const validationError = validateVideoFile(f);
      if (validationError) {
        setError(validationError);
        setPhase("idle");
        return;
      }

      const audio = isAudioFile(f);
      const duration = await readVideoDuration(f);
      if (duration === null) {
        setError(
          `Impossible de lire ce fichier ${audio ? "audio" : "vidéo"}. Il est peut-être corrompu.`,
        );
        setPhase("idle");
        return;
      }
      if (duration > MAX_DURATION_SECONDS) {
        setError(
          `Fichier trop long (${formatDuration(duration)}). Maximum : 30 minutes.`,
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

      setFileInfo({ name: f.name, duration, size: f.size, audio });
      setPhase("configure");

      // ── L'envoi part MAINTENANT, pendant que l'utilisateur choisit sa langue ──
      const started = await startVideoUpload({
        filename: f.name,
        durationSeconds: duration,
        sizeBytes: f.size,
        format: fileExtension(f.name),
      });
      if (!started.ok) {
        setTransferBoth({
          state: "error",
          videoId: null,
          message: started.error,
        });
        return;
      }

      draftIdRef.current = started.videoId;
      setTransferBoth({ state: "uploading", videoId: started.videoId, pct: 0 });

      try {
        await uploadWithProgress(f, started.uploadUrl, xhrRef, (pct) => {
          const cur = transferRef.current;
          if (cur.state === "uploading" && cur.videoId === started.videoId) {
            setTransferBoth({ ...cur, pct });
          }
        });
        setTransferBoth({ state: "uploaded", videoId: started.videoId });
      } catch (e) {
        if (e instanceof Error && e.message === "aborted") return; // changement de fichier
        setTransferBoth({
          state: "error",
          videoId: started.videoId,
          message:
            e instanceof Error ? e.message : "Échec de l'envoi du fichier.",
        });
      }
    },
    [minutesAvailable, discardDraft, setTransferBoth],
  );

  // ── 2. Lancement : on attend la fin de l'envoi si besoin, puis on finalise ──
  const handleGenerate = useCallback(async () => {
    if (!fileInfo || submitting) return;
    if (transfer.state === "error") {
      setError(transfer.message);
      return;
    }
    setSubmitting(true);
    setError(null);
    setPhase("finalizing");

    // L'envoi tourne peut-être encore : on patiente ici (la barre reste visible).
    const videoId = await waitForUpload();
    if (!videoId) {
      setError("L'envoi du fichier n'a pas abouti. Réessayez.");
      setPhase("configure");
      setSubmitting(false);
      return;
    }

    const res = await finalizeVideoUpload(videoId, {
      sourceLang,
      targetLang,
      importantTerms,
    });
    if (!res.ok) {
      setError(res.error);
      setPhase("configure");
      setSubmitting(false);
      return;
    }

    committedRef.current = true;
    setPhase("done");
    router.push(`/app/videos/${videoId}`);

    /** Résout dès que l'envoi est terminé (ou null en cas d'échec). */
    function waitForUpload(): Promise<string | null> {
      return new Promise((resolve) => {
        const check = () => {
          const t = transferRef.current;
          if (t.state === "uploaded") resolve(t.videoId);
          else if (t.state === "error") resolve(null);
          else setTimeout(check, 150);
        };
        check();
      });
    }
  }, [
    fileInfo,
    submitting,
    transfer,
    sourceLang,
    targetLang,
    importantTerms,
    router,
  ]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSelect(f);
  };

  const reset = () => {
    discardDraft();
    setPhase("idle");
    setError(null);
    setFileInfo(null);
    setTransferBoth({ state: "idle" });
    setAdvancedOpen(false);
    setSubmitting(false);
  };

  // Phrase explicative selon les choix.
  const helperText =
    targetLang === "same"
      ? "Sous-titres dans la langue parlée, parfait pour rendre votre contenu accessible."
      : sourceLang === "auto"
        ? `Traduction vers ${langLabel(targetLang)} : la langue parlée est détectée automatiquement.`
        : sourceLang === targetLang
          ? `Transcription en ${langLabel(targetLang)}.`
          : `Traduction ${langLabel(sourceLang)} → ${langLabel(targetLang)}.`;

  // ─── Rendu ───
  return (
    <div>
      {/* Étape 1, Dépôt (le premier geste). */}
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
                  Déposez votre vidéo ou audio ici
                </p>
                <p className="text-sm text-ink-600">
                  ou{" "}
                  <span className="text-rouge-500 font-semibold">
                    cliquez pour parcourir
                  </span>
                </p>
                <p className="mt-3 text-xs text-ink-400">
                  Vidéo (MP4, MOV, AVI, MKV, WebM) ou audio/podcast (MP3, WAV,
                  M4A, AAC, OGG, FLAC) · jusqu&apos;à 1&nbsp;Go et 30&nbsp;min
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  L&apos;envoi démarre tout de suite, vous choisissez la langue
                  pendant ce temps.
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm,.mp4,.mov,.avi,.mkv,.webm,audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.opus,.weba"
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

      {/* Étape 2, Configuration (l'envoi tourne en fond). */}
      {(phase === "configure" || phase === "finalizing" || phase === "done") &&
        fileInfo && (
          <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-8">
            {/* Fichier déposé + état de l'envoi */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 h-12 w-12 rounded-sm bg-ink-900 flex items-center justify-center">
                {fileInfo.audio ? (
                  <FileAudio
                    className="h-6 w-6 text-rouge-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                ) : (
                  <FileVideo
                    className="h-6 w-6 text-rouge-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
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
              {phase === "configure" && (
                <button
                  onClick={reset}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Changer
                </button>
              )}
            </div>

            <TransferStatus transfer={transfer} />

            {phase === "configure" && (
              <>
                {/* Langue des sous-titres (l'unique vraie décision) */}
                <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2 mt-6">
                  Sous-titres en
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetLang("same")}
                    className={chipCls(targetLang === "same")}
                  >
                    Dans la langue parlée
                  </button>
                  {LANG_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setTargetLang(o.id)}
                      className={chipCls(targetLang === o.id)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>

                <p className="text-xs text-ink-500 mt-3">{helperText}</p>

                {/* Noms propres à respecter (optionnel) */}
                <div className="mt-5">
                  <label
                    htmlFor="important-terms"
                    className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2"
                  >
                    Noms propres à respecter{" "}
                    <span className="text-ink-400 normal-case tracking-normal">
                      (optionnel)
                    </span>
                  </label>
                  <input
                    id="important-terms"
                    type="text"
                    value={importantTerms}
                    onChange={(e) => setImportantTerms(e.target.value)}
                    placeholder="ex. Maxline Studio, maxlinestudio.fr, Maxence"
                    className="w-full px-3 py-2 rounded-sm border border-ivory-300 bg-ivory-50 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
                  />
                  <p className="text-xs text-ink-500 mt-1.5">
                    Marques, prénoms, noms, pseudos, sites… On les écrit
                    exactement, et on ne les traduit pas.
                  </p>
                </div>

                {/* Avancé, préciser la langue parlée */}
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
                        Par défaut, la langue parlée est détectée
                        automatiquement. Précisez-la seulement si la détection se
                        trompe (clip très court, fort accent…).
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSourceLang("auto")}
                          className={chipCls(sourceLang === "auto")}
                        >
                          Détection automatique
                        </button>
                        {LANG_OPTIONS.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setSourceLang(o.id)}
                            className={chipCls(sourceLang === o.id)}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
              >
                <AlertCircle
                  className="h-4 w-4 mt-0.5 flex-shrink-0"
                  aria-hidden
                />
                <span>{error}</span>
              </div>
            )}

            {/* Action */}
            {phase !== "done" ? (
              <div className="mt-7 flex items-center gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={submitting || transfer.state === "error"}
                  className="inline-flex items-center gap-2 bg-ink-900 text-ivory-50 px-5 py-2.5 rounded-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <UploadCloud className="h-4 w-4" aria-hidden />
                  )}
                  {submitting ? "Envoi en cours…" : "Générer les sous-titres"}
                </button>
                <span className="text-xs text-ink-400 font-mono tabular-nums">
                  {Math.ceil(fileInfo.duration / 60)} min
                </span>
              </div>
            ) : (
              <div className="mt-7 flex items-center gap-2 text-sm text-rouge-700 font-medium">
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Vidéo envoyée. Traitement en cours, redirection…
              </div>
            )}
          </div>
        )}
    </div>
  );
}

/** Bandeau d'état de l'envoi (barre, « fichier prêt », erreur). */
function TransferStatus({ transfer }: { transfer: Transfer }) {
  if (transfer.state === "idle") {
    return (
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
        Préparation de l&apos;envoi…
      </p>
    );
  }

  if (transfer.state === "uploading") {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Envoi en cours, vous pouvez choisir votre langue
          </span>
          <span className="font-mono text-xs tabular-nums text-ink-900">
            {transfer.pct}%
          </span>
        </div>
        <div className="h-2 bg-ivory-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-rouge-500 transition-all duration-200"
            style={{ width: `${transfer.pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (transfer.state === "uploaded") {
    return (
      <p className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-600">
        <CheckCircle2 className="h-3.5 w-3.5 text-rouge-500" aria-hidden />
        Fichier prêt, le traitement démarrera dès validation
      </p>
    );
  }

  return (
    <p
      role="alert"
      className="inline-flex items-start gap-1.5 text-xs text-rouge-700"
    >
      <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden />
      Envoi interrompu : {transfer.message}. Cliquez « Changer » pour redéposer
      le fichier.
    </p>
  );
}

const chipCls = (active: boolean) =>
  `px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
    active
      ? "border-rouge-500 bg-rouge-50 text-ink-900"
      : "border-ivory-300 text-ink-600 hover:border-ink-400"
  }`;

/**
 * Upload direct navigateur → Cloudflare R2 via XHR (pour la progression), sur une
 * URL PUT présignée (la signature est dans l'URL, aucun en-tête d'auth à fournir).
 * La requête est exposée via `ref` pour pouvoir être annulée si l'utilisateur
 * change de fichier en cours de route.
 */
function uploadWithProgress(
  file: File,
  presignedUrl: string,
  ref: React.MutableRefObject<XMLHttpRequest | null>,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    ref.current = xhr;
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
      ref.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`HTTP ${xhr.status}, ${xhr.responseText.slice(0, 120)}`));
      }
    };
    xhr.onerror = () => {
      ref.current = null;
      reject(new Error("erreur réseau pendant l'envoi"));
    };
    xhr.onabort = () => {
      ref.current = null;
      reject(new Error("aborted"));
    };

    xhr.send(file);
  });
}
