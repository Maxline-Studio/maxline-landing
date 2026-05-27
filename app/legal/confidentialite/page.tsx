import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Maxline Studio collecte, utilise et protège vos données personnelles.",
  robots: { index: true, follow: true },
};

export default function Confidentialite() {
  return (
    <>
      <Header />
      <main id="main-content" className="py-12 md:py-20">
        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>

          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-neutral-500 mb-10">
            Dernière mise à jour : [À DÉFINIR AU LANCEMENT]
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-3">1. Qui sommes-nous ?</h2>
              <p className="text-neutral-700 leading-relaxed">
                Maxline Studio est édité par [NOM PRÉNOM], micro-entrepreneur.
                Coordonnées complètes sur la page{" "}
                <Link href="/legal/mentions" className="text-primary-600 underline">
                  mentions légales
                </Link>
                .
              </p>
              <p className="text-neutral-700 leading-relaxed mt-3">
                <strong>Responsable de traitement</strong> : [NOM PRÉNOM]
                <br />
                <strong>Contact</strong> :{" "}
                <a
                  href="mailto:contact@maxlinestudio.fr"
                  className="text-primary-600 underline"
                >
                  contact@maxlinestudio.fr
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Données collectées sur cette page</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                À ce stade pré-lancement, nous collectons uniquement :
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-700">
                <li>Votre adresse email (que vous nous donnez explicitement)</li>
                <li>
                  Un hash anonymisé de votre IP (pour limiter les inscriptions
                  abusives, jamais l&apos;IP en clair)
                </li>
                <li>Votre user agent (navigateur, OS)</li>
                <li>La date d&apos;inscription</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Pourquoi ?</h2>
              <ul className="list-disc list-inside space-y-1 text-neutral-700">
                <li>Vous prévenir du lancement de Maxline Studio (base : votre consentement)</li>
                <li>
                  Vous proposer un accès anticipé (base : exécution d&apos;un service
                  pré-contractuel)
                </li>
                <li>
                  Empêcher les inscriptions abusives ou frauduleuses (base :
                  intérêt légitime)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Combien de temps ?</h2>
              <p className="text-neutral-700 leading-relaxed">
                Votre email est conservé jusqu&apos;au lancement de Maxline Studio,
                puis pendant 24 mois après désinscription (preuve de consentement). Vous
                pouvez demander la suppression à tout moment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Sous-traitants</h2>
              <ul className="list-disc list-inside space-y-1 text-neutral-700">
                <li>
                  <strong>Supabase</strong> (Frankfurt, UE) — Base de données
                </li>
                <li>
                  <strong>Vercel</strong> (US, DPF certifié) — Hébergement du site
                </li>
                <li>
                  <strong>Resend</strong> (US, DPF certifié) — Envoi d&apos;emails
                </li>
                <li>
                  <strong>Cloudflare</strong> (DNS et protection)
                </li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Aucune donnée n&apos;est partagée à des fins publicitaires ou commerciales.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Vos droits (RGPD)</h2>
              <p className="text-neutral-700 leading-relaxed mb-3">
                Vous disposez à tout moment des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-1 text-neutral-700">
                <li>Accès à vos données</li>
                <li>Rectification</li>
                <li>Effacement (&laquo; droit à l&apos;oubli &raquo;)</li>
                <li>Limitation du traitement</li>
                <li>Portabilité</li>
                <li>Opposition (désabonnement)</li>
                <li>Plainte auprès de la CNIL</li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Pour exercer ces droits : envoyez un email à{" "}
                <a
                  href="mailto:contact@maxlinestudio.fr"
                  className="text-primary-600 underline"
                >
                  contact@maxlinestudio.fr
                </a>
                . Réponse sous 30 jours maximum.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Sécurité</h2>
              <p className="text-neutral-700 leading-relaxed">
                HTTPS partout, chiffrement au repos, base de données hébergée en
                Europe (Frankfurt). Aucune donnée vendue à des tiers, jamais. Aucun
                pixel publicitaire (Meta, Google Ads, TikTok). Pas d&apos;entraînement
                IA sur vos données.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Cookies</h2>
              <p className="text-neutral-700 leading-relaxed">
                Cette landing utilise uniquement des cookies techniques essentiels
                (session). Pas de tracking publicitaire. Plus de détails sur la page{" "}
                <Link href="/legal/cookies" className="text-primary-600 underline">
                  cookies
                </Link>
                .
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
