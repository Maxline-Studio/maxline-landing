import type { Metadata } from "next";
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Maxline Studio.",
  robots: { index: true, follow: true },
};

export default function MentionsLegales() {
  return (
    <LegalShell label="Mentions légales" title="Mentions légales" updated="31 mai 2026">
      <LegalSection title="Éditeur du site">
        <p>
          Le site et le service <strong>Maxline Studio</strong> sont édités par :
        </p>
        <ul>
          <li>
            <strong>Maxence Chopin</strong> — entrepreneur individuel
          </li>
          <li>Siège social : 41 rue Vaillant Couturier, 59233 Maing, France</li>
          <li>
            Adresse électronique :{" "}
            <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>
          </li>
          <li>SIRET : en cours d&apos;immatriculation</li>
          <li>Code APE/NAF : en cours d&apos;attribution</li>
          <li>
            TVA intracommunautaire : non applicable — TVA non applicable, article
            293 B du CGI (franchise en base)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>Maxence Chopin, en sa qualité d&apos;éditeur du site.</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>Le site, l&apos;application et les données sont hébergés par :</p>
        <ul>
          <li>
            <strong>Vercel Inc.</strong> — hébergement du site et des fonctions
            serveur. 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis —{" "}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
              vercel.com
            </a>
          </li>
          <li>
            <strong>Supabase, Inc.</strong> — base de données, authentification et
            fichiers de sous-titres. Données hébergées dans l&apos;Union
            européenne (région AWS Europe — Irlande) —{" "}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              supabase.com
            </a>
          </li>
          <li>
            <strong>Cloudflare, Inc.</strong> — réseau de diffusion (CDN) et
            stockage des vidéos (Cloudflare R2). 101 Townsend St, San Francisco,
            CA 94107, États-Unis —{" "}
            <a href="https://cloudflare.com" target="_blank" rel="noopener noreferrer">
              cloudflare.com
            </a>
          </li>
        </ul>
        <p>
          La liste complète des prestataires qui traitent des données (dont les
          services d&apos;intelligence artificielle de transcription et de
          traduction) figure dans notre{" "}
          <a href="/legal/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble du site (textes, visuels, logos, identité, code source,
          base de données, design) est protégé par le droit d&apos;auteur et le
          droit des bases de données. Toute reproduction ou réutilisation sans
          autorisation préalable est interdite.
        </p>
        <p>
          Les vidéos que vous importez et les sous-titres produits{" "}
          <strong>restent votre propriété</strong> : Maxline Studio ne revendique
          aucun droit dessus (voir nos{" "}
          <a href="/legal/cgu">conditions générales</a>).
        </p>
        <p>
          La dénomination « Maxline Studio » fait l&apos;objet d&apos;une démarche
          de protection auprès de l&apos;INPI.
        </p>
      </LegalSection>

      <LegalSection title="Médiation et litiges">
        <p>
          Le présent site est soumis au droit français. En cas de différend, une
          solution amiable sera recherchée en priorité (contact :{" "}
          <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>).
        </p>
        <p>
          Conformément au Code de la consommation, le consommateur peut recourir
          gratuitement à un médiateur de la consommation. La plateforme européenne
          de règlement en ligne des litiges est accessible ici :{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          . À défaut d&apos;accord, les tribunaux français sont compétents.
        </p>
      </LegalSection>

      <LegalSection title="Signalement de contenu illicite">
        <p>
          Tout contenu manifestement illicite peut être signalé à{" "}
          <a href="mailto:contact@maxlinestudio.fr">contact@maxlinestudio.fr</a>.
          Nous nous engageons à traiter ces signalements avec diligence.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
