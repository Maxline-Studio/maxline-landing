"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

type Voice = {
  channel: string;
  followers: string;
  vertical: string;
  quote: string;
  highlight: string;
};

const VOICES: Voice[] = [
  {
    channel: "@lea.cooks",
    followers: "27 K abonnés",
    vertical: "Cuisine · YouTube long",
    quote:
      "Je passais 4 heures par vidéo à traduire à la main. Quatre heures que je préférais largement passer à filmer la suivante.",
    highlight: "4 heures par vidéo",
  },
  {
    channel: "@tomruns",
    followers: "62 K abonnés",
    vertical: "Sport · TikTok Shorts",
    quote:
      "Pour des shorts de 60 secondes, payer un freelance c'est absurde. Mais sans traduction je perds 80 % de mon audience anglophone.",
    highlight: "80 % d'audience perdue",
  },
  {
    channel: "@studio.romane",
    followers: "14 K abonnés",
    vertical: "Design · YouTube",
    quote:
      "Les outils existants sortent un anglais lissé, corporate. Ma voix de créatrice disparaît dans la traduction. Et ça, c'est rédhibitoire.",
    highlight: "Ma voix disparaît",
  },
  {
    channel: "@theo.builds",
    followers: "9 K abonnés",
    vertical: "Tech · YouTube",
    quote:
      "J'ai testé HeyGen, Rask, Captions. Trop cher pour un solo, interface anglaise partout, export montage à oublier. J'attendais un truc français.",
    highlight: "un truc français",
  },
];

export function CreatorVoices() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = VOICES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 7500);
    return () => clearInterval(t);
  }, [paused, total]);

  const active = VOICES[index] as Voice;

  return (
    <section
      id="voices"
      className="relative py-24 md:py-36 bg-ivory-100 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="relative container mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mb-14 md:mb-16">
          <div className="flex items-center gap-3 mb-6">
            <span className="annotation">§04 · Voix de créateurs</span>
            <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
              personas · pré-lancement
            </span>
          </div>
          <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
            Ce que disent les{" "}
            <span className="font-display italic font-light text-rouge-500">
              créateurs
            </span>
            <br />
            qu&apos;on construit pour.
          </h2>
          <p className="mt-6 text-lg text-ink-600 leading-relaxed max-w-2xl">
            Pas encore de vrais clients — la beta n&apos;est pas ouverte. Voilà
            les retours-types des huit créateurs interviewés pendant la phase
            de validation. Quatre profils, quatre douleurs, une seule réponse.
          </p>
        </div>

        {/* Carte témoignage façon fiche cartonnée */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            key={index}
            className="relative bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-14 lg:p-16 shadow-[8px_8px_0_0_rgba(26,24,20,1)] animate-slide-in-right"
          >
            {/* Numéro fiche */}
            <div className="absolute top-0 left-0 bg-ink-900 text-ivory-50 px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase">
              N° {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </div>

            {/* Tag rouge en haut-droite : "vérifié interview" */}
            <div className="absolute top-0 right-0 bg-rouge-500 text-ivory-50 px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase">
              ✓ interviewé
            </div>

            {/* Métadonnées créateur */}
            <div className="flex flex-wrap items-center gap-3 mb-8 mt-4">
              <span className="font-mono text-xs text-ink-700 uppercase tracking-widest font-bold">
                {active.channel}
              </span>
              <span className="text-ink-300">·</span>
              <span className="font-mono text-xs text-ink-500 uppercase tracking-widest">
                {active.followers}
              </span>
              <span className="text-ink-300">·</span>
              <span className="font-mono text-xs text-encre-500 uppercase tracking-widest">
                {active.vertical}
              </span>
            </div>

            {/* Quote géant Fraunces */}
            <div className="relative">
              <Quote
                className="absolute -left-2 -top-3 h-10 w-10 text-rouge-500/20"
                strokeWidth={1.5}
                aria-hidden
              />
              <blockquote className="font-display text-2xl md:text-3xl lg:text-[2.4rem] leading-[1.25] tracking-[-0.015em] text-ink-900 italic font-light pl-10">
                {active.quote.split(active.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="not-italic font-medium highlighter text-ink-900">
                        {active.highlight}
                      </span>
                    )}
                  </span>
                ))}
              </blockquote>
            </div>
          </div>

          {/* Contrôles */}
          <div className="mt-10 flex items-center justify-between gap-6">
            <div className="flex gap-2">
              {VOICES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Aller au témoignage ${i + 1}`}
                  className={`h-1 rounded-full transition-all ${
                    i === index ? "w-12 bg-rouge-500" : "w-6 bg-ink-300 hover:bg-ink-500"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIndex((i) => (i - 1 + total) % total)}
                aria-label="Précédent"
                className="h-11 w-11 flex items-center justify-center border-2 border-ink-900 hover:bg-ink-900 hover:text-ivory-50 text-ink-900 rounded-sm transition-colors"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                onClick={() => setIndex((i) => (i + 1) % total)}
                aria-label="Suivant"
                className="h-11 w-11 flex items-center justify-center border-2 border-ink-900 hover:bg-ink-900 hover:text-ivory-50 text-ink-900 rounded-sm transition-colors"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-14 text-center text-xs font-mono text-ink-500 uppercase tracking-widest">
          [ profils représentatifs des huit interviews · pas de vrais clients à ce stade ]
        </p>
      </div>
    </section>
  );
}
