"use client";

/**
 * Incrustation des sous-titres DANS LE NAVIGATEUR.
 *
 * ─── Pourquoi ────────────────────────────────────────────────────────────────
 * L'incrustation serveur tourne sur une VM à 0,25 vCPU : x264 logiciel, file
 * d'attente globale à 1, aller-retour transatlantique. En production, un burn
 * démarré à 17:12 était encore en cours à 18:43 avant d'être abandonné. Aucune
 * optimisation de ligne de commande ne rattrape un facteur 20 de puissance
 * manquante.
 *
 * La machine de l'utilisateur, elle, a un encodeur MATÉRIEL. C'est exactement
 * ce que fait un logiciel de montage : il encode en local, sans réseau. Ici,
 * l'encodage ne coûte plus rien au serveur et ne fait plus attendre personne.
 *
 * ─── Le choix technique qui compte ───────────────────────────────────────────
 * On aurait pu lire la vidéo en accéléré et capturer les images présentées
 * (`playbackRate` + `requestVideoFrameCallback`). C'est tentant mais faux : le
 * nombre d'images présentées est plafonné par la FRÉQUENCE DE L'ÉCRAN. À 8× sur
 * une vidéo 30 fps, il faudrait présenter 240 images par seconde ; un écran 60 Hz
 * en fournit 60. On perdrait les trois quarts des images.
 *
 * On avance donc par **déplacements successifs** (`currentTime` puis `seeked`).
 * Ce n'est borné par aucun écran, et surtout c'est DÉTERMINISTE : chaque image
 * de sortie existe, aucune n'est perdue.
 */
import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import type { SubtitleStyle } from "@/lib/subtitle-style";
import type { Segment } from "@/lib/video-types";
import { speakerColor, countSpeakers } from "@/lib/speakers";
import {
  activeSegmentIndex,
  drawSubtitle,
  resolveSubtitlePaint,
  type SubtitlePaint,
} from "@/lib/subtitle-render";
import {
  bitrateFor,
  checkExportSupport,
  scaleToFit,
  type ExportSupport,
} from "./capabilities";

export type BurnPhase = "preparation" | "audio" | "video" | "finalisation";
export type BurnProgress = { phase: BurnPhase; pct: number };

export type BurnOptions = {
  /** URL de la vidéo source (présignée R2). Le CORS doit autoriser GET depuis
   * le site, sinon le canvas est « teinté » et l'encodage est refusé. */
  videoUrl: string;
  segments: Segment[];
  style: SubtitleStyle;
  rtl?: boolean;
  /** Images par seconde de la sortie. 30 suffit pour du sous-titrage. */
  fps?: number;
  /** Plus grand côté de la sortie (défaut 1920, comme le worker). */
  maxDim?: number;
  signal?: AbortSignal;
  onProgress?: (p: BurnProgress) => void;
};

/** Au-delà, on refuse : décoder l'audio entier en mémoire deviendrait risqué
 * (une heure de son stéréo décompressé pèse plus d'un gigaoctet). */
const MAX_DURATION_SECONDS = 20 * 60;

export class BurnUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BurnUnsupportedError";
  }
}

/** Charge la vidéo dans un élément masqué et attend ses métadonnées. */
function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    // INDISPENSABLE : sans en-têtes CORS, dessiner la vidéo « teinte » le canvas
    // et toute lecture de pixels devient interdite → l'encodage échoue.
    v.crossOrigin = "anonymous";
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    v.src = url;
    const onError = () =>
      reject(
        new BurnUnsupportedError(
          "Impossible de lire la vidéo source dans le navigateur.",
        ),
      );
    v.addEventListener("error", onError, { once: true });
    v.addEventListener(
      "loadedmetadata",
      () => {
        if (!v.videoWidth || !v.videoHeight) {
          onError();
          return;
        }
        resolve(v);
      },
      { once: true },
    );
  });
}

/** Déplace la lecture à `t` et attend que l'image soit réellement prête. */
function seekTo(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      v.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      v.removeEventListener("seeked", onSeeked);
      reject(new Error("Déplacement dans la vidéo impossible."));
    };
    v.addEventListener("seeked", onSeeked, { once: true });
    v.addEventListener("error", onError, { once: true });
    v.currentTime = Math.min(t, Math.max(0, (v.duration || 0) - 0.001));
  });
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Export annulé", "AbortError");
}

/**
 * Grave les sous-titres et renvoie le MP4 final.
 *
 * Lève `BurnUnsupportedError` quand la machine ou la source ne s'y prêtent pas :
 * l'appelant doit alors basculer sur l'incrustation serveur. On ne laisse
 * JAMAIS l'utilisateur devant un échec sec.
 */
export async function burnInBrowser(opts: BurnOptions): Promise<Blob> {
  const fps = opts.fps ?? 30;
  const report = (phase: BurnPhase, pct: number) =>
    opts.onProgress?.({ phase, pct: Math.max(0, Math.min(100, Math.round(pct))) });

  report("preparation", 0);
  throwIfAborted(opts.signal);

  const video = await loadVideo(opts.videoUrl);
  const duration = video.duration;
  if (!isFinite(duration) || duration <= 0) {
    throw new BurnUnsupportedError("Durée de la vidéo inconnue.");
  }
  if (duration > MAX_DURATION_SECONDS) {
    throw new BurnUnsupportedError(
      `Vidéo trop longue pour l'export local (${Math.round(duration / 60)} min).`,
    );
  }

  const out = scaleToFit(video.videoWidth, video.videoHeight, opts.maxDim ?? 1920);
  const support: ExportSupport = await checkExportSupport(out.width, out.height, fps);
  if (!support.ok) throw new BurnUnsupportedError(support.reason);

  // ── Canvas de composition ────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new BurnUnsupportedError("Canvas 2D indisponible.");

  // Les polices doivent être chargées AVANT le premier dessin, sinon les
  // premières images seraient rendues avec une police de repli.
  if (document.fonts?.ready) await document.fonts.ready;

  // ── Paints pré-calculés (un par locuteur) ────────────────────────────────
  const multiSpeaker = countSpeakers(opts.segments) > 1;
  const paintCache = new Map<number, SubtitlePaint>();
  const paintFor = (speaker: number | undefined): SubtitlePaint => {
    const key = multiSpeaker && typeof speaker === "number" ? speaker : -1;
    let p = paintCache.get(key);
    if (!p) {
      p = resolveSubtitlePaint(
        opts.style,
        key >= 0 ? speakerColor(key) : null,
      );
      paintCache.set(key, p);
    }
    return p;
  };

  // ── Audio : décodé AVANT tout le reste ───────────────────────────────────
  //
  // On décode l'audio en premier pour deux raisons : on n'encode pas des
  // milliers d'images pour rien si l'audio pose problème, et surtout il faut
  // SAVOIR s'il y aura une piste audio avant de construire le muxeur.
  //
  // Distinction essentielle :
  //  - la vidéo n'a PAS de piste audio (clip muet, export d'animation) → on
  //    produit un MP4 muet, c'est le résultat correct ;
  //  - la vidéo a une piste audio qu'on n'arrive PAS à décoder → on refuse et
  //    on laisse le serveur faire. Rendre un fichier muet en silence serait
  //    pire que tout : l'utilisateur ne s'en apercevrait qu'après publication.
  report("audio", 0);
  const expectsAudio = await hasAudioTrack(video);
  let audioBuffer: AudioBuffer | null = null;
  try {
    audioBuffer = await decodeAudio(opts.videoUrl, opts.signal);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    if (expectsAudio) {
      throw new BurnUnsupportedError(
        "La piste audio n'a pas pu être traitée dans le navigateur.",
      );
    }
    audioBuffer = null; // vidéo réellement muette
  }
  if (audioBuffer && audioBuffer.length === 0) audioBuffer = null;

  // ── Muxeur + encodeurs ───────────────────────────────────────────────────
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    fastStart: "in-memory", // lecture possible avant téléchargement complet
    video: { codec: "avc", width: out.width, height: out.height },
    ...(audioBuffer
      ? {
          audio: {
            codec: "aac" as const,
            numberOfChannels: 2,
            sampleRate: audioBuffer.sampleRate,
          },
        }
      : {}),
  });

  let encodeError: unknown = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => (encodeError = e),
  });
  videoEncoder.configure({
    codec: support.codec,
    width: out.width,
    height: out.height,
    bitrate: bitrateFor(out.width, out.height, fps),
    framerate: fps,
    hardwareAcceleration: support.hardware ? "prefer-hardware" : "no-preference",
  });

  let audioEncoder: AudioEncoder | null = null;
  if (audioBuffer) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => (encodeError = e),
    });
    try {
      await encodeAudio(audioBuffer, audioEncoder, opts.signal, (p) =>
        report("audio", p),
      );
    } catch (err) {
      videoEncoder.close();
      audioEncoder.close();
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new BurnUnsupportedError(
        "La piste audio n'a pas pu être encodée dans le navigateur.",
      );
    }
  }
  report("audio", 100);

  // ── Vidéo : image par image, déplacement déterministe ────────────────────
  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const frameDurationUs = Math.round(1_000_000 / fps);

  for (let i = 0; i < totalFrames; i++) {
    throwIfAborted(opts.signal);
    if (encodeError) throw encodeError;

    const t = i / fps;
    await seekTo(video, t);

    ctx.drawImage(video, 0, 0, out.width, out.height);

    const idx = activeSegmentIndex(opts.segments, t);
    if (idx >= 0) {
      const seg = opts.segments[idx]!;
      drawSubtitle(ctx, {
        width: out.width,
        height: out.height,
        text: seg.text,
        paint: paintFor(seg.speaker),
        words: seg.words,
        time: t,
        animation: opts.style.animation,
        rtl: opts.rtl,
      });
    }

    const frame = new VideoFrame(canvas, {
      timestamp: Math.round(t * 1_000_000),
      duration: frameDurationUs,
    });
    // Image clé toutes les 2 secondes : permet de se déplacer dans le fichier
    // final sans le relire depuis le début.
    videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();

    // On ne laisse pas la file d'encodage enfler indéfiniment : sur une longue
    // vidéo, cela ferait exploser la mémoire.
    if (videoEncoder.encodeQueueSize > 8) {
      await new Promise<void>((r) => setTimeout(r, 0));
      while (videoEncoder.encodeQueueSize > 4) {
        await new Promise<void>((r) => setTimeout(r, 4));
      }
    }
    if (i % 10 === 0) report("video", (i / totalFrames) * 100);
  }

  report("finalisation", 0);
  await videoEncoder.flush();
  if (audioEncoder) await audioEncoder.flush();
  if (encodeError) throw encodeError;
  videoEncoder.close();
  audioEncoder?.close();
  muxer.finalize();
  report("finalisation", 100);

  video.src = "";
  video.remove();
  return new Blob([target.buffer as ArrayBuffer], { type: "video/mp4" });
}

/**
 * La source a-t-elle une piste audio ?
 *
 * Il n'existe pas d'API universelle. On interroge donc, dans l'ordre, les
 * indices que les navigateurs exposent réellement. En dernier recours on répond
 * « oui » : c'est le choix PRUDENT — mieux vaut retomber sur le serveur que
 * livrer un fichier muet sans prévenir.
 */
async function hasAudioTrack(v: HTMLVideoElement): Promise<boolean> {
  const anyV = v as unknown as {
    mozHasAudio?: boolean;
    webkitAudioDecodedByteCount?: number;
    audioTracks?: { length: number };
  };
  if (typeof anyV.mozHasAudio === "boolean") return anyV.mozHasAudio;
  if (anyV.audioTracks && typeof anyV.audioTracks.length === "number") {
    return anyV.audioTracks.length > 0;
  }
  if (typeof anyV.webkitAudioDecodedByteCount === "number") {
    // Le compteur ne bouge qu'une fois du son réellement décodé : on lit un
    // court instant, en silence, pour lui laisser une chance de s'incrémenter.
    try {
      v.muted = true;
      await v.play();
      await new Promise((r) => setTimeout(r, 220));
      v.pause();
      v.currentTime = 0;
    } catch {
      /* lecture refusée : on retombe sur la réponse prudente */
    }
    return (anyV.webkitAudioDecodedByteCount ?? 0) > 0;
  }
  return true;
}

/**
 * Décode la piste audio de la source.
 *
 * `decodeAudioData` gère lui-même le conteneur (MP4, WebM, MOV…), ce qui évite
 * d'embarquer un démultiplexeur complet. En contrepartie il décompresse tout en
 * mémoire — d'où la limite de durée posée plus haut.
 */
async function decodeAudio(
  url: string,
  signal: AbortSignal | undefined,
): Promise<AudioBuffer> {
  throwIfAborted(signal);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Téléchargement audio : HTTP ${res.status}`);
  const bytes = await res.arrayBuffer();
  throwIfAborted(signal);

  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioCtx();
  try {
    return await audioCtx.decodeAudioData(bytes);
  } finally {
    void audioCtx.close();
  }
}

/** Réencode un AudioBuffer déjà décodé en AAC, par blocs d'une seconde. */
async function encodeAudio(
  buffer: AudioBuffer,
  encoder: AudioEncoder,
  signal: AbortSignal | undefined,
  onProgress: (pct: number) => void,
): Promise<void> {
  const channels = Math.min(2, buffer.numberOfChannels) || 1;
  const sampleRate = buffer.sampleRate;
  encoder.configure({
    codec: "mp4a.40.2", // AAC-LC : lu partout
    sampleRate,
    numberOfChannels: 2,
    bitrate: 128_000,
  });

  // Entrelacement stéréo par blocs d'une seconde.
  const block = sampleRate;
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;
  const total = buffer.length;

  for (let offset = 0; offset < total; offset += block) {
    throwIfAborted(signal);
    const n = Math.min(block, total - offset);
    const interleaved = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      interleaved[i * 2] = left[offset + i] ?? 0;
      interleaved[i * 2 + 1] = right[offset + i] ?? 0;
    }
    const data = new AudioData({
      format: "f32",
      sampleRate,
      numberOfFrames: n,
      numberOfChannels: 2,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: interleaved,
    });
    encoder.encode(data);
    data.close();
    onProgress((offset / total) * 100);
    if (encoder.encodeQueueSize > 8) {
      await new Promise<void>((r) => setTimeout(r, 4));
    }
  }
  onProgress(100);
}
