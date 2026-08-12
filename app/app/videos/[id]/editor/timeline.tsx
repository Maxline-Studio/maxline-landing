"use client";

/**
 * Timeline horizontale de l'éditeur.
 *
 * ─── Ce qui a changé (audit 2026-08) et POURQUOI ─────────────────────────────
 *
 * 1. **La tête de lecture ne passe plus par React.** Elle s'abonne à la
 *    `PlaybackClock` et se déplace en écrivant un `transform` CSS. Avant, le
 *    temps courant était un état React rafraîchi 60 fois par seconde : la
 *    timeline entière se reconstruisait à chaque image.
 *
 * 2. **Délégation d'événements.** Les blocs ne portent plus de gestionnaires :
 *    un seul jeu de gestionnaires vit sur la piste, et retrouve le bloc visé via
 *    `data-idx` / `data-handle`. Avant, `cues.map()` recréait quatre fonctions
 *    par bloc à chaque rendu, ce qui **annulait complètement le `memo()`** :
 *    400 à 700 composants se re-rendaient 60 fois par seconde.
 *
 * 3. **Virtualisation.** Seuls les blocs visibles (± un écran de marge) sont
 *    montés. Une vidéo de 30 minutes ne monte plus 2 000 nœuds DOM.
 *
 * 4. **Aucune lecture de layout dans la boucle chaude.** `scrollLeft` et la
 *    largeur visible sont tenus à jour par les événements `scroll`/`resize` et
 *    lus depuis des refs — jamais mesurés pendant l'animation (ce qui forçait
 *    un recalcul de mise en page à chaque image).
 *
 * 5. **Fini le décor mensonger.** La piste « forme d'onde » était une onde
 *    ALÉATOIRE fabriquée à partir des fenêtres de cues, et les vignettes des
 *    dégradés de couleur : caler un sous-titre « sur l'onde » ne calait sur
 *    rien. La piste est désormais une bande de **présence de parole**, ce
 *    qu'elle a toujours réellement été — dessinée sobrement et nommée
 *    honnêtement. Les vraies formes d'onde arriveront avec les pics calculés
 *    par le worker à l'extraction audio.
 */
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, GripHorizontal } from "lucide-react";
import { cps, CPS_WARN, MIN_CUE_DURATION, formatClock, type Cue } from "./types";
import type { PlaybackClock } from "./playback-clock";

const TRACK_SPEECH_H = 30;
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

/**
 * Premier index dont la FIN dépasse `t` — borne gauche de virtualisation.
 *
 * Les cues sont triés par DÉBUT ; comme l'éditeur autorise les bornes souples
 * (un cue peut chevaucher son voisin), les FINS ne sont pas strictement
 * croissantes. On recule donc de quelques indices : la dichotomie reste juste
 * au cue près, et la marge garantit qu'aucun bloc chevauchant n'est oublié au
 * bord gauche. Le coût est nul.
 */
const OVERLAP_MARGIN = 8;
function firstVisible(cues: Cue[], t: number): number {
  let lo = 0;
  let hi = cues.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid]!.end < t) lo = mid + 1;
    else hi = mid;
  }
  return Math.max(0, lo - OVERLAP_MARGIN);
}

export const Timeline = memo(function Timeline({
  cues,
  duration,
  clock,
  isPlaying,
  selectedIdx,
  activeIdx,
  pxPerSec,
  snap,
  follow,
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
  /** Horloge de lecture (hors React) : source du temps courant. */
  clock: PlaybackClock;
  isPlaying: boolean;
  selectedIdx: number;
  /** Index du cue en cours de lecture (-1 si aucun). Change quelques fois par
   * seconde, jamais à la fréquence d'affichage. */
  activeIdx: number;
  pxPerSec: number;
  snap: boolean;
  follow: boolean;
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
  const playheadRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<HTMLCanvasElement>(null);
  const [snapGuide, setSnapGuide] = useState<number | null>(null);

  const innerWidth = Math.max(1, Math.ceil(duration * pxPerSec) + 80);

  // ─── Géométrie de défilement, tenue à jour HORS boucle d'animation ───
  // Lire `scrollLeft` / `clientWidth` pendant l'animation force un recalcul de
  // mise en page à chaque image. On les met en cache ici, à la source.
  const scrollLeftRef = useRef(0);
  const viewportWRef = useRef(0);
  const [view, setView] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const syncView = () => {
      viewportWRef.current = scroller.clientWidth;
      scrollLeftRef.current = scroller.scrollLeft;
      // L'état de virtualisation n'est rafraîchi que lorsqu'on a défilé d'au
      // moins un tiers d'écran : quelques rendus par geste, pas un par pixel.
      setView((prev) => {
        const dx = Math.abs(prev.left - scroller.scrollLeft);
        if (dx < scroller.clientWidth / 3 && prev.width === scroller.clientWidth) {
          return prev;
        }
        return { left: scroller.scrollLeft, width: scroller.clientWidth };
      });
    };

    syncView();
    onReady?.(scroller.clientWidth);

    let raf = 0;
    const onScroll = () => {
      scrollLeftRef.current = scroller.scrollLeft;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncView);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(syncView);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Tête de lecture + suivi : abonnement à l'horloge, ZÉRO rendu React ───
  const followRef = useRef(follow);
  followRef.current = follow;
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    const head = playheadRef.current;
    if (!head) return;

    const apply = (t: number) => {
      const x = t * pxPerSec;
      head.style.transform = `translate3d(${x}px,0,0)`;

      // Suivi : on ne recentre que si la tête sort de la zone de confort, et on
      // ne lit AUCUNE dimension (tout vient des refs tenues à jour au scroll).
      if (!followRef.current || !playingRef.current) return;
      const left = scrollLeftRef.current;
      const vw = viewportWRef.current;
      if (vw > 0 && (x < left + vw * 0.15 || x > left + vw * 0.75)) {
        const target = Math.max(0, x - vw * 0.35);
        scrollLeftRef.current = target;
        const scroller = scrollRef.current;
        if (scroller) scroller.scrollLeft = target;
      }
    };

    apply(clock.time);
    return clock.subscribe(apply);
  }, [clock, pxPerSec]);

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

  // ─── Piste « parole » : bande HONNÊTE de présence de parole ───
  // Ce n'est pas une forme d'onde (on n'a pas encore les pics audio) : c'est
  // exactement l'information dont on dispose — où quelqu'un parle. On la dessine
  // comme telle, sans amplitude inventée.
  const drawSpeech = useCallback(() => {
    const canvas = speechRef.current;
    const scroller = scrollRef.current;
    if (!canvas || !scroller || duration <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = scroller.clientWidth;
    const h = TRACK_SPEECH_H;
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

    const left = scroller.scrollLeft;
    const t0 = left / pxPerSec;
    const t1 = (left + w) / pxPerSec;
    ctx.fillStyle = "#1D3557"; // encre
    ctx.globalAlpha = 0.2;
    const barTop = 6;
    const barH = h - 12;
    for (let i = firstVisible(cues, t0); i < cues.length; i++) {
      const c = cues[i]!;
      if (c.start > t1) break;
      const x = c.start * pxPerSec - left;
      const cw = Math.max(2, (c.end - c.start) * pxPerSec);
      ctx.fillRect(x, barTop, cw, barH);
    }
    ctx.globalAlpha = 1;
  }, [duration, pxPerSec, cues]);

  useEffect(() => {
    drawSpeech();
  }, [drawSpeech, view]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(drawSpeech);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => drawSpeech());
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [drawSpeech]);

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

  // ─── Rognage / déplacement : gestionnaires DÉLÉGUÉS sur la piste ───
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
  const cuesRef = useRef(cues);
  cuesRef.current = cues;

  /** Retrouve le bloc et la poignée visés par un événement, via data-*. */
  const hit = (
    e: React.PointerEvent | React.MouseEvent,
  ): { idx: number; handle: string | null } | null => {
    const target = e.target as HTMLElement | null;
    const block = target?.closest<HTMLElement>("[data-idx]");
    if (!block) return null;
    const idx = Number(block.dataset.idx);
    if (!Number.isInteger(idx)) return null;
    const handleEl = target?.closest<HTMLElement>("[data-handle]");
    return { idx, handle: handleEl?.dataset.handle ?? null };
  };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    const h = hit(e);
    if (!h) return;
    const mode: Drag["mode"] =
      h.handle === "l" ? "trim-l" : h.handle === "r" ? "trim-r" : "move";
    // Déplacement du bloc entier au DOIGT : réservé à la poignée centrale du
    // bloc actif, sinon un glissement sur le corps entrerait en conflit avec le
    // défilement de la timeline. À la souris, tout le corps déplace.
    if (mode === "move" && e.pointerType !== "mouse" && h.handle !== "grip") return;

    const c = cuesRef.current[h.idx];
    if (!c) return;
    e.preventDefault();
    dragRef.current = {
      idx: h.idx,
      mode,
      pointerId: e.pointerId,
      moved: false,
      startX: e.clientX,
      origStart: c.start,
      origEnd: c.end,
    };
    // Capture sur la PISTE (et non sur le bloc) : le glissement survit à la
    // sortie du pointeur hors du bloc, et au remontage du bloc pendant l'édition.
    e.currentTarget.setPointerCapture(e.pointerId);
    if (h.idx !== selectedIdx) onSelect(h.idx, false);
  };

  const onTrackClick = (e: React.MouseEvent) => {
    if (suppressClickRef.current) return;
    const h = hit(e);
    if (h) onSelect(h.idx, true);
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
    const list = cuesRef.current;
    const playhead = clock.time;
    const threshold = (snap ? 8 : 0) / pxPerSec;
    if (d.mode === "move") {
      const dt = (e.clientX - d.startX) / pxPerSec;
      const len = d.origEnd - d.origStart;
      let ns = d.origStart + dt;
      const rs = snapTime(ns, d.idx, list, playhead, threshold);
      const re = snapTime(ns + len, d.idx, list, playhead, threshold);
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
      const r = snapTime(t0, d.idx, list, playhead, threshold);
      const t = r.t;
      setSnapGuide(r.snapped);
      const c = list[d.idx];
      if (!c) return;
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

  // ─── Virtualisation : uniquement les blocs visibles ± un écran de marge ───
  const { from, to } = useMemo(() => {
    const vw = view.width || 1200;
    const overscan = vw;
    const t0 = Math.max(0, (view.left - overscan) / pxPerSec);
    const t1 = (view.left + vw + overscan) / pxPerSec;
    const start = firstVisible(cues, t0);
    let end = start;
    while (end < cues.length && cues[end]!.start <= t1) end++;
    // On garde toujours le bloc sélectionné monté (l'inspecteur s'y réfère).
    return {
      from: Math.min(start, Math.max(0, selectedIdx)),
      to: Math.max(end, Math.min(cues.length, selectedIdx + 1)),
    };
  }, [cues, view, pxPerSec, selectedIdx]);

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
                style={{ left: tick.t * pxPerSec, height: tick.major ? 10 : 6 }}
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

        {/* Présence de parole — canvas « sticky » (largeur du viewport) */}
        <div
          className="relative border-b border-ivory-200"
          style={{ height: TRACK_SPEECH_H }}
          onClick={(e) => onScrub(timeFromEvent(e.clientX))}
        >
          <canvas
            ref={speechRef}
            className="sticky left-0 block"
            aria-label="Présence de parole"
          />
        </div>

        {/* Sous-titres — gestionnaires DÉLÉGUÉS (aucun handler par bloc) */}
        <div
          className="relative"
          style={{ height: TRACK_SUBS_H }}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onClick={onTrackClick}
        >
          {cues.slice(from, to).map((c, k) => {
            const i = from + k;
            return (
              <CueBlock
                key={c.id}
                index={i}
                start={c.start}
                end={c.end}
                text={c.text}
                pxPerSec={pxPerSec}
                active={i === selectedIdx}
                isCurrent={i === activeIdx}
                rtl={rtl}
              />
            );
          })}
        </div>

        {/* Tête de lecture — déplacée en DOM direct par l'horloge */}
        <div
          ref={playheadRef}
          data-playhead
          className="absolute top-0 bottom-0 left-0 z-10 pointer-events-none will-change-transform"
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
        {snap && snapGuide != null && (
          <div
            className="absolute top-0 bottom-0 z-[9] w-0 border-l border-dashed border-encre-500 pointer-events-none"
            style={{ left: snapGuide * pxPerSec }}
          />
        )}
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
/**
 * Bloc de sous-titre. **Aucun gestionnaire d'événement, que des props
 * primitives** : c'est ce qui rend `memo()` réellement efficace. Le bloc ne se
 * re-rend que si son propre texte, ses bornes, le zoom ou son état changent.
 * L'interaction passe par la délégation (`data-idx` / `data-handle`).
 */
const CueBlock = memo(function CueBlock({
  index,
  start,
  end,
  text,
  pxPerSec,
  active,
  isCurrent,
  rtl,
}: {
  index: number;
  start: number;
  end: number;
  text: string;
  pxPerSec: number;
  active: boolean;
  isCurrent: boolean;
  rtl?: boolean;
}) {
  const speed = cps({ start, end, text });
  const fast = speed > CPS_WARN;
  return (
    <div
      data-idx={index}
      className={`absolute top-[7px] bottom-[7px] flex items-stretch overflow-hidden rounded border-[1.5px] cursor-pointer ${
        active
          ? "border-rouge-500 bg-ivory-50 shadow-[0_2px_10px_rgba(200,57,47,0.22)] z-[2]"
          : isCurrent
            ? "border-ink-400 bg-ivory-50"
            : "border-ivory-300 bg-ivory-50/90 hover:border-ink-400"
      }`}
      style={{
        left: start * pxPerSec,
        width: Math.max(22, (end - start) * pxPerSec),
      }}
    >
      <div
        data-handle="l"
        className={`w-3.5 flex-shrink-0 flex items-center justify-center cursor-col-resize ${
          active ? "text-rouge-500" : "text-ivory-300"
        }`}
        style={{ touchAction: "none" }}
        role="slider"
        aria-label="Début du sous-titre"
        aria-valuenow={Math.round(start * 100) / 100}
        tabIndex={-1}
      >
        <span className="h-1/2 w-[3px] rounded-full bg-current" />
      </div>
      <div
        dir={rtl ? "rtl" : undefined}
        className={`flex-1 min-w-0 self-center px-0.5 text-[10.5px] leading-[1.25] line-clamp-2 pointer-events-none ${
          isCurrent ? "text-ink-900 font-medium" : "text-ink-600"
        }`}
      >
        {text || "…"}
      </div>
      {/* Poignée de DÉPLACEMENT (bloc actif) : permet de glisser le sous-titre au
          doigt (le corps du bloc, lui, laisse défiler la timeline au toucher). */}
      {active && (
        <span
          data-handle="grip"
          aria-hidden
          style={{ touchAction: "none" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[3] inline-flex items-center justify-center h-6 w-8 rounded-full bg-rouge-500/90 text-ivory-50 shadow-sm cursor-grab active:cursor-grabbing"
        >
          <GripHorizontal className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      {fast && (
        <span
          className="absolute top-0.5 right-4 inline-flex items-center gap-0.5 font-mono text-[8px] text-[#A87B00] pointer-events-none"
          title={`${speed.toFixed(0)} caractères/seconde : difficile à lire`}
        >
          <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
          {speed.toFixed(0)}
        </span>
      )}
      <div
        data-handle="r"
        className={`w-3.5 flex-shrink-0 flex items-center justify-center cursor-col-resize ${
          active ? "text-rouge-500" : "text-ivory-300"
        }`}
        style={{ touchAction: "none" }}
        role="slider"
        aria-label="Fin du sous-titre"
        aria-valuenow={Math.round(end * 100) / 100}
        tabIndex={-1}
      >
        <span className="h-1/2 w-[3px] rounded-full bg-current" />
      </div>
    </div>
  );
});
