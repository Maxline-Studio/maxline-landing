import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Conditions générales",
  description:
    "Conditions générales d'utilisation et de vente du service Maxline Studio.",
  robots: { index: true, follow: true },
};

export default function CGU() {
  return (
    <LegalShell
      label="Conditions générales"
      title="Conditions générales d'utilisation et de vente"
      updated="31 mai 2026"
      intro="Ces conditions encadrent l'utilisation de Maxline Studio. On a fait au plus clair et au plus honnête — sans piège, comme le reste."
    >
      <LegalSection title="1. Objet et acceptation">
        <p>
          Les présentes conditions générales (« CGU/CGV ») régissent
          l&apos;utilisation du service Maxline Studio, édité par Maxence Chopin
          (voir <a href="/legal/mentions">mentions légales</a>). En créant un compte
          ou en utilisant le service, vous acceptez ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Le service">
        <p>
          Maxline Studio est un outil en ligne de <strong>sous-titrage vidéo</strong>{" "}
          : transcription automatique de la parole, traduction entre le français et
          l&apos;anglais (dans les deux sens) ou simple transcription dans la langue
          parlée, puis génération de sous-titres exportables (.srt, .vtt, .txt). Le
          traitement repose sur des technologies d&apos;intelligence artificielle.
        </p>
        <p>
          Le service évolue régulièrement (nouvelles fonctionnalités, améliorations).
        </p>
      </LegalSection>

      <LegalSection title="3. Compte">
        <p>
          La création d&apos;un compte requiert une adresse email valide (ou une
          connexion Google). Vous vous engagez à fournir des informations exactes,
          à garder vos identifiants confidentiels et à être responsable de
          l&apos;activité sur votre compte. Le service est réservé aux personnes de
          15 ans et plus (accord du représentant légal requis pour un mineur).
        </p>
      </LegalSection>

      <LegalSection title="4. Abonnement, minutes et tarifs">
        <ul>
          <li>
            L&apos;offre est proposée par abonnement mensuel à{" "}
            <strong>12 €/mois</strong> (TVA non applicable, article 293 B du CGI),
            sans engagement de durée.
          </li>
          <li>
            L&apos;usage est décompté en <strong>minutes</strong> de vidéo traitées,
            selon le quota de votre formule, complété le cas échéant par des{" "}
            <strong>crédits</strong>.
          </li>
          <li>
            Le <strong>programme de parrainage</strong> peut octroyer des minutes
            bonus, selon les conditions affichées dans l&apos;Atelier (notamment à la
            souscription payante d&apos;un filleul). Les bonus n&apos;ont pas de
            valeur monétaire et ne sont pas remboursables.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Paiement">
        <p>
          Les paiements sont traités par <strong>Stripe</strong>. Nous ne stockons
          pas votre carte bancaire. L&apos;abonnement est renouvelé automatiquement
          à chaque période ; vous pouvez le résilier à tout moment depuis votre
          espace, la résiliation prenant effet à la fin de la période en cours. En
          cas d&apos;échec de paiement, l&apos;accès aux fonctions payantes peut être
          suspendu.
        </p>
      </LegalSection>

      <LegalSection title="6. Droit de rétractation">
        <p>
          Conformément au Code de la consommation, vous disposez en principe
          d&apos;un délai de <strong>14 jours</strong> pour vous rétracter
          d&apos;un achat à distance.
        </p>
        <p>
          Toutefois, Maxline Studio est un service de contenu numérique exécuté
          immédiatement. En lançant un traitement de vidéo avant la fin de ce délai,
          vous <strong>demandez expressément l&apos;exécution immédiate</strong> du
          service et reconnaissez perdre votre droit de rétractation pour les
          prestations déjà exécutées. Tant que vous n&apos;avez lancé aucun
          traitement, vous pouvez exercer votre rétractation en écrivant à{" "}
          <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>.
        </p>
      </LegalSection>

      <LegalSection title="7. Utilisation acceptable">
        <p>Vous vous engagez à ne pas utiliser le service pour :</p>
        <ul>
          <li>
            traiter des contenus illicites, haineux, violents, ou portant atteinte
            aux droits de tiers ;
          </li>
          <li>
            importer des vidéos pour lesquelles vous ne détenez pas les droits
            nécessaires ;
          </li>
          <li>
            tenter de contourner les quotas, de nuire au service ou d&apos;en
            détourner l&apos;usage.
          </li>
        </ul>
        <p>
          Vous <strong>garantissez détenir les droits</strong> sur les vidéos que
          vous importez et restez seul responsable de leur contenu.
        </p>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>
          <strong>Vos vidéos et les sous-titres produits restent votre propriété.</strong>{" "}
          Vous nous accordez uniquement la licence technique, limitée et temporaire,
          nécessaire pour exécuter le service (importer, transcrire, traduire,
          stocker le temps de la rétention, vous restituer les fichiers). Nous ne les
          exploitons à aucune autre fin.
        </p>
        <p>
          Le service lui-même (logiciel, identité, marque « Maxline Studio »,
          design) reste la propriété exclusive de l&apos;éditeur.
        </p>
      </LegalSection>

      <LegalSection title="9. Qualité du résultat et rôle de l'IA">
        <p>
          Le service vise une qualité élevée, mais les résultats produits par
          l&apos;intelligence artificielle peuvent comporter des imprécisions. Vous
          disposez d&apos;un éditeur pour relire et corriger les sous-titres avant
          export, et restez responsable de la version finale que vous publiez.
        </p>
      </LegalSection>

      <LegalSection title="10. Disponibilité">
        <p>
          Nous mettons tout en œuvre pour assurer la disponibilité du service, sans
          pouvoir la garantir de manière ininterrompue (maintenance, incidents,
          dépendances techniques tierces). En cas d&apos;échec de traitement
          d&apos;une vidéo, une relance est possible sans nouveau décompte.
        </p>
      </LegalSection>

      <LegalSection title="11. Responsabilité">
        <p>
          Maxline Studio ne saurait être tenu responsable des dommages indirects
          (perte de revenus, de données, d&apos;opportunité). En tout état de cause,
          la responsabilité de l&apos;éditeur est limitée au montant que vous avez
          versé au cours des douze derniers mois. Aucune de ces limitations ne
          s&apos;applique en cas de faute lourde ou de dol, ni n&apos;écarte vos
          droits légaux impératifs en tant que consommateur.
        </p>
      </LegalSection>

      <LegalSection title="12. Données personnelles">
        <p>
          Le traitement de vos données est décrit dans notre{" "}
          <a href="/legal/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>

      <LegalSection title="13. Résiliation">
        <p>
          Vous pouvez résilier votre abonnement et supprimer votre compte à tout
          moment. Nous pouvons suspendre ou résilier un compte en cas de
          non-respect des présentes conditions ou d&apos;usage abusif, après
          information lorsque c&apos;est possible.
        </p>
      </LegalSection>

      <LegalSection title="14. Modification des conditions">
        <p>
          Ces conditions peuvent évoluer. La version applicable est celle en ligne
          au moment de votre utilisation ; en cas de changement important, vous en
          serez informé.
        </p>
      </LegalSection>

      <LegalSection title="15. Droit applicable et médiation">
        <p>
          Les présentes conditions sont soumises au droit français. En cas de
          litige, une solution amiable sera recherchée en priorité. Le consommateur
          peut recourir gratuitement à un médiateur de la consommation ou à la{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            plateforme européenne de règlement en ligne des litiges
          </a>
          . À défaut d&apos;accord, les tribunaux français sont compétents.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
