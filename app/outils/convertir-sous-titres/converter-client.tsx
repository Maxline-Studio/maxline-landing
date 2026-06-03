"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, Download, Copy, Check, ArrowRight, FileText } from "lucide-react";
import { parseSubtitleFile, type SubtitleFileFormat } from "@/lib/subtitle-parse";
import { generateSubtitles, SUBTITLE_MIME } from "@/lib/subtitles";

const FORMATS: { id: SubtitleFileFormat; label: string; ext: string }[] = [
  { id: "srt", label: "SRT", ext: ".srt" },
  { id: "vtt", label: "VTT", ext: ".vtt" },
  { id: "txt", label: "TXT", ext: ".txt" },
];

/** Devine le format d'après l'extension du nom de fichier, sinon le contenu. */
function detectFormat(filename: string, content: string): SubtitleFileFormat {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "srt" || ext === "vtt" || ext === "txt") return ext;
  if (/^﻿?WEBVTT/.test(content)) return "vtt";
  if (/-->/.test(content)) return "srt";
  return "txt";
}

/**
 * Convertisseur de sous-titres 100 % navigateur (aucun envoi, aucune IA, 0 €).
 * Dépose ou colle un .srt/.vtt/.txt → choisis le format de sortie → télécharge.
 * Réutilise les fonctions PURES parseSubtitleFile + generateSubtitles.
 */
export function SubtitleConverter() {
  const [input, setInput] = useState("");
  const [inFormat, setInFormat] = useState<SubtitleFileFormat>("srt");
  const [outFormat, setOutFormat] = useState<SubtitleFileFormat>("vtt");
  const [filename, setFilename] = useState("sous-titres");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      const base = file.name.replace(/\.[^.]+$/, "") || "sous-titres";
      setFilename(base);
      setInput(content);
      setInFormat(detectFormat(file.name, content));
      setError(null);
    };
    reader.onerror = () => setError("Lecture du fichier impossible.");
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  // Conversion (mémoïsée) : parse le format d'entrée → régénère dans le format de sortie.
  const { output, segCount, convertError } = useMemo(() => {
    if (!input.trim()) return { output: "", segCount: 0, convertError: null };
    try {
      const parsed = parseSubtitleFile(input, inFormat);
      if (parsed.segments.length === 0) {
        return {
          output: "",
          segCount: 0,
          convertError: "Aucun sous-titre lisible. Vérifiez le format d'entrée.",
        };
      }
      return {
        output: generateSubtitles(parsed.segments, outFormat),
        segCount: parsed.segments.length,
        convertError: null,
      };
    } catch {
      return { output: "", segCount: 0, convertError: "Conversion impossible." };
    }
  }, [input, inFormat, outFormat]);

  const losesTimecodes = inFormat === "txt" && outFormat !== "txt";

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: SUBTITLE_MIME[outFormat] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${outFormat}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [output, outFormat, filename]);

  const copy = useCallback(() => {
    if (!output) return;
    navigator.clipboard?.writeText(output).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => setError("Copie impossible."),
    );
  }, [output]);

  return (
    <div className="rounded-sm border-2 border-ink-900 bg-ivory-50 overflow-hidden shadow-[6px_6px_0_0_rgba(26,24,20,1)]">
      {/* Bandeau : confidentialité (argument fort) */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-ivory-50 font-mono text-[10px] uppercase tracking-widest">
        <span className="h-1.5 w-1.5 rounded-full bg-rouge-500" />
        Conversion dans votre navigateur · rien n&apos;est envoyé · gratuit
      </div>

      <div className="grid md:grid-cols-2">
        {/* ─── Entrée ─── */}
        <div className="p-5 md:p-6 md:border-r border-ivory-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              1 · Votre fichier
            </span>
            <div className="flex gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setInFormat(f.id)}
                  aria-pressed={inFormat === f.id}
                  className={`px-2 py-0.5 rounded-sm border text-xs font-semibold transition-colors ${
                    inFormat === f.id
                      ? "border-rouge-500 bg-rouge-50 text-ink-900"
                      : "border-ivory-300 text-ink-500 hover:border-ink-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zone de dépôt */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`mb-3 rounded-sm border-2 border-dashed px-4 py-4 text-center transition-colors ${
              dragOver ? "border-rouge-500 bg-rouge-50" : "border-ivory-300"
            }`}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900 hover:text-rouge-500 transition-colors"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Déposer ou choisir un fichier
            </button>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              .srt · .vtt · .txt — ou collez le texte ci-dessous
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".srt,.vtt,.txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) loadFile(file);
                e.target.value = "";
              }}
            />
          </div>

          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            rows={10}
            spellCheck={false}
            aria-label="Sous-titres à convertir"
            placeholder={"1\n00:00:01,000 --> 00:00:03,000\nVotre sous-titre…"}
            className="ml-scroll w-full bg-white border border-ink-200 rounded-sm px-3 py-2.5 font-mono text-xs text-ink-900 leading-relaxed resize-y focus:outline-none focus:border-rouge-500"
          />
        </div>

        {/* ─── Sortie ─── */}
        <div className="p-5 md:p-6 bg-ivory-100/50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              2 · Convertir en
            </span>
            <div className="flex gap-1">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOutFormat(f.id)}
                  aria-pressed={outFormat === f.id}
                  className={`px-2 py-0.5 rounded-sm border text-xs font-semibold transition-colors ${
                    outFormat === f.id
                      ? "border-rouge-500 bg-rouge-500 text-ivory-50"
                      : "border-ivory-300 text-ink-500 hover:border-ink-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={convertError ? "" : output}
            readOnly
            rows={10}
            spellCheck={false}
            aria-label="Résultat de la conversion"
            placeholder="Le résultat apparaît ici…"
            className="ml-scroll w-full bg-white border border-ink-200 rounded-sm px-3 py-2.5 font-mono text-xs text-ink-900 leading-relaxed resize-y focus:outline-none"
          />

          {/* Messages */}
          {(error || convertError) && (
            <p className="mt-2 text-xs text-rouge-600">{error || convertError}</p>
          )}
          {!convertError && output && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {segCount} sous-titres · {inFormat.toUpperCase()}{" "}
              <ArrowRight className="inline h-3 w-3 -mt-0.5" aria-hidden />{" "}
              {outFormat.toUpperCase()}
            </p>
          )}
          {losesTimecodes && output && (
            <p className="mt-1 text-xs text-ink-500">
              ⚠ Un .txt ne contient pas de timecodes : le {outFormat.toUpperCase()}{" "}
              généré aura des temps à zéro.
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              disabled={!output}
              className="btn-pen text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" aria-hidden />
              Télécharger .{outFormat}
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!output}
              className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Copy className="h-4 w-4" aria-hidden />
              )}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      </div>

      {/* Pied : passerelle produit (honnête, pas intrusif) */}
      <div className="flex items-start gap-3 px-5 py-3 border-t border-ivory-200 bg-ivory-100">
        <FileText className="h-4 w-4 text-ink-400 mt-0.5 flex-shrink-0" aria-hidden />
        <p className="text-xs text-ink-600 leading-relaxed">
          Besoin de <strong>créer</strong> les sous-titres (pas seulement les
          convertir) ? Maxline transcrit et traduit votre vidéo dans 10 langues,
          puis vous rend un .srt/.vtt propre.
        </p>
      </div>
    </div>
  );
}
