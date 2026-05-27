import { Shield, Lock, Heart, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/reveal";

const promises = [
  {
    icon: Lock,
    title: "Vos vidéos vous appartiennent",
    description:
      "Supprimées automatiquement sous 30 jours. Jamais utilisées pour entraîner une IA.",
  },
  {
    icon: Shield,
    title: "Hébergé en Europe",
    description: "Stockage et traitement en UE. RGPD natif, pas un sticker marketing.",
  },
  {
    icon: Heart,
    title: "Annulation 2 clics",
    description: "Pas d'engagement, pas de carte demandée pour essayer, pas de piège.",
  },
  {
    icon: MessageCircle,
    title: "Support humain en français",
    description: "Vous parlez à une vraie personne. Réponse sous 24 h ouvrées garantie.",
  },
];

export function Promises() {
  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="bg-primary-50 rounded-3xl p-10 md:p-16 border border-primary-100 relative overflow-hidden">
            {/* Décor coin */}
            <div
              aria-hidden
              className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary-100/60 blur-2xl pointer-events-none"
            />

            <div className="relative">
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-neutral-900 leading-tight">
                  Nos engagements,
                  <br />
                  <em className="text-primary-600">noir sur blanc</em>.
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  Pas du marketing. Des promesses tenables.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 max-w-4xl mx-auto">
                {promises.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <Reveal key={idx} delay={idx * 80}>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white border border-primary-200 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary-600" aria-hidden />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900 mb-1">
                            {p.title}
                          </h3>
                          <p className="text-sm text-neutral-600 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
