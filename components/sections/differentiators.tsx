import { Globe2, FileCode2, Wallet } from "lucide-react";

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
      "Fichiers .srt et .vtt parfaitement timés. .fcpxml (DaVinci) et .xml (Premiere) en v1. Aucun concurrent grand public ne le fait bien.",
  },
  {
    icon: Wallet,
    title: "Tarif transparent",
    description:
      "12 €/mois, point. Pas de minimum 2 sièges, pas de quota piégeux, annulation en 2 clics. Vos crédits sans expiration.",
  },
];

export function Differentiators() {
  return (
    <section className="py-20 md:py-28 bg-cream-50">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
            Pourquoi Maxline Studio
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Trois choses qu&apos;aucun concurrent ne fait aussi bien.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="text-center md:text-left">
                <div className="h-12 w-12 rounded-lg bg-white border border-primary-200 flex items-center justify-center mb-5 mx-auto md:mx-0">
                  <Icon className="h-6 w-6 text-primary-600" aria-hidden />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
