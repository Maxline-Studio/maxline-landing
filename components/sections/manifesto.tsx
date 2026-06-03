import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

/**
 * Manifeste — la lettre de l'éditeur. Une citation manuscrite,
 * signée par le fondateur, avec le ton du correcteur attentif.
 */
export function Manifesto() {
  return (
    <section className="relative py-24 md:py-36 bg-ivory-100 border-y border-ivory-200 overflow-hidden">
      {/* Grain papier subtil */}
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="flex items-center gap-3 mb-10">
            <span className="annotation">§01 · Notre conviction</span>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <blockquote className="relative">
            <p className="font-display font-medium text-3xl md:text-5xl lg:text-[3.6rem] leading-[1.12] tracking-[-0.02em] text-ink-900 max-w-5xl">
              Un créateur ne devrait pas avoir à choisir entre{" "}
              <HandUnderline variant="rouge">faire</HandUnderline> et{" "}
              <HandUnderline variant="rouge">être vu</HandUnderline>.
            </p>
          </blockquote>
        </Reveal>

        <Reveal delay={250}>
          <div className="mt-16 md:mt-20 grid md:grid-cols-3 gap-10 md:gap-16 lg:gap-20 max-w-6xl">
            <div className="md:col-span-2 space-y-5 text-lg text-ink-700 leading-relaxed">
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
              <p className="text-ink-900 font-medium text-xl font-display italic">
                Pas un outil de plus. Un outil de moins —{" "}
                <HandUnderline variant="rouge" style="straight">
                  celui qu&apos;il fallait
                </HandUnderline>
                .
              </p>
            </div>

            {/* Signature — fiche éditeur */}
            <div className="hidden md:flex flex-col items-start justify-end space-y-3 pl-8 border-l-2 border-ink-900">
              <span className="annotation-filled">Fondateur</span>
              <div className="font-display italic text-3xl text-ink-900 mt-2 leading-none">
                Maxence
              </div>
              <div className="text-sm text-ink-600 leading-relaxed">
                Codeur, support client,
                <br />
                correcteur en chef.
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="font-display font-black text-2xl text-ink-900">M</span>
                <span className="h-2 w-2 rounded-full bg-rouge-500" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  studio
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
