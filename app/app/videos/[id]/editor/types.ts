/**
 * Types et helpers partagés de l'éditeur timeline.
 *
 * Cue = segment + identifiant STABLE (clé React). Indispensable : sans clé
 * stable, insérer/supprimer une ligne décale toutes les clés par index et React
 * réutilise les mauvais composants. L'id ne vit que côté client (retiré avant
 * d'enregistrer/exporter).
 */
import type { Segment } from "@/lib/video-types";

export type Cue = Segment & { id: string };

let cueIdSeq = 0;
export const nextCueId = () => `t${cueIdSeq++}`;
export const withIds = (segs: Segment[]): Cue[] =>
  segs.map((s) => ({ ...s, id: nextCueId() }));
export const stripIds = (cues: Cue[]): Segment[] =>
  cues.map(({ id: _id, ...s }) => s);

/** Durée minimale d'un cue (s) — borne les rognages/redimensionnements. */
export const MIN_CUE_DURATION = 0.2;

/** Vitesse de lecture en caractères/seconde. Au-delà de CPS_WARN, le
 * sous-titre est difficile à lire (norme pro ≈ 15-17 c/s). */
export const CPS_WARN = 17;
export function cps(seg: Pick<Segment, "start" | "end" | "text">): number {
  const d = seg.end - seg.start;
  return d > 0 ? seg.text.replace(/\s+/g, " ").trim().length / d : 0;
}

/** secondes → « mm:ss.cc » (édition) */
export function formatTimecode(seconds: number): string {
  const s = Math.max(0, seconds);
  const cs = Math.round((s % 1) * 100);
  const sec = Math.floor(s) % 60;
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(
    cs === 100 ? 99 : cs,
  ).padStart(2, "0")}`;
}

/** « mm:ss.cc » / « ss.cc » / « ss » → secondes (null si invalide). */
export function parseTimecode(str: string): number | null {
  const trimmed = str.trim();
  const full = trimmed.match(/^(\d+):(\d{1,2})(?:\.(\d{1,2}))?$/);
  if (full) {
    const m = parseInt(full[1]!, 10);
    const s = parseInt(full[2]!, 10);
    const cs = full[3] ? parseInt(full[3].padEnd(2, "0"), 10) : 0;
    if (s >= 60) return null;
    return m * 60 + s + cs / 100;
  }
  const simple = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (simple) {
    const s = parseInt(simple[1]!, 10);
    const cs = simple[2] ? parseInt(simple[2].padEnd(2, "0"), 10) : 0;
    return s + cs / 100;
  }
  return null;
}

/** secondes → « m:ss » (affichage règle/transport) */
export function formatClock(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
