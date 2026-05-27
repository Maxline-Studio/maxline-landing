import { Upload, Wand2, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Uploadez votre vidéo",
    description:
      "MP4, MOV, AVI ou MKV. Glissez-déposez ou parcourez. Jusqu'à 30 minutes par vidéo.",
  },
  {
    icon: Wand2,
    title: "2. Notre IA fait le travail",
    description:
      "Transcription en français, traduction en anglais, alignement automatique de la timeline. Environ 10 minutes pour 10 minutes de vidéo.",
  },
  {
    icon: Download,
    title: "3. Récupérez vos sous-titres",
    description:
      "Fichier .srt, .vtt, ou vidéo MP4 avec sous-titres incrustés. Tout est exportable vers DaVinci, Premiere ou directement publiable.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
            Comment ça marche
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Trois étapes, dix minutes. Pas plus.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <article
                key={idx}
                className="bg-cream-50 rounded-2xl p-8 border border-cream-100 hover:border-primary-200 transition-colors"
              >
                <div className="h-14 w-14 rounded-xl bg-primary-100 flex items-center justify-center mb-6">
                  <Icon className="h-7 w-7 text-primary-600" aria-hidden />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
