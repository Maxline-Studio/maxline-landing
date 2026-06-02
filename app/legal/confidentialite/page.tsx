import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment Maxline Studio collecte, utilise et protège vos données personnelles (RGPD).",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.maxlinestudio.fr/legal/confidentialite" },
};

export default function Confidentialite() {
  return (
    <LegalShell
      label="Confidentialité"
      title="Politique de confidentialité"
      updated="31 mai 2026"
      intro="Maxline Studio est un service français, pensé pour le RGPD. On collecte le strict nécessaire, on ne revend rien, et vos vidéos sont supprimées automatiquement. Voici, en clair, ce qu'on fait de vos données."
    >
      <LegalSection title="1. Responsable du traitement">
        <p>
          Le responsable du traitement est <strong>Maxence Chopin</strong>,
          entrepreneur individuel (voir{" "}
          <a href="/legal/mentions">mentions légales</a>).
        </p>
        <p>
          Contact pour toute question relative à vos données :{" "}
          <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>.
        </p>
      </LegalSection>

      <LegalSection title="2. Les données que nous traitons">
        <ul>
          <li>
            <strong>Compte</strong> : adresse email, nom affiché, et soit un mot de
            passe (jamais stocké en clair — haché par notre prestataire
            d&apos;authentification), soit votre identifiant de connexion Google si
            vous utilisez « Continuer avec Google ».
          </li>
          <li>
            <strong>Vos vidéos et sous-titres</strong> : la vidéo que vous
            importez, l&apos;audio extrait (temporaire, le temps du traitement), la
            transcription et les sous-titres générés, ainsi que vos réglages de
            style.
          </li>
          <li>
            <strong>Abonnement et paiement</strong> : statut de votre abonnement,
            minutes et crédits, historique de facturation. Le paiement est géré par
            Stripe : <strong>nous ne voyons ni ne stockons votre carte bancaire</strong>.
          </li>
          <li>
            <strong>Parrainage</strong> : votre code de parrainage et le lien
            parrain/filleul, pour créditer les bonus.
          </li>
          <li>
            <strong>Données techniques</strong> : statut de traitement de vos
            vidéos, minutes consommées, journaux techniques nécessaires au bon
            fonctionnement et à la sécurité.
          </li>
          <li>
            <strong>Liste d&apos;attente</strong> (si vous vous y inscrivez) :
            email, empreinte anonymisée de l&apos;IP (jamais en clair), navigateur,
            date.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Pourquoi, et sur quelle base légale">
        <ul>
          <li>
            Fournir le service (compte, import, transcription, traduction, exports)
            — <strong>exécution du contrat</strong>.
          </li>
          <li>
            Gérer l&apos;abonnement, la facturation et la comptabilité —{" "}
            <strong>exécution du contrat</strong> et{" "}
            <strong>obligation légale</strong>.
          </li>
          <li>
            Emails de service (confirmation, état des vidéos, bonus) —{" "}
            <strong>exécution du contrat</strong>. Emails de liste d&apos;attente —{" "}
            <strong>consentement</strong>.
          </li>
          <li>
            Programme de parrainage et bonus — <strong>exécution du contrat</strong>.
          </li>
          <li>
            Sécurité, prévention de la fraude et des abus —{" "}
            <strong>intérêt légitime</strong>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Combien de temps nous les gardons">
        <ul>
          <li>
            <strong>Vos vidéos et sous-titres</strong> : supprimés{" "}
            <strong>automatiquement</strong> à l&apos;issue de votre délai de
            rétention (30 jours par défaut), ou immédiatement si vous supprimez la
            vidéo. La vidéo source vous appartient ; on ne la garde pas plus que
            nécessaire.
          </li>
          <li>
            <strong>Compte</strong> : tant que votre compte est actif. À sa
            suppression, vos données sont effacées (hors obligations légales).
          </li>
          <li>
            <strong>Facturation</strong> : conservée jusqu&apos;à 10 ans (obligation
            comptable légale).
          </li>
          <li>
            <strong>Inscription au Journal / liste de diffusion</strong> :
            conservée jusqu&apos;à votre désinscription, puis 24 mois (preuve du
            consentement).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Prestataires (sous-traitants)">
        <p>
          Pour faire fonctionner le service, nous nous appuyons sur des prestataires
          soigneusement choisis. Chacun n&apos;intervient que pour ce qui lui est
          confié :
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — base de données, comptes, sous-titres ·{" "}
            <em>Union européenne (Irlande)</em>
          </li>
          <li>
            <strong>Vercel</strong> — hébergement du site et des fonctions ·{" "}
            <em>États-Unis</em>
          </li>
          <li>
            <strong>Cloudflare (R2)</strong> — stockage des vidéos et diffusion ·{" "}
            <em>États-Unis</em>
          </li>
          <li>
            <strong>Google Cloud</strong> — serveur qui réalise le traitement vidéo ·{" "}
            <em>États-Unis</em>
          </li>
          <li>
            <strong>Groq</strong> — transcription audio par intelligence artificielle ·{" "}
            <em>États-Unis</em>
          </li>
          <li>
            <strong>Anthropic (Claude)</strong> — traduction par intelligence
            artificielle · <em>États-Unis</em>
          </li>
          <li>
            <strong>Stripe</strong> — paiement et abonnement ·{" "}
            <em>Irlande / États-Unis</em>
          </li>
          <li>
            <strong>Resend</strong> — envoi des emails · <em>États-Unis</em>
          </li>
          <li>
            <strong>Google</strong> — connexion « Continuer avec Google » (si vous
            l&apos;utilisez)
          </li>
        </ul>
        <p>
          <strong>
            Nos prestataires d&apos;IA traitent vos contenus via leur interface
            professionnelle (API) et ne les utilisent pas pour entraîner leurs
            modèles.
          </strong>{" "}
          Aucune donnée n&apos;est vendue ni partagée à des fins publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="6. Transferts hors Union européenne">
        <p>
          Vos données de compte sont hébergées dans l&apos;Union européenne
          (Irlande). En revanche, certains prestataires ci-dessus sont situés aux
          États-Unis : l&apos;hébergement du site, le stockage des vidéos et les
          traitements d&apos;IA peuvent donc impliquer un transfert hors UE.
        </p>
        <p>
          Ces transferts sont encadrés par les garanties prévues par le RGPD :
          adhésion au <strong>Data Privacy Framework</strong> UE–États-Unis et/ou{" "}
          <strong>Clauses Contractuelles Types</strong> de la Commission
          européenne, selon les prestataires.
        </p>
      </LegalSection>

      <LegalSection title="7. Vos droits">
        <p>Conformément au RGPD, vous disposez à tout moment des droits suivants :</p>
        <ul>
          <li>Accès à vos données et copie</li>
          <li>Rectification</li>
          <li>Effacement (« droit à l&apos;oubli »)</li>
          <li>Limitation et opposition au traitement</li>
          <li>Portabilité</li>
          <li>Retrait de votre consentement à tout moment</li>
          <li>
            Réclamation auprès de la CNIL (
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
              cnil.fr
            </a>
            )
          </li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez à{" "}
          <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>.
          Nous répondons sous un mois maximum.
        </p>
      </LegalSection>

      <LegalSection title="8. Sécurité">
        <p>
          Chiffrement des échanges (HTTPS/TLS) et des données au repos, isolation
          stricte des données par utilisateur, mots de passe hachés, suppression
          automatique des vidéos. Pas de revente de données, pas de pixel
          publicitaire (Meta, Google Ads, TikTok…), pas d&apos;entraînement
          d&apos;IA sur vos contenus.
        </p>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>
          Nous n&apos;utilisons que des cookies strictement nécessaires (session,
          authentification, paiement). Détails sur la page{" "}
          <a href="/legal/cookies">cookies</a>.
        </p>
      </LegalSection>

      <LegalSection title="10. Mineurs">
        <p>
          Le service n&apos;est pas destiné aux personnes de moins de 15 ans. Si
          vous êtes mineur, l&apos;accord d&apos;un représentant légal est requis.
        </p>
      </LegalSection>

      <LegalSection title="11. Évolution de cette politique">
        <p>
          Cette politique peut être mise à jour pour refléter les évolutions du
          service ou de la réglementation. La date de dernière mise à jour figure en
          haut de cette page ; en cas de changement important, nous vous en
          informerons.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
