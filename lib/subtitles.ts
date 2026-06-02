/**
 * Génération de fichiers de sous-titres à partir des segments traduits.
 *
 * Segment = { start: secondes, end: secondes, text: string }.
 * Formats : .srt, .vtt, .txt. (Le MP4 incrusté dépend du worker FFmpeg,
 * les exports montage .fcpxml/.xml feront l'objet d'une itération dédiée.)
 */

export type SubtitleSegment = {
  start: number;
  end: number;
  text: string;
};

export type SubtitleFormat = "srt" | "vtt" | "txt";

export const SUBTITLE_MIME: Record<SubtitleFormat, string> = {
  srt: "application/x-subrip; charset=utf-8",
  vtt: "text/vtt; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

/** Formate des secondes en HH:MM:SS,mmm (SRT) ou HH:MM:SS.mmm (VTT). */
function formatTimestamp(seconds: number, sep: "," | "."): string {
  const total = Math.max(0, seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const ms = Math.round((total - Math.floor(total)) * 1000);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms, 3)}`;
}

export function toSrt(segments: SubtitleSegment[]): string {
  return (
    segments
      .map((seg, i) => {
        const start = formatTimestamp(seg.start, ",");
        const end = formatTimestamp(seg.end, ",");
        return `${i + 1}\n${start} --> ${end}\n${seg.text.trim()}`;
      })
      .join("\n\n") + "\n"
  );
}

export function toVtt(segments: SubtitleSegment[]): string {
  const body = segments
    .map((seg) => {
      const start = formatTimestamp(seg.start, ".");
      const end = formatTimestamp(seg.end, ".");
      return `${start} --> ${end}\n${seg.text.trim()}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

export function toTxt(segments: SubtitleSegment[]): string {
  return segments.map((seg) => seg.text.trim()).join("\n") + "\n";
}

export function generateSubtitles(
  segments: SubtitleSegment[],
  format: SubtitleFormat,
): string {
  switch (format) {
    case "srt":
      return toSrt(segments);
    case "vtt":
      return toVtt(segments);
    case "txt":
      return toTxt(segments);
  }
}

/** Nom de fichier d'export : base du fichier source + extension donnée. */
export function exportFilename(
  originalFilename: string,
  format: string,
): string {
  const base = originalFilename.replace(/\.[^.]+$/, "") || "sous-titres";
  const safe = base.replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim() || "sous-titres";
  return `${safe}.${format}`;
}
