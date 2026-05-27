import { Upload, Wand2, Download } from "lucide-react";
import { Reveal } from "@/components/reveal";

const steps = [
  {
    icon: Upload,
    title: "Uploadez votre vidéo",
    description:
      "MP4, MOV, AVI ou MKV. Glissez-déposez ou parcourez. Jusqu'à 30 minutes par vidéo.",
    accent: "01",
  },
  {
    icon: Wand2,
    title: "L'IA fait son travail",
    description:
      "Transcription française, traduction anglaise, alignement automatique. Environ 10 minutes pour 10 minutes de vidéo.",
    accent: "02",
  },
  {
    icon: Download,
    title: "Récupérez vos sous-titres",
    description:
      "Fichier .srt, .vtt, ou vidéo MP4 sous-titrée. Exportable vers DaVinci, Premiere ou directement publiable.",
    accent: "03",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="h-px w-12 bg-primary-300" />
              <span className="text-xs uppercase tracking-[0.2em] text-primary-600 font-semibold">
                Le processus
              </span>
              <span className="h-px w-12 bg-primary-300" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-tight">
              Trois étapes.
              <br />
              <em className="text-primary-600">Dix minutes.</em>
            </h2>
            <p className="mt-6 text-lg text-neutral-600">
              Pas plus. Pas moins. C&apos;est la promesse Maxline.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Ligne de connexion entre cards (desktop only) */}
          <div className="hidden md:block absolute top-32 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Reveal key={idx} delay={idx * 120}>
                <article className="group relative bg-cream-50 rounded-2xl p-8 border border-cream-100 hover:border-primary-300 transition-all duration-300 h-full lift-on-hover">
                  {/* Numéro en grand format serif */}
                  <div className="absolute top-6 right-6 font-serif text-5xl text-primary-200 group-hover:text-primary-300 transition-colors leading-none">
                    {step.accent}
                  </div>

                  <div className="h-14 w-14 rounded-sm bg-cream-50 border-2 border-neutral-900 group-hover:bg-primary-400 group-hover:border-primary-400 flex items-center justify-center mb-6 transition-all duration-300">
                    <Icon className="h-7 w-7 text-neutral-900 transition-colors" aria-hidden />
                  </div>

                  <h3 className="font-serif text-2xl text-neutral-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {step.description}
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
