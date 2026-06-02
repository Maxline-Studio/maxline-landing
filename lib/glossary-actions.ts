"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeRank, RANK_ORDER } from "@/lib/atelier";
import { isLang, type Lang } from "@/lib/langs";

export type GlossaryEntry = {
  id: string;
  source_term: string;
  target_term: string;
  source_lang: string;
  target_lang: string;
};

const MAX_ENTRIES = 200;

/** Le glossaire est un perk à partir du rang Correcteur (≥ 300 min cumulées). */
function hasGlossaryAccess(lifetimeMinutes: number): boolean {
  const rank = computeRank(lifetimeMinutes);
  return RANK_ORDER.indexOf(rank) >= RANK_ORDER.indexOf("correcteur");
}

async function getUserAndAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, access: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("lifetime_minutes_used")
    .eq("id", user.id)
    .single();
  const access = hasGlossaryAccess(profile?.lifetime_minutes_used ?? 0);
  return { supabase, user, access };
}

/** Liste les entrées du glossaire de l'utilisateur. */
export async function listGlossary(): Promise<GlossaryEntry[]> {
  const { supabase, user } = await getUserAndAccess();
  if (!user) return [];
  const { data } = await supabase
    .from("glossaries")
    .select("id, source_term, target_term, source_lang, target_lang")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return (data as GlossaryEntry[] | null) ?? [];
}

/** Ajoute une entrée. Gated rang Correcteur. */
export async function addGlossaryEntry(params: {
  sourceTerm: string;
  targetTerm: string;
  sourceLang: Lang;
  targetLang: Lang;
}): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user, access } = await getUserAndAccess();
  if (!user) return { ok: false, error: "Session expirée." };
  if (!access) {
    return {
      ok: false,
      error: "Le glossaire est débloqué au rang Correcteur (300 min cumulées).",
    };
  }

  const sourceTerm = params.sourceTerm.trim();
  const targetTerm = params.targetTerm.trim();
  if (!sourceTerm || !targetTerm) {
    return { ok: false, error: "Renseignez le terme et sa traduction." };
  }
  if (sourceTerm.length > 120 || targetTerm.length > 200) {
    return { ok: false, error: "Terme trop long." };
  }
  const sourceLang: Lang = isLang(params.sourceLang) ? params.sourceLang : "fr";
  const targetLang: Lang = isLang(params.targetLang) ? params.targetLang : "en";
  if (sourceLang === targetLang) {
    return { ok: false, error: "Choisissez deux langues différentes." };
  }

  // Garde-fou volume.
  const { count } = await supabase
    .from("glossaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if ((count ?? 0) >= MAX_ENTRIES) {
    return { ok: false, error: `Maximum ${MAX_ENTRIES} entrées.` };
  }

  const { error } = await supabase.from("glossaries").insert({
    user_id: user.id,
    source_term: sourceTerm,
    target_term: targetTerm,
    source_lang: sourceLang,
    target_lang: targetLang,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ce terme existe déjà pour ce couple de langues." };
    }
    return { ok: false, error: error.message };
  }
  revalidatePath("/app/glossary");
  return { ok: true };
}

/** Supprime une entrée. */
export async function deleteGlossaryEntry(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await getUserAndAccess();
  if (!user) return { ok: false, error: "Session expirée." };
  const { error } = await supabase
    .from("glossaries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/glossary");
  return { ok: true };
}
