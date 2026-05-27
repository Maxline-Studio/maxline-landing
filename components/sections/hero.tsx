import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroMockup } from "@/components/sections/hero-mockup";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32"
    >
      {/* Background gradient subtil */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-cream-50 to-cream-100/50"
        aria-hidden
      />

      {/* Pattern de "subtitles" en arrière-plan (lignes horizontales très discrètes) */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.025] pointer-events-none"
        aria-hidden
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 38px,
            #25241F 38px,
            #25241F 40px
          )`,
        }}
      />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Colonne texte */}
          <div className="max-w-2xl">
            <Badge variant="cream" className="mb-6">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>Lancement officiel à venir</span>
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-neutral-900 leading-[1.05]">
              Vos vidéos françaises,
              <br />
              sous-titrées en{" "}
              <span className="relative inline-block text-primary-500">
                anglais
                <svg
                  className="absolute -bottom-2 left-0 w-full"
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
                    opacity="0.6"
                  />
                </svg>
              </span>
              <br />
              en 10 minutes.
            </h1>

            <p className="mt-6 text-lg md:text-xl text-neutral-600 leading-relaxed max-w-xl">
              L&apos;outil de sous-titrage vidéo pour créateurs YouTube et TikTok,
              en français, à <span className="font-semibold text-neutral-800">12 €/mois</span>.
              Sans piège.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#subscribe"
                className={cn(buttonVariants({ variant: "primary", size: "lg" }))}
              >
                Être prévenu du lancement
                <ArrowRight className="h-5 w-5" aria-hidden />
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
