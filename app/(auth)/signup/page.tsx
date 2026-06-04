import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthCard } from "@/components/app/auth-card";
import { REF_COOKIE, sanitizeReferralCode } from "@/lib/referral";
import { billingResumeUrl } from "@/lib/checkout-intent";
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
  searchParams: Promise<{ ref?: string; checkout?: string }>;
}) {
  const { ref, checkout } = await searchParams;
  const cookieStore = await cookies();
  const referralCode = sanitizeReferralCode(
    ref || cookieStore.get(REF_COOKIE)?.value || "",
  );
  // Lien « déjà un compte » : on transmet l'intention de paiement pour que la
  // connexion atterrisse aussi sur le paiement du bon plan.
  const loginHref = checkout
    ? `/login?redirect=${encodeURIComponent(billingResumeUrl(checkout))}`
    : "/login";

  return (
    <AuthCard
      annotation="§ Inscription"
      title={<>Ouvrez votre atelier.</>}
      subtitle="Première vidéo gratuite, 5 minutes, sans carte demandée."
      footer={
        <p>
          Déjà un compte ?{" "}
          <Link href={loginHref} className="link-pen">
            Connectez-vous
          </Link>
        </p>
      }
    >
      <SignupForm referralCode={referralCode} checkout={checkout} />
    </AuthCard>
  );
}
