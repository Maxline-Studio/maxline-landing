/**
 * Worker MOCK — simule le pipeline de traduction sans Oracle Cloud.
 *
 * Le vrai worker (Sprint 3) fera : extraction audio (FFmpeg) → transcription
 * (Whisper.cpp) → traduction (OPUS-MT) → alignement → génération .srt/.vtt →
 * burn-in. Ici on simule la progression via une state machine paresseuse
 * basée sur le temps écoulé, et on génère une transcription factice réaliste.
 *
 * Tout ce fichier est PUR (pas d'I/O) — facile à remplacer au Sprint 3.
 */

export type Segment = { start: number; end: number; text: string };
export type VideoStatus =
  | "queued"
  | "extracting_audio"
  | "transcribing"
  | "translating"
  | "aligning"
  | "generating_subtitles"
  | "burning_in"
  | "done"
  | "failed"
  | "cancelled";

/**
 * Timeline mock (secondes cumulées depuis processing_started_at).
 * Accéléré pour la démo : ~22s au total quel que soit la durée vidéo.
 */
const STAGE_TIMELINE: { status: VideoStatus; until: number; label: string }[] = [
  { status: "extracting_audio", until: 3, label: "Extraction de l'audio" },
  { status: "transcribing", until: 8, label: "Transcription française" },
  { status: "translating", until: 14, label: "Traduction anglaise" },
  { status: "aligning", until: 16, label: "Alignement des sous-titres" },
  { status: "generating_subtitles", until: 18, label: "Génération .srt / .vtt" },
  { status: "burning_in", until: 22, label: "Incrustation vidéo" },
];

export const MOCK_TOTAL_SECONDS = 22;

export const STAGE_LABELS: Record<VideoStatus, string> = {
  queued: "En attente",
  extracting_audio: "Extraction de l'audio",
  transcribing: "Transcription française",
  translating: "Traduction anglaise",
  aligning: "Alignement des sous-titres",
  generating_subtitles: "Génération des sous-titres",
  burning_in: "Incrustation vidéo",
  done: "Terminé",
  failed: "Échec",
  cancelled: "Annulé",
};

/**
 * Calcule l'étape courante et la progression (0-100) selon le temps écoulé.
 */
export function computeStage(elapsedSeconds: number): {
  status: VideoStatus;
  progress: number;
} {
  if (elapsedSeconds >= MOCK_TOTAL_SECONDS) {
    return { status: "done", progress: 100 };
  }
  for (const stage of STAGE_TIMELINE) {
    if (elapsedSeconds < stage.until) {
      return {
        status: stage.status,
        progress: Math.min(
          Math.round((elapsedSeconds / MOCK_TOTAL_SECONDS) * 100),
          99,
        ),
      };
    }
  }
  return { status: "done", progress: 100 };
}

// ─────────────────────────────────────────────────────────────────
//  Génération de transcription factice
// ─────────────────────────────────────────────────────────────────

// Phrases-types de créateur FR + leur traduction EN, pour un rendu crédible.
const PHRASE_POOL: { fr: string; en: string }[] = [
  {
    fr: "Salut tout le monde, j'espère que vous allez bien !",
    en: "Hi everyone, I hope you're doing great!",
  },
  {
    fr: "Aujourd'hui, on attaque un sujet qui me tient à cœur.",
    en: "Today, we're diving into a topic close to my heart.",
  },
  {
    fr: "Avant de commencer, pensez à vous abonner.",
    en: "Before we start, don't forget to subscribe.",
  },
  {
    fr: "Alors, la première chose à comprendre, c'est ça.",
    en: "So, the first thing to understand is this.",
  },
  {
    fr: "Je vais vous montrer comment je procède concrètement.",
    en: "Let me show you exactly how I do it.",
  },
  {
    fr: "Et là, vous voyez le résultat à l'écran.",
    en: "And here, you can see the result on screen.",
  },
  {
    fr: "C'est plus simple que ce qu'on croit, franchement.",
    en: "Honestly, it's simpler than you'd think.",
  },
  {
    fr: "Petite astuce que peu de gens connaissent.",
    en: "A little tip that few people know about.",
  },
  {
    fr: "Faites bien attention à cette étape, elle est cruciale.",
    en: "Pay close attention to this step, it's crucial.",
  },
  {
    fr: "Si ça vous a plu, laissez un commentaire.",
    en: "If you enjoyed this, leave a comment.",
  },
  {
    fr: "On se retrouve très vite pour la suite.",
    en: "See you very soon for the next part.",
  },
  {
    fr: "Merci d'avoir regardé jusqu'au bout, à bientôt !",
    en: "Thanks for watching to the end, see you soon!",
  },
];

/**
 * Génère une transcription FR + EN factice découpée en segments d'environ
 * 4 secondes couvrant toute la durée de la vidéo.
 */
export function generateMockTranscription(durationSeconds: number): {
  fr: Segment[];
  en: Segment[];
} {
  const segmentLength = 4;
  const count = Math.max(1, Math.ceil(durationSeconds / segmentLength));
  const fr: Segment[] = [];
  const en: Segment[] = [];

  for (let i = 0; i < count; i++) {
    const start = i * segmentLength;
    const end = Math.min((i + 1) * segmentLength, durationSeconds);
    const phrase = PHRASE_POOL[i % PHRASE_POOL.length]!;
    fr.push({ start, end, text: phrase.fr });
    en.push({ start, end, text: phrase.en });
  }

  return { fr, en };
}

/** Convertit des segments en contenu .srt. */
export function segmentsToSrt(segments: Segment[]): string {
  return segments
    .map((seg, i) => {
      return `${i + 1}\n${srtTime(seg.start)} --> ${srtTime(seg.end)}\n${seg.text}\n`;
    })
    .join("\n");
}

/** Convertit des segments en contenu .vtt. */
export function segmentsToVtt(segments: Segment[]): string {
  const body = segments
    .map((seg) => {
      return `${vttTime(seg.start)} --> ${vttTime(seg.end)}\n${seg.text}\n`;
    })
    .join("\n");
  return `WEBVTT\n\n${body}`;
}

function srtTime(seconds: number): string {
  const ms = Math.floor((seconds % 1) * 1000);
  const s = Math.floor(seconds) % 60;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function vttTime(seconds: number): string {
  return srtTime(seconds).replace(",", ".");
}

function pad(n: number, len = 2): string {
  return n.toString().padStart(len, "0");
}
