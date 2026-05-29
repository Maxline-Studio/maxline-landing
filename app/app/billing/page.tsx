import type { Metadata } from "next";
import { ComingSoon } from "@/components/app/coming-soon";

export const metadata: Metadata = {
  title: "Facturation",
  robots: { index: false, follow: false },
};

export default function BillingPage() {
  return (
    <ComingSoon
      annotation="§ Facturation"
      sprint="Sprint 5 — à venir"
      title="Plan, crédits, et factures."
      description="Le portail de facturation (changement de plan, achat de packs crédits, historique des factures Stripe, mise à jour carte) sera disponible au Sprint 5."
    />
  );
}
