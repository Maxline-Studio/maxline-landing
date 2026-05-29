import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Mes vidéos",
  robots: { index: false, follow: false },
};

export default function VideosPage() {
  return (
    <ComingSoon
      annotation="§ Mes vidéos"
      sprint="Sprint 2 — à venir"
      title="Toutes vos traductions, au même endroit."
      description="La liste complète de vos vidéos (filtres par statut, recherche, actions par lot, téléchargement des exports) sera disponible au Sprint 2."
    />
  );
}
