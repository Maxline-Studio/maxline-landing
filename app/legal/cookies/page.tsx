import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Politique cookies",
  description: "Politique cookies minimaliste de Maxline Studio : uniquement l'essentiel.",
  robots: { index: true, follow: true },
};

export default function Cookies() {
  return (
    <LegalShell
      label="Cookies"
      title="Politique cookies"
      updated="31 mai 2026"
      intro="Approche minimaliste : uniquement les cookies indispensables au fonctionnement. Aucun cookie publicitaire, aucun traceur tiers, aucun pistage."
    >
      <LegalSection title="Cookies strictement nécessaires">
        <p>
          Ces cookies sont indispensables au fonctionnement du service ; ils ne
          requièrent pas de consentement (recommandation CNIL).
        </p>
        <ul>
          <li>
            <strong>Authentification / session</strong> — déposés par notre
            prestataire d&apos;authentification (Supabase) pour vous garder connecté
            et sécuriser votre session une fois sur votre espace.
          </li>
          <li>
            <strong>Paiement</strong> — lors d&apos;un paiement, Stripe dépose des
            cookies techniques de sécurité et de prévention de la fraude sur sa
            page de paiement.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Ce que nous n'utilisons PAS">
        <ul>
          <li>❌ Pas de cookie publicitaire</li>
          <li>❌ Pas de Pixel Meta / Google Ads / TikTok / LinkedIn</li>
          <li>❌ Pas de Google Analytics ni équivalent</li>
          <li>❌ Pas de Hotjar / FullStory ni d&apos;enregistrement de session</li>
          <li>❌ Pas de chat tiers traceur (Intercom, Drift…)</li>
          <li>✅ Aucun pistage publicitaire, point.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Pas de bandeau intrusif">
        <p>
          N&apos;utilisant aucun cookie soumis à consentement, nous n&apos;affichons
          pas de bandeau bloquant : cette page d&apos;information vous suffit. Vous
          pouvez aussi bloquer ou supprimer les cookies depuis les réglages de votre
          navigateur (au risque de ne plus pouvoir vous connecter).
        </p>
      </LegalSection>

      <LegalSection title="En savoir plus">
        <p>
          <a
            href="https://www.cnil.fr/fr/cookies-et-traceurs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Recommandation de la CNIL sur les cookies →
          </a>
        </p>
        <p>
          Une question ?{" "}
          <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>
        </p>
      </LegalSection>
    </LegalShell>
  );
}
