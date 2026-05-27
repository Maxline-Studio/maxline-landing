"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroMockup } from "@/components/sections/hero-mockup";

/**
 * Animation typo : bascule "english" → "anglais" en boucle continue.
 * Le mot est surligné en bloc lime ink — signature visuelle Maxline.
 */
function TranslatingWord() {
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowFinal((p) => !p);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-flex items-center">
      <span
        key={showFinal ? "anglais" : "english"}
        className="slab animate-fade-in inline-block"
        style={{ minWidth: "4.5ch" }}
      >
        {showFinal ? "anglais" : "english"}
      </span>
    </span>
  );
}

/**
 * Bande de timecodes qui défile en haut du hero.
 * Évoque la timeline d'un éditeur vidéo, sans imiter Linear/Vercel.
 */
function TimecodeStrip() {
  const tcs = [
    "00:00:00", "00:00:12", "00:00:24", "00:00:36", "00:00:48",
    "00:01:00", "00:01:12", "00:01:24", "00:01:36", "00:01:48",
    "00:02:00", "00:02:12",
  ];
  const loop = [...tcs, ...tcs];

  return (
    <div className="absolute top-0 inset-x-0 overflow-hidden bg-neutral-900 border-b border-neutral-800 z-10">
      <div className="timecode-marquee flex gap-12 py-2.5 whitespace-nowrap will-change-transform">
        {loop.map((tc, i) => (
          <span
            key={i}
            className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase flex items-center gap-2 shrink-0"
          >
            <span className="h-1 w-1 rounded-full bg-primary-400" />
            <span className="tabular-nums">{tc}</span>
            <span className="text-neutral-700">/</span>
            <span className="text-primary-400">FR → EN</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-neutral-900 text-cream-50 ink-surface"
    >
      <TimecodeStrip />

      {/* Tape lines — remplace la grille. Lignes horizontales discrètes. */}
      <div className="absolute inset-0 -z-0 tape-lines pointer-events-none" aria-hidden />

      {/* Glow ambient : cobalt en haut-gauche, lime en bas-droite */}
      <div
        className="absolute inset-0 -z-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 12% 8%, rgba(30, 63, 255, 0.20) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 88% 95%, rgba(199, 255, 60, 0.13) 0%, transparent 65%)",
        }}
      />

      {/* Pellicule top */}
      <div className="absolute top-[42px] inset-x-0 film-perforation-inverse opacity-25 pointer-events-none" />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-28 pb-24 md:pt-32 md:pb-36">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Texte */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Label REC */}
            <div className="flex items-center gap-3 mb-10 animate-fade-in">
              <span className="timecode">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse-soft" />
                REC · PRÉ-LANCEMENT
              </span>
              <span className="font-mono text-[11px] text-neutral-500 uppercase tracking-widest">
                v.0 — beta dans 8 semaines
              </span>
            </div>

            {/* Headline — typo display, caret clignotant à la fin */}
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tighter text-cream-50 leading-[0.95]">
              <span className="block">Vos vidéos</span>
              <span className="block text-neutral-500">françaises,</span>
              <span className="block">sous-titrées</span>
              <span className="block">
                en <TranslatingWord />
                <span className="caret" aria-hidden />
              </span>
            </h1>

            {/* Sous-titre — texte simple lisible */}
            <p className="mt-10 text-lg md:text-xl text-neutral-300 leading-relaxed max-w-xl">
              L&apos;outil de sous-titrage vidéo pour créateurs YouTube et
              TikTok, en français, à{" "}
              <span className="font-bold text-cream-50 font-mono tabular-nums">
                12&nbsp;€/mois
              </span>
              . Sans piège.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a
                href="#subscribe"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "group relative overflow-hidden font-bold",
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Être prévenu du lancement
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 px-6 text-lg font-semibold text-cream-50 border border-neutral-700 hover:border-primary-400 hover:bg-neutral-800 rounded-md transition-colors"
              >
                Voir comment ça marche
              </a>
            </div>

            <p className="mt-6 text-sm text-neutral-500 font-mono tabular-nums">
              › aucune carte demandée · 1 vidéo de 5 min offerte au lancement
            </p>
          </div>

          {/* Mockup */}
          <div className="lg:col-span-5">
            <HeroMockup />
          </div>
        </div>
      </div>

      {/* Pellicule bas */}
      <div className="absolute bottom-0 inset-x-0 film-perforation-inverse opacity-25 pointer-events-none" />
    </section>
  );
}
