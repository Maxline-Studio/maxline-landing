"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, Download, Copy, Check } from "lucide-react";
import { parseSubtitleFile, type SubtitleFileFormat } from "@/lib/subtitle-parse";

function detectFormat(filename: string, content: string): SubtitleFileFormat {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "srt" || ext === "vtt" || ext === "txt") return ext;
  if (/^﻿?WEBVTT/.test(content)) return "vtt";
  if (/-->/.test(content)) return "srt";
  return "txt";
}

type Mode = "lines" | "paragraph";

/**
 * Extracteur de texte : retire les timecodes et numéros d'un .srt/.vtt et ne
 * garde que le texte — une ligne par sous-titre, ou un paragraphe fluide.
 * 100 % navigateur (parse → texte), 0 €.
 */
export function SubtitleExtractor() {
  const [input, setInput] = useState("");
  const [inFormat, setInFormat] = useState<SubtitleFileFormat>("srt");
  const [mode, setMode] = useState<Mode>("lines");
  const [filename, setFilename] = useState("transcription");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setFilename(file.name.replace(/\.[^.]+$/, "") || "transcription");
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

  const { output, words, convertError } = useMemo(() => {
    if (!input.trim()) return { output: "", words: 0, convertError: null };
    try {
      const parsed = parseSubtitleFile(input, inFormat);
      if (parsed.segments.length === 0) {
        return { output: "", words: 0, convertError: "Aucun texte lisible dans ce fichier." };
      }
      // Texte de chaque cue, retours de ligne internes aplatis en espaces.
      const lines = parsed.segments.map((s) => s.text.replace(/\s*\n\s*/g, " ").trim());
      const text = mode === "lines" ? lines.join("\n") : lines.join(" ").replace(/\s+/g, " ").trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      return { output: text, words: wordCount, convertError: null };
    } catch {
      return { output: "", words: 0, convertError: "Extraction impossible." };
    }
  }, [input, inFormat, mode]);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output + "\n"], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [output, filename]);

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
      <div className="flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-ivory-50 font-mono text-[10px] uppercase tracking-widest">
        <span className="h-1.5 w-1.5 rounded-full bg-rouge-500" />
        Dans votre navigateur · rien n&apos;est envoyé · gratuit
      </div>

      <div className="grid md:grid-cols-2">
        {/* Entrée */}
        <div className="p-5 md:p-6 md:border-r border-ivory-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              1 · Votre fichier
            </span>
            <div className="flex gap-1">
              {(["srt", "vtt", "txt"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setInFormat(f)}
                  aria-pressed={inFormat === f}
                  className={`px-2 py-0.5 rounded-sm border text-xs font-semibold transition-colors ${
                    inFormat === f
                      ? "border-rouge-500 bg-rouge-50 text-ink-900"
                      : "border-ivory-300 text-ink-500 hover:border-ink-400"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

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
              .srt · .vtt — ou collez le texte ci-dessous
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
            rows={9}
            spellCheck={false}
            aria-label="Sous-titres à convertir en texte"
            placeholder={"1\n00:00:01,000 --> 00:00:03,000\nVotre sous-titre…"}
            className="ml-scroll w-full bg-white border border-ink-200 rounded-sm px-3 py-2.5 font-mono text-xs text-ink-900 leading-relaxed resize-y focus:outline-none focus:border-rouge-500"
          />
        </div>

        {/* Sortie */}
        <div className="p-5 md:p-6 bg-ivory-100/50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              2 · Texte extrait
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setMode("lines")}
                aria-pressed={mode === "lines"}
                className={`px-2 py-0.5 rounded-sm border text-xs font-semibold transition-colors ${
                  mode === "lines"
                    ? "border-rouge-500 bg-rouge-500 text-ivory-50"
                    : "border-ivory-300 text-ink-500 hover:border-ink-400"
                }`}
              >
                Lignes
              </button>
              <button
                type="button"
                onClick={() => setMode("paragraph")}
                aria-pressed={mode === "paragraph"}
                className={`px-2 py-0.5 rounded-sm border text-xs font-semibold transition-colors ${
                  mode === "paragraph"
                    ? "border-rouge-500 bg-rouge-500 text-ivory-50"
                    : "border-ivory-300 text-ink-500 hover:border-ink-400"
                }`}
              >
                Paragraphe
              </button>
            </div>
          </div>

          <textarea
            value={convertError ? "" : output}
            readOnly
            rows={9}
            spellCheck={false}
            aria-label="Texte extrait"
            placeholder="Le texte sans timecodes apparaît ici…"
            className="ml-scroll w-full bg-white border border-ink-200 rounded-sm px-3 py-2.5 text-sm text-ink-900 leading-relaxed resize-y focus:outline-none"
          />

          {(error || convertError) && (
            <p className="mt-2 text-xs text-rouge-600">{error || convertError}</p>
          )}
          {!convertError && output && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {words} mots · timecodes retirés
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={download}
              disabled={!output}
              className="btn-pen text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" aria-hidden />
              Télécharger .txt
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!output}
              className="inline-flex items-center gap-2 px-3 py-2 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
