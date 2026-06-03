/**
 * Langues supportées par le pipeline (les 10 langues les plus parlées au monde).
 * Codes ISO-639-1, compatibles Whisper (Groq) ET Claude.
 * Source = langue parlée dans la vidéo ; cible = langue des sous-titres produits.
 * - source ≠ cible → traduction (ex. FR→ES)
 * - source = cible → transcription dans la langue parlée (ex. FR→FR : accessibilité)
 */

export type Lang =
  | "fr"
  | "en"
  | "es"
  | "de"
  | "it"
  | "pt"
  | "ru"
  | "zh"
  | "ja"
  | "ar";

export const LANG_OPTIONS: { id: Lang; label: string; short: string }[] = [
  { id: "fr", label: "Français", short: "FR" },
  { id: "en", label: "Anglais", short: "EN" },
  { id: "es", label: "Espagnol", short: "ES" },
  { id: "de", label: "Allemand", short: "DE" },
  { id: "it", label: "Italien", short: "IT" },
  { id: "pt", label: "Portugais", short: "PT" },
  { id: "ru", label: "Russe", short: "RU" },
  { id: "zh", label: "Chinois (mandarin)", short: "ZH" },
  { id: "ja", label: "Japonais", short: "JA" },
  { id: "ar", label: "Arabe", short: "AR" },
];

export const LANGS: readonly Lang[] = LANG_OPTIONS.map((o) => o.id);

/** Libellés longs minuscules (pour les phrases / prompts). */
const LABELS_LC: Record<Lang, string> = {
  fr: "français",
  en: "anglais",
  es: "espagnol",
  de: "allemand",
  it: "italien",
  pt: "portugais",
  ru: "russe",
  zh: "chinois",
  ja: "japonais",
  ar: "arabe",
};

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

/** Libellé long, minuscule (« français », « espagnol »). Pour les phrases. */
export function langLabel(lang: string): string {
  return LABELS_LC[lang as Lang] ?? lang;
}

/** Code court majuscule (« FR », « ES »). Pour les badges. */
export function langShort(lang: string): string {
  return (lang || "").toUpperCase();
}

/** true si on traduit (langues différentes), false si simple transcription. */
export function isTranslation(sourceLang: string, targetLang: string): boolean {
  return sourceLang !== targetLang;
}

/** Langues écrites de droite à gauche (affichage / édition). */
export const RTL_LANGS: readonly Lang[] = ["ar"];

export function isRtl(lang: string): boolean {
  return (RTL_LANGS as readonly string[]).includes(lang);
}

/**
 * Langues sans espaces entre les mots (chinois, japonais) : la découpe des
 * sous-titres se fait par caractères, pas par mots. Source unique partagée par
 * l'app (wrap-lines) — le worker a sa propre copie (hors repo).
 */
export const CJK_LANGS: readonly Lang[] = ["zh", "ja"];

export function isCjk(lang: string): boolean {
  return (CJK_LANGS as readonly string[]).includes(lang);
}
