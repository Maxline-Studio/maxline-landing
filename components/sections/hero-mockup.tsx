"use client";

import { useEffect, useState } from "react";

/**
 * Mockup repensé : une page de cahier d'éditeur où la traduction FR→EN
 * se fait en direct, sous-titre par sous-titre. Chaque ligne FR est
 * rayée au stylo et la version EN apparaît en dessous.
 */
const ROWS = [
  { tc: "00:00:02", fr: "Salut, aujourd'hui on parle de...", en: "Hi, today we're talking about..." },
  { tc: "00:00:09", fr: "...comment traduire vos vidéos.", en: "...how to translate your videos." },
  { tc: "00:00:14", fr: "Et c'est plus simple que prévu.", en: "And it's easier than you'd think." },
];

export function HeroMockup() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % ROWS.length);
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      {/* Carte papier ivoire */}
      <div className="relative bg-ivory-50 border-2 border-ink-900 rounded-sm overflow-hidden shadow-[8px_8px_0_0_rgba(26,24,20,1)]">
        {/* En-tête de carnet */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-900 bg-ivory-100">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rouge-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-ivory-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-ivory-300" />
          </div>
          <span className="font-mono text-[10px] text-ink-500 uppercase tracking-widest">
            transcription · FR → EN
          </span>
        </div>

        {/* Page de cahier avec lignes */}
        <div className="relative px-6 py-8 min-h-[340px]" style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 31px, rgba(26,24,20,0.06) 31px, rgba(26,24,20,0.06) 32px)",
          backgroundSize: "100% 32px",
        }}>
          {/* Marge gauche rouge */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-rouge-500/30" aria-hidden />

          <div className="space-y-5 relative">
            {ROWS.map((row, i) => {
              const active = i === activeIdx;
              const past = i < activeIdx;
              return (
                <div key={i} className="flex gap-4 items-start">
                  {/* Timecode dans la marge */}
                  <span className="font-mono text-[10px] text-ink-400 pt-1 tabular-nums w-14 shrink-0">
                    {row.tc}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Ligne FR */}
                    <div
                      className={`text-[15px] leading-tight transition-colors duration-300 ${
                        active || past
                          ? "text-ink-400 pen-strike"
                          : "text-ink-900"
                      }`}
                    >
                      {row.fr}
                    </div>

                    {/* Ligne EN — apparaît en dessous, rouge correcteur */}
                    {(active || past) && (
                      <div className="mt-1 text-[15px] leading-tight font-medium text-rouge-500 italic font-display animate-fade-in">
                        ↳ {row.en}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pied de carte avec stats */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-900 bg-ivory-100 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          <span>3 segments · 10 secondes</span>
          <span className="text-rouge-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rouge-500 animate-pulse-soft" />
            corrigé en direct
          </span>
        </div>
      </div>

      {/* Annotation marginale flottante haut-droite */}
      <div className="absolute -top-4 -right-4 hidden sm:block bg-ink-900 text-ivory-50 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold rotate-3 shadow-lg">
        aperçu
      </div>

      {/* Stat flottante bas-gauche */}
      <div className="hidden lg:flex absolute -bottom-5 -left-5 bg-ivory-50 border-2 border-ink-900 px-4 py-3 items-center gap-3 rounded-sm shadow-[4px_4px_0_0_rgba(26,24,20,1)]">
        <div className="h-9 w-9 rounded-sm bg-rouge-500 flex items-center justify-center text-ivory-50 font-display font-black text-lg">
          ↻
        </div>
        <div>
          <p className="text-[10px] text-ink-500 font-mono uppercase tracking-widest">
            Temps moyen
          </p>
          <p className="text-sm font-display font-bold text-ink-900 tabular-nums">
            10 min → 10 min
          </p>
        </div>
      </div>
    </div>
  );
}
