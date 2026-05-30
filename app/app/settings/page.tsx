import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return (
    <ComingSoon
      annotation="§ Paramètres"
      sprint="Bientôt disponible"
      title="Préférences et confidentialité."
      description="Les paramètres (durée de rétention des vidéos 7/14/30j, notifications email, langue de l'interface, suppression de compte) arrivent très bientôt."
    />
  );
}
