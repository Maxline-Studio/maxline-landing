"use client";

/**
 * Timeline horizontale de l'éditeur : règle temporelle (scrub), piste
 * vignettes (dégradés v1 — vraies vignettes en phase 2), forme d'onde
 * (synthétique v1, dérivée des fenêtres de cues — vrais pics worker en
 * Sprint B), piste des sous-titres (blocs sélectionnables, poignées de
 * rognage avec AIMANTATION aux bords voisins et à la tête de lecture,
 * déplacement à la souris), tête de lecture + suivi automatique.
 *
 * Perf vidéos longues : l'onde est dessinée sur un canvas « sticky » de la
 * largeur du viewport (redessiné au scroll) — jamais un canvas de la largeur
 * totale (30 min × 80 px/s dépasserait la taille max d'un canvas). Les blocs
 * sont mémoïsés + content-visibility.
 */
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, GripHorizontal } from "lucide-react";
import { cps, CPS_WARN, MIN_CUE_DURATION, formatClock, type Cue } from "./types";

const TRACK_THUMBS_H = 26;
const TRACK_WAVE_H = 34;
const TRACK_SUBS_H = 62;
const RULER_H = 22;

/** Cibles d'aimantation : bords des autres cues + tête de lecture. */
function snapTime(
  t: number,
  ignoreIdx: number,
  cues: Cue[],
  playhead: number,
  threshold: number,
): { t: number; snapped: number | null } {
  let best: number | null = null;
  let bestDist = threshold;
  const consider = (target: number) => {
    const d = Math.abs(target - t);
    if (d < bestDist) {
      bestDist = d;
      best = target;
    }
  };
  consider(playhead);
  for (let i = 0; i < cues.length; i++) {
    if (i === ignoreIdx) continue;
    consider(cues[i]!.start);
    consider(cues[i]!.end);
  }
  return best != null ? { t: best, snapped: best } : { t, snapped: null };
}

export function Timeline({
  cues,
  duration,
  currentTime,
  isPlaying,
  selectedIdx,
  pxPerSec,
  snap,
  follow,
  isAudio,
  rtl,
  onSelect,
  onScrub,
  onEditStart,
  onTiming,
  onEditEnd,
  onReady,
}: {
  cues: Cue[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  selectedIdx: number;
  pxPerSec: number;
  snap: boolean;
  follow: boolean;
  isAudio: boolean;
  rtl?: boolean;
  /** Tap/clic sur un bloc. `fromTap` = vrai geste utilisateur (peut ouvrir la feuille). */
  onSelect: (idx: number, fromTap: boolean) => void;
  onScrub: (t: number) => void;
  /** Appelé UNE fois au premier mouvement d'un rognage/déplacement (snapshot historique). */
  onEditStart: () => void;
  onTiming: (idx: number, start: number, end: number) => void;
  /** Relâcher d'un glissement/rognage : le parent recale le karaoké + réordonne. */
  onEditEnd: (idx: number) => void;
  /** Largeur visible au montage (le parent calcule le zoom initial). */
  onReady?: (viewportWidth: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapGuide, setSnapGuide] = useState<number | null>(null);

  const innerWidth = Math.max(1, Math.ceil(duration * pxPerSec) + 80);

  // ─── Zoom initial : le parent le calcule depuis la largeur visible ───
  useEffect(() => {
    if (scrollRef.current && onReady) onReady(scrollRef.current.clientWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Règle : graduations adaptatives (≤ ~400 ticks quel que soit le zoom) ───
  const ticks = useMemo(() => {
    const steps = [1, 2, 5, 10, 30, 60];
    const step = steps.find((s) => duration / s <= 400) ?? 60;
    const labelEvery = pxPerSec * step >= 46 ? step : step * 5;
    const out: { t: number; major: boolean; label: string | null }[] = [];
    for (let t = 0; t <= duration; t += step) {
      const major = t % labelEvery === 0;
      out.push({ t, major, label: major ? formatClock(t) : null });
    }
    return out;
  }, [duration, pxPerSec]);

  // ─── Vignettes (v1 : cellules dégradées déterministes ; phase 2 : sprite) ───
  const thumbCells = useMemo(() => {
    if (isAudio || duration <= 0) return [];
    const cellDur = Math.max(2, duration / 240);
    const hues = [215, 205, 30, 25, 220, 35, 210, 20, 230, 28];
    const cells: { left: number; width: number; bg: string }[] = [];
    for (let i = 0; i * cellDur < duration; i++) {
      const h = hues[i % hues.length]!;
      const l = 24 + (i % 4) * 5;
      cells.push({
        left: i * cellDur * pxPerSec,
        width: cellDur * pxPerSec - 2,
        bg: `linear-gradient(150deg, hsl(${h},28%,${l}%), hsl(${h + 18},26%,${l - 9}%))`,
      });
    }
    return cells;
  }, [isAudio, duration, pxPerSec]);

  // ─── Forme d'onde : canvas sticky redessiné selon le scroll ───
  const drawWave = useCallback(() => {
    const canvas = canvasRef.current;
    const scroller = scrollRef.current;
    if (!canvas || !scroller || duration <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = scroller.clientWidth;
    const h = TRACK_WAVE_H;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1D3557"; // encre — lisible sur ivoire, clin d'œil Atelier
    ctx.globalAlpha = 0.72;
    const barW = 2;
    const gap = 1;
    const mid = h / 2;
    const scrollLeft = scroller.scrollLeft;
    // Onde SYNTHÉTIQUE : énergie dans les fenêtres de cues (≈ la parole), quasi
    // silence ailleurs. Remplacée par les vrais pics worker au Sprint B.
    for (let x = 0; x < w; x += barW + gap) {
      const t = (scrollLeft + x) / pxPerSec;
      if (t > duration) break;
      let inSpeech = false;
      // cues triés par temps → sortie anticipée
      for (let i = 0; i < cues.length; i++) {
        const c = cues[i]!;
        if (c.start - 0.08 > t) break;
        if (t <= c.end + 0.08) {
          inSpeech = true;
          break;
        }
      }
      const seed = Math.sin(t * 12.9898) * 43758.5453;
      const r = seed - Math.floor(seed);
      const env = inSpeech ? 0.3 + 0.58 * Math.abs(Math.sin(t * 3.1 + r * 2)) : 0.05;
      const amp = Math.max(1, env * (0.55 + 0.45 * r) * (h - 6) / 2);
      ctx.fillRect(x, mid - amp, barW, amp * 2);
    }
    ctx.globalAlpha = 1;
  }, [duration, pxPerSec, cues]);

  useEffect(() => {
    drawWave();
  }, [drawWave]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(drawWave);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => drawWave());
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [drawWave]);

  // ─── Suivi de la tête de lecture ───
  useEffect(() => {
    if (!follow || !isPlaying) return;
    const scroller = scrollRef.current;
    if (!scroller) return;
    const x = currentTime * pxPerSec;
    const vw = scroller.clientWidth;
    if (x < scroller.scrollLeft + vw * 0.15 || x > scroller.scrollLeft + vw * 0.75) {
      scroller.scrollLeft = Math.max(0, x - vw * 0.35);
    }
  }, [currentTime, isPlaying, follow, pxPerSec]);

  // ─── Bloc sélectionné visible (hors lecture) ───
  useEffect(() => {
    if (isPlaying) return;
    const scroller = scrollRef.current;
    const c = cues[selectedIdx];
    if (!scroller || !c) return;
    const x = c.start * pxPerSec;
    const vw = scroller.clientWidth;
    if (x < scroller.scrollLeft + 16 || x > scroller.scrollLeft + vw - 60) {
      scroller.scrollTo({ left: Math.max(0, x - vw * 0.25), behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  // ─── Scrub (règle) ───
  const timeFromEvent = useCallback(
    (clientX: number): number => {
      const scroller = scrollRef.current;
      if (!scroller) return 0;
      const rect = scroller.getBoundingClientRect();
      const x = clientX - rect.left + scroller.scrollLeft;
      return Math.max(0, Math.min(duration, x / pxPerSec));
    },
    [duration, pxPerSec],
  );

  const scrubbing = useRef(false);
  const onRulerDown = (e: React.PointerEvent) => {
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    onScrub(timeFromEvent(e.clientX));
  };
  const onRulerMove = (e: React.PointerEvent) => {
    if (scrubbing.current) onScrub(timeFromEvent(e.clientX));
  };
  const onRulerUp = () => {
    scrubbing.current = false;
  };

  // ─── Rognage (poignées) + déplacement (souris) avec aimantation ───
  type Drag = {
    idx: number;
    mode: "trim-l" | "trim-r" | "move";
    pointerId: number;
    moved: boolean;
    startX: number;
    origStart: number;
    origEnd: number;
  };
  const dragRef = useRef<Drag | null>(null);
  const suppressClickRef = useRef(false);

  const startDrag = (
    e: React.PointerEvent,
    idx: number,
    mode: Drag["mode"],
    allowTouch = false,
  ) => {
    // Déplacement du bloc entier au DOIGT : réservé à la poignée centrale du bloc
    // actif (allowTouch), sinon un glissement sur le corps entrerait en conflit
    // avec le scroll de la timeline. À la souris, tout le corps déplace.
    if (mode === "move" && e.pointerType !== "mouse" && !allowTouch) return;
    e.preventDefault();
    e.stopPropagation();
    const c = cues[idx];
    if (!c) return;
    dragRef.current = {
      idx,
      mode,
      pointerId: e.pointerId,
      moved: false,
      startX: e.clientX,
      origStart: c.start,
      origEnd: c.end,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (idx !== selectedIdx) onSelect(idx, false);
  };

  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) < 4) return;
    if (!d.moved) {
      d.moved = true;
      suppressClickRef.current = true;
      onEditStart();
    }
    // Bornes SOUPLES : on ne bloque plus aux voisins → un cue peut GLISSER
    // devant/derrière un autre (réordonné au relâcher). Seule limite : [0, durée].
    // L'aimantation reste active (accroche aux bords voisins + tête de lecture)
    // mais n'empêche jamais de passer.
    const threshold = (snap ? 8 : 0) / pxPerSec;
    if (d.mode === "move") {
      const dt = (e.clientX - d.startX) / pxPerSec;
      const len = d.origEnd - d.origStart;
      let ns = d.origStart + dt;
      const rs = snapTime(ns, d.idx, cues, currentTime, threshold);
      const re = snapTime(ns + len, d.idx, cues, currentTime, threshold);
      let guide: number | null = null;
      if (rs.snapped != null) {
        ns = rs.t;
        guide = rs.snapped;
      } else if (re.snapped != null) {
        ns = re.t - len;
        guide = re.snapped;
      }
      ns = Math.max(0, Math.min(duration - len, ns));
      setSnapGuide(guide);
      onTiming(d.idx, ns, ns + len);
    } else {
      const t0 = timeFromEvent(e.clientX);
      const r = snapTime(t0, d.idx, cues, currentTime, threshold);
      const t = r.t;
      setSnapGuide(r.snapped);
      const c = cues[d.idx]!;
      if (d.mode === "trim-l") {
        const ns = Math.max(0, Math.min(c.end - MIN_CUE_DURATION, t));
        onTiming(d.idx, ns, c.end);
      } else {
        const ne = Math.min(duration, Math.max(c.start + MIN_CUE_DURATION, t));
        onTiming(d.idx, c.start, ne);
      }
    }
  };

  const onDragEnd = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    setSnapGuide(null);
    if (d.moved) onEditEnd(d.idx);
    // Le clic qui suit un drag ne doit pas re-sélectionner/ouvrir la feuille.
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  // En mode « move », l'aimantation n'est active que si snap est vrai.
  const snapForMove = snap;

  return (
    <div
      ref={scrollRef}
      className="ml-scroll relative overflow-x-auto overflow-y-hidden bg-ivory-100 border-t border-ivory-200 select-none"
      style={{ overscrollBehaviorX: "contain" }}
      aria-label="Timeline des sous-titres"
    >
      <div className="relative" style={{ width: innerWidth }}>
        {/* Règle */}
        <div
          className="relative border-b border-ivory-200 cursor-ew-resize"
          style={{ height: RULER_H, touchAction: "none" }}
          onPointerDown={onRulerDown}
          onPointerMove={onRulerMove}
          onPointerUp={onRulerUp}
          onPointerCancel={onRulerUp}
        >
          {ticks.map((tick) => (
            <div key={tick.t}>
              <div
                className="absolute bottom-0 w-px bg-ivory-300"
                style={{
                  left: tick.t * pxPerSec,
                  height: tick.major ? 10 : 6,
                }}
              />
              {tick.label && (
                <span
                  className="absolute top-0.5 translate-x-1 font-mono text-[8.5px] text-ink-400 tabular-nums"
                  style={{ left: tick.t * pxPerSec }}
                >
                  {tick.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Vignettes (clic = se déplacer) */}
        {!isAudio && (
          <div
            className="relative overflow-hidden border-b border-ivory-200"
            style={{ height: TRACK_THUMBS_H }}
            onClick={(e) => onScrub(timeFromEvent(e.clientX))}
          >
            {thumbCells.map((cell, i) => (
              <div
                key={i}
                className="absolute top-[3px] bottom-[3px] rounded-[2px] opacity-90"
                style={{ left: cell.left, width: cell.width, background: cell.bg }}
              />
            ))}
          </div>
        )}

        {/* Forme d'onde — canvas sticky (largeur viewport), redessiné au scroll */}
        <div
          className="relative border-b border-ivory-200"
          style={{ height: TRACK_WAVE_H }}
          onClick={(e) => onScrub(timeFromEvent(e.clientX))}
        >
          <canvas
            ref={canvasRef}
            className="sticky left-0 block"
            aria-label="Forme d'onde audio"
          />
        </div>

        {/* Sous-titres */}
        <div
          className="relative"
          style={{ height: TRACK_SUBS_H }}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          {cues.map((c, i) => (
            <CueBlock
              key={c.id}
              cue={c}
              index={i}
              pxPerSec={pxPerSec}
              active={i === selectedIdx}
              isCurrent={currentTime >= c.start && currentTime < c.end}
              rtl={rtl}
              onTap={() => {
                if (suppressClickRef.current) return;
                onSelect(i, true);
              }}
              onBodyDown={(e) => startDrag(e, i, "move")}
              onGripDown={(e) => startDrag(e, i, "move", true)}
              onHandleDown={(e, side) =>
                startDrag(e, i, side === "l" ? "trim-l" : "trim-r")
              }
            />
          ))}
        </div>

        {/* Tête de lecture */}
        <div
          className="absolute top-0 bottom-0 z-10 pointer-events-none"
          style={{ left: currentTime * pxPerSec }}
        >
          <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-rouge-500" />
          <div
            className="absolute top-0 -left-1.5"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "7px solid var(--color-rouge-500)",
            }}
          />
        </div>

        {/* Guide d'aimantation */}
        {snapForMove && snapGuide != null && (
          <div
            className="absolute top-0 bottom-0 z-[9] w-0 border-l border-dashed border-encre-500 pointer-events-none"
            style={{ left: snapGuide * pxPerSec }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Bloc de sous-titre (mémoïsé : seuls les blocs affectés se re-rendent)
// ─────────────────────────────────────────────────────────────────
const CueBlock = memo(function CueBlock({
  cue,
  index: _index,
  pxPerSec,
  active,
  isCurrent,
  rtl,
  onTap,
  onBodyDown,
  onGripDown,
  onHandleDown,
}: {
  cue: Cue;
  index: number;
  pxPerSec: number;
  active: boolean;
  isCurrent: boolean;
  rtl?: boolean;
  onTap: () => void;
  onBodyDown: (e: React.PointerEvent) => void;
  onGripDown: (e: React.PointerEvent) => void;
  onHandleDown: (e: React.PointerEvent, side: "l" | "r") => void;
}) {
  const speed = cps(cue);
  const fast = speed > CPS_WARN;
  return (
    <div
      className={`absolute top-[7px] bottom-[7px] flex items-stretch overflow-hidden rounded border-[1.5px] cursor-pointer transition-shadow ${
        active
          ? "border-rouge-500 bg-ivory-50 shadow-[0_2px_10px_rgba(200,57,47,0.22)] z-[2]"
          : "border-ivory-300 bg-ivory-50/90 hover:border-ink-400"
      }`}
      style={{
        left: cue.start * pxPerSec,
        width: Math.max(22, (cue.end - cue.start) * pxPerSec),
        contentVisibility: "auto",
      }}
      onClick={onTap}
      onPointerDown={onBodyDown}
    >
      <div
        className={`w-3.5 flex-shrink-0 flex items-center justify-center cursor-col-resize ${
          active ? "text-rouge-500" : "text-ivory-300"
        }`}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => onHandleDown(e, "l")}
        role="slider"
        aria-label="Début du sous-titre"
        aria-valuenow={Math.round(cue.start * 100) / 100}
        tabIndex={-1}
      >
        <span className="h-1/2 w-[3px] rounded-full bg-current" />
      </div>
      <div
        dir={rtl ? "rtl" : undefined}
        className={`flex-1 min-w-0 self-center px-0.5 text-[10.5px] leading-[1.25] line-clamp-2 pointer-events-none ${
          isCurrent ? "text-ink-900" : "text-ink-600"
        }`}
      >
        {cue.text || "…"}
      </div>
      {/* Poignée de DÉPLACEMENT (bloc actif) : permet de glisser le sous-titre au
          doigt (le corps du bloc, lui, laisse défiler la timeline au toucher). */}
      {active && (
        <button
          type="button"
          aria-label="Déplacer ce sous-titre"
          onPointerDown={(e) => {
            e.stopPropagation();
            onGripDown(e);
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: "none" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[3] inline-flex items-center justify-center h-6 w-8 rounded-full bg-rouge-500/90 text-ivory-50 shadow-sm cursor-grab active:cursor-grabbing"
        >
          <GripHorizontal className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      {fast && (
        <span
          className="absolute top-0.5 right-4 inline-flex items-center gap-0.5 font-mono text-[8px] text-[#A87B00]"
          title={`${speed.toFixed(0)} caractères/seconde : difficile à lire`}
        >
          <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
          {speed.toFixed(0)}
        </span>
      )}
      <div
        className={`w-3.5 flex-shrink-0 flex items-center justify-center cursor-col-resize ${
          active ? "text-rouge-500" : "text-ivory-300"
        }`}
        style={{ touchAction: "none" }}
        onPointerDown={(e) => onHandleDown(e, "r")}
        role="slider"
        aria-label="Fin du sous-titre"
        aria-valuenow={Math.round(cue.end * 100) / 100}
        tabIndex={-1}
      >
        <span className="h-1/2 w-[3px] rounded-full bg-current" />
      </div>
    </div>
  );
});
