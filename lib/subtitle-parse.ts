/**
 * Parsing de fichiers de sous-titres importés (.srt / .vtt / .txt) pour la
 * traduction de fichiers (A3). Inverse de lib/subtitles.ts (qui génère).
 *
 *  - .srt / .vtt → liste de cues { start, end, text } (timecodes préservés).
 *  - .txt        → liste de lignes de texte (pas de timecode).
 */
import type { SubtitleSegment } from "@/lib/subtitles";

export type ParsedSubtitles = {
  /** Cues avec timecodes (srt/vtt) OU lignes texte (txt, start/end à 0). */
  segments: SubtitleSegment[];
  /** Vrai si le fichier portait des timecodes (srt/vtt). */
  timed: boolean;
};

/** "HH:MM:SS,mmm" ou "HH:MM:SS.mmm" (ou "MM:SS.mmm") → secondes. */
function parseTimecode(tc: string): number {
  const m = tc.trim().match(/(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})/);
  if (!m) return 0;
  const h = m[1] ? parseInt(m[1], 10) : 0;
  const min = parseInt(m[2]!, 10);
  const s = parseInt(m[3]!, 10);
  const ms = parseInt(m[4]!.padEnd(3, "0"), 10);
  return h * 3600 + min * 60 + s + ms / 1000;
}

const ARROW = /-->/;

/** Parse un fichier .srt en cues. Tolère les numéros d'index et lignes vides. */
export function parseSrt(content: string): SubtitleSegment[] {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const cues: SubtitleSegment[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    // Saute un éventuel numéro d'index en 1re ligne.
    let i = 0;
    if (/^\d+$/.test(lines[0]!.trim())) i = 1;
    const timeLine = lines[i];
    if (!timeLine || !ARROW.test(timeLine)) continue;
    const [startRaw, endRaw] = timeLine.split(ARROW);
    const text = lines.slice(i + 1).join("\n").trim();
    if (!text) continue;
    cues.push({
      start: parseTimecode(startRaw!),
      end: parseTimecode(endRaw!),
      text,
    });
  }
  return cues;
}

/** Parse un fichier .vtt en cues. Ignore l'en-tête WEBVTT et les blocs NOTE. */
export function parseVtt(content: string): SubtitleSegment[] {
  const cleaned = content
    .replace(/\r\n/g, "\n")
    .replace(/^﻿/, "") // BOM
    .replace(/^WEBVTT[^\n]*\n/, "");
  const blocks = cleaned.split(/\n{2,}/);
  const cues: SubtitleSegment[] = [];
  for (const block of blocks) {
    if (/^NOTE\b/.test(block.trim()) || /^STYLE\b/.test(block.trim())) continue;
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    if (lines.length === 0) continue;
    // Une ligne d'ID (cue identifier) peut précéder la ligne de timecode.
    let i = 0;
    if (!ARROW.test(lines[0]!)) i = 1;
    const timeLine = lines[i];
    if (!timeLine || !ARROW.test(timeLine)) continue;
    const [startRaw, endRaw] = timeLine.split(ARROW);
    const text = lines.slice(i + 1).join("\n").trim();
    if (!text) continue;
    cues.push({
      start: parseTimecode(startRaw!),
      end: parseTimecode(endRaw!.split(/\s+/)[0]!), // ignore les réglages de position
      text,
    });
  }
  return cues;
}

/** Parse un .txt : une ligne non vide = un segment (sans timecode). */
export function parseTxt(content: string): SubtitleSegment[] {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "")
    .map((text) => ({ start: 0, end: 0, text }));
}

export type SubtitleFileFormat = "srt" | "vtt" | "txt";

export function parseSubtitleFile(
  content: string,
  format: SubtitleFileFormat,
): ParsedSubtitles {
  switch (format) {
    case "srt":
      return { segments: parseSrt(content), timed: true };
    case "vtt":
      return { segments: parseVtt(content), timed: true };
    case "txt":
      return { segments: parseTxt(content), timed: false };
  }
}

/**
 * Minutes facturées pour un fichier (décision produit) :
 *  - srt/vtt : durée = dernier timecode de fin → minutes = ceil(durée / 60).
 *  - txt     : ~1000 caractères/min → minutes = ceil(totalChars / 1000).
 * Toujours au moins 1 minute si le fichier a du contenu.
 */
export function billedMinutes(
  parsed: ParsedSubtitles,
): number {
  if (parsed.segments.length === 0) return 0;
  if (parsed.timed) {
    const lastEnd = Math.max(...parsed.segments.map((s) => s.end || 0));
    return Math.max(1, Math.ceil(lastEnd / 60));
  }
  const chars = parsed.segments.reduce((n, s) => n + s.text.length, 0);
  return Math.max(1, Math.ceil(chars / 1000));
}
