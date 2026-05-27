import { Reveal } from "@/components/reveal";

/**
 * Manifeste — touche signature Maxline, en mode plaque slate.
 * Une grande phrase, encadrée comme un sous-titre, signée par le fondateur.
 */
export function Manifesto() {
  return (
    <section className="relative py-24 md:py-36 bg-cream-50 overflow-hidden">
      {/* Bande de pellicule top */}
      <div className="absolute top-0 inset-x-0 film-perforation opacity-50 pointer-events-none" />

      <div className="container mx-auto max-w-5xl px-4 md:px-6 lg:px-8 relative">
        {/* Label timecode */}
        <Reveal>
          <div className="flex items-center gap-3 mb-10">
            <span className="timecode-outline">
              <span className="h-1 w-1 rounded-full bg-primary-500" />
              [00:00] · NOTRE CONVICTION
            </span>
          </div>
        </Reveal>

        {/* Citation principale — encadrée comme un sous-titre */}
        <Reveal delay={100}>
          <blockquote className="relative">
            <p className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tighter text-neutral-900 max-w-4xl font-bold">
              Un créateur ne devrait pas avoir à choisir entre{" "}
              <span className="subtitle-highlight">faire</span> et{" "}
              <span className="subtitle-highlight">être vu</span>.
            </p>
          </blockquote>
        </Reveal>

        {/* Paragraphe manifeste */}
        <Reveal delay={250}>
          <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-8 md:gap-12 max-w-4xl">
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
              <p className="text-neutral-900 font-semibold text-xl">
                Pas un outil de plus. Un outil de moins —{" "}
                <span className="subtitle-highlight">
                  celui qu&apos;il fallait
                </span>
                .
              </p>
            </div>

            {/* Signature : encadré façon ID-card studio */}
            <div className="hidden md:flex flex-col items-start justify-end space-y-3 pl-8 border-l-2 border-neutral-900">
              <span className="timecode">
                FONDATEUR
              </span>
              <div className="font-display font-bold text-2xl text-neutral-900 mt-2">
                Maxence
              </div>
              <div className="text-sm text-neutral-600 leading-relaxed">
                Codeur, support client.
                <br />
                Tout à la fois.
              </div>
              <div className="mt-4 h-12 w-12 rounded-sm bg-neutral-900 border-2 border-primary-400 flex items-center justify-center">
                <span className="font-display font-extrabold text-primary-400 text-2xl leading-none">
                  M
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Bande de pellicule bottom */}
      <div className="absolute bottom-0 inset-x-0 film-perforation opacity-50 pointer-events-none" />
    </section>
  );
}
