import { Globe2, FileCode2, Wallet } from "lucide-react";
import { Reveal } from "@/components/reveal";

const items = [
  {
    icon: Globe2,
    title: "Français natif",
    description:
      "Interface, support et ton 100 % en français. Pas une app US traduite — pensée pour vous dès le départ.",
  },
  {
    icon: FileCode2,
    title: "Export montage propre",
    description:
      "Fichiers .srt et .vtt parfaitement timés. .fcpxml (DaVinci) et .xml (Premiere) en v1.",
  },
  {
    icon: Wallet,
    title: "Tarif transparent",
    description:
      "12 €/mois, point. Pas de minimum 2 sièges, pas de quota piégeux, annulation en 2 clics.",
  },
];

export function Differentiators() {
  return (
    <section className="py-24 md:py-32 bg-cream-50 relative overflow-hidden">
      {/* Décor : large M en arrière-plan, très subtil */}
      <div
        aria-hidden
        className="absolute -right-20 top-1/2 -translate-y-1/2 font-serif text-[24rem] text-primary-100 leading-none pointer-events-none select-none opacity-50"
      >
        M
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-2xl mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Pourquoi Maxline
              </span>
              <span className="h-px w-12 bg-primary-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-tight">
              Trois choses qu&apos;
              <em className="text-primary-600">aucun concurrent</em>
              <br />
              ne fait aussi bien.
            </h2>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Reveal key={idx} delay={idx * 100} direction={idx % 2 === 0 ? "up" : "up"}>
                <div className="group">
                  <div className="h-14 w-14 rounded-sm bg-cream-50 border-2 border-neutral-900 group-hover:bg-primary-400 group-hover:border-primary-400 flex items-center justify-center mb-6 transition-all duration-300">
                    <Icon className="h-7 w-7 text-neutral-900 transition-colors" aria-hidden />
                  </div>
                  <h3 className="font-serif text-3xl text-neutral-900 mb-4">
                    {item.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed text-lg">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
