import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthCard } from "@/components/app/auth-card";
import { REF_COOKIE, sanitizeReferralCode } from "@/lib/referral";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Créez votre atelier Maxline Studio. Première vidéo offerte, sans carte.",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const cookieStore = await cookies();
  const referralCode = sanitizeReferralCode(
    ref || cookieStore.get(REF_COOKIE)?.value || "",
  );

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
      <SignupForm referralCode={referralCode} />
    </AuthCard>
  );
}
