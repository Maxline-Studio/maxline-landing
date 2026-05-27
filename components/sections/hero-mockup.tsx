"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";

// Animation : les sous-titres défilent, démontrant le produit en action
const SUBTITLES = [
  { fr: "Bonjour, aujourd'hui on parle de...", en: "Hello, today we're talking about..." },
  { fr: "...comment traduire vos vidéos.", en: "...how to translate your videos." },
  { fr: "Allons-y !", en: "Let's get started!" },
];

export function HeroMockup() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    // Cycle : 1.5s en français, transition de 0.5s, 1.5s en anglais, switch ligne
    const cycleMs = 3500;
    const timer = setInterval(() => {
      setShowTranslation((prev) => {
        if (prev) {
          // Switch to next subtitle when finishing English display
          setActiveIdx((idx) => (idx + 1) % SUBTITLES.length);
          return false;
        }
        return true;
      });
    }, cycleMs / 2);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative">
      {/* Mockup window */}
      <div
        className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 bg-neutral-900"
        role="img"
        aria-label="Aperçu de l'éditeur Maxline Studio en action"
      >
        {/* Topbar fenêtre */}
        <div className="absolute top-0 inset-x-0 h-10 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 gap-2 z-10">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-error-500" />
            <div className="h-3 w-3 rounded-full bg-warning-500" />
            <div className="h-3 w-3 rounded-full bg-success-500" />
          </div>
          <span className="ml-4 text-xs text-neutral-400 font-mono">
            maxlinestudio.fr/editor
          </span>
        </div>

        {/* Contenu mockup */}
        <div className="pt-10 p-6 grid grid-cols-3 gap-4 h-full bg-gradient-to-br from-neutral-800 to-neutral-900">
          {/* Video preview side */}
          <div className="col-span-2 bg-neutral-700/40 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
            {/* Play button */}
            <div className="h-16 w-16 rounded-full bg-primary-500/20 border-2 border-primary-400 flex items-center justify-center">
              <Play className="h-7 w-7 text-primary-400 fill-primary-400 ml-1" />
            </div>

            <p className="mt-3 text-xs text-neutral-400 font-mono">
              00:42 / 12:34
            </p>

            {/* Subtitle bar at the bottom of the video — animation key visuelle */}
            <div className="absolute bottom-4 inset-x-4 min-h-[44px] flex items-center justify-center">
              <div
                key={`${activeIdx}-${showTranslation}`}
                className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded text-white text-sm font-medium text-center max-w-full animate-fade-in"
              >
                {showTranslation
                  ? SUBTITLES[activeIdx]?.en
                  : SUBTITLES[activeIdx]?.fr}
              </div>
            </div>

            {/* Language indicator badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-neutral-900/80 backdrop-blur-sm rounded text-[10px] font-semibold text-cream-50 uppercase tracking-wider">
              {showTranslation ? "EN" : "FR"}
            </div>
          </div>

          {/* Subtitles list side */}
          <div className="space-y-2">
            {SUBTITLES.map((sub, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-md transition-all duration-300 ${
                  idx === activeIdx
                    ? "bg-primary-500/25 border-l-2 border-primary-400"
                    : "bg-neutral-700/40 border-l-2 border-transparent"
                }`}
              >
                <p
                  className={`text-[9px] font-mono mb-1 ${
                    idx === activeIdx ? "text-primary-300" : "text-neutral-500"
                  }`}
                >
                  00:0{idx} - 00:0{idx + 1}
                </p>
                <p
                  className={`text-xs leading-snug ${
                    idx === activeIdx ? "text-neutral-100" : "text-neutral-400"
                  }`}
                >
                  {showTranslation && idx === activeIdx
                    ? sub.en
                    : sub.fr}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticker flottant - z-20 pour passer au-dessus du mockup */}
      <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-20 bg-primary-500 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl rotate-3 ring-4 ring-cream-50/80">
        🚀 Prochainement
      </div>

      {/* Stats flottantes (preuve visuelle) */}
      <div className="hidden lg:flex absolute -bottom-6 -left-6 bg-white border border-neutral-200 rounded-xl shadow-xl px-5 py-3 items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-success-500/10 flex items-center justify-center">
          <span className="text-success-600 text-lg">✓</span>
        </div>
        <div>
          <p className="text-xs text-neutral-500 font-medium">Traitement moyen</p>
          <p className="text-sm font-bold text-neutral-900">~10 min pour 10 min</p>
        </div>
      </div>
    </div>
  );
}
