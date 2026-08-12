/**
 * Profils de découpe des sous-titres — côté application (interface + validation).
 *
 * ⚠️ Les VALEURS de découpe (caractères par ligne, longueur visée, vitesse de
 * lecture…) vivent dans le worker : `code/worker/src/pipeline/profiles.ts`.
 * Ce module ne porte que les identifiants et les libellés montrés à
 * l'utilisateur. Ne pas y dupliquer de chiffres : c'est exactement ce qui a
 * produit la divergence 34/42 entre la découpe et la mise en lignes.
 */

export const CUT_PROFILE_IDS = ["court", "equilibre", "broadcast"] as const;
export type CutProfileId = (typeof CUT_PROFILE_IDS)[number];

export const DEFAULT_CUT_PROFILE: CutProfileId = "equilibre";

export type CutProfileOption = {
  id: CutProfileId;
  label: string;
  /** Une phrase, en langage humain : ce que ça change à l'écran. */
  hint: string;
  /** Aperçu textuel montré dans le sélecteur. */
  sample: string;
};

export const CUT_PROFILE_OPTIONS: CutProfileOption[] = [
  {
    id: "equilibre",
    label: "Équilibré",
    hint: "Des groupes de sens complets. Le meilleur choix dans presque tous les cas.",
    sample: "j'ai vraiment adoré ce film\ndu début à la fin",
  },
  {
    id: "court",
    label: "Court",
    hint: "Une ligne brève qui claque. Pour le vertical (TikTok, Reels, Shorts) et le karaoké.",
    sample: "j'ai vraiment adoré\nce film",
  },
  {
    id: "broadcast",
    label: "Broadcast",
    hint: "Deux lignes pleines, rythme posé. Pour les formats longs et l'accessibilité.",
    sample:
      "j'ai vraiment adoré ce film du début à la fin,\nmais la dernière scène était trop longue",
  },
];

/** Valide un identifiant venu du client ou de la base (jamais de confiance). */
export function isCutProfile(v: unknown): v is CutProfileId {
  return typeof v === "string" && (CUT_PROFILE_IDS as readonly string[]).includes(v);
}

export function cutProfileLabel(id: unknown): string {
  return CUT_PROFILE_OPTIONS.find((o) => o.id === id)?.label ?? "Équilibré";
}
