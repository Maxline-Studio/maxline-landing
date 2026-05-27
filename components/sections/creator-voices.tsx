"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

/**
 * Section "Voix de créateurs" — élément structurel signature.
 *
 * Mockup : pour le pré-lancement, ce sont des persona-types et non
 * de vrais témoignages. À remplacer par de vrais quotes dès qu'on en aura.
 * Le ton et le mot "Persona" affichés en clair évitent toute confusion.
 */
type Voice = {
  channel: string;
  followers: string;
  vertical: string;
  quote: string;
  highlight: string;
  timecode: string;
  duration: string;
};

const VOICES: Voice[] = [
  {
    channel: "@lea.cooks",
    followers: "27 K abonnés",
    vertical: "Cuisine · YouTube long",
    quote:
      "Je passais 4 heures par vidéo à traduire à la main. Quatre heures que je préférais largement passer à filmer la suivante.",
    highlight: "4 heures par vidéo",
    timecode: "00:42",
    duration: "12:34",
  },
  {
    channel: "@tomruns",
    followers: "62 K abonnés",
    vertical: "Sport · TikTok Shorts",
    quote:
      "Pour des shorts de 60 secondes, payer un freelance c'est absurde. Mais sans traduction je perds 80 % de mon audience anglophone.",
    highlight: "80 % d'audience perdue",
    timecode: "00:08",
    duration: "00:59",
  },
  {
    channel: "@studio.romane",
    followers: "14 K abonnés",
    vertical: "Tutos design · YouTube",
    quote:
      "Les outils existants sortent un anglais lissé, corporate. Ma voix de créatrice disparaît dans la traduction. Et ça, c'est rédhibitoire.",
    highlight: "Ma voix disparaît",
    timecode: "01:12",
    duration: "08:21",
  },
  {
    channel: "@theo.builds",
    followers: "9 K abonnés",
    vertical: "Tech · YouTube",
    quote:
      "J'ai testé HeyGen, Rask, Captions. Trop cher pour un solo, interface anglaise partout, export montage à oublier. J'attendais un truc français.",
    highlight: "J'attendais un truc français",
    timecode: "02:24",
    duration: "15:42",
  },
];

export function CreatorVoices() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = VOICES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, 7000);
    return () => clearInterval(t);
  }, [paused, total]);

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  // VOICES est statique et non-vide, on coupe court à la vérification undefined.
  const active = VOICES[index] as Voice;

  return (
    <section
      id="voices"
      className="relative bg-neutral-900 text-cream-50 ink-surface py-24 md:py-36 overflow-hidden"
    >
      {/* Bande pellicule top */}
      <div className="absolute top-0 inset-x-0 film-perforation-inverse opacity-25 pointer-events-none" />

      {/* Background : grille subtile */}
      <div
        className="absolute inset-0 -z-0 opacity-[0.05] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative container mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        {/* Header de section */}
        <div className="max-w-3xl mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="timecode">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse-soft" />
              CH. 02 · VOIX DE CRÉATEURS
            </span>
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              · personas · pré-lancement
            </span>
          </div>

          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter leading-[1.05] text-cream-50">
            Ce que disent les{" "}
            <span className="text-primary-400">créateurs</span>{" "}
            qu&apos;on construit pour.
          </h2>

          <p className="mt-6 text-lg text-neutral-400 leading-relaxed max-w-2xl">
            Pas encore de vrais clients — la beta n&apos;est pas ouverte. Mais
            voilà les retours-types des huit créateurs interviewés pendant la
            phase de validation. Quatre profils, quatre douleurs, une seule
            réponse.
          </p>
        </div>

        {/* Frame vidéo principal */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Conteneur 16:9 façon écran vidéo */}
          <div className="relative aspect-[16/10] md:aspect-[16/8] bg-neutral-800 border-2 border-primary-400 rounded-sm overflow-hidden shadow-2xl">
            {/* Topbar éditeur */}
            <div className="absolute top-0 inset-x-0 h-9 bg-neutral-900 border-b border-neutral-700 flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-400" />
                </div>
                <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                  voices.maxlinestudio.fr — {active.channel}
                </span>
              </div>
              <span className="font-mono text-[10px] text-primary-400 tabular-nums tracking-widest">
                {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>

            {/* Frame contenu : grand quote stylé comme un sous-titre */}
            <div
              key={index}
              className="absolute inset-0 pt-9 flex flex-col justify-center px-6 md:px-16 lg:px-24 animate-slide-in-right"
            >
              {/* Métadonnées créateur — gauche */}
              <div className="flex flex-wrap items-center gap-3 mb-6 md:mb-8">
                <span className="timecode">
                  <Play className="h-3 w-3 fill-neutral-900" aria-hidden />
                  REC
                </span>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  {active.channel}
                </span>
                <span className="font-mono text-xs text-neutral-600">·</span>
                <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">
                  {active.followers}
                </span>
                <span className="font-mono text-xs text-neutral-600">·</span>
                <span className="font-mono text-xs text-cobalt-400 uppercase tracking-widest">
                  {active.vertical}
                </span>
              </div>

              {/* La quote elle-même */}
              <blockquote className="font-display text-2xl md:text-4xl lg:text-5xl leading-[1.15] tracking-tight text-cream-50 font-medium">
                &laquo;&nbsp;
                {active.quote.split(active.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="subtitle-highlight text-neutral-900 font-semibold">
                        {active.highlight}
                      </span>
                    )}
                  </span>
                ))}
                &nbsp;&raquo;
              </blockquote>

              {/* Timecode + duration : pied de frame, style éditeur */}
              <div className="absolute bottom-6 left-6 md:left-16 lg:left-24 right-6 md:right-16 lg:right-24 flex items-center justify-between font-mono text-xs text-neutral-500 uppercase tracking-widest">
                <span className="tabular-nums">
                  {active.timecode}{" "}
                  <span className="text-neutral-700">/</span>{" "}
                  <span className="text-neutral-400">{active.duration}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary-400 animate-pulse-soft" />
                  EN DIRECT
                </div>
              </div>

              {/* Barre de progression style timeline */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900/60">
                <div
                  className="h-full bg-primary-400 transition-all"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Contrôles de navigation */}
          <div className="mt-8 flex items-center justify-between gap-6">
            {/* Bullets */}
            <div className="flex gap-2">
              {VOICES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Aller au témoignage ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-12 bg-primary-400"
                      : "w-6 bg-neutral-700 hover:bg-neutral-600"
                  }`}
                />
              ))}
            </div>

            {/* Boutons prev/next */}
            <div className="flex gap-2">
              <button
                onClick={goPrev}
                aria-label="Précédent"
                className="h-11 w-11 flex items-center justify-center border border-neutral-700 hover:border-primary-400 hover:bg-neutral-800 rounded-sm transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-cream-50" aria-hidden />
              </button>
              <button
                onClick={goNext}
                aria-label="Suivant"
                className="h-11 w-11 flex items-center justify-center border border-neutral-700 hover:border-primary-400 hover:bg-neutral-800 rounded-sm transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-cream-50" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {/* Pied de section : honnêteté */}
        <p className="mt-16 text-center text-sm font-mono text-neutral-500 uppercase tracking-widest">
          [ note · les profils ci-dessus représentent les douleurs entendues
          pendant les interviews · pas de vrais clients à ce stade ]
        </p>
      </div>

      {/* Pellicule bas */}
      <div className="absolute bottom-0 inset-x-0 film-perforation-inverse opacity-25 pointer-events-none" />
    </section>
  );
}
