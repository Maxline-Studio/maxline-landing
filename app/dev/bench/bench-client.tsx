"use client";

/**
 * Banc d'essai de l'éditeur (dev only) — voir page.tsx.
 *
 * Deux mesures, faites depuis l'EXTÉRIEUR des composants (aucune instrumentation
 * interne, donc aucun risque de mesurer un artefact) :
 *
 *  - **Cadrage** : on donne au lecteur des boîtes de tailles précises et on
 *    vérifie que le cadre calculé tient dedans, au pixel près.
 *  - **Rendus parasites** : un `MutationObserver` compte les mutations du DOM de
 *    la piste des sous-titres pendant que l'horloge avance à 60 Hz. Si la
 *    timeline se re-rendait (l'ancien comportement), React toucherait le DOM des
 *    centaines de fois par seconde. Attendu désormais : **zéro**.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { SubtitlePlayer } from "@/components/app/subtitle-player";
import { Timeline } from "@/app/app/videos/[id]/editor/timeline";
import { PlaybackClock } from "@/app/app/videos/[id]/editor/playback-clock";
import {
  planInsertion,
  FLOOR_CUE,
  MIN_NEW_CUE,
} from "@/app/app/videos/[id]/editor/cue-ops";
import type { Cue } from "@/app/app/videos/[id]/editor/types";

const CUE_COUNT = 600;
const VIDEO_SECONDS = 600;

/** 600 cues ≈ une vidéo de 10 min découpée façon « court » : le pire cas réel. */
function makeCues(): Cue[] {
  const out: Cue[] = [];
  for (let i = 0; i < CUE_COUNT; i++) {
    const start = i * (VIDEO_SECONDS / CUE_COUNT);
    out.push({
      id: `b${i}`,
      start,
      end: start + 0.8,
      text: `Sous-titre numéro ${i + 1} du banc d'essai`,
    });
  }
  return out;
}

type Result = { label: string; ok: boolean; detail: string };

export function BenchClient() {
  const [cues] = useState(makeCues);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [clock] = useState(() => new PlaybackClock());
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [boxH, setBoxH] = useState(280);
  const [boxW, setBoxW] = useState(900);

  const stageWrapRef = useRef<HTMLDivElement>(null);

  // ─── Vidéo de test fabriquée dans le navigateur (pas de fichier, pas de ffmpeg) ───
  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    (async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1280;
        canvas.height = 720; // 16:9
        const ctx = canvas.getContext("2d")!;
        const stream = canvas.captureStream(30);
        const chunks: Blob[] = [];
        const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const done = new Promise<void>((r) => (rec.onstop = () => r()));
        rec.start();
        const t0 = performance.now();
        const draw = () => {
          const el = performance.now() - t0;
          ctx.fillStyle = "#1A1814";
          ctx.fillRect(0, 0, 1280, 720);
          ctx.fillStyle = "#C8392F";
          ctx.fillRect((el / 10) % 1280, 300, 120, 120);
          if (el < 4000 && !cancelled) requestAnimationFrame(draw);
          else rec.stop();
        };
        draw();
        await done;
        if (cancelled) return;
        url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
        setVideoUrl(url);
      } catch {
        setVideoUrl(null);
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  // ─── Mesure ───
  const run = useCallback(async () => {
    setRunning(true);
    const out: Result[] = [];

    // 1) CADRAGE : le cadre tient-il dans la boîte qu'on lui donne ?
    const check = (w: number, h: number) =>
      new Promise<void>((resolve) => {
        setBoxW(w);
        setBoxH(h);
        // deux images pour laisser passer la mesure ResizeObserver + le rendu
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              const stage = stageWrapRef.current;
              const inner = stage?.querySelector<HTMLElement>(".ml-player-inner");
              if (!stage || !inner) {
                out.push({
                  label: `Cadrage ${w}×${h}`,
                  ok: false,
                  detail: "cadre introuvable (vidéo non chargée ?)",
                });
                resolve();
                return;
              }
              const s = stage.getBoundingClientRect();
              const f = inner.getBoundingClientRect();
              const fits = f.width <= s.width + 1 && f.height <= s.height + 1;
              out.push({
                label: `Cadrage ${w}×${h}`,
                ok: fits,
                detail: `boîte ${Math.round(s.width)}×${Math.round(s.height)} → cadre ${Math.round(f.width)}×${Math.round(f.height)}${fits ? "" : "  ✗ DÉBORDE"}`,
              });
              resolve();
            }),
          ),
        );
      });

    await check(900, 280); // portable 1366×768 : le cas qui cassait
    await check(1100, 700); // grand écran
    await check(360, 200); // mobile
    await check(900, 180); // très plat

    // 2) RENDUS PARASITES : mutations du DOM de la piste pendant 3 s d'horloge.
    const track = document.querySelector<HTMLElement>("[data-bench-track]");
    let mutations = 0;
    let playheadMutations = 0;
    const obs = new MutationObserver((list) => {
      for (const m of list) {
        const t = m.target as HTMLElement;
        if (t.closest?.("[data-playhead]")) playheadMutations++;
        else mutations++;
      }
    });
    if (track) {
      obs.observe(track, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true,
      });
    }

    const frames: number[] = [];
    await new Promise<void>((resolve) => {
      const t0 = performance.now();
      let last = t0;
      const tick = () => {
        const now = performance.now();
        frames.push(now - last);
        last = now;
        // On avance l'horloge comme le ferait la lecture d'une vidéo.
        clock.set(((now - t0) / 1000) * 1);
        if (now - t0 < 3000) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    obs.disconnect();

    frames.sort((a, b) => a - b);
    const p95 = frames[Math.floor(frames.length * 0.95)] ?? 0;
    const long = frames.filter((f) => f > 32).length;

    out.push({
      label: "Rendus parasites de la timeline",
      ok: mutations === 0,
      detail: `${mutations} mutation(s) DOM hors tête de lecture sur 3 s à 60 Hz (${CUE_COUNT} cues). Attendu : 0.`,
    });
    out.push({
      label: "Tête de lecture animée",
      ok: playheadMutations > 60,
      detail: `${playheadMutations} mise(s) à jour de la tête de lecture (preuve que l'horloge tourne bien).`,
    });
    out.push({
      label: "Fluidité",
      ok: p95 < 25 && long <= 3,
      detail: `p95 = ${p95.toFixed(1)} ms/image · ${long} image(s) > 32 ms sur ${frames.length}.`,
    });

    // 3) AJOUT À LA TÊTE DE LECTURE — le bug remonté, reproduit à l'identique.
    const list = [
      { start: 0, end: 1 },
      { start: 1.5, end: 2.5 },
      { start: 200, end: 201 },
      { start: 201, end: 202.5 },
    ];
    const D = 300;
    const cases: [string, number, { index: number; start: number } | null][] = [
      // LE cas du bug : on regarde à 3 min 20 s, la ligne doit naître LÀ.
      ["tête à 200,5 s (dans un cue)", 200.5, { index: 3, start: 201 }],
      ["tête à 100 s (zone vide)", 100, { index: 2, start: 100 }],
      // Tête DANS le premier cue : on ne crée pas de ligne à cheval, on la met
      // juste après. (Attente initiale erronée de ma part : le code a raison.)
      ["tête à 0 s, déjà occupé → juste après", 0, { index: 1, start: 1 }],
      // Tête AVANT tout cue, dans du vide : la ligne naît pile à la tête.
      // Trou de 0,3 s : la ligne naît À la tête, courte — elle ne recule pas.
      ["tête à 1,2 s (trou court de 0,3 s)", 1.2, { index: 1, start: 1.2 }],
      ["liste vide → pile à la tête", 42, { index: 0, start: 42 }],
      // Fin de vidéo : recule au lieu d'échouer en silence (l'ancien défaut).
      ["tête à la toute fin", 299.9, { index: 4, start: 299.4 }],
    ];
    for (const [label, t, want] of cases) {
      const got = planInsertion(label.includes("liste vide") ? [] : list, t, D);
      const ok =
        !!got &&
        !!want &&
        got.index === want.index &&
        Math.abs(got.start - want.start) < 0.001 &&
        got.end > got.start;
      out.push({
        label: `Ajout — ${label}`,
        ok,
        detail: got
          ? `index ${got.index}, ${got.start.toFixed(2)} s → ${got.end.toFixed(2)} s`
          : "aucune insertion possible",
      });
    }
    // Invariants, sur toutes les positions possibles de la tête de lecture.
    let bad = 0;
    let drift = 0;
    let maxOverlap = 0;
    for (let t = 0; t <= D; t += 0.37) {
      const p = planInsertion(list, t, D);
      if (!p) {
        bad++;
        continue;
      }
      // (a) reste dans la vidéo, durée strictement positive
      if (p.start < 0 || p.end > D || p.end <= p.start) bad++;
      // (b) ne démarre jamais à l'intérieur du cue précédent
      const prev = list[p.index - 1];
      if (prev && p.start < prev.end - 0.001) bad++;
      // (c) ne mord sur le cue suivant que du plancher, au pire
      const next = list[p.index];
      if (next) maxOverlap = Math.max(maxOverlap, p.end - next.start);
      // (d) LE point qui compte : le début ne s'éloigne jamais de la tête de
      //     lecture, sauf pour éviter un cue existant ou la fin de la vidéo.
      const legitimate = Math.max(
        prev ? prev.end : 0,
        Math.min(t, D - MIN_NEW_CUE),
      );
      if (Math.abs(p.start - legitimate) > 0.001) drift++;
    }
    out.push({
      label: "Ajout — invariants",
      ok: bad === 0 && drift === 0 && maxOverlap <= FLOOR_CUE + 0.001,
      detail: `${bad} violation(s), ${drift} dérive(s) hors tête de lecture, chevauchement max ${maxOverlap.toFixed(2)} s — sur ${Math.ceil(D / 0.37)} positions.`,
    });

    setResults(out);
    setRunning(false);
  }, [clock]);

  return (
    <div className="p-6 space-y-6 bg-ivory-50 min-h-dvh">
      <div>
        <h1 className="font-display text-2xl text-ink-900">
          Banc d&apos;essai éditeur
        </h1>
        <p className="text-sm text-ink-600">
          {CUE_COUNT} sous-titres · vidéo de test fabriquée dans le navigateur
        </p>
      </div>

      <button
        onClick={run}
        disabled={running || !videoUrl}
        className="btn-pen text-sm disabled:opacity-50"
      >
        {running
          ? "Mesure en cours…"
          : videoUrl
            ? "Lancer les mesures"
            : "Fabrication de la vidéo de test…"}
      </button>

      {results.length > 0 && (
        <ul className="space-y-1 font-mono text-xs" data-bench-results>
          {results.map((r) => (
            <li key={r.label} className={r.ok ? "text-success-600" : "text-rouge-600"}>
              {r.ok ? "OK  " : "ÉCHEC "} {r.label} — {r.detail}
            </li>
          ))}
        </ul>
      )}

      {/* Boîte de test du lecteur : dimensions imposées, comme dans l'éditeur */}
      <div className="inline-block border-2 border-dashed border-rouge-500">
        <div
          ref={stageWrapRef}
          style={{ width: boxW, height: boxH }}
          className="bg-ink-900"
        >
          <SubtitlePlayer
            videoUrl={videoUrl}
            activeText="Ceci est un sous-titre de contrôle"
            subtitleStyle={undefined}
            clock={clock}
          />
        </div>
      </div>
      <p className="font-mono text-[10px] text-ink-500">
        boîte imposée : {boxW}×{boxH} px — le cadre rouge est la limite à ne pas
        dépasser
      </p>

      <div data-bench-track>
        <Timeline
          cues={cues}
          duration={VIDEO_SECONDS}
          clock={clock}
          isPlaying={false}
          selectedIdx={selectedIdx}
          activeIdx={activeIdx}
          pxPerSec={40}
          snap
          follow={false}
          onSelect={(i) => setSelectedIdx(i)}
          onScrub={(t) => clock.set(t)}
          onEditStart={() => {}}
          onTiming={() => {}}
          onEditEnd={() => {}}
        />
      </div>
      <button
        onClick={() => setActiveIdx((a) => (a + 1) % CUE_COUNT)}
        className="btn-outline text-xs"
      >
        Simuler un changement de cue actif (doit rester fluide)
      </button>
    </div>
  );
}
