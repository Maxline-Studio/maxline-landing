import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/app/auth-card";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Réinitialiser mot de passe",
  description: "Demander un email de réinitialisation de mot de passe.",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const params = await searchParams;
  const step = params.step === "2" ? 2 : 1;

  return (
    <AuthCard
      annotation={step === 1 ? "§ Mot de passe oublié" : "§ Nouveau mot de passe"}
      title={
        step === 1 ? (
          <>On vous remet en selle.</>
        ) : (
          <>Choisissez votre nouveau code.</>
        )
      }
      subtitle={
        step === 1
          ? "Indiquez votre email, nous vous envoyons un lien de réinitialisation."
          : "Votre lien a été validé. Définissez maintenant votre nouveau mot de passe."
      }
      footer={
        <p>
          Retour à la{" "}
          <Link href="/login" className="link-pen">
            connexion
          </Link>
        </p>
      }
    >
      <ResetPasswordForm step={step} />
    </AuthCard>
  );
}
