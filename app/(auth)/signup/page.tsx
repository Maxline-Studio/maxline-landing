import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/app/auth-card";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Créez votre atelier Maxline Studio. Première vidéo offerte, sans carte.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AuthCard
      annotation="§ Inscription"
      title={<>Ouvrez votre atelier.</>}
      subtitle="Première vidéo gratuite, 5 minutes, sans carte demandée."
      footer={
        <p>
          Déjà un compte ?{" "}
          <Link href="/login" className="link-pen">
            Connectez-vous
          </Link>
        </p>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
