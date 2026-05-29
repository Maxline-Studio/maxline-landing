import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "L'Atelier",
  robots: { index: false, follow: false },
};

export default function AtelierPage() {
  return (
    <ComingSoon
      annotation="§ L'Atelier"
      sprint="Sprint 6 — à venir"
      title="Votre progression, vos bonus, votre code de référence."
      description="Le tableau de bord complet de votre Atelier (rang actuel, minutes cumulées à vie, historique des bonus reçus, code de référence personnel, statistiques) sera disponible au Sprint 6. La doc stratégique complète est dans 03-produit/06-atelier-gamification.md."
    />
  );
}
