import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Pourquoi je crée Maxline Studio",
  description:
    "Il y a un trou évident sur le marché français de la traduction vidéo. Voilà comment je suis tombé dedans, et pourquoi je décide de m'y attaquer seul.",
  openGraph: {
    title: "Pourquoi je crée Maxline Studio",
    description:
      "Il y a un trou évident sur le marché français de la traduction vidéo. Voilà comment je suis tombé dedans, et pourquoi je décide de m'y attaquer seul.",
    url: "https://maxlinestudio.fr/blog/pourquoi-maxline-studio",
    type: "article",
    publishedTime: "2026-05-27T08:00:00+02:00",
    authors: ["Maxence"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pourquoi je crée Maxline Studio",
    description:
      "Il y a un trou évident sur le marché français de la traduction vidéo. Voilà comment je suis tombé dedans.",
  },
  alternates: {
    canonical: "https://maxlinestudio.fr/blog/pourquoi-maxline-studio",
  },
};

export default function PourquoiMaxlineStudio() {
  return (
    <>
      <Header />
      <main id="main-content" className="py-12 md:py-20 bg-cream-50">
        <article className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-10"
          >
            <ArrowLeft className="h-4 w-4" /> Tous les articles
          </Link>

          <header className="mb-12 md:mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Journal · Article 01
              </span>
              <span className="h-px w-12 bg-primary-300" />
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-neutral-900 mb-6">
              Pourquoi je crée{" "}
              <em className="text-primary-600">Maxline Studio</em>.
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <time dateTime="2026-05-27">27 mai 2026</time>
              <span className="h-1 w-1 rounded-full bg-neutral-300" />
              <span>8 min de lecture</span>
              <span className="h-1 w-1 rounded-full bg-neutral-300" />
              <span>Par Maxence</span>
            </div>
          </header>

          <div className="space-y-7 text-lg text-neutral-800 leading-relaxed">
            <p className="font-serif text-2xl md:text-3xl text-neutral-900 leading-snug border-l-2 border-primary-400 pl-6 my-12">
              Il y a un trou évident sur le marché français de la traduction
              vidéo. Voilà comment je suis tombé dedans, et pourquoi je décide
              de m&apos;y attaquer seul.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Le déclencheur
            </h2>

            <p>
              Il y a six mois, une amie créatrice — disons Léa, 27 ans, 25 000
              abonnés sur YouTube, ambition d&apos;ouvrir une audience
              anglophone — me racontait son dernier dimanche. Elle avait passé
              quatre heures à traduire à la main les sous-titres d&apos;une
              vidéo de douze minutes. Le lundi matin, elle a publié la version
              anglaise. Le lundi soir, elle avait 200 vues dessus. Elle a
              calculé : à ce rythme, traduire ses vidéos lui coûtait plus de
              temps que de les filmer.
            </p>

            <p>
              Elle a regardé ce qui existait. HeyGen à 29 $/mois mais
              l&apos;interface anglaise, les voix clonées, la complexité ; trop
              cher, trop gros pour son besoin. Rask AI à 60 $/mois, même
              constat. Captions à 10 $/mois mais TikTok-only et anglophone.
              CapCut gratuit mais le rendu fait amateur et l&apos;export pour
              DaVinci n&apos;existe pas. Un freelance de Fiverr à 50 € la
              vidéo, délai 48 h, qualité aléatoire.
            </p>

            <p>
              Elle m&apos;a dit, mot pour mot :{" "}
              <em>
                « il manque un truc simple, en français, qui me sortirait des
                .srt propres pour 10-15 € par mois. »
              </em>
            </p>

            <p>
              J&apos;ai cherché ce truc. Il n&apos;existait pas.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Le trou de marché
            </h2>

            <p>
              Le marché mondial de la traduction vidéo IA est passé de 2,68
              milliards de dollars en 2024 à un projet de 33,4 milliards en
              2034 — un taux de croissance annuel composé de 28 %. C&apos;est
              une vague. Mais sur le segment qui m&apos;intéresse —{" "}
              <strong>les créateurs solo francophones</strong> — il y a cinq
              trous distincts que je n&apos;ai vus comblés par personne.
            </p>

            <p>
              <strong>Un :</strong> aucun outil sérieux n&apos;est{" "}
              <em>français-first</em>. L&apos;interface, le support client, la
              documentation — tout est anglophone. Pour une créatrice qui passe
              déjà sa journée à traduire, c&apos;est une friction de plus.
            </p>

            <p>
              <strong>Deux :</strong> aucun ne sort de fichiers{" "}
              <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                .fcpxml
              </code>{" "}
              ou{" "}
              <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                .xml
              </code>{" "}
              propres pour les monteurs sur DaVinci ou Premiere. Les
              concurrents partent du principe que tu vas exporter ta vidéo
              finie depuis leur plateforme, avec leur style de sous-titres.
              Sauf que la plupart des créateurs sérieux montent eux-mêmes, dans
              leur logiciel, à leur sauce.
            </p>

            <p>
              <strong>Trois :</strong> personne ne propose un tarif solo
              honnête entre 8 et 15 €/mois, sans piège. C&apos;est soit
              gratuit-mais-pourri, soit cher-pour-équipe.
            </p>

            <p>
              <strong>Quatre :</strong> le ton de l&apos;auteur n&apos;est
              jamais préservé dans la traduction. Une créatrice qui parle « cash
              » en français se retrouve avec un anglais lissé, neutre,
              corporate. Sa voix disparaît dans la traduction.
            </p>

            <p>
              <strong>Cinq :</strong> il n&apos;y a pas de support client
              humain en français. Tu envoies un email, tu reçois un template
              anglais 72 h plus tard, généré.
            </p>

            <p>
              Cinq trous. Sur un marché qui multiplie par douze en dix ans. Et
              le profil cible — créateur FR à 5-50k abonnés — est précisément
              celui qui passe sous le radar de tous les outils en place, qui
              visent soit la masse TikTok soit l&apos;entreprise.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Ce que Maxline est
            </h2>

            <p>
              Une seule chose, bien faite. C&apos;est tout. C&apos;est sec à
              dire mais c&apos;est la promesse :{" "}
              <strong>
                transcrire le français, traduire en anglais, sortir des
                sous-titres propres exportables vers les logiciels de montage
              </strong>{" "}
              — point.
            </p>

            <p>
              Au MVP : exports{" "}
              <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                .srt
              </code>
              ,{" "}
              <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                .vtt
              </code>{" "}
              et MP4 avec sous-titres incrustés. En version 1 (3 à 6 mois après
              le MVP) : ajout des exports{" "}
              <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                .fcpxml
              </code>{" "}
              pour DaVinci Resolve et{" "}
              <code className="text-base bg-neutral-100 px-1.5 py-0.5 rounded">
                .xml
              </code>{" "}
              pour Premiere Pro.
            </p>

            <p>
              Le tarif : <strong>12 €/mois</strong> pour 120 minutes de vidéo
              traitée, ou des packs de crédits (8 €, 22 €, 55 €) sans
              expiration pour les usages occasionnels. Première vidéo gratuite,
              5 minutes, sans carte bancaire demandée. Annulation en deux
              clics. Pas de clause d&apos;engagement de douze mois, pas de
              augmentation tarifaire surprise (clause grand-père pour les
              premiers inscrits).
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Ce que Maxline n&apos;est pas, et ne sera jamais
            </h2>

            <p>
              La discipline du non est plus importante que celle du oui.
              Voilà ce que je refuse de construire, et pourquoi.
            </p>

            <ul className="space-y-3 pl-6 list-disc marker:text-primary-500">
              <li>
                <strong>Pas de doublage avec voix clonée</strong> au MVP. C&apos;est
                techniquement faisable (ElevenLabs API, ~0,30 €/min) mais
                éthiquement bordélique et concurrentiellement perdant face à
                HeyGen. Peut-être en v2 si la demande est massive. Peut-être
                pas.
              </li>
              <li>
                <strong>Pas de lip-sync deepfake.</strong> Jamais. Coût GPU
                prohibitif, qualité encore médiocre, problème éthique réel
                (consentement, désinformation). Ce n&apos;est pas notre métier.
              </li>
              <li>
                <strong>Pas d&apos;éditeur vidéo intégré.</strong> Jamais. C&apos;est
                un autre métier, fait par d&apos;autres outils (DaVinci,
                Premiere, CapCut). On exporte vers eux, on ne les remplace pas.
              </li>
              <li>
                <strong>Pas d&apos;app mobile native</strong> avant la version
                3. La landing et l&apos;app web sont responsives dès le MVP, ça
                suffit pour 95 % des usages.
              </li>
              <li>
                <strong>Pas de plan gratuit illimité.</strong> Une version
                gratuite illimitée serait soit subventionnée par les payants
                (injuste), soit financée par la pub ou la revente de données
                (impensable). La première vidéo gratuite de 5 minutes est là
                pour montrer la qualité, c&apos;est tout.
              </li>
            </ul>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Pourquoi 12 €/mois et pas plus
            </h2>

            <p>
              J&apos;ai passé six heures à itérer sur le pricing avant de
              poser ce chiffre. Voilà la logique brute.
            </p>

            <p>
              Le coût variable par minute traitée, en self-hosted pur (Whisper
              transcription + OPUS-MT traduction sur Oracle Cloud Free), est{" "}
              <strong>proche de zéro</strong>. Maximum 0,015 € en cas de
              bascule cloud sur des pics. Avec 120 minutes incluses à 12 €, la
              marge brute est de l&apos;ordre de 96 %. C&apos;est confortable
              sans être indécent.
            </p>

            <p>
              À 7 ou 9 €/mois je serais en concurrence avec Captions (qui a
              une app mobile excellente et un budget marketing énorme) et je
              n&apos;aurais aucune marge pour absorber les utilisateurs
              intensifs. À 19 ou 24 € je me retrouverais dans le territoire de
              Rask et HeyGen, en face de produits plus matures, sans
              différenciation prix.
            </p>

            <p>
              12 €/mois, c&apos;est le point qui dit{" "}
              <em>« c&apos;est sérieux, mais c&apos;est juste »</em>. C&apos;est
              le prix d&apos;un abonnement Spotify Premium. C&apos;est ce que
              ma cible accepte de payer sans réfléchir.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Comment je vais construire ça
            </h2>

            <p>
              Seul. Pas par héroïsme, par contrainte : je n&apos;ai pas le
              budget pour embaucher, et je n&apos;ai pas envie de co-fonder
              avec quelqu&apos;un que je connaîtrais mal. La stack a été choisie
              pour qu&apos;un humain seul puisse l&apos;opérer : Next.js sur
              Vercel, Supabase pour l&apos;auth et la base, Cloudflare R2 pour
              le stockage des fichiers, et un worker Python sur Oracle Cloud
              Always Free pour Whisper et OPUS-MT.
            </p>

            <p>
              Le coût fixe d&apos;exploitation au démarrage :{" "}
              <strong>0 €/mois</strong>. Le seuil de rentabilité opérationnelle
              : <strong>un client payant</strong>. Ça change tout. Ça veut dire
              que ce projet ne peut pas faire faillite, et donc qu&apos;il peut
              prendre le temps de bien se construire au lieu de courir après la
              prochaine levée.
            </p>

            <p>
              Le plan d&apos;exécution est en 90 jours, jour par jour, avec
              des critères de succès chiffrés à mois 3, mois 6 et mois 9. Si
              à mois 9 j&apos;ai moins de 80 clients payants, je m&apos;assois
              une semaine pour décider si je continue, si je pivote, ou si je
              pause. C&apos;est documenté, c&apos;est public, c&apos;est ce qui
              m&apos;évitera de m&apos;entêter sur un truc qui ne marche pas.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              Ce que je promets, ce que je ne promets pas
            </h2>

            <p>
              <strong>Je promets</strong> de construire en public — code,
              décisions, chiffres bruts, doutes. Je promets une suppression
              automatique des vidéos à J+30 après traitement. Je promets que
              tes données ne serviront jamais à entraîner un modèle d&apos;IA.
              Je promets un support humain en français, sous 24 h. Je promets
              que si je dois augmenter les prix un jour, les premiers inscrits
              garderont le tarif d&apos;origine — clause grand-père, écrite
              dans les CGV.
            </p>

            <p>
              <strong>Je ne promets pas</strong> que ça va marcher. Je ne
              promets pas une qualité de traduction parfaite — la machine
              n&apos;est pas humaine, et l&apos;édition manuelle restera
              toujours utile pour les nuances. Je ne promets pas un MVP sans
              bug. Je ne promets pas que je ne ferai pas d&apos;erreurs.
            </p>

            <p>
              Mais je promets de les dire quand je les ferai. Et de les
              corriger.
            </p>

            <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 mt-16 mb-4">
              La suite
            </h2>

            <p>
              La landing pré-lancement est en ligne. Le MVP sort dans environ
              huit semaines. Entre les deux, je vais :
            </p>

            <ul className="space-y-3 pl-6 list-disc marker:text-primary-500">
              <li>
                Interviewer 8 créateurs français qui correspondent au persona
                Léa et Tom, pour valider mes hypothèses avant d&apos;écrire la
                première ligne de code produit.
              </li>
              <li>
                Mettre en place le worker Python sur Oracle Cloud Free, faire
                tourner Whisper et OPUS-MT en self-hosted, mesurer la qualité
                de bout en bout sur 20 vidéos test francophones.
              </li>
              <li>
                Construire le MVP en 7 semaines : auth, upload, pipeline,
                éditeur sous-titres, exports, paiement Stripe, dashboard.
              </li>
              <li>
                Ouvrir une beta privée à 30 testeurs, deux semaines avant le
                lancement public.
              </li>
              <li>
                Lancer publiquement un mardi, sur Product Hunt, X, LinkedIn,
                Reddit, simultanément.
              </li>
            </ul>

            <p>
              Si tu veux suivre tout ça — les bons jours et les mauvais — je
              raconterai chaque étape ici dans le journal, plus quelques posts
              X / LinkedIn. Tu peux aussi t&apos;inscrire à la waitlist sur la
              page d&apos;accueil, je préviens par email au lancement.
            </p>

            <p className="font-serif text-xl text-neutral-900 italic border-t border-neutral-200 pt-8 mt-12">
              Merci d&apos;avoir lu jusqu&apos;ici.
              <br />
              On se reparle bientôt.
            </p>

            <p className="text-base text-neutral-500 mt-4">— Maxence</p>
          </div>

          {/* CTA bas d'article */}
          <aside className="mt-20 bg-white border border-neutral-200 rounded-2xl p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Pré-lancement ouvert
              </span>
              <span className="h-px w-12 bg-primary-300" />
            </div>
            <h2 className="font-serif text-2xl md:text-3xl leading-tight text-neutral-900 mb-3">
              Suis la construction ou réserve ta place.
            </h2>
            <p className="text-neutral-700 mb-6">
              L&apos;inscription à la waitlist te donne l&apos;accès anticipé au
              MVP et le tarif d&apos;origine à vie, à 12 €/mois.
            </p>
            <Link
              href="/#subscribe"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-cream-50 font-medium px-6 py-3 rounded-lg transition-colors"
            >
              S&apos;inscrire à la waitlist
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </article>
      </main>
      <Footer />
    </>
  );
}
