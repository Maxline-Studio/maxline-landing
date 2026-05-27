import { Globe2, FileCode2, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

const items = [
  {
    icon: Globe2,
    title: "Français natif",
    description:
      "Interface, support et ton 100 % en français. Pas une app US traduite — pensée pour vous dès le départ.",
    tag: "FR",
  },
  {
    icon: FileCode2,
    title: "Export montage propre",
    description:
      "Fichiers .srt et .vtt parfaitement timés. .fcpxml (DaVinci) et .xml (Premiere) en v1.",
    tag: ".srt",
  },
  {
    icon: Wallet,
    title: "Tarif transparent",
    description:
      "12 €/mois, point. Pas de minimum 2 sièges, pas de quota piégeux, annulation en 2 clics.",
    tag: "12€",
  },
];

export function Differentiators() {
  return (
    <section className="relative py-24 md:py-36 bg-ink-900 text-ivory-50 overflow-hidden">
      <div className="absolute inset-0 paper-grain-ink pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-3xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation-filled">§03 · Pourquoi Maxline</span>
            </div>
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ivory-50 leading-[1.05] tracking-[-0.02em]">
              Trois choses qu&apos;
              <span className="font-display italic font-light text-rouge-400">
                <HandUnderline variant="ivory" style="straight">
                  aucun concurrent
                </HandUnderline>
              </span>
              <br />
              ne fait aussi bien.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={idx} delay={idx * 120}>
                <article className="group relative h-full bg-ink-800 border border-ink-700 hover:border-rouge-500 transition-all duration-300 rounded-sm p-8 md:p-10 lift-on-hover">
                  {/* Tag haut-droite */}
                  <div className="absolute top-0 right-0 bg-rouge-500 text-ivory-50 px-3 py-1 font-mono font-bold text-[10px] tracking-widest uppercase">
                    {item.tag}
                  </div>

                  {/* Icône */}
                  <div className="h-12 w-12 rounded-sm bg-ink-900 border-2 border-rouge-500 group-hover:bg-rouge-500 flex items-center justify-center mb-8 transition-all duration-300">
                    <Icon
                      className="h-6 w-6 text-rouge-500 group-hover:text-ivory-50 transition-colors"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>

                  <h3 className="font-display font-semibold text-2xl text-ivory-50 mb-3 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-ink-300 leading-relaxed">
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
