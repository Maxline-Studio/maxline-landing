import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

/**
 * Le mot du fondateur — storytelling hybride : la marque Maxline Studio au
 * premier plan, et Maxence présent dans une lettre signée. Histoire réelle
 * (artisan indépendant du Valenciennois, déclic via proches, éthique, langue
 * native FR). La "carte d'artisan" remplace une photo (que l'on pourra ajouter
 * plus tard à la place du monogramme).
 */
const VALUES = ["Empathie", "Perfectionnisme", "Sens du service", "Éthique"];

export function Founder() {
  return (
    <section
      id="fondateur"
      className="relative py-24 md:py-36 bg-ivory-100 border-y border-ivory-200 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="flex items-center gap-3 mb-12">
            <span className="annotation">§07 · Le mot du fondateur</span>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-[1fr_1.7fr] gap-10 md:gap-16 items-start">
          {/* ─── Carte d'artisan ─── */}
          <Reveal delay={80}>
            <div className="md:sticky md:top-28">
              <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6 shadow-[6px_6px_0_0_rgba(26,24,20,0.9)]">
                {/* Monogramme (remplaçable par une photo) */}
                <div className="aspect-square rounded-sm bg-ink-900 flex items-center justify-center mb-5">
                  <div className="flex items-end gap-1">
                    <span className="font-display font-black text-6xl text-ivory-50 leading-none">
                      M
                    </span>
                    <span className="h-3 w-3 rounded-full bg-rouge-500 mb-2" />
                  </div>
                </div>

                <div className="font-display font-semibold text-2xl text-ink-900 leading-none">
                  Maxence
                </div>
                <div className="mt-2 text-sm text-ink-600 leading-relaxed">
                  Fondateur de Maxline Studio
                  <br />
                  Développeur indépendant
                </div>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Valenciennois · France
                </div>

                <div className="mt-5 pt-5 border-t border-ivory-200 flex flex-wrap gap-1.5">
                  {VALUES.map((v) => (
                    <span
                      key={v}
                      className="inline-block bg-ivory-100 border border-ivory-300 rounded-sm px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-ink-600"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* ─── La lettre ─── */}
          <Reveal delay={160}>
            <div>
              <h2 className="font-display font-medium text-3xl md:text-4xl lg:text-5xl text-ink-900 leading-[1.1] tracking-[-0.02em] mb-8">
                Derrière l&apos;outil, il y a{" "}
                <span className="font-display italic font-light">
                  <HandUnderline variant="rouge">un artisan</HandUnderline>
                </span>
                .
              </h2>

              <div className="space-y-5 text-lg text-ink-700 leading-relaxed">
                <p>
                  Je m&apos;appelle Maxence, j&apos;ai 31 ans et je suis
                  développeur indépendant dans le Valenciennois. J&apos;ai
                  longtemps travaillé pour des entreprises où je devais ranger
                  mes idées au placard. J&apos;ai fini par me lancer seul — pour
                  faire les choses à ma façon&nbsp;: avec soin, et avec mes
                  valeurs.
                </p>
                <p>
                  Autour de moi, beaucoup de créateurs. Et la même rengaine,
                  surtout chez ma femme et mes amis&nbsp;: écrire, tourner,
                  monter… puis y passer des heures de plus, juste pour tout
                  retraduire en anglais. Les solutions&nbsp;? Trop chères, ou
                  incapables de saisir le sens, le contexte, une expression bien
                  de chez nous.
                </p>
                <p>
                  Ça m&apos;a semblé injuste. Traduire, ce n&apos;est pas
                  remplacer des mots un par un — c&apos;est transmettre une
                  intention. Et pour bien rendre le français, encore faut-il le
                  parler vraiment&nbsp;: son jargon, ses tournures, son humour.
                  C&apos;est pourquoi Maxline est pensé et opéré depuis la
                  France, vos vidéos restent en Europe, et vos données ne seront{" "}
                  <HandUnderline variant="rouge" style="straight">
                    jamais revendues
                  </HandUnderline>
                  . Pas de grand groupe, pas de courtiers. Juste un artisan qui
                  tient à bien faire.
                </p>

                <blockquote className="!mt-10 border-l-2 border-rouge-500 pl-6">
                  <p className="font-display italic text-2xl md:text-3xl text-ink-900 leading-snug">
                    Je ne voulais pas un outil de plus. Je voulais celui que
                    j&apos;aurais aimé tendre à mes proches.
                  </p>
                </blockquote>

                <p className="!mt-10 text-ink-900 font-medium">
                  Si vous me confiez une vidéo, je la traite comme si
                  c&apos;était la mienne.
                </p>
              </div>

              {/* Signature manuscrite */}
              <div className="mt-8 flex items-end gap-4">
                <span className="font-signature text-5xl md:text-6xl text-ink-900 leading-none">
                  Maxence
                </span>
                <span className="mb-2 h-2.5 w-2.5 rounded-full bg-rouge-500" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
