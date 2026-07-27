"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { deleteObjects } from "@/lib/r2";
import {
  burnedKey,
  previewKey,
  asrAudioKey,
  videoFolder,
  STORAGE_BUCKET,
} from "@/lib/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Met à jour le profil affiché : nom et/ou photo (avatar_url). L'upload de la
 * photo se fait côté client dans le bucket `avatars` ; cette action ne fait
 * qu'enregistrer l'URL publique (ou null pour revenir au logo par défaut).
 */
export async function updateProfile(patch: {
  displayName?: string;
  avatarUrl?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée. Reconnectez-vous." };

  const update: { display_name?: string | null; avatar_url?: string | null } = {};
  if (patch.displayName !== undefined) {
    const name = patch.displayName.trim();
    if (name.length > 60) {
      return { ok: false, error: "Nom trop long (60 caractères maximum)." };
    }
    update.display_name = name || null;
  }
  if (patch.avatarUrl !== undefined) {
    // L'URL vient du client (upload dans le bucket `avatars`). On refuse toute
    // adresse qui ne pointe pas vers notre propre stockage : sans ce contrôle,
    // n'importe quelle URL externe pouvait être enregistrée puis servie comme
    // photo de profil (pixel de traçage, contenu tiers…).
    if (patch.avatarUrl !== null) {
      const url = patch.avatarUrl.trim();
      const allowed =
        /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/avatars\//i.test(
          url,
        ) || /^https:\/\/lh[0-9]\.googleusercontent\.com\//i.test(url);
      if (!allowed) {
        return { ok: false, error: "Image de profil invalide." };
      }
      update.avatar_url = url;
    } else {
      update.avatar_url = null;
    }
  }
  if (Object.keys(update).length === 0) return { ok: true };

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/settings");
  revalidatePath("/app", "layout"); // rafraîchit l'avatar/nom dans la sidebar
  return { ok: true };
}

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

  // Recalcule delete_at pour les vidéos existantes, EN UNE SEULE requête
  // (migration 030). Avant : une lecture puis un UPDATE par vidéo, en boucle.
  // Sur un compte chargé, c'était des dizaines d'allers-retours enchaînés, avec
  // le risque que l'action soit coupée en cours de route et laisse la rétention
  // incohérente d'une vidéo à l'autre.
  const { error: retErr } = await supabase.rpc("reset_video_retention", {
    p_days: days,
  });
  if (retErr) {
    return {
      ok: false,
      error: "Préférence enregistrée, mais le recalcul des dates a échoué.",
    };
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
    .select("id, storage_key_source, storage_key_burned, storage_key_preview")
    .eq("user_id", userId);

  /** Efface tous les fichiers d'UNE vidéo (R2 + Supabase Storage). */
  const purgeFiles = async (v: {
    id: string;
    storage_key_source: string | null;
    storage_key_burned: string | null;
    storage_key_preview: string | null;
  }) => {
    try {
      // Les quatre objets possibles sur R2. Le proxy d'aperçu et l'audio
      // temporaire de transcription manquaient à l'appel : sur un droit à
      // l'effacement, laisser des fichiers derrière soi n'est pas une option.
      await deleteObjects([
        v.storage_key_source,
        v.storage_key_burned ?? burnedKey(userId, v.id),
        v.storage_key_preview ?? previewKey(userId, v.id),
        asrAudioKey(userId, v.id),
      ]);
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
  };

  // Par vagues de 10 : une boucle séquentielle sur un compte chargé dépassait
  // le temps imparti à l'action, et la suppression s'arrêtait au milieu.
  const list = videos ?? [];
  for (let i = 0; i < list.length; i += 10) {
    await Promise.all(list.slice(i, i + 10).map(purgeFiles));
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
