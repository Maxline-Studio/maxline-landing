"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { callClaude, isAnthropicConfigured } from "@/lib/anthropic";
import { subtitleTranslationSystem } from "@/lib/translation-prompt";
import {
  parseSubtitleFile,
  billedMinutes,
  type SubtitleFileFormat,
} from "@/lib/subtitle-parse";
import {
  generateSubtitles,
  type SubtitleSegment,
} from "@/lib/subtitles";
import { isLang, type Lang } from "@/lib/langs";

const MAX_CONTENT_BYTES = 2 * 1024 * 1024; // 2 Mo : un fichier de sous-titres reste petit
const MAX_CUES = 4000;
const BATCH = 60; // cues par appel Claude (alignement 1:1 fiable)

export type FileTranslateResult =
  | { ok: true; content: string; billedMinutes: number; format: SubtitleFileFormat }
  | { ok: false; error: string };

function langName(code: string): string {
  return code === "en" ? "anglais" : code === "fr" ? "français" : code;
}

/** Traduit un lot de cues via Claude, alignement 1:1 strict. */
async function translateBatch(
  texts: string[],
  sourceLang: Lang,
  targetLang: Lang,
): Promise<string[]> {
  const tgt = langName(targetLang);
  const system = subtitleTranslationSystem(sourceLang, targetLang);
  const user = `Traduis ces ${texts.length} sous-titres en ${tgt}, dans l'ordre. Réponds par un tableau JSON de ${texts.length} chaînes :\n${JSON.stringify(texts)}`;

  const parse = (raw: string): string[] | null => {
    const a = raw.indexOf("[");
    const b = raw.lastIndexOf("]");
    if (a === -1 || b === -1 || b <= a) return null;
    try {
      const arr = JSON.parse(raw.slice(a, b + 1));
      if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
        return arr as string[];
      }
    } catch {
      /* ignore */
    }
    return null;
  };

  let out = parse(await callClaude({ system, user, maxTokens: 16000, temperature: 0.3 }));
  if (!out || out.length !== texts.length) {
    const stricter =
      system + `\nIMPORTANT : le tableau DOIT contenir EXACTEMENT ${texts.length} chaînes.`;
    out = parse(await callClaude({ system: stricter, user, maxTokens: 16000, temperature: 0.2 }));
  }
  if (!out || out.length !== texts.length) {
    throw new Error(
      `Traduction désalignée (attendu ${texts.length}, reçu ${out?.length ?? 0}).`,
    );
  }
  return out.map((s) => s.trim());
}

/**
 * Traduit un fichier de sous-titres (.srt/.vtt/.txt) importé.
 * Vérifie le quota, parse, traduit par lots, consomme les minutes (client admin),
 * renvoie le contenu traduit dans le même format.
 *
 * Facturation : srt/vtt → durée (dernier timecode) ; txt → ~1000 car/min.
 */
export async function translateSubtitleFile(params: {
  filename: string;
  format: SubtitleFileFormat;
  content: string;
  sourceLang: Lang;
  targetLang: Lang;
}): Promise<FileTranslateResult> {
  if (!isAnthropicConfigured()) {
    return { ok: false, error: "Service de traduction indisponible pour le moment." };
  }

  const { format, content } = params;
  if (!["srt", "vtt", "txt"].includes(format)) {
    return { ok: false, error: "Format non supporté (.srt, .vtt ou .txt)." };
  }
  if (!content || content.length > MAX_CONTENT_BYTES) {
    return { ok: false, error: "Fichier vide ou trop volumineux (max 2 Mo)." };
  }

  const sourceLang: Lang = isLang(params.sourceLang) ? params.sourceLang : "fr";
  const targetLang: Lang = isLang(params.targetLang) ? params.targetLang : "en";
  if (sourceLang === targetLang) {
    return {
      ok: false,
      error: "Choisissez deux langues différentes pour traduire un fichier.",
    };
  }

  const parsed = parseSubtitleFile(content, format);
  if (parsed.segments.length === 0) {
    return { ok: false, error: "Aucun sous-titre lisible dans ce fichier." };
  }
  if (parsed.segments.length > MAX_CUES) {
    return { ok: false, error: `Fichier trop long (max ${MAX_CUES} lignes).` };
  }

  const needed = billedMinutes(parsed);

  // ─── Auth + quota ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("quota_minutes_total, quota_minutes_used, credits_minutes")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Profil introuvable." };

  const quotaAvail = Math.max(
    profile.quota_minutes_total - profile.quota_minutes_used,
    0,
  );
  const available = quotaAvail + profile.credits_minutes;
  if (available < needed) {
    return {
      ok: false,
      error: `Quota insuffisant : ${available.toFixed(0)} min disponibles, ce fichier en demande ${needed}.`,
    };
  }

  // ─── Traduction par lots ───
  const texts = parsed.segments.map((s) => s.text);
  const translated: string[] = [];
  try {
    for (let i = 0; i < texts.length; i += BATCH) {
      const chunk = texts.slice(i, i + BATCH);
      const out = await translateBatch(chunk, sourceLang, targetLang);
      translated.push(...out);
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Échec de la traduction.",
    };
  }

  // ─── Consommation des minutes (quota d'abord, puis crédits) via client admin ───
  let newQuotaUsed = profile.quota_minutes_used;
  let newCredits = profile.credits_minutes;
  if (quotaAvail >= needed) {
    newQuotaUsed += needed;
  } else {
    newQuotaUsed = profile.quota_minutes_total;
    newCredits -= needed - quotaAvail;
  }
  const { error: updErr } = await createAdminClient()
    .from("profiles")
    .update({ quota_minutes_used: newQuotaUsed, credits_minutes: newCredits })
    .eq("id", user.id);
  if (updErr) {
    return { ok: false, error: "Erreur de décompte des minutes, réessayez." };
  }

  // ─── Régénère le fichier traduit (même format, timecodes préservés) ───
  const outSegments: SubtitleSegment[] = parsed.segments.map((s, i) => ({
    start: s.start,
    end: s.end,
    text: translated[i] ?? s.text,
  }));
  const outContent = generateSubtitles(outSegments, format);

  return { ok: true, content: outContent, billedMinutes: needed, format };
}
