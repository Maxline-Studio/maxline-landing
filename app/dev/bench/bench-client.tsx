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
import { DEFAULT_SUBTITLE_STYLE } from "@/lib/subtitle-style";

const CUE_COUNT = 600;
const VIDEO_SECONDS = 600;

/**
 * Destination disque SIMULÉE, à la forme d'un `FileSystemFileHandle`.
 *
 * Le vrai sélecteur de fichier exige un geste utilisateur : ce chemin serait
 * donc intestable en automatique, alors que c'est lui qui sert aux vidéos
 * longues. On reproduit ici le contrat qui compte : des écritures à des
 * positions arbitraires, et la distinction entre « fermer » (= valider sur le
 * disque) et « abandonner ».
 */
function makeFakeFile() {
  let buf = new Uint8Array(0);
  const state = { committed: false, discarded: false };
  const put = (pos: number, data: Uint8Array) => {
    const end = pos + data.length;
    if (end > buf.length) {
      const bigger = new Uint8Array(Math.max(end, buf.length * 2));
      bigger.set(buf);
      buf = bigger.subarray(0, end);
      const grown = new Uint8Array(end);
      grown.set(buf.subarray(0, Math.min(buf.length, end)));
      buf = grown;
    }
    buf.set(data, pos);
  };
  const stream = {
    async write(p: { type: string; position: number; data: Uint8Array }) {
      put(p.position, p.data);
    },
    async close() {
      state.committed = true;
    },
    async abort() {
      state.discarded = true;
    },
  };
  const handle = {
    createWritable: async () => stream,
    remove: async () => {
      state.discarded = true;
    },
  } as unknown as FileSystemFileHandle;
  return {
    handle,
    bytes: () => buf,
    get committed() {
      return state.committed;
    },
    get discarded() {
      return state.discarded;
    },
  };
}

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
  const [exportMsg, setExportMsg] = useState("");
  /** Vrai fichier déposé par l'opérateur : la seule matière qui prouve quoi que
   * ce soit sur les performances d'export. */
  const [realFileUrl, setRealFileUrl] = useState<string | null>(null);
  const [realFileName, setRealFileName] = useState("");
  /** Image extraite du MP4 produit : le seul contrôle qui montre le sous-titre. */
  const previewRef = useRef<HTMLCanvasElement | null>(null);
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

  // ─── Export MP4 dans le navigateur : la vraie preuve ───
  //
  // La version précédente de ce banc ne testait QUE la petite vidéo synthétique
  // fabriquée ici. Elle validait donc un export qui, sur un vrai MP4, mettait
  // 185 ms par image au lieu de 3. Un banc qui ne teste pas la matière réelle ne
  // protège de rien : on peut désormais lui donner un vrai fichier.
  const runExport = useCallback(async () => {
    const source = realFileUrl ?? videoUrl;
    if (!source) return;
    setRunning(true);
    const out: Result[] = [];
    const t0 = performance.now();
    try {
      // (0) La police se pose-t-elle vraiment sur le canvas ?
      // `ctx.font` ignore SILENCIEUSEMENT une chaîne invalide et reste à
      // « 10px sans-serif ». C'est le défaut qui a rendu illisibles tous les
      // sous-titres gravés dans le navigateur : on le verrouille ici.
      const { resolveFontFamilies } = await import("@/lib/subtitle-render");
      const probe = document.createElement("canvas").getContext("2d")!;
      const family = resolveFontFamilies()[DEFAULT_SUBTITLE_STYLE.font];
      probe.font = "10px sans-serif";
      probe.font = `600 59px ${family}`;
      out.push({
        label: "Police acceptée par le canvas",
        ok: probe.font.includes("59px"),
        detail: probe.font.includes("59px")
          ? `« ${probe.font} »`
          : `REJETÉE — le canvas est resté à « ${probe.font} » : les sous-titres sortiraient en 10 px`,
      });

      const { burnInBrowser } = await import("@/lib/export/burn-in-browser");
      const result = await burnInBrowser({
        videoUrl: source,
        segments: [
          { start: 0, end: 1.5, text: "Premier sous-titre gravé" },
          { start: 1.6, end: 3.2, text: "Deuxième ligne\nsur deux lignes" },
        ],
        style: DEFAULT_SUBTITLE_STYLE,
        onProgress: (p) => setExportMsg(`${p.phase} ${p.pct}%`),
      });
      const blob = result.blob!;
      const seconds = (performance.now() - t0) / 1000;
      const st = result.stats;
      out.push({
        label: "MP4 produit",
        ok: blob.size > 1000 && blob.type === "video/mp4",
        detail: `${(blob.size / 1024).toFixed(0)} Ko, ${st.width}×${st.height}, ${st.frames} images, audio ${st.audio}, en ${seconds.toFixed(1)} s`,
      });

      // LE chiffre anti-régression. Le décodage par déplacements donnait
      // 185 ms/image ; le décodage séquentiel, 3,13 ms. On échoue bien avant
      // d'être revenu à l'ancien comportement.
      const msPerFrame = st.elapsedMs / Math.max(1, st.frames);
      const speed = st.durationSeconds / (st.elapsedMs / 1000);
      out.push({
        label: "Débit d'encodage",
        ok: msPerFrame < 40,
        detail: `${msPerFrame.toFixed(2)} ms/image · ×${speed.toFixed(2)} le temps réel (seuil d'alerte : 40 ms/image)`,
      });

      // Un fichier publiable, pas une copie de laboratoire. Un réglage de
      // qualité mal interprété a déjà produit 47 Mbit/s (128 Mo pour 22 s), ce
      // qui passe tous les autres contrôles sans être utilisable.
      const mbps = (blob.size * 8) / 1e6 / Math.max(0.1, st.durationSeconds);
      out.push({
        label: "Poids du fichier",
        ok: mbps < 15,
        detail: `${mbps.toFixed(1)} Mbit/s · ${(blob.size / 1048576).toFixed(1)} Mo pour ${st.durationSeconds.toFixed(1)} s (seuil d'alerte : 15 Mbit/s)`,
      });

      // Le fichier est-il RELISIBLE ? C'est la seule preuve qui compte : un
      // muxage invalide produit un blob de bonne taille mais illisible.
      const url = URL.createObjectURL(blob);
      const check = await new Promise<{ ok: boolean; detail: string }>((res) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        const timer = setTimeout(
          () => res({ ok: false, detail: "métadonnées jamais chargées" }),
          8000,
        );
        v.onloadedmetadata = () => {
          clearTimeout(timer);
          res({
            ok: v.videoWidth > 0 && isFinite(v.duration) && v.duration > 0,
            detail: `${v.videoWidth}×${v.videoHeight}, ${v.duration.toFixed(2)} s`,
          });
        };
        v.onerror = () => {
          clearTimeout(timer);
          res({ ok: false, detail: "le navigateur refuse de le lire" });
        };
        v.src = url;
      });
      out.push({ label: "MP4 relisible", ...check });
      URL.revokeObjectURL(url);

      // ── La preuve qui compte vraiment : le sous-titre est-il LÀ, et lisible ?
      // Tous les contrôles ci-dessus passaient déjà quand le canvas gravait en
      // 10 px par défaut. Seul un regard sur l'image le montre.
      try {
        const { Input, BlobSource, ALL_FORMATS, CanvasSink } = await import(
          "mediabunny"
        );
        const check2 = new Input({
          source: new BlobSource(blob),
          formats: ALL_FORMATS,
        });
        const vt = await check2.getPrimaryVideoTrack();
        if (vt) {
          const sink = new CanvasSink(vt, { width: 360 });
          const shot = await sink.getCanvas(0.6);
          const cv = previewRef.current;
          if (shot && cv) {
            cv.width = shot.canvas.width;
            cv.height = shot.canvas.height;
            const pctx = cv.getContext("2d")!;
            pctx.drawImage(shot.canvas, 0, 0);

            // Le sous-titre est-il RÉELLEMENT gravé, et à la bonne taille ?
            // Le style par défaut pose une boîte sombre pleine largeur sous un
            // texte clair : on compte les rangées de boîte et les pixels de
            // texte. Une police tombée à 10 px donnerait une boîte cinq fois
            // trop courte — précisément le défaut qui a échappé à tous les
            // autres contrôles pendant six jours.
            const { width: pw, height: ph } = cv;
            const px = pctx.getImageData(0, 0, pw, ph).data;
            let boxRows = 0;
            let textPixels = 0;
            for (let y = 0; y < ph; y++) {
              let dark = 0;
              for (let x = 0; x < pw; x++) {
                const i = (y * pw + x) * 4;
                if (px[i]! < 45 && px[i + 1]! < 45 && px[i + 2]! < 40) dark++;
              }
              if (dark <= pw * 0.25) continue;
              boxRows++;
              for (let x = 0; x < pw; x++) {
                const i = (y * pw + x) * 4;
                if (px[i]! > 200 && px[i + 1]! > 200 && px[i + 2]! > 190)
                  textPixels++;
              }
            }
            const scale = st.width / pw;
            const boxPx = Math.round(boxRows * scale);
            const expected = Math.round(
              0.055 * Math.min(st.width, st.height) * 1.45,
            );
            out.push({
              label: "Sous-titre gravé et lisible",
              ok: textPixels > 150 && boxPx > expected * 0.6,
              detail: `boîte de ${boxPx} px de haut (attendu ≈ ${expected}), ${textPixels} pixels de texte`,
            });
          }
        }
        await check2.dispose?.();
      } catch {
        /* l'aperçu est un confort, son échec ne condamne pas l'export */
      }
      // ── Écriture directe sur le disque ────────────────────────────────
      // Ce chemin sert aux vidéos longues (la mémoire ne suit plus). Il est
      // impossible à déclencher en automatique — `showSaveFilePicker` exige un
      // geste — donc on lui fournit une destination SIMULÉE. Deux propriétés
      // comptent : le fichier écrit doit être un MP4 valide, et une annulation
      // ne doit RIEN valider (fermer un fichier réel le valide sur le disque,
      // ce qui déposerait une vidéo tronquée d'apparence normale).
      const disk = makeFakeFile();
      const diskRun = await burnInBrowser({
        videoUrl: source,
        segments: [{ start: 0, end: 2, text: "Écriture directe sur le disque" }],
        style: DEFAULT_SUBTITLE_STYLE,
        fileHandle: disk.handle,
      });
      const written = disk.bytes();
      out.push({
        label: "Écriture disque — fichier validé",
        ok:
          diskRun.blob === null &&
          diskRun.stats.toDisk &&
          disk.committed &&
          written.length > 1000,
        detail: `${(written.length / 1048576).toFixed(1)} Mo écrits, validé=${disk.committed}, jeté=${disk.discarded}, blob en mémoire=${diskRun.blob === null ? "aucun" : "présent"}`,
      });

      const readable = await new Promise<{ ok: boolean; detail: string }>((res) => {
        const u = URL.createObjectURL(new Blob([written], { type: "video/mp4" }));
        const v = document.createElement("video");
        v.preload = "metadata";
        const t = setTimeout(() => res({ ok: false, detail: "illisible" }), 8000);
        v.onloadedmetadata = () => {
          clearTimeout(t);
          URL.revokeObjectURL(u);
          res({
            ok: v.videoWidth > 0 && v.duration > 0,
            detail: `${v.videoWidth}×${v.videoHeight}, ${v.duration.toFixed(2)} s`,
          });
        };
        v.onerror = () => {
          clearTimeout(t);
          URL.revokeObjectURL(u);
          res({ ok: false, detail: "le navigateur refuse de le lire" });
        };
        v.src = u;
      });
      out.push({ label: "Écriture disque — MP4 relisible", ...readable });

      // Annulation : le fichier ne doit surtout pas être validé.
      const disk2 = makeFakeFile();
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 250);
      let aborted = false;
      try {
        await burnInBrowser({
          videoUrl: source,
          segments: [{ start: 0, end: 2, text: "Annulation" }],
          style: DEFAULT_SUBTITLE_STYLE,
          fileHandle: disk2.handle,
          signal: ctrl.signal,
        });
      } catch {
        aborted = true;
      }
      out.push({
        label: "Annulation — rien n'est validé",
        ok: aborted && !disk2.committed && disk2.discarded,
        detail: aborted
          ? `validé=${disk2.committed} (doit être false), jeté=${disk2.discarded} (doit être true)`
          : "l'export ne s'est pas interrompu",
      });
    } catch (err) {
      out.push({
        label: "Export",
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      });
    }
    setExportMsg("");
    setResults(out);
    setRunning(false);
  }, [realFileUrl, videoUrl]);

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

      <div className="flex flex-wrap gap-2 items-center">
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
        <button
          onClick={runExport}
          disabled={running || (!videoUrl && !realFileUrl)}
          className="btn-outline text-sm disabled:opacity-50"
        >
          Tester l&apos;export MP4
          {realFileUrl ? " (vrai fichier)" : " (vidéo synthétique)"}
        </button>
        <label className="btn-outline text-sm cursor-pointer">
          Choisir un vrai MP4…
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (realFileUrl) URL.revokeObjectURL(realFileUrl);
              setRealFileUrl(URL.createObjectURL(f));
              setRealFileName(`${f.name} — ${(f.size / 1048576).toFixed(1)} Mo`);
            }}
          />
        </label>
        {realFileName && (
          <span className="font-mono text-xs text-ink-600">{realFileName}</span>
        )}
        {exportMsg && (
          <span className="font-mono text-xs text-ink-500">{exportMsg}</span>
        )}
        <canvas
          ref={previewRef}
          className="border border-ink-200 rounded bg-ink-900"
          aria-label="Image extraite du MP4 produit"
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-ink-500">
          L&apos;image ci-dessus est extraite du fichier PRODUIT : c&apos;est le
          seul contrôle qui montre que le sous-titre est gravé et lisible.
        </span>
      </div>

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
