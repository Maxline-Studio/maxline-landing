import { Upload, Wand2, Download } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { HandUnderline } from "@/components/hand-underline";

const steps = [
  {
    n: "01",
    icon: Upload,
    title: "Uploadez votre vidéo",
    description:
      "MP4, MOV, AVI ou MKV. Glissez-déposez ou parcourez. Jusqu'à 30 minutes par vidéo.",
    timecode: "00:00 → 00:10",
  },
  {
    n: "02",
    icon: Wand2,
    title: "L'IA fait son travail",
    description:
      "Transcription dans la langue parlée, traduction si besoin, alignement automatique. Environ 10 minutes pour 10 minutes de vidéo.",
    timecode: "00:10 → 10:00",
  },
  {
    n: "03",
    icon: Download,
    title: "Récupérez vos sous-titres",
    description:
      ".srt, .vtt, ou MP4 sous-titré. Exportable vers DaVinci, Premiere ou directement publiable.",
    timecode: "10:00 → 10:10",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-36 bg-ivory-50 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-16 md:mb-20">
            <div className="flex items-center gap-3 mb-6">
              <span className="annotation">§02 · Le procédé</span>
            </div>
            <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
              Trois étapes.
              <br />
              <span className="font-display italic font-light text-rouge-500">
                <HandUnderline variant="rouge" style="straight">
                  Dix minutes
                </HandUnderline>
                .
              </span>
            </h2>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed max-w-xl">
              Pas plus. Pas moins. C&apos;est la promesse Maxline.
            </p>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Reveal key={idx} delay={idx * 120}>
                <article className="group relative h-full bg-ivory-100 border border-ivory-200 hover:border-ink-900 transition-all duration-300 rounded-sm card-annotated p-8 md:p-10">
                  {/* Grand numéro en Fraunces italique */}
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="font-display italic font-light text-7xl text-ink-900/15 leading-none tabular-nums group-hover:text-rouge-500/30 transition-colors duration-300">
                      {step.n}
                    </span>
                    <div className="h-12 w-12 rounded-sm bg-ivory-50 border-2 border-ink-900 group-hover:bg-rouge-500 group-hover:border-rouge-500 flex items-center justify-center transition-all duration-300">
                      <Icon
                        className="h-6 w-6 text-ink-900 group-hover:text-ivory-50 transition-colors"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </div>
                  </div>

                  <div className="font-mono text-[10px] text-ink-500 uppercase tracking-widest mb-4 tabular-nums">
                    [ {step.timecode} ]
                  </div>

                  <h3 className="font-display font-semibold text-2xl text-ink-900 mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-ink-600 leading-relaxed">
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
