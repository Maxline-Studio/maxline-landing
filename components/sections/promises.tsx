import { Shield, Lock, Heart, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/reveal";

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
    description: "Stockage et traitement en UE. RGPD natif, pas un sticker marketing.",
    code: "EU-01",
  },
  {
    icon: Heart,
    title: "Annulation 2 clics",
    description: "Pas d'engagement, pas de carte demandée pour essayer, pas de piège.",
    code: "EX-01",
  },
  {
    icon: MessageCircle,
    title: "Support humain en français",
    description: "Vous parlez à une vraie personne. Réponse sous 24 h ouvrées garantie.",
    code: "FR-01",
  },
];

export function Promises() {
  return (
    <section className="relative py-24 md:py-32 bg-cream-50 overflow-hidden">
      {/* Tape lines fond clair */}
      <div className="absolute inset-0 -z-0 tape-lines-light pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-6xl px-4 md:px-6 lg:px-8 relative">
        <Reveal>
          <div className="bg-neutral-900 text-cream-50 ink-surface rounded-sm border-2 border-neutral-900 relative overflow-hidden">
            {/* Pellicule top */}
            <div className="absolute top-0 inset-x-0 film-perforation-inverse opacity-30 pointer-events-none" />

            {/* Glow cobalt subtil */}
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  "radial-gradient(ellipse 50% 40% at 90% 100%, rgba(199, 255, 60, 0.10) 0%, transparent 65%)",
              }}
            />

            <div className="relative p-10 md:p-16">
              <div className="max-w-3xl mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className="timecode">
                    CH. 05 · ENGAGEMENTS
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                    inscrits dans les CGV
                  </span>
                </div>
                <h2 className="font-display font-extrabold text-3xl md:text-4xl lg:text-5xl text-cream-50 leading-[1.05] tracking-tighter">
                  Nos engagements,
                  <br />
                  <span className="slab">noir sur blanc</span>.
                </h2>
                <p className="mt-6 text-lg text-neutral-400">
                  Pas du marketing. Des promesses tenables.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-10">
                {promises.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <Reveal key={idx} delay={idx * 80}>
                      <div className="flex gap-5">
                        <div className="flex-shrink-0 h-12 w-12 rounded-sm bg-neutral-900 border-2 border-primary-400 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary-400" aria-hidden />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-mono text-[10px] text-primary-400 uppercase tracking-widest tabular-nums">
                              [{p.code}]
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-lg text-cream-50 mb-1.5">
                            {p.title}
                          </h3>
                          <p className="text-sm text-neutral-400 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>

            {/* Pellicule bas */}
            <div className="absolute bottom-0 inset-x-0 film-perforation-inverse opacity-30 pointer-events-none" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
