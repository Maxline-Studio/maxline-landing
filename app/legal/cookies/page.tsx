import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Politique cookies",
  description: "Politique cookies minimaliste de Maxline Studio.",
  robots: { index: true, follow: true },
};

export default function Cookies() {
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
            Politique cookies
          </h1>
          <p className="text-sm text-neutral-500 mb-10">
            Dernière mise à jour : [À DÉFINIR AU LANCEMENT]
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-3">Notre approche</h2>
              <p className="text-neutral-700 leading-relaxed">
                Maxline Studio adopte une approche{" "}
                <strong>minimaliste</strong> des cookies. Nous utilisons uniquement
                ceux strictement nécessaires au fonctionnement du site. Aucun
                cookie publicitaire. Aucun tracker tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                Cookies utilisés sur cette landing
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                À ce stade pré-lancement, cette landing&nbsp;:
              </p>
              <ul className="list-disc list-inside space-y-2 text-neutral-700">
                <li>
                  <strong>Ne dépose AUCUN cookie de tracking publicitaire</strong>
                </li>
                <li>
                  <strong>N&apos;utilise pas de Pixel</strong> Meta / Google Ads /
                  TikTok / LinkedIn
                </li>
                <li>
                  <strong>N&apos;utilise pas Google Analytics</strong> ni
                  d&apos;équivalent
                </li>
              </ul>
              <p className="text-neutral-700 leading-relaxed mt-4">
                Seul un cookie technique éventuel (préférence thème) pourrait être
                déposé si vous changez de mode clair/sombre.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">
                Conséquence : pas de bandeau cookies invasif
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                Conformément aux recommandations de la CNIL, n&apos;utilisant aucun
                cookie soumis à consentement, nous n&apos;affichons pas de bandeau
                bloquant. Cette page d&apos;information vous suffit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Notre engagement</h2>
              <ul className="list-disc list-inside space-y-2 text-neutral-700">
                <li>❌ Pas de Facebook Pixel</li>
                <li>❌ Pas de Google Ads</li>
                <li>❌ Pas de TikTok Pixel</li>
                <li>❌ Pas de Hotjar / FullStory</li>
                <li>❌ Pas de chat tiers traceur (Intercom, Drift...)</li>
                <li>✅ Pas de tracking publicitaire, point.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">Plus d&apos;information</h2>
              <p className="text-neutral-700 leading-relaxed">
                <a
                  href="https://www.cnil.fr/fr/cookies-et-traceurs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline"
                >
                  Recommandation CNIL sur les cookies →
                </a>
              </p>
              <p className="text-neutral-700 leading-relaxed mt-3">
                Pour toute question :{" "}
                <a
                  href="mailto:contact@maxlinestudio.fr"
                  className="text-primary-600 underline"
                >
                  contact@maxlinestudio.fr
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
