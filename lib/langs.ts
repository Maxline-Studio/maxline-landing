/**
 * Langues supportées par le pipeline (v1 : FR + EN).
 * Source = langue parlée dans la vidéo ; cible = langue des sous-titres produits.
 * - source ≠ cible → traduction (ex. FR→EN, EN→FR)
 * - source = cible → transcription dans la langue parlée (ex. FR→FR : accessibilité)
 */

export type Lang = "fr" | "en";

export const LANGS: readonly Lang[] = ["fr", "en"] as const;

export const LANG_OPTIONS: { id: Lang; label: string; short: string }[] = [
  { id: "fr", label: "Français", short: "FR" },
  { id: "en", label: "Anglais", short: "EN" },
];

export function isLang(v: unknown): v is Lang {
  return v === "fr" || v === "en";
}

/** Libellé long, minuscule (« français », « anglais »). Pour les phrases. */
export function langLabel(lang: string): string {
  return lang === "en" ? "anglais" : lang === "fr" ? "français" : lang;
}

/** Code court majuscule (« FR », « EN »). Pour les badges. */
export function langShort(lang: string): string {
  return (lang || "").toUpperCase();
}

/** true si on traduit (langues différentes), false si simple transcription. */
export function isTranslation(sourceLang: string, targetLang: string): boolean {
  return sourceLang !== targetLang;
}
