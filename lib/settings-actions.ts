"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { deleteObjects } from "@/lib/r2";
import { burnedKey, videoFolder, STORAGE_BUCKET } from "@/lib/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ALLOWED_RETENTION = [7, 14, 30] as const;
export type RetentionDays = (typeof ALLOWED_RETENTION)[number];

/**
 * Met à jour la durée de rétention des vidéos (jours) et recalcule la date de
 * suppression automatique des vidéos existantes (non encore supprimées).
 */
export async function updateRetention(days: number): Promise<ActionResult> {
  if (!ALLOWED_RETENTION.includes(days as RetentionDays)) {
    return { ok: false, error: "Durée de rétention invalide." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const { error: profErr } = await supabase
    .from("profiles")
    .update({ delete_after_days: days })
    .eq("id", user.id);
  if (profErr) return { ok: false, error: profErr.message };

  // Recalcule delete_at pour les vidéos existantes encore soumises à rétention.
  const { data: videos } = await supabase
    .from("videos")
    .select("id, uploaded_at")
    .eq("user_id", user.id)
    .not("delete_at", "is", null);

  for (const v of videos ?? []) {
    const newDeleteAt = new Date(
      new Date(v.uploaded_at).getTime() + days * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabase.from("videos").update({ delete_at: newDeleteAt }).eq("id", v.id);
  }

  revalidatePath("/app/settings");
  return { ok: true };
}

/** Active/désactive les emails non essentiels (bonus, rang, parrainage…). */
export async function updateEmailNotifications(
  enabled: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const { error } = await supabase
    .from("profiles")
    .update({ email_notifications: enabled })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings");
  return { ok: true };
}

/**
 * Suppression définitive du compte (droit à l'effacement RGPD) :
 *  1) supprime les vidéos sur R2 + les sous-titres sur Supabase Storage
 *  2) annule l'abonnement Stripe éventuel
 *  3) supprime les données en base (cascade depuis profiles)
 *  4) supprime le compte d'authentification
 *
 * Utilise le client admin (service_role) mais STRICTEMENT borné à l'utilisateur
 * authentifié (jamais d'id venant du client).
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const userId = user.id;
  const admin = createAdminClient();

  // 1) Récupère les vidéos pour connaître les objets à supprimer.
  const { data: videos } = await admin
    .from("videos")
    .select("id, storage_key_source")
    .eq("user_id", userId);

  // 1a) Objets R2 (source + MP4 incrusté) + 1b) sous-titres Supabase.
  for (const v of videos ?? []) {
    try {
      await deleteObjects([v.storage_key_source ?? null, burnedKey(userId, v.id)]);
    } catch {
      /* best-effort : on continue la suppression du compte */
    }
    try {
      const folder = videoFolder(userId, v.id);
      const { data: files } = await admin.storage.from(STORAGE_BUCKET).list(folder);
      if (files && files.length > 0) {
        await admin.storage
          .from(STORAGE_BUCKET)
          .remove(files.map((f) => `${folder}/${f.name}`));
      }
    } catch {
      /* best-effort */
    }
  }

  // 2) Annule l'abonnement Stripe s'il existe.
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_subscription_id")
    .eq("id", userId)
    .single();
  if (profile?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      /* l'abonnement peut déjà être annulé/expiré */
    }
  }

  // 3) Données en base : on délie d'abord les filleuls (FK referred_by NO ACTION),
  //    puis on supprime le profil → cascade videos/rewards/rank_history/referrals.
  await admin.from("profiles").update({ referred_by: null }).eq("referred_by", userId);
  const { error: delProfileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (delProfileErr) {
    return { ok: false, error: `Suppression des données : ${delProfileErr.message}` };
  }

  // 4) Compte d'authentification.
  const { error: delUserErr } = await admin.auth.admin.deleteUser(userId);
  if (delUserErr) {
    return { ok: false, error: `Suppression du compte : ${delUserErr.message}` };
  }

  return { ok: true };
}
