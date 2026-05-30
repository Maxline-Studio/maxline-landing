import { Shield, Lock, Heart, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

const promises = [
  {
    icon: Lock,
    title: "Vos vidéos vous appartiennent",
    description:
      "Supprimées automatiquement sous 30 jours. Jamais utilisées pour entraîner une IA.",
    code: "RGPD-01",
  },
  {
    icon: Shield,
    title: "Hébergé en Europe",
    description:
      "Stockage et traitement en UE. RGPD natif, pas un sticker marketing.",
    code: "EU-01",
  },
  {
    icon: Heart,
    title: "Annulation 2 clics",
    description:
      "Pas d'engagement, pas de carte demandée pour essayer, pas de piège.",
    code: "EX-01",
  },
  {
    icon: MessageCircle,
    title: "Support humain en français",
    description:
      "Vous parlez à une vraie personne. Réponse sous 24 h ouvrées garantie.",
    code: "FR-01",
  },
];

export function Promises() {
  return (
    <section className="relative py-24 md:py-32 bg-ivory-50 overflow-hidden">
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="max-w-3xl mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§06 · Engagements</span>
              <span className="font-mono text-[11px] text-ink-500 uppercase tracking-widest">
                inscrits dans les CGV
              </span>
            </div>
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
              Nos engagements,
              <br />
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  noir sur blanc
                </HandUnderline>
              </span>
              .
            </h2>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              Pas du marketing. Des promesses tenables.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-x-10 lg:gap-x-16 gap-y-10">
          {promises.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Reveal key={idx} delay={idx * 80}>
                <div className="group flex gap-5">
                  <div className="flex-shrink-0 h-12 w-12 rounded-sm bg-ivory-100 border-2 border-ink-900 group-hover:bg-rouge-500 group-hover:border-rouge-500 flex items-center justify-center transition-all duration-300">
                    <Icon
                      className="h-6 w-6 text-ink-900 group-hover:text-ivory-50 transition-colors"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[10px] text-rouge-500 uppercase tracking-widest tabular-nums font-bold">
                        [{p.code}]
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-xl text-ink-900 mb-1.5">
                      {p.title}
                    </h3>
                    <p className="text-ink-600 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
