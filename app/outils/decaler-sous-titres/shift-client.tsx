"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Upload, Download, Copy, Check, Minus, Plus } from "lucide-react";
import { parseSubtitleFile } from "@/lib/subtitle-parse";
import { generateSubtitles, SUBTITLE_MIME } from "@/lib/subtitles";

type TimedFormat = "srt" | "vtt";

/** Devine srt/vtt d'après l'extension, sinon le contenu (défaut srt). */
function detectTimed(filename: string, content: string): TimedFormat {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext === "vtt") return "vtt";
  if (ext === "srt") return "srt";
  return /^﻿?WEBVTT/.test(content) ? "vtt" : "srt";
}

/**
 * Décaleur de sous-titres : avance ou retarde TOUS les timecodes d'un .srt/.vtt
 * d'un décalage en secondes. 100 % navigateur (parse → décale → regénère), 0 €.
 */
export function SubtitleShifter() {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<TimedFormat>("srt");
  const [filename, setFilename] = useState("sous-titres");
  const [offset, setOffset] = useState(0); // secondes (peut être négatif)
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setFilename(file.name.replace(/\.[^.]+$/, "") || "sous-titres");
      setInput(content);
      setFormat(detectTimed(file.name, content));
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

  const { output, segCount, convertError } = useMemo(() => {
    if (!input.trim()) return { output: "", segCount: 0, convertError: null };
    try {
      const parsed = parseSubtitleFile(input, format);
      if (parsed.segments.length === 0) {
        return { output: "", segCount: 0, convertError: "Aucun sous-titre lisible dans ce fichier." };
      }
      const shifted = parsed.segments.map((s) => ({
        start: Math.max(0, s.start + offset),
        end: Math.max(0, s.end + offset),
        text: s.text,
      }));
      return { output: generateSubtitles(shifted, format), segCount: shifted.length, convertError: null };
    } catch {
      return { output: "", segCount: 0, convertError: "Décalage impossible." };
    }
  }, [input, format, offset]);

  const bump = (delta: number) =>
    setOffset((o) => Math.round((o + delta) * 1000) / 1000);

  const download = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: SUBTITLE_MIME[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-decale.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [output, format, filename]);

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

  const offsetLabel = `${offset > 0 ? "+" : ""}${offset.toFixed(offset % 1 === 0 ? 0 : 3)} s`;

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
              1 · Votre fichier (.srt / .vtt)
            </span>
            <div className="flex gap-1">
              {(["srt", "vtt"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  aria-pressed={format === f}
                  className={`px-2 py-0.5 rounded-sm border text-xs font-semibold transition-colors ${
                    format === f
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
              accept=".srt,.vtt,text/plain"
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
            rows={8}
            spellCheck={false}
            aria-label="Sous-titres à décaler"
            placeholder={"1\n00:00:01,000 --> 00:00:03,000\nVotre sous-titre…"}
            className="ml-scroll w-full bg-white border border-ink-200 rounded-sm px-3 py-2.5 font-mono text-xs text-ink-900 leading-relaxed resize-y focus:outline-none focus:border-rouge-500"
          />
        </div>

        {/* Réglage + sortie */}
        <div className="p-5 md:p-6 bg-ivory-100/50">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3 block">
            2 · Décalage
          </span>

          {/* Contrôle de décalage */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => bump(-1)}
              aria-label="Retarder d'une seconde"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink-900 bg-ivory-50 text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <div className="flex-1 text-center">
              <input
                type="number"
                step="0.1"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value) || 0)}
                aria-label="Décalage en secondes"
                className="w-full bg-white border border-ink-200 rounded-sm px-2 py-1.5 font-mono text-lg tabular-nums text-ink-900 text-center focus:outline-none focus:border-rouge-500"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                secondes · {offsetLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => bump(1)}
              aria-label="Avancer d'une seconde"
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border-2 border-ink-900 bg-ivory-50 text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {[-0.5, -0.1, 0.1, 0.5].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => bump(d)}
                className="px-2 py-0.5 rounded-sm border border-ivory-300 text-xs font-mono text-ink-600 hover:border-ink-400 transition-colors"
              >
                {d > 0 ? "+" : ""}
                {d}s
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="px-2 py-0.5 rounded-sm border border-ivory-300 text-xs font-mono text-ink-600 hover:border-ink-400 transition-colors"
            >
              remettre à 0
            </button>
          </div>

          <p className="text-xs text-ink-500 mb-3">
            Décalage positif = les sous-titres apparaissent <strong>plus tard</strong> ;
            négatif = <strong>plus tôt</strong>.
          </p>

          <textarea
            value={convertError ? "" : output}
            readOnly
            rows={5}
            spellCheck={false}
            aria-label="Résultat décalé"
            placeholder="Le fichier décalé apparaît ici…"
            className="ml-scroll w-full bg-white border border-ink-200 rounded-sm px-3 py-2.5 font-mono text-xs text-ink-900 leading-relaxed resize-y focus:outline-none"
          />

          {(error || convertError) && (
            <p className="mt-2 text-xs text-rouge-600">{error || convertError}</p>
          )}
          {!convertError && output && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {segCount} sous-titres décalés de {offsetLabel}
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
              Télécharger .{format}
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
