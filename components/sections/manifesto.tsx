import { Reveal } from "@/components/reveal";

/**
 * Section "Manifeste" — touche éditoriale qui démarque Maxline des landings SaaS standard.
 * Style magazine, beaucoup d'air, typo serif pour le contraste.
 */
export function Manifesto() {
  return (
    <section className="relative py-24 md:py-36 bg-cream-50 overflow-hidden">
      {/* Décor : ligne de citation à la marge */}
      <div className="absolute left-4 md:left-12 top-32 bottom-32 w-px bg-primary-300 hidden lg:block" />

      <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8 relative">
        {/* Label de section */}
        <Reveal>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
              Notre conviction
            </span>
            <span className="h-px w-12 bg-primary-300" />
          </div>
        </Reveal>

        {/* Citation principale */}
        <Reveal delay={100}>
          <blockquote className="relative">
            <p className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.15] text-neutral-900 max-w-4xl">
              Un créateur ne devrait pas avoir à choisir{" "}
              <em className="text-primary-600">entre faire</em> et{" "}
              <em className="text-primary-600">être vu</em>.
            </p>
          </blockquote>
        </Reveal>

        {/* Paragraphe manifeste */}
        <Reveal delay={250}>
          <div className="mt-12 md:mt-16 grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl">
            <div className="md:col-span-2 space-y-6 text-lg text-neutral-700 leading-relaxed">
              <p>
                Aujourd&apos;hui, un créateur français qui veut percer à
                l&apos;international a deux options&nbsp;: passer ses nuits à
                tout retraduire à la main, ou payer 50&nbsp;€ par vidéo à un
                freelance. Les deux tuent la spontanéité.
              </p>
              <p>
                Maxline Studio existe pour la troisième option. Celle qui
                respecte votre temps, votre voix, et votre budget.
              </p>
              <p className="text-neutral-900 font-medium">
                Pas un outil de plus. Un outil de moins —{" "}
                <span className="font-serif italic text-primary-600">
                  celui qu&apos;il fallait
                </span>
                .
              </p>
            </div>

            {/* Signature visuelle */}
            <div className="hidden md:flex flex-col items-start justify-end space-y-3 pl-8 border-l border-neutral-200">
              <div className="font-serif italic text-2xl text-neutral-900">
                Maxence
              </div>
              <div className="text-sm text-neutral-500">
                Fondateur, codeur,
                <br />
                support client.
                <br />
                Tout à la fois.
              </div>
              <div className="mt-4 h-12 w-12 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center">
                <span className="font-serif italic text-primary-700 text-xl">
                  M
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
