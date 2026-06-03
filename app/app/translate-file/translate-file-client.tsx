"use client";

import { useState, useRef, useCallback } from "react";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from "lucide-react";
import { translateSubtitleFile } from "@/lib/file-translate-actions";
import type { SubtitleFileFormat } from "@/lib/subtitle-parse";
import { LANG_OPTIONS, langLabel, type Lang } from "@/lib/langs";

type Phase = "idle" | "translating" | "done" | "error";

const ACCEPTED = ["srt", "vtt", "txt"] as const;
const MAX_BYTES = 2 * 1024 * 1024;

function extOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

export function TranslateFileClient({
  minutesAvailable,
}: {
  minutesAvailable: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sourceLang, setSourceLang] = useState<Lang>("fr");
  const [targetLang, setTargetLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<{
    content: string;
    billedMinutes: number;
    format: SubtitleFileFormat;
    outName: string;
  } | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setResult(null);

      const ext = extOf(file.name);
      if (!ACCEPTED.includes(ext as (typeof ACCEPTED)[number])) {
        setError("Format non supporté. Importez un fichier .srt, .vtt ou .txt.");
        setPhase("error");
        return;
      }
      if (file.size === 0 || file.size > MAX_BYTES) {
        setError("Fichier vide ou trop volumineux (max 2 Mo).");
        setPhase("error");
        return;
      }
      if (sourceLang === targetLang) {
        setError("Choisissez deux langues différentes pour traduire.");
        setPhase("error");
        return;
      }

      setFileName(file.name);
      setPhase("translating");

      const content = await file.text();
      const res = await translateSubtitleFile({
        filename: file.name,
        format: ext as SubtitleFileFormat,
        content,
        sourceLang,
        targetLang,
      });

      if (!res.ok) {
        setError(res.error);
        setPhase("error");
        return;
      }

      const base = file.name.replace(/\.[^.]+$/, "") || "sous-titres";
      setResult({
        content: res.content,
        billedMinutes: res.billedMinutes,
        format: res.format,
        outName: `${base}-${targetLang}.${res.format}`,
      });
      setPhase("done");
    },
    [sourceLang, targetLang],
  );

  const download = () => {
    if (!result) return;
    const mime =
      result.format === "vtt"
        ? "text/vtt"
        : result.format === "srt"
          ? "application/x-subrip"
          : "text/plain";
    const blob = new Blob([result.content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.outName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setPhase("idle");
    setError(null);
    setFileName(null);
    setResult(null);
  };

  if (phase === "done" && result) {
    return (
      <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0 h-12 w-12 rounded-sm bg-ink-900 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-rouge-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-ink-900">
              Traduction terminée.
            </p>
            <p className="text-xs text-ink-500 font-mono mt-0.5">
              {fileName} · {result.billedMinutes} min décomptées ·{" "}
              {langLabel(sourceLang)} → {langLabel(targetLang)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={download}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rouge-500 border-2 border-rouge-500 rounded-sm text-sm font-semibold text-ivory-50 hover:bg-rouge-600 transition-colors"
          >
            <Download className="h-4 w-4" aria-hidden />
            Télécharger .{result.format}
          </button>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
          >
            Traduire un autre fichier
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
      {/* Colonne gauche — langues */}
      <div className="flex flex-col gap-5">
        <div>
          <span className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-2">
            Langue du fichier
          </span>
          <div className="flex flex-wrap gap-1.5">
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
            Traduire en
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

        <p className="mt-auto pt-5 border-t border-ivory-300 text-sm text-ink-500 leading-relaxed">
          Facturation : .srt/.vtt selon la durée des sous-titres ; .txt selon le
          volume de texte (~1000 caractères/minute). Registre et ton préservés.
        </p>
      </div>

      {/* Colonne droite — dépôt / progression */}
      <div className="flex flex-col">
      {phase === "translating" ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[340px] lg:min-h-[440px] rounded-sm border-2 border-ink-300 bg-ivory-100 p-12 text-center">
          <Loader2 className="h-8 w-8 text-rouge-500 animate-spin mx-auto mb-4" aria-hidden />
          <p className="font-display font-medium text-ink-900">
            Traduction en cours…
          </p>
          <p className="text-sm text-ink-500 mt-1">{fileName}</p>
        </div>
      ) : (
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
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`relative flex-1 flex flex-col items-center justify-center min-h-[340px] lg:min-h-[440px] cursor-pointer rounded-sm border-2 border-dashed transition-colors p-10 text-center ${
            dragOver
              ? "border-rouge-500 bg-rouge-50"
              : "border-ink-300 bg-ivory-100 hover:border-ink-900"
          }`}
        >
          <div className="inline-flex h-14 w-14 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center mb-5">
            <FileText className="h-6 w-6 text-ink-900" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="font-display font-medium text-xl text-ink-900 mb-2">
            Déposez votre fichier de sous-titres
          </p>
          <p className="text-sm text-ink-600">
            ou{" "}
            <span className="text-rouge-500 font-semibold">
              cliquez pour parcourir
            </span>{" "}
            · .srt, .vtt, .txt
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".srt,.vtt,.txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 p-3 bg-rouge-50 border border-rouge-200 rounded-sm text-sm text-rouge-700"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {phase === "error" && (
        <button
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
        >
          <X className="h-4 w-4" aria-hidden />
          Réessayer
        </button>
      )}

      {minutesAvailable <= 0 && phase === "idle" && (
        <p className="mt-4 text-sm text-ink-500">
          Vous n&apos;avez plus de minutes disponibles.
        </p>
      )}
      </div>
    </div>
  );
}
