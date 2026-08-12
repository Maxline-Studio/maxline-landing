import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BenchClient } from "./bench-client";

export const metadata: Metadata = {
  title: "Banc d'essai éditeur",
  robots: { index: false, follow: false },
};

/**
 * Banc d'essai de l'éditeur — DÉVELOPPEMENT UNIQUEMENT.
 *
 * Monte les VRAIS composants (SubtitlePlayer, Timeline, PlaybackClock) avec des
 * données synthétiques, pour vérifier sans base de données ni fichier vidéo :
 *   1. que le lecteur ne déborde JAMAIS de la place qu'on lui donne ;
 *   2. que la timeline ne se re-rend PAS pendant que la tête de lecture avance.
 *
 * Renvoie un 404 en production : cette page ne doit jamais être atteignable.
 */
export default function BenchPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BenchClient />;
}
