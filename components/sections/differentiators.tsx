import { Globe2, FileCode2, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";

const items = [
  {
    icon: Globe2,
    title: "Français natif",
    description:
      "Interface, support et ton 100 % en français. Pas une app US traduite — pensée pour vous dès le départ.",
    accent: "FR",
  },
  {
    icon: FileCode2,
    title: "Export montage propre",
    description:
      "Fichiers .srt et .vtt parfaitement timés. .fcpxml (DaVinci) et .xml (Premiere) en v1.",
    accent: ".srt",
  },
  {
    icon: Wallet,
    title: "Tarif transparent",
    description:
      "12 €/mois, point. Pas de minimum 2 sièges, pas de quota piégeux, annulation en 2 clics.",
    accent: "12€",
  },
];

export function Differentiators() {
  return (
    <section className="relative py-24 md:py-36 bg-cream-50 overflow-hidden">
      {/* M géant en watermark — ink très light */}
      <div
        aria-hidden
        className="absolute -right-20 top-1/2 -translate-y-1/2 font-display font-extrabold text-[24rem] text-neutral-900 leading-none pointer-events-none select-none opacity-[0.04]"
      >
        M
      </div>

      {/* Tape lines fond clair */}
      <div className="absolute inset-0 -z-0 tape-lines-light pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="timecode-cobalt">
                CH. 03 · POURQUOI MAXLINE
              </span>
            </div>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-[1.0] tracking-tighter">
              Trois choses qu&apos;
              <br />
              <span className="slab-cobalt">aucun concurrent</span>
              <br />
              ne fait aussi bien.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={idx} delay={idx * 100}>
                <article className="group relative h-full bg-white border border-neutral-200 hover:border-neutral-900 rounded-sm transition-all duration-300 card-subtitle-bar p-8 md:p-10">
                  {/* Accent tag haut-droite */}
                  <div className="absolute top-0 right-0 bg-neutral-900 text-primary-400 px-3 py-1 font-mono font-bold text-xs tracking-widest uppercase">
                    {item.accent}
                  </div>

                  {/* Icône en slate ink */}
                  <div className="h-14 w-14 rounded-sm bg-neutral-900 border-2 border-neutral-900 group-hover:bg-primary-400 group-hover:border-primary-400 flex items-center justify-center mb-8 transition-all duration-300">
                    <Icon
                      className="h-7 w-7 text-primary-400 group-hover:text-neutral-900 transition-colors"
                      aria-hidden
                    />
                  </div>

                  <h3 className="font-display font-bold text-2xl md:text-3xl text-neutral-900 mb-4 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-neutral-700 leading-relaxed">
                    {item.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
