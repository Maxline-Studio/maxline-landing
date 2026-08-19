/**
 * Mise en lignes des sous-titres, côté application.
 *
 * ─── Ce que ce module n'est plus ─────────────────────────────────────────────
 * Il portait sa PROPRE copie de l'algorithme, avec 42 caractères et 2 lignes
 * codés en dur — alors que le worker découpe selon le profil choisi par
 * l'utilisateur (34 × 1 pour « Court », 42 × 2 pour « Équilibré »), et avec des
 * pénalités linguistiques que cette copie n'avait pas.
 *
 * Conséquence observée : changer la langue des sous-titres d'une vidéo « Court »
 * remettait le texte en lignes à 42 × 2. Le même contenu n'avait pas le même
 * rythme selon la langue — la « divergence 34/42 », revenue par la porte de
 * derrière après avoir été corrigée côté worker.
 *
 * Ce module n'est donc plus qu'un ADAPTATEUR au-dessus de `subtitle-cut.ts`,
 * source unique partagée avec le worker. Aucune valeur de découpe ici.
 */
import { resolveProfile, wrapToLines } from "@/lib/subtitle-cut";

/**
 * Met un texte en lignes comme le ferait le pipeline.
 *
 * @param text    le texte à mettre en lignes
 * @param lang    la langue du texte (le CJK se coupe par caractères)
 * @param profile l'identifiant de profil de la vidéo (`videos.cut_profile`).
 *                Omis → profil par défaut, ce qui n'est correct que hors
 *                contexte vidéo (traduction d'un fichier .srt déposé).
 */
export function wrapLines(
  text: string,
  lang?: string,
  profile?: string | null,
): string {
  return wrapToLines(text, resolveProfile(profile, lang), lang);
}
