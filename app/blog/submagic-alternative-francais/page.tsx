import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HandUnderline } from "@/components/hand-underline";
import { JsonLd } from "@/components/json-ld";
import { articleLd, breadcrumbLd } from "@/lib/seo";

const TITLE = "Submagic en français : l'alternative pour les créateurs FR";
const DESCRIPTION =
  "Submagic excelle sur les captions virales. Pour des sous-titres FR↔EN propres, en français et en euros, voici l'alternative française — comparatif honnête.";
const PATH = "/blog/submagic-alternative-francais";
const PUBLISHED = "2026-06-02T09:00:00+02:00";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `https://www.maxlinestudio.fr${PATH}`,
    type: "article",
    publishedTime: PUBLISHED,
    authors: ["Maxence"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submagic en français : l'alternative pour les créateurs FR",
    description:
      "Captions virales d'un côté, sous-titres FR↔EN propres et exportables de l'autre. Le comparatif honnête, par un créateur FR.",
  },
  alternates: {
    canonical: `https://www.maxlinestudio.fr${PATH}`,
  },
};

export default function SubmagicAlternativeFrancais() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: "Submagic en français : l'alternative FR", path: PATH },
          ]),
          articleLd({
            headline: TITLE,
            description: DESCRIPTION,
            path: PATH,
            datePublished: PUBLISHED,
          }),
        ]}
      />
      <Header />
      <main id="main-content" className="py-12 md:py-20 bg-ivory-50 relative">
        <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />
        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 mb-10 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Tous les articles
          </Link>

          <header className="mb-12 md:mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§ Comparatif · Journal</span>
            </div>

            <h1 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-6">
              Submagic en français : l&apos;alternative pensée pour les{" "}
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  créateurs FR
                </HandUnderline>
              </span>
              .
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm font-mono uppercase tracking-widest text-ink-500">
              <time dateTime="2026-06-02">2 juin 2026</time>
              <span className="h-1 w-1 rounded-full bg-ink-300" />
              <span>8 min de lecture</span>
              <span className="h-1 w-1 rounded-full bg-ink-300" />
              <span>Par Maxence</span>
            </div>
          </header>

          <div className="space-y-7 text-lg text-neutral-800 leading-relaxed">
            <p className="font-display italic font-light text-2xl md:text-3xl text-ink-900 leading-snug border-l-[3px] border-rouge-500 pl-6 my-12">
              Submagic est un excellent outil. Mais il n&apos;a pas été pensé
              pour un créateur français qui veut des sous-titres FR↔EN propres,
              dans sa langue, et payés en euros. Voici un comparatif honnête —
              et où chacun gagne vraiment.
            </p>

            <p>
              Si vous faites des Shorts ou du TikTok, vous avez forcément croisé{" "}
              <strong>Submagic</strong> : c&apos;est l&apos;un des outils les plus
              populaires pour ajouter des sous-titres animés « qui retiennent
              l&apos;attention ». Et sur ce terrain, il est très bon. Je ne vais
              pas prétendre le contraire — ce serait malhonnête, et ce n&apos;est
              pas la maison.
            </p>

            <p>
              Mais beaucoup de créateurs francophones m&apos;écrivent avec la
              même question : « je veux surtout des sous-titres corrects, et
              traduire mes vidéos en anglais — est-ce que Submagic est fait pour
              ça ? » La réponse honnête est : <em>en partie</em>. Et c&apos;est
              précisément le vide que{" "}
              <Link href="/" className="link-pen">
                Maxline Studio
              </Link>{" "}
              vient combler. Voyons ça point par point.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Ce que Submagic fait — et fait bien
            </h2>

            <p>
              Soyons clairs sur ses forces, parce qu&apos;elles sont réelles.
              Submagic est taillé pour la <strong>vidéo courte virale</strong> :
            </p>

            <ul className="space-y-3 pl-6 list-disc marker:text-rouge-500">
              <li>
                <strong>Sous-titres animés</strong> avec des templates « façon
                MrBeast » : mots qui apparaissent un par un, surlignage,
                emojis, effets de pop. C&apos;est leur signature.
              </li>
              <li>
                <strong>B-roll automatique</strong>, zooms dynamiques, titres
                d&apos;accroche générés par IA, nettoyage audio, suppression des
                blancs et des « euh ».
              </li>
              <li>
                Une bibliothèque d&apos;effets pensée pour <strong>maximiser la
                rétention</strong> sur TikTok, Reels et Shorts.
              </li>
            </ul>

            <p>
              Si votre objectif numéro un, c&apos;est l&apos;esthétique virale du
              short-form, Submagic fait le travail. Maxline ne joue pas dans cette
              catégorie — et ne prétend pas le faire.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Les trois frictions pour un créateur français
            </h2>

            <p>
              Là où ça coince quand on est francophone et qu&apos;on veut surtout
              du sous-titre <em>propre</em> et de la traduction soignée :
            </p>

            <ol className="space-y-3 pl-6 list-decimal marker:text-ink-500 marker:font-mono">
              <li>
                <strong>Tout est en anglais.</strong> Interface, support,
                facturation. Au moment où j&apos;écris ces lignes, Submagic
                génère des sous-titres dans une quarantaine de langues (français
                inclus), mais l&apos;outil lui-même n&apos;est pas pensé en
                français. Pour beaucoup, c&apos;est un frein quotidien.
              </li>
              <li>
                <strong>La facturation est en dollars, par membre, et au nombre
                de vidéos.</strong> Les formules tournent autour de 19 à 69 $ par
                mois, avec un quota de vidéos et une durée maximale par vidéo (2
                à 30 minutes selon le plan), plus des « crédits IA » limités.
                C&apos;est un modèle pensé pour des équipes, pas forcément pour
                un solo qui veut de la simplicité.
              </li>
              <li>
                <strong>C&apos;est un outil de caption virale, pas un atelier de
                traduction.</strong> La traduction de sous-titres existe, mais
                elle est secondaire. Le contrôle ligne à ligne et l&apos;export
                propre vers votre logiciel de montage ne sont pas le cœur du
                produit.
              </li>
            </ol>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Le comparatif, sans langue de bois
            </h2>

            <p>
              Les chiffres Submagic ci-dessous datent de la rédaction (2026) et
              peuvent évoluer — vérifiez toujours sur leur site. L&apos;idée
              n&apos;est pas de dénigrer, mais de poser les critères qui comptent
              pour <em>vous</em>.
            </p>

            <div className="my-10 overflow-x-auto border-2 border-ink-900 rounded-sm">
              <table className="w-full text-base border-collapse">
                <thead>
                  <tr className="bg-ink-900 text-ivory-50 font-mono text-xs uppercase tracking-widest">
                    <th className="text-left p-4 font-semibold">Critère</th>
                    <th className="text-left p-4 font-semibold">Submagic</th>
                    <th className="text-left p-4 font-semibold">Maxline Studio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/15">
                  <tr>
                    <td className="p-4 font-semibold text-ink-900">Interface &amp; support</td>
                    <td className="p-4 text-ink-700">Anglais</td>
                    <td className="p-4 text-ink-900 font-medium">Français natif</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-ink-900">Prix d&apos;entrée</td>
                    <td className="p-4 text-ink-700">~19 $/mois (par membre)</td>
                    <td className="p-4 text-ink-900 font-medium">12 €/mois</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-ink-900">Modèle de quota</td>
                    <td className="p-4 text-ink-700">Au nombre de vidéos + durée max</td>
                    <td className="p-4 text-ink-900 font-medium">120 min/mois, toute durée</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-ink-900">Traduction FR↔EN</td>
                    <td className="p-4 text-ink-700">Secondaire</td>
                    <td className="p-4 text-ink-900 font-medium">Au cœur du produit</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-ink-900">Export montage</td>
                    <td className="p-4 text-ink-700 inline-flex items-center gap-1.5"><X className="h-4 w-4 text-ink-400" aria-hidden /> Vidéo finie</td>
                    <td className="p-4 text-ink-900 font-medium inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-rouge-500" aria-hidden /> .srt / .vtt / .fcpxml</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-ink-900">Captions animées &amp; B-roll</td>
                    <td className="p-4 text-ink-900 font-medium inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-rouge-500" aria-hidden /> Oui, sa force</td>
                    <td className="p-4 text-ink-700 inline-flex items-center gap-1.5"><X className="h-4 w-4 text-ink-400" aria-hidden /> Non</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Quand choisir l&apos;un, quand choisir l&apos;autre
            </h2>

            <p>
              Je préfère vous faire gagner du temps plutôt que vous vendre du
              rêve. Voici la vraie ligne de partage :
            </p>

            <ul className="space-y-3 pl-6 list-disc marker:text-rouge-500">
              <li>
                <strong>Choisissez Submagic</strong> si votre priorité absolue,
                c&apos;est la <strong>caption animée virale</strong>, le B-roll
                automatique et l&apos;esthétique short-form qui retient
                l&apos;attention. C&apos;est leur métier.
              </li>
              <li>
                <strong>Choisissez Maxline</strong> si vous voulez des{" "}
                <strong>sous-titres FR↔EN propres</strong>, corrigés ligne à
                ligne, exportables dans DaVinci ou Premiere — le tout en
                français, en euros, et sans payer au nombre de vidéos. Notamment
                pour{" "}
                <Link href="/blog/traduire-video-francais-anglais" className="link-pen">
                  traduire vos vidéos du français vers l&apos;anglais
                </Link>
                .
              </li>
            </ul>

            <p>
              Et rien ne vous empêche d&apos;utiliser les deux : Maxline pour la
              traduction propre et l&apos;export, Submagic pour habiller un short
              quand vous visez la viralité. Des outils différents pour des
              besoins différents.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Et le prix, concrètement ?
            </h2>

            <p>
              Submagic démarre autour de 19 $/mois pour 15 vidéos plafonnées à 2
              minutes (soit ~30 minutes de contenu), avec un tarif annuel plus
              bas si vous vous engagez à l&apos;année. Maxline, c&apos;est{" "}
              <Link href="/#tarif" className="link-pen">
                12 €/mois pour 120 minutes
              </Link>
              , sans engagement, sans plafond au nombre de vidéos, et avec
              l&apos;
              <Link href="/atelier" className="link-pen">
                Atelier
              </Link>{" "}
              (des minutes en plus à mesure que vous éditez). Pour qui sous-titre
              et traduit régulièrement des vidéos longues, le calcul à la minute
              penche nettement.
            </p>

            <p>
              Le détail des concurrents (Submagic, VEED, Kapwing, Maestra) est
              aussi résumé dans le{" "}
              <Link href="/#comparatif" className="link-pen">
                comparatif de la page d&apos;accueil
              </Link>
              , avec les mêmes critères factuels.
            </p>

            <p className="font-serif text-xl text-neutral-900 italic border-t border-neutral-200 pt-8 mt-12">
              Le meilleur outil, c&apos;est celui qui correspond à votre besoin
              réel — pas le plus bruyant.
              <br />
              Pour la traduction FR↔EN propre, en français, c&apos;est Maxline.
            </p>

            <p className="text-base text-neutral-500 mt-4">— Maxence</p>
          </div>

          {/* CTA bas d'article */}
          <aside className="mt-20 bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-10 shadow-[6px_6px_0_0_rgba(26,24,20,1)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="annotation">§ Essayez Maxline</span>
            </div>
            <h2 className="font-display font-medium text-2xl md:text-3xl leading-tight text-ink-900 mb-3 tracking-[-0.015em]">
              Des sous-titres FR↔EN propres,
              <br />
              <span className="font-display italic font-light text-rouge-500">
                en français, en euros.
              </span>
            </h2>
            <p className="text-ink-700 mb-6 leading-relaxed">
              Déposez une vidéo, récupérez des sous-titres prêts à monter. La
              première vidéo de moins de 5 minutes est offerte, sans carte
              bancaire.
            </p>
            <Link href="/signup" className="btn-pen text-base">
              Créer mon atelier
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </article>
      </main>
      <Footer />
    </>
  );
}
