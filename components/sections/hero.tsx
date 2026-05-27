import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32"
    >
      {/* Décor de fond (subtil) */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-cream-50 to-cream-100/50"
        aria-hidden
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
              <span className="text-primary-500">anglais</span>
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

          {/* Colonne visuelle (preview) */}
          <div className="relative">
            <div
              className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 bg-neutral-900"
              role="img"
              aria-label="Aperçu de l'éditeur Maxline Studio"
            >
              {/* Mockup interface */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900">
                {/* Topbar */}
                <div className="absolute top-0 inset-x-0 h-10 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 gap-2">
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
                <div className="pt-10 p-6 grid grid-cols-3 gap-4 h-full">
                  <div className="col-span-2 bg-neutral-700/50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="h-16 w-16 mx-auto rounded-full bg-primary-500/20 border-2 border-primary-400 flex items-center justify-center">
                        <div className="h-0 w-0 border-l-[12px] border-l-primary-400 border-y-8 border-y-transparent ml-1" />
                      </div>
                      <p className="mt-3 text-xs text-neutral-400 font-mono">
                        00:42 / 12:34
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-neutral-700/50 p-3 rounded-md">
                      <p className="text-[10px] text-neutral-500 font-mono mb-1">
                        00:00 - 00:03
                      </p>
                      <p className="text-xs text-neutral-300">
                        Hello everyone, today we&apos;re...
                      </p>
                    </div>
                    <div className="bg-primary-500/20 border-l-2 border-primary-400 p-3 rounded-md">
                      <p className="text-[10px] text-primary-300 font-mono mb-1">
                        00:03 - 00:07
                      </p>
                      <p className="text-xs text-neutral-200">
                        ...how to translate your videos.
                      </p>
                    </div>
                    <div className="bg-neutral-700/50 p-3 rounded-md">
                      <p className="text-[10px] text-neutral-500 font-mono mb-1">
                        00:07 - 00:10
                      </p>
                      <p className="text-xs text-neutral-300">
                        Let&apos;s get started!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticker flottant */}
            <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 bg-primary-500 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg rotate-3">
              🚀 Prochainement
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
