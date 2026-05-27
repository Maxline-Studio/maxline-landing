import { Upload, Wand2, Download } from "lucide-react";
import { Reveal } from "@/components/reveal";

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
      "Transcription française, traduction anglaise, alignement automatique. Environ 10 minutes pour 10 minutes de vidéo.",
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
      className="relative py-24 md:py-36 bg-neutral-900 text-cream-50 ink-surface overflow-hidden"
    >
      {/* Tape lines en fond */}
      <div className="absolute inset-0 -z-0 tape-lines pointer-events-none" aria-hidden />

      {/* Glow accent cobalt */}
      <div
        className="absolute inset-0 -z-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 30%, rgba(30, 63, 255, 0.10) 0%, transparent 65%)",
        }}
      />

      {/* Pellicule top */}
      <div className="absolute top-0 inset-x-0 film-perforation-inverse opacity-25 pointer-events-none" />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl mb-16 md:mb-24">
            <div className="flex items-center gap-3 mb-6">
              <span className="timecode">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse-soft" />
                CH. 01 · LE PROCESSUS
              </span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.0] text-cream-50">
              Trois étapes.
              <br />
              <span className="slab">Dix minutes.</span>
            </h2>
            <p className="mt-6 text-lg text-neutral-400 leading-relaxed max-w-xl">
              Pas plus. Pas moins. C&apos;est la promesse Maxline.
            </p>
          </div>
        </Reveal>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Reveal key={idx} delay={idx * 120}>
                <article className="group relative h-full bg-neutral-800/60 border border-neutral-700 hover:border-primary-400 rounded-sm transition-all duration-300 card-subtitle-bar overflow-hidden">
                  {/* Numéro géant en ink-slab */}
                  <div className="absolute top-0 right-0 bg-primary-400 text-neutral-900 px-3 py-1 font-mono font-extrabold text-xs tracking-widest">
                    {step.n}
                  </div>

                  <div className="p-8 md:p-10">
                    {/* Icône en slate */}
                    <div className="h-14 w-14 rounded-sm bg-neutral-900 border-2 border-primary-400 group-hover:bg-primary-400 group-hover:border-primary-400 flex items-center justify-center mb-8 transition-all duration-300">
                      <Icon
                        className="h-7 w-7 text-primary-400 group-hover:text-neutral-900 transition-colors"
                        aria-hidden
                      />
                    </div>

                    {/* Timecode */}
                    <div className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3 tabular-nums">
                      [ {step.timecode} ]
                    </div>

                    <h3 className="font-display text-2xl md:text-3xl font-bold text-cream-50 mb-4 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-neutral-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* Pellicule bas */}
      <div className="absolute bottom-0 inset-x-0 film-perforation-inverse opacity-25 pointer-events-none" />
    </section>
  );
}
