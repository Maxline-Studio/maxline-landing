import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Maxline Studio.",
  robots: { index: true, follow: true },
};

export default function MentionsLegales() {
  return (
    <>
      <Header />
      <main id="main-content" className="py-12 md:py-20">
        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 prose prose-neutral">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>

          <h1 className="text-4xl font-bold tracking-tight mb-2">Mentions légales</h1>
          <p className="text-sm text-neutral-500 mb-10">
            Dernière mise à jour : [À DÉFINIR AU LANCEMENT]
          </p>

          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-3">Éditeur du site</h2>
              <p className="text-neutral-700 leading-relaxed">
                <strong>Maxline Studio</strong> est un service édité par :
              </p>
              <ul className="list-disc list-inside space-y-1 mt-3 text-neutral-700">
                <li>Nom : [NOM PRÉNOM DU PORTEUR]</li>
                <li>Statut juridique : Entrepreneur individuel — Micro-entreprise</li>
                <li>Adresse du siège social : [ADRESSE]</li>
                <li>Email : contact@maxlinestudio.fr</li>
                <li>SIRET : [À COMPLÉTER]</li>
                <li>Code APE/NAF : [À COMPLÉTER]</li>
                <li>
                  Numéro de TVA intracommunautaire : Non applicable (article
                  293 B du CGI — franchise en base)
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Directeur de la publication</h2>
              <p className="text-neutral-700">
                [NOM PRÉNOM DU PORTEUR], en sa qualité de représentant légal.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Hébergement</h2>
              <ul className="space-y-2 text-neutral-700">
                <li>
                  <strong>Vercel Inc.</strong> — Front et API
                  <br />
                  440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
                </li>
                <li>
                  <strong>Supabase Inc.</strong> — Base de données et authentification
                  <br />
                  Région d&apos;hébergement : Europe (Frankfurt)
                </li>
                <li>
                  <strong>Cloudflare Inc.</strong> — DNS, CDN et stockage R2
                  <br />
                  101 Townsend St, San Francisco, CA 94107, États-Unis
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Propriété intellectuelle</h2>
              <p className="text-neutral-700 leading-relaxed">
                L&apos;ensemble du site (textes, images, logos, code source, base
                de données, design) est protégé par le droit d&apos;auteur. Toute
                reproduction sans autorisation préalable est interdite.
              </p>
              <p className="text-neutral-700 leading-relaxed mt-3">
                La marque &laquo; Maxline Studio &raquo; est en cours de dépôt à l&apos;INPI.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Loi applicable</h2>
              <p className="text-neutral-700 leading-relaxed">
                Le présent site est soumis au droit français. En cas de litige,
                après échec d&apos;une résolution amiable, les tribunaux français
                sont seuls compétents.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Signalement de contenu illicite</h2>
              <p className="text-neutral-700 leading-relaxed">
                Tout contenu illicite peut être signalé à :{" "}
                <a
                  href="mailto:contact@maxlinestudio.fr"
                  className="text-primary-600 underline"
                >
                  contact@maxlinestudio.fr
                </a>
              </p>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
