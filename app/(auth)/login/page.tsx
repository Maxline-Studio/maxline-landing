import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/app/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre atelier Maxline Studio.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      annotation="§ Connexion"
      title={<>Retour à l&apos;atelier.</>}
      subtitle="Connectez-vous pour reprendre votre travail."
      footer={
        <p>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="link-pen">
            Créez votre atelier
          </Link>
        </p>
      }
    >
      <LoginForm
        redirectTo={params.redirect}
        externalError={params.error}
      />
    </AuthCard>
  );
}
