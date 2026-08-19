"use client";

/**
 * Incrustation des sous-titres DANS LE NAVIGATEUR — décodage séquentiel.
 *
 * ─── Ce qui a été jeté, et pourquoi ──────────────────────────────────────────
 * La première version (12 août) avançait par DÉPLACEMENTS : pour chaque image de
 * sortie, `video.currentTime = t` puis attente de `seeked`. Mesuré le 18 août sur
 * un fichier réel, à machine constante :
 *
 *   déplacement image par image ....... 48 ms (début) → 85 ms (milieu de fichier)
 *   décodage séquentiel ............... 0,8 ms
 *   chaîne complète, ancienne ......... 185 ms / image
 *   chaîne complète, celle-ci ......... 3,13 ms / image   (×59)
 *
 * La cause est mécanique : un MP4 ne contient une image clé que toutes les
 * quelques secondes (le proxy d'aperçu : UNE toutes les 250 images). Se déplacer
 * à l'image N force le navigateur à repartir de l'image clé précédente et à
 * décoder puis JETER tout ce qui sépare les deux — environ 125 images à chaque
 * fois. On payait 125 décodages pour en garder un.
 *
 * Un décodeur lit une vidéo dans l'ordre. C'est tout ce qu'il fallait faire.
 *
 * ─── Trois autres défauts corrigés au passage ────────────────────────────────
 *  1. On gravait le PROXY d'aperçu (854 px, CRF 30, audio déjà recompressé) en
 *     croyant graver la source. On grave désormais la source.
 *  2. La sortie était forcée à 30 img/s depuis une source à 24 : une image sur
 *     cinq était un doublon. On suit maintenant la cadence de la source.
 *  3. L'audio était décompressé en mémoire puis RÉENCODÉ. Les paquets d'origine
 *     sont désormais recopiés tels quels : zéro perte, zéro travail.
 *
 * ─── Pourquoi mediabunny ─────────────────────────────────────────────────────
 * Démultiplexage, décodage, rotation, encodage, multiplexage et contre-pression
 * dans une seule bibliothèque, écrite par l'auteur de `mp4-muxer`. Elle traite
 * en particulier la ROTATION des vidéos de téléphone, qu'un décodage brut
 * ignorerait — on aurait sorti les vidéos verticales couchées.
 */
import {
  ALL_FORMATS,
  AudioSampleSource,
  AudioSampleSink,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  EncodedAudioPacketSource,
  EncodedPacketSink,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  StreamTarget,
  UrlSource,
  getFirstEncodableVideoCodec,
  type InputAudioTrack,
  type StreamTargetChunk,
} from "mediabunny";
import type { SubtitleStyle } from "@/lib/subtitle-style";
import type { Segment } from "@/lib/video-types";
import { speakerColor, countSpeakers } from "@/lib/speakers";
import {
  activeSegmentIndex,
  drawSubtitle,
  ensureFontLoaded,
  resolveFontFamilies,
  resolveSubtitlePaint,
  type SubtitlePaint,
} from "@/lib/subtitle-render";
import { bitrateFor, scaleToFit } from "./capabilities";

export type BurnPhase = "preparation" | "video" | "finalisation";
export type BurnProgress = {
  phase: BurnPhase;
  pct: number;
  /** Secondes restantes estimées, une fois la mesure assez stable pour être honnête. */
  etaSeconds?: number;
};

/** Ce que l'export a réellement fait — sert à l'instrumentation, pas à l'UI. */
export type BurnStats = {
  /** Durée totale de l'export, en millisecondes. */
  elapsedMs: number;
  /** Images encodées. */
  frames: number;
  /** Durée de la vidéo, en secondes. */
  durationSeconds: number;
  /** Définition de sortie. */
  width: number;
  height: number;
  /** L'audio a-t-il été recopié tel quel (vs réencodé, vs absent) ? */
  audio: "copie" | "reencode" | "aucun";
  /** Le fichier a-t-il été écrit directement sur le disque de l'utilisateur ? */
  toDisk: boolean;
};

export type BurnResult = {
  /** Absent quand le fichier a été écrit directement sur le disque. */
  blob: Blob | null;
  stats: BurnStats;
};

export type BurnOptions = {
  /**
   * URL de la vidéo SOURCE (présignée R2). Le CORS doit autoriser GET depuis le
   * site et exposer les requêtes de plage, sinon la lecture séquentielle
   * échoue et on repart sur le serveur.
   */
  videoUrl: string;
  segments: Segment[];
  style: SubtitleStyle;
  rtl?: boolean;
  /** Plus grand côté de la sortie (défaut 1920, comme le worker). */
  maxDim?: number;
  /**
   * Destination sur le disque de l'utilisateur, obtenue par l'appelant DANS le
   * gestionnaire de clic (`showSaveFilePicker`). Quand elle est fournie, le MP4
   * est écrit au fil de l'eau et la mémoire ne dépend plus de la durée de la
   * vidéo. Sinon on assemble en mémoire — d'où le plafond ci-dessous.
   *
   * On reçoit le HANDLE et non un flux déjà ouvert : c'est le sélecteur qui
   * exige un geste utilisateur, pas l'ouverture. Garder le handle permet de
   * SUPPRIMER le fichier si l'export échoue, au lieu de laisser une carcasse.
   */
  fileHandle?: FileSystemFileHandle;
  signal?: AbortSignal;
  onProgress?: (p: BurnProgress) => void;
};

/**
 * Plafond appliqué UNIQUEMENT à l'assemblage en mémoire. Avec une destination
 * disque, il n'y a plus de limite : c'est tout l'intérêt.
 */
const MAX_IN_MEMORY_SECONDS = 12 * 60;

export class BurnUnsupportedError extends Error {
  /** Motif court et stable, écrit en base pour savoir POURQUOI on est retombé
   * sur le serveur. Sans lui, un repli ne laisse aucune trace exploitable. */
  readonly reason: string;
  constructor(reason: string, message: string) {
    super(message);
    this.name = "BurnUnsupportedError";
    this.reason = reason;
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Export annulé", "AbortError");
}

/** Le navigateur sait-il écrire directement dans un fichier choisi ? */
export function canSaveToDisk(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as { showSaveFilePicker?: unknown }).showSaveFilePicker ===
      "function"
  );
}

/**
 * Adapte un fichier choisi par l'utilisateur à la cible de mediabunny.
 *
 * Le multiplexeur écrit à des POSITIONS arbitraires (il revient poser les
 * en-têtes). On repositionne donc explicitement avant chaque écriture : écrire
 * séquentiellement produirait un fichier corrompu.
 *
 * ⚠️ Le point délicat : mediabunny ferme ce flux DANS LES DEUX CAS, à la
 * finalisation comme à l'annulation. Or fermer un `FileSystemWritableFileStream`
 * VALIDE son contenu sur le disque. Sans la garde ci-dessous, annuler un export
 * déposerait une vidéo tronquée — d'apparence normale — à l'emplacement que
 * l'utilisateur a choisi. On ne valide donc que si la finalisation a commencé,
 * et on jette le fichier dans tous les autres cas.
 */
function diskTarget(handle: FileSystemFileHandle): Promise<{
  target: StreamTarget;
  /** À appeler juste avant `output.finalize()`. */
  beginFinalize: () => void;
  /** Jette le fichier partiel si l'export n'a pas abouti. */
  discardIfIncomplete: () => Promise<void>;
}> {
  return handle.createWritable().then((stream) => {
    let finalizing = false;
    let settled = false;

    const discard = async () => {
      if (settled) return;
      settled = true;
      await stream.abort?.().catch(() => {});
      // Le fichier créé par le sélecteur reste sinon sur le disque, vide et
      // trompeur. `remove()` n'existe pas partout : on tente, sans exiger.
      await (
        handle as unknown as { remove?: () => Promise<void> }
      ).remove?.().catch(() => {});
    };

    const writable = new WritableStream<StreamTargetChunk>({
      async write(chunk) {
        await stream.write({
          type: "write",
          position: chunk.position,
          data: chunk.data,
        });
      },
      async close() {
        if (!finalizing) {
          await discard();
          return;
        }
        settled = true;
        await stream.close();
      },
      async abort() {
        await discard();
      },
    });

    return {
      target: new StreamTarget(writable, { chunked: true }),
      beginFinalize: () => {
        finalizing = true;
      },
      discardIfIncomplete: discard,
    };
  });
}

/**
 * Grave les sous-titres et renvoie le MP4 final.
 *
 * Lève `BurnUnsupportedError` — avec un motif exploitable — quand la machine ou
 * la source ne s'y prêtent pas : l'appelant bascule alors sur l'incrustation
 * serveur. On ne laisse JAMAIS l'utilisateur devant un échec sec.
 */
export async function burnInBrowser(opts: BurnOptions): Promise<BurnResult> {
  const startedAt = performance.now();
  const report = (phase: BurnPhase, pct: number, etaSeconds?: number) =>
    opts.onProgress?.({
      phase,
      pct: Math.max(0, Math.min(100, Math.round(pct))),
      etaSeconds,
    });

  report("preparation", 0);
  throwIfAborted(opts.signal);

  // ── 1) Ouvrir la source, en flux ────────────────────────────────────────
  // `UrlSource` lit par plages au fil du décodage : on ne télécharge pas le
  // fichier entier avant de commencer, et une vidéo de 600 Mo ne remplit pas
  // la mémoire.
  const input = new Input({
    source: new UrlSource(opts.videoUrl),
    formats: ALL_FORMATS,
  });

  if (!(await input.canRead())) {
    throw new BurnUnsupportedError(
      "format_illisible",
      "Le navigateur ne reconnaît pas le format de cette vidéo.",
    );
  }

  const videoTrack = await input.getPrimaryVideoTrack();
  if (!videoTrack) {
    throw new BurnUnsupportedError(
      "aucune_piste_video",
      "Ce fichier ne contient pas de piste vidéo.",
    );
  }
  if (!(await videoTrack.canDecode())) {
    throw new BurnUnsupportedError(
      "codec_video_indecodable",
      "Ce navigateur ne sait pas décoder le codec de cette vidéo.",
    );
  }

  // Dimensions d'AFFICHAGE : elles tiennent compte de la rotation du fichier
  // (une vidéo de téléphone est stockée couchée) et du rapport de pixels.
  const displayWidth = await videoTrack.getDisplayWidth();
  const displayHeight = await videoTrack.getDisplayHeight();
  const out = scaleToFit(displayWidth, displayHeight, opts.maxDim ?? 1920);

  const durationSeconds = await input.computeDuration();
  if (!isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new BurnUnsupportedError(
      "duree_inconnue",
      "Durée de la vidéo indéterminable.",
    );
  }
  if (!opts.fileHandle && durationSeconds > MAX_IN_MEMORY_SECONDS) {
    throw new BurnUnsupportedError(
      "trop_long_sans_disque",
      `Vidéo de ${Math.round(durationSeconds / 60)} min : trop longue pour être assemblée en mémoire.`,
    );
  }

  const codec = await getFirstEncodableVideoCodec(["avc"], {
    width: out.width,
    height: out.height,
  });
  if (!codec) {
    throw new BurnUnsupportedError(
      "aucun_encodeur",
      "Aucun encodeur H.264 disponible sur cette machine.",
    );
  }

  // ── 2) Préparer le dessin ───────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new BurnUnsupportedError("canvas_indisponible", "Canvas 2D indisponible.");
  }

  // Les polices réelles (next/font) ne sont connues qu'à l'exécution, et il faut
  // les avoir CHARGÉES avant la première image : sinon les premières secondes
  // seraient gravées avec une police de repli, puis l'apparence changerait en
  // cours de vidéo.
  const families = resolveFontFamilies();
  const multiSpeaker = countSpeakers(opts.segments) > 1;
  const paintCache = new Map<number, SubtitlePaint>();
  const paintFor = (speaker: number | undefined): SubtitlePaint => {
    const key = multiSpeaker && typeof speaker === "number" ? speaker : -1;
    let p = paintCache.get(key);
    if (!p) {
      p = resolveSubtitlePaint(
        opts.style,
        key >= 0 ? speakerColor(key) : null,
        families,
      );
      paintCache.set(key, p);
    }
    return p;
  };
  const base = paintFor(undefined);
  await ensureFontLoaded(base.fontFamily, base.fontWeight, base.italic);

  report("preparation", 100);
  throwIfAborted(opts.signal);

  // ── 3) Construire la sortie ─────────────────────────────────────────────
  const disk = opts.fileHandle ? await diskTarget(opts.fileHandle) : null;
  const bufferTarget = disk ? null : new BufferTarget();
  const output = new Output({
    // Sur disque : métadonnées en fin de fichier (aucune mémoire retenue).
    // En mémoire : « fast start », puisque tout est déjà là de toute façon.
    format: new Mp4OutputFormat({
      fastStart: disk ? false : "in-memory",
    }),
    target: disk ? disk.target : bufferTarget!,
  });

  const videoSource = new CanvasSource(canvas, {
    codec,
    // ⚠️ `new Quality(3_500_000)` ne veut PAS dire « 3,5 Mbit/s » : un nombre nu
    // est lu comme un NIVEAU de qualité. Passé tel quel, il produisait un
    // encodage quasi sans perte — 128 Mo pour 22 secondes de vidéo, inutilisable
    // pour une publication. Le débit doit être nommé explicitement.
    quality: new Quality({ bitrate: bitrateFor(out.width, out.height, 30) }),
    // Une image clé toutes les 2 s : on peut se déplacer dans le fichier final
    // sans le relire depuis le début.
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource);

  // ── 4) L'audio : recopie d'abord, réencodage seulement s'il le faut ─────
  const audioTrack = await input.getPrimaryAudioTrack();

  // Décalage temporel commun aux DEUX pistes.
  //
  // Une piste AAC commence presque toujours par des échantillons « d'amorce »
  // portant un horodatage NÉGATIF (ici : -18 ms) : le décodeur est censé les
  // consommer sans les restituer. Un MP4 n'accepte pas de temps négatif, et la
  // recopie échouait donc dès la première image sonore.
  //
  // On décale l'ensemble d'une même valeur — jamais l'audio seul : décaler une
  // seule piste désynchroniserait la voix de l'image, ce qui est bien pire que
  // les quelques millisecondes qu'on déplace ici.
  const firstTimestamp = await input.getFirstTimestamp();
  const shift = Math.max(0, -firstTimestamp);

  const audioPlan = await planAudio(output, audioTrack, shift);

  await output.start();

  // ── 5) Les deux flux, en parallèle ──────────────────────────────────────
  let frames = 0;
  let aborted = false;

  const pumpVideo = async () => {
    const sink = new CanvasSink(videoTrack, {
      width: out.width,
      height: out.height,
      fit: "contain",
      // Les canvas sont recyclés en anneau : la mémoire vidéo reste constante
      // au lieu d'être réallouée à chaque image.
      poolSize: 3,
    });
    let lastReport = 0;
    for await (const frame of sink.canvases()) {
      if (opts.signal?.aborted) {
        aborted = true;
        break;
      }
      ctx.drawImage(frame.canvas, 0, 0, out.width, out.height);

      const idx = activeSegmentIndex(opts.segments, frame.timestamp);
      if (idx >= 0) {
        const seg = opts.segments[idx]!;
        drawSubtitle(ctx, {
          width: out.width,
          height: out.height,
          text: seg.text,
          paint: paintFor(seg.speaker),
          words: seg.words,
          time: frame.timestamp,
          animation: opts.style.animation,
          rtl: opts.rtl,
        });
      }

      // `add` ne rend la main que lorsque l'encodeur ET l'écriture peuvent
      // suivre. C'est la contre-pression correcte : aucune minuterie, donc
      // l'export ne s'effondre pas quand l'onglet passe en arrière-plan.
      await videoSource.add(Math.max(0, frame.timestamp + shift), frame.duration);
      frames++;

      const now = performance.now();
      if (now - lastReport > 250) {
        lastReport = now;
        const done = Math.min(1, frame.timestamp / durationSeconds);
        const elapsed = (now - startedAt) / 1000;
        report(
          "video",
          done * 100,
          done > 0.03 ? Math.max(0, elapsed / done - elapsed) : undefined,
        );
      }
    }
  };

  try {
    await Promise.all([pumpVideo(), audioPlan.pump(opts.signal)]);
    if (aborted) throw new DOMException("Export annulé", "AbortError");

    report("finalisation", 0);
    // À partir d'ici, et seulement à partir d'ici, fermer le fichier signifie
    // « le valider ». Voir `diskTarget`.
    disk?.beginFinalize();
    await output.finalize();
    report("finalisation", 100);
  } catch (err) {
    await output.cancel().catch(() => {});
    // Filet : si `cancel` n'a pas touché le flux, on jette quand même le
    // fichier partiel plutôt que de le laisser sur le disque de l'utilisateur.
    await disk?.discardIfIncomplete();
    throw err;
  } finally {
    await input.dispose?.();
  }

  const stats: BurnStats = {
    elapsedMs: Math.round(performance.now() - startedAt),
    frames,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    width: out.width,
    height: out.height,
    audio: audioPlan.kind,
    toDisk: !!disk,
  };

  return {
    blob: bufferTarget?.buffer
      ? new Blob([bufferTarget.buffer], { type: "video/mp4" })
      : null,
    stats,
  };
}

// ─────────────────────────────────────────────────────────────────
//  Audio
// ─────────────────────────────────────────────────────────────────

type AudioPlan = {
  kind: BurnStats["audio"];
  pump: (signal?: AbortSignal) => Promise<void>;
};

/**
 * Décide quoi faire de la piste audio, dans cet ordre :
 *
 *  1. **Recopie telle quelle** si le codec d'origine tient dans un MP4 (c'est le
 *     cas de la quasi-totalité des vidéos : AAC). Aucun décodage, aucun
 *     réencodage, aucune perte de qualité, coût nul.
 *  2. **Réencodage** sinon (source Opus/Vorbis d'un WebM, par exemple).
 *  3. **Rien** si la vidéo est réellement muette.
 *
 * Une vidéo SONORE dont l'audio échoue ne doit jamais produire un MP4 muet en
 * silence : l'utilisateur ne s'en apercevrait qu'après publication. Dans ce cas
 * on lève, et le serveur prend le relais.
 */
async function planAudio(
  output: Output,
  track: InputAudioTrack | null,
  /** Décalage commun aux deux pistes, pour supprimer les temps négatifs. */
  shift: number,
): Promise<AudioPlan> {
  if (!track) return { kind: "aucun", pump: async () => {} };

  const codec = await track.getCodec();
  const supported = output.format.getSupportedCodecs();

  // ── 1) Recopie des paquets d'origine ──────────────────────────────────
  if (codec && supported.includes(codec)) {
    const source = new EncodedAudioPacketSource(codec);
    output.addAudioTrack(source);
    const config = await track.getDecoderConfig();
    return {
      kind: "copie",
      pump: async (signal) => {
        const sink = new EncodedPacketSink(track);
        let first = true;
        for await (const packet of sink.packets()) {
          if (signal?.aborted) return;
          const shifted =
            shift > 0
              ? packet.clone({ timestamp: packet.timestamp + shift })
              : packet;
          await source.add(
            shifted,
            first && config ? { decoderConfig: config } : undefined,
          );
          first = false;
        }
      },
    };
  }

  // ── 2) Réencodage, seulement si la recopie est impossible ─────────────
  if (!(await track.canDecode())) {
    throw new BurnUnsupportedError(
      "codec_audio_indecodable",
      "La piste audio de cette vidéo n'est pas lisible par ce navigateur.",
    );
  }
  // `AudioSampleSource` et non `AudioBufferSource` : le second replace toujours
  // le son à partir de zéro, ce qui le décalerait de `shift` par rapport à
  // l'image. Ici on garde les horodatages d'origine et on applique EXACTEMENT
  // le même décalage qu'à la vidéo — la synchronisation est préservée au
  // millième près.
  const source = new AudioSampleSource({
    codec: "aac",
    bitrate: 192_000,
  });
  output.addAudioTrack(source);
  return {
    kind: "reencode",
    pump: async (signal) => {
      const sink = new AudioSampleSink(track);
      for await (const sample of sink.samples()) {
        if (signal?.aborted) return;
        if (shift > 0) sample.setTimestamp(sample.timestamp + shift);
        await source.add(sample);
        sample.close();
      }
    },
  };
}
