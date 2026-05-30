"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { HandUnderline } from "@/components/hand-underline";
import { HeroMockup } from "@/components/sections/hero-mockup";

/**
 * Animation typo : le mot "english" devient "anglais" en boucle.
 * Style : la version EN est rayée au stylo rouge, puis la version FR
 * apparaît dessous comme une correction.
 */
function TranslatingPair() {
  const [phase, setPhase] = useState<"english" | "transitioning" | "anglais">(
    "english",
  );

  useEffect(() => {
    const sequence = () => {
      // english visible → rayé → anglais arrive
      setTimeout(() => setPhase("transitioning"), 1800);
      setTimeout(() => setPhase("anglais"), 2400);
      // boucle
      setTimeout(() => setPhase("english"), 6000);
    };
    sequence();
    const interval = setInterval(sequence, 6000);
    return () => clearInterval(interval);
  }, []);

  if (phase === "anglais") {
    return (
      <span className="font-display italic font-light text-rouge-500 animate-fade-in">
        anglais
      </span>
    );
  }
  if (phase === "transitioning") {
    return (
      <span className="font-display italic font-light text-ink-900 pen-strike">
        english
      </span>
    );
  }
  return (
    <span className="font-display italic font-light text-ink-900">
      english
    </span>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-ivory-50 pt-16 pb-24 md:pt-24 md:pb-32"
    >
      {/* Grain papier en fond */}
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      {/* Lignes manuscrites discrètes en fond */}
      <div className="absolute inset-0 paper-lines pointer-events-none opacity-40" aria-hidden />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* ─── Texte ─── */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Headline — Fraunces, mix de droit et italique */}
            <h1 className="font-display font-medium text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.4rem] leading-[1.02] tracking-[-0.025em] text-ink-900">
              <span className="block">Vos vidéos</span>
              <span className="block">
                <HandUnderline variant="rouge" style="wavy">
                  françaises
                </HandUnderline>
                ,
              </span>
              <span className="block mt-2">sous-titrées</span>
              <span className="block">
                en <TranslatingPair />
                <span className="pen-caret" aria-hidden />
              </span>
            </h1>

            {/* Sous-titre / explication */}
            <p className="mt-10 text-lg md:text-xl text-ink-600 leading-relaxed max-w-xl">
              L&apos;outil de sous-titrage vidéo pour créateurs YouTube et
              TikTok, en français, à{" "}
              <span className="font-semibold text-ink-900 tabular-nums">
                12&nbsp;€/mois
              </span>
              . Sans piège.
            </p>
            <p className="mt-4 text-base text-ink-500 leading-relaxed max-w-xl">
              Aussi&nbsp;:{" "}
              <span className="font-medium text-ink-700">anglais → français</span>
              , et sous-titres dans la langue parlée (transcription — idéal pour
              l&apos;accessibilité).
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <a
                href="#subscribe"
                className="btn-pen group text-base"
              >
                Réserver mon accès
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </a>
              <a
                href="#how-it-works"
                className="btn-outline text-base"
              >
                Voir comment ça marche
              </a>
            </div>

            <p className="mt-6 text-sm text-ink-500 font-mono">
              › aucune carte demandée &middot; première vidéo offerte au lancement
            </p>
          </div>

          {/* ─── Mockup ─── */}
          <div className="lg:col-span-5">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
