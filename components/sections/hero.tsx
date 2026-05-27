"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroMockup } from "@/components/sections/hero-mockup";

/**
 * Word qui se "traduit" en direct.
 * Cycle : "english" → fade → "anglais" → reste.
 */
function TranslatingWord() {
  const [phase, setPhase] = useState<"initial" | "transitioning" | "final">(
    "initial",
  );

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("transitioning"), 1100);
    const t2 = setTimeout(() => setPhase("final"), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <span className="relative inline-block text-primary-500">
      <span
        className="inline-block transition-all duration-500"
        style={{
          opacity: phase === "transitioning" ? 0 : 1,
          transform:
            phase === "transitioning" ? "translateY(-12px)" : "translateY(0)",
          filter: phase === "transitioning" ? "blur(6px)" : "blur(0)",
        }}
      >
        {phase === "final" ? "anglais" : "english"}
      </span>
      <svg
        className="absolute -bottom-2 left-0 w-full pointer-events-none"
        height="10"
        viewBox="0 0 200 10"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M2 7 Q 50 1, 100 5 T 198 4"
          stroke="#C46A45"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
          style={{
            strokeDasharray: 200,
            strokeDashoffset: phase === "final" ? 0 : 200,
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1) 0.4s",
          }}
        />
      </svg>
    </span>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32"
    >
      {/* Background : aurora gradient subtle */}
      <div
        className="absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(196, 106, 69, 0.12) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 80% 100%, rgba(228, 213, 172, 0.4) 0%, transparent 60%), linear-gradient(180deg, #FAF7F1 0%, #FAF7F1 100%)",
        }}
      />

      {/* Grain texture overlay — donne du caractère */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none mix-blend-multiply"
        aria-hidden
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Colonne texte */}
          <div className="max-w-2xl">
            <Badge variant="cream" className="mb-6 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>Lancement officiel à venir</span>
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 leading-[1.05]">
              Vos vidéos françaises,
              <br />
              sous-titrées en{" "}
              <TranslatingWord />
              <br />
              en{" "}
              <span className="relative inline-block">
                <span className="font-serif italic font-normal text-primary-600">
                  10 minutes
                </span>
                <span className="text-neutral-900">.</span>
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-neutral-600 leading-relaxed max-w-xl">
              L&apos;outil de sous-titrage vidéo pour créateurs YouTube et TikTok,
              en français, à{" "}
              <span className="font-semibold text-neutral-800">12 €/mois</span>.
              Sans piège.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#subscribe"
                className={cn(
                  buttonVariants({ variant: "primary", size: "lg" }),
                  "group relative overflow-hidden",
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Être prévenu du lancement
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden />
                </span>
                {/* Shine effect at hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
              </a>
              <a
                href="#how-it-works"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
              >
                Voir comment ça marche
              </a>
            </div>

            <p className="mt-4 text-sm text-neutral-500">
              Aucune carte demandée · 1 vidéo de 5 min offerte au lancement
            </p>
          </div>

          {/* Mockup interactif animé */}
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
