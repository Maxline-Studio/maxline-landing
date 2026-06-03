"use client";

import { useEffect, useState } from "react";

/**
 * Mockup : une page de cahier d'éditeur où la traduction se fait en direct,
 * sous-titre par sous-titre. La ligne source (FR) est rayée au stylo et la
 * traduction apparaît dessous — et la LANGUE CIBLE défile (FR → EN → ES → 中文
 * → 日本語 → العربية…), dans son écriture native, pour montrer toutes les langues.
 */
const TC = ["00:00:02", "00:00:09", "00:00:14"];
const SOURCE_FR = [
  "Salut, aujourd'hui on parle de...",
  "...comment traduire vos vidéos.",
  "Et c'est plus simple que prévu.",
];

const LANGS: { tag: string; rtl?: boolean; rows: [string, string, string] }[] = [
  {
    tag: "EN",
    rows: [
      "Hi, today we're talking about...",
      "...how to translate your videos.",
      "And it's easier than you'd think.",
    ],
  },
  {
    tag: "ES",
    rows: [
      "Hola, hoy hablamos de...",
      "...cómo traducir tus vídeos.",
      "Y es más fácil de lo que crees.",
    ],
  },
  {
    tag: "DE",
    rows: [
      "Hallo, heute geht es um...",
      "...wie du deine Videos übersetzt.",
      "Und es ist einfacher als gedacht.",
    ],
  },
  {
    tag: "IT",
    rows: [
      "Ciao, oggi parliamo di...",
      "...come tradurre i tuoi video.",
      "Ed è più semplice del previsto.",
    ],
  },
  {
    tag: "PT",
    rows: [
      "Olá, hoje vamos falar de...",
      "...como traduzir os teus vídeos.",
      "E é mais simples do que parece.",
    ],
  },
  {
    tag: "RU",
    rows: [
      "Привет, сегодня поговорим о...",
      "...как переводить ваши видео.",
      "И это проще, чем кажется.",
    ],
  },
  {
    tag: "ZH",
    rows: ["大家好，今天我们来聊聊…", "…如何翻译你的视频。", "其实比你想的更简单。"],
  },
  {
    tag: "JA",
    rows: ["こんにちは、今日のテーマは…", "…動画を翻訳する方法です。", "思ったより簡単なんです。"],
  },
  {
    tag: "AR",
    rtl: true,
    rows: [
      "مرحبًا، سنتحدث اليوم عن…",
      "…كيفية ترجمة مقاطع الفيديو.",
      "والأمر أسهل مما تظن.",
    ],
  },
];

export function HeroMockup() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [langIdx, setLangIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveIdx((i) => {
        const next = (i + 1) % SOURCE_FR.length;
        // Au bouclage des 3 lignes, on passe à la langue suivante.
        if (next === 0) setLangIdx((l) => (l + 1) % LANGS.length);
        return next;
      });
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const lang = LANGS[langIdx] ?? LANGS[0]!;

  return (
    <div className="relative">
      {/* Carte papier ivoire */}
      <div className="relative bg-ivory-50 border-2 border-ink-900 rounded-sm overflow-hidden shadow-[8px_8px_0_0_rgba(26,24,20,1)]">
        {/* En-tête de carnet */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-900 bg-ivory-100">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-rouge-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-ivory-300" />
            <div className="h-2.5 w-2.5 rounded-full bg-ivory-300" />
          </div>
          <span className="font-mono text-[10px] text-ink-500 uppercase tracking-widest tabular-nums">
            traduction · FR → {lang.tag}
          </span>
        </div>

        {/* Page de cahier avec lignes */}
        <div
          className="relative px-6 py-8 min-h-[340px]"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, transparent 31px, rgba(26,24,20,0.06) 31px, rgba(26,24,20,0.06) 32px)",
            backgroundSize: "100% 32px",
          }}
        >
          {/* Marge gauche rouge */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-rouge-500/30" aria-hidden />

          <div className="space-y-5 relative">
            {SOURCE_FR.map((fr, i) => {
              const active = i === activeIdx;
              const past = i < activeIdx;
              const revealed = active || past;
              return (
                <div key={i} className="flex gap-4 items-start">
                  {/* Timecode dans la marge */}
                  <span className="font-mono text-[10px] text-ink-400 pt-1 tabular-nums w-14 shrink-0">
                    {TC[i]}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Ligne source FR */}
                    <div
                      className={`text-[15px] leading-tight transition-colors duration-300 ${
                        revealed ? "text-ink-400 pen-strike" : "text-ink-900"
                      }`}
                    >
                      {fr}
                    </div>

                    {/* Traduction — apparaît dessous, rouge correcteur, écriture native */}
                    {revealed && (
                      <div
                        key={`${langIdx}-${i}`}
                        dir={lang.rtl ? "rtl" : undefined}
                        className="mt-1 text-[15px] leading-tight font-medium text-rouge-500 italic font-display animate-fade-in"
                      >
                        ↳ {lang.rows[i]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pied de carte avec stats */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-900 bg-ivory-100 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          <span>3 segments · 10 secondes</span>
          <span className="text-rouge-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-rouge-500 animate-pulse-soft" />
            corrigé en direct
          </span>
        </div>
      </div>

      {/* Annotation marginale flottante haut-droite */}
      <div className="absolute -top-4 -right-4 hidden sm:block bg-ink-900 text-ivory-50 px-3 py-1.5 rounded-sm font-mono text-[10px] uppercase tracking-widest font-bold rotate-3 shadow-lg">
        aperçu
      </div>

      {/* Stat flottante bas-gauche */}
      <div className="hidden lg:flex absolute -bottom-5 -left-5 bg-ivory-50 border-2 border-ink-900 px-4 py-3 items-center gap-3 rounded-sm shadow-[4px_4px_0_0_rgba(26,24,20,1)]">
        <div className="h-9 w-9 rounded-sm bg-rouge-500 flex items-center justify-center text-ivory-50 font-display font-black text-lg">
          ↻
        </div>
        <div>
          <p className="text-[10px] text-ink-500 font-mono uppercase tracking-widest">
            10 langues
          </p>
          <p className="text-sm font-display font-bold text-ink-900 tabular-nums">
            dans tous les sens
          </p>
        </div>
      </div>
    </div>
  );
}
