"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroMockup } from "@/components/sections/hero-mockup";

/**
 * Animation typo : le mot bascule de "english" à "anglais"
 * avec un highlight lime façon sous-titre.
 */
function TranslatingWord() {
  const [phase, setPhase] = useState<"initial" | "transitioning" | "final">(
    "initial",
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("transitioning"), 1300);
    const t2 = setTimeout(() => setPhase("final"), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <span className="relative inline-block">
      <span
        className="inline-block transition-all duration-500 subtitle-highlight"
        style={{
          opacity: phase === "transitioning" ? 0 : 1,
          transform:
            phase === "transitioning" ? "translateY(-12px)" : "translateY(0)",
          filter: phase === "transitioning" ? "blur(6px)" : "blur(0)",
        }}
      >
        {phase === "final" ? "anglais" : "english"}
      </span>
    </span>
  );
}

/**
 * Bande de timecodes qui défile en fond (motif signature Maxline).
 * Lisible mais discret — pour ancrer le métier subtil.
 */
function TimecodeStrip() {
  const timecodes = [
    "00:00:00",
    "00:00:12",
    "00:00:24",
    "00:00:36",
    "00:00:48",
    "00:01:00",
    "00:01:12",
    "00:01:24",
    "00:01:36",
    "00:01:48",
    "00:02:00",
    "00:02:12",
  ];
  // Dupliqué pour boucle infinie sans saut
  const loop = [...timecodes, ...timecodes];

  return (
    <div className="absolute top-0 inset-x-0 overflow-hidden border-b border-neutral-800/40 bg-neutral-900/95 z-10">
      <div className="timecode-marquee flex gap-12 py-2.5 whitespace-nowrap will-change-transform">
        {loop.map((tc, i) => (
          <span
            key={i}
            className="font-mono text-[10px] tracking-widest text-neutral-400 uppercase flex items-center gap-2"
          >
            <span className="h-1 w-1 rounded-full bg-primary-400" />
            {tc}
            <span className="text-neutral-600">/</span>
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

      {/* Pellicule en haut, juste sous la bande timecode */}
      <div className="absolute top-[42px] inset-x-0 film-perforation-inverse opacity-30 pointer-events-none" />

      {/* Background : lueur cobalt en haut à gauche, lueur lime en bas à droite */}
      <div
        className="absolute inset-0 -z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(30, 63, 255, 0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 45% at 85% 90%, rgba(199, 255, 60, 0.10) 0%, transparent 60%)",
        }}
      />

      {/* Grille subtile en fond */}
      <div
        className="absolute inset-0 -z-0 opacity-[0.07] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-28 pb-24 md:pt-32 md:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Colonne texte (7 colonnes sur grand écran) */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Label timecode signature */}
            <div className="flex items-center gap-3 mb-8 animate-fade-in">
              <span className="timecode">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse-soft" />
                REC · PRÉ-LANCEMENT
              </span>
              <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider">
                v.0 — beta
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter text-cream-50 leading-[0.95]">
              Vos vidéos
              <br />
              <span className="text-neutral-400">françaises,</span>
              <br />
              sous-titrées
              <br />
              en <TranslatingWord />.
            </h1>

            <p className="mt-10 text-lg md:text-xl text-neutral-300 leading-relaxed max-w-xl">
              L&apos;outil de sous-titrage vidéo pour créateurs YouTube et
              TikTok, en français, à{" "}
              <span className="font-semibold text-cream-50 font-mono tabular-nums">
                12&nbsp;€/mois
              </span>
              . Sans piège.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a
                href="#subscribe"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "group relative overflow-hidden",
                )}
              >
                <span className="relative z-10 flex items-center gap-2 font-bold">
                  Être prévenu du lancement
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 px-6 text-lg font-semibold text-cream-50 border border-neutral-700 hover:bg-neutral-800 rounded-md transition-colors"
              >
                Voir comment ça marche
              </a>
            </div>

            <p className="mt-6 text-sm text-neutral-500 font-mono tabular-nums">
              › aucune carte demandée · 1 vidéo de 5 min offerte au lancement
            </p>
          </div>

          {/* Mockup à droite (5 colonnes) */}
          <div className="lg:col-span-5">
            <HeroMockup />
          </div>
        </div>
      </div>

      {/* Pellicule bas du hero */}
      <div className="absolute bottom-0 inset-x-0 film-perforation-inverse opacity-30 pointer-events-none" />
    </section>
  );
}
