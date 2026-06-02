/**
 * L'Atelier — source unique de vérité du système de fidélité.
 *
 * Toute la logique de rang/seuils/bonus vit ici. La landing
 * (components/sections/atelier.tsx), le dashboard, la page /app/atelier,
 * la page publique /atelier et les server actions consomment ces constantes.
 * Les seuils sont AUSSI répliqués dans la migration 006 (fonction SQL
 * compute_rank) — garder les deux synchronisés.
 *
 * Spec complète : 03-produit/06-atelier-gamification.md
 */

export type Rank = "apprenti" | "correcteur" | "editeur_en_chef" | "maitre_doeuvre";

/** Ordre de progression des rangs. */
export const RANK_ORDER: Rank[] = [
  "apprenti",
  "correcteur",
  "editeur_en_chef",
  "maitre_doeuvre",
];

/** Seuil d'entrée (minutes cumulées à vie) de chaque rang. */
export const RANK_THRESHOLDS: Record<Rank, number> = {
  apprenti: 0,
  correcteur: 300,
  editeur_en_chef: 1200,
  maitre_doeuvre: 5000,
};

/** Libellé humain du rang. */
export const RANK_LABELS: Record<Rank, string> = {
  apprenti: "Apprenti",
  correcteur: "Correcteur",
  editeur_en_chef: "Éditeur en chef",
  maitre_doeuvre: "Maître d'œuvre",
};

/** Plage de minutes affichée (landing + page publique). */
export const RANK_RANGE_LABEL: Record<Rank, string> = {
  apprenti: "0 — 299 min",
  correcteur: "300 — 1 199 min",
  editeur_en_chef: "1 200 — 4 999 min",
  maitre_doeuvre: "5 000+ min",
};

/** Avantages concrets par rang (affichés landing + page publique). */
export const RANK_PERKS: Record<Rank, string[]> = {
  apprenti: [
    "Toutes les fonctions du plan choisi",
    "Support en français sous 24 h",
  ],
  correcteur: [
    "Glossaire personnalisé sauvegardé",
    "Priorité dans la file de traitement",
    "+5 min offertes tous les 3 mois consécutifs",
  ],
  editeur_en_chef: [
    "Export montage .fcpxml inclus, même sur Starter",
    "Accès anticipé aux nouvelles fonctions",
    "+15 min offertes tous les 3 mois · +50 min anniversaire",
  ],
  maitre_doeuvre: [
    "Vote sur la prochaine fonction prioritaire",
    "+200 min offertes chaque année",
    "+50 min offertes tous les 3 mois",
  ],
};

/** Bonus de streak (tous les 3 mois consécutifs) selon le rang. */
export const STREAK_BONUS_MINUTES: Record<Rank, number> = {
  apprenti: 0,
  correcteur: 5,
  editeur_en_chef: 15,
  maitre_doeuvre: 50,
};

/** Minutes offertes le jour anniversaire de l'inscription (chaque année) — base
 * du rang Apprenti. Le bonus réel croît avec le rang (cron SQL migration 018 :
 * apprenti 10 · correcteur 20 · éditeur en chef 50 · maître d'œuvre 200). */
export const ANNIVERSARY_BONUS_MINUTES = 10;

/** Minutes offertes à chaque partie d'un parrainage validé. */
export const REFERRAL_BONUS_MINUTES = 30;

/** Cadeau surprise trimestriel (M6). */
export const GIFT_BONUS_MINUTES = 20;

/** Cap de parrainages acceptés par mois et par utilisateur (anti-abus). */
export const REFERRAL_MONTHLY_CAP = 5;

/** Calcule le rang à partir des minutes cumulées à vie. */
export function computeRank(lifetimeMinutes: number): Rank {
  if (lifetimeMinutes >= RANK_THRESHOLDS.maitre_doeuvre) return "maitre_doeuvre";
  if (lifetimeMinutes >= RANK_THRESHOLDS.editeur_en_chef) return "editeur_en_chef";
  if (lifetimeMinutes >= RANK_THRESHOLDS.correcteur) return "correcteur";
  return "apprenti";
}

/** Rang suivant, ou null si déjà au sommet. */
export function nextRank(rank: Rank): Rank | null {
  const i = RANK_ORDER.indexOf(rank);
  if (i < 0 || i >= RANK_ORDER.length - 1) return null;
  return RANK_ORDER[i + 1] ?? null;
}

export type RankProgress = {
  current: Rank;
  next: Rank | null;
  /** Seuil du rang suivant (null si au sommet). */
  nextThreshold: number | null;
  /** Minutes restantes avant le rang suivant (0 si au sommet). */
  remaining: number;
  /** Progression vers le rang suivant en pourcentage [0..100]. */
  percent: number;
};

/**
 * Progression de l'utilisateur vers le rang suivant.
 * Le pourcentage est relatif au palier courant (seuil rang actuel → seuil suivant),
 * pour une barre qui se remplit de façon lisible à chaque rang.
 */
export function rankProgress(lifetimeMinutes: number): RankProgress {
  const current = computeRank(lifetimeMinutes);
  const next = nextRank(current);

  if (!next) {
    return {
      current,
      next: null,
      nextThreshold: null,
      remaining: 0,
      percent: 100,
    };
  }

  const floor = RANK_THRESHOLDS[current];
  const ceil = RANK_THRESHOLDS[next];
  const span = ceil - floor;
  const done = Math.max(lifetimeMinutes - floor, 0);
  const percent = span > 0 ? Math.min((done / span) * 100, 100) : 0;

  return {
    current,
    next,
    nextThreshold: ceil,
    remaining: Math.max(ceil - lifetimeMinutes, 0),
    percent,
  };
}

/** Type d'entrée du journal des récompenses (miroir de l'enum SQL). */
export type RewardType =
  | "rank_promotion"
  | "streak_bonus"
  | "anniversary"
  | "referral_inviter"
  | "referral_invitee"
  | "gift_random"
  | "compensation";

/** Libellé humain d'un type de récompense. */
export const REWARD_LABELS: Record<RewardType, string> = {
  rank_promotion: "Passage de rang",
  streak_bonus: "Bonus de continuité",
  anniversary: "Anniversaire",
  referral_inviter: "Parrainage (vous avez invité)",
  referral_invitee: "Parrainage (vous avez été invité)",
  gift_random: "Cadeau surprise",
  compensation: "Geste commercial",
};
