"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HandUnderline } from "@/components/hand-underline";
import { HeroMockup } from "@/components/sections/hero-mockup";

/**
 * Animation typo : la langue des sous-titres défile, l'une après l'autre, dans
 * son écriture native (english, español, deutsch, 中文, 日本語, العربية…).
 * Montre d'un coup d'œil que l'outil gère toutes les langues et tous les scripts.
 */
const TARGET_LANGS = [
  "english",
  "español",
  "deutsch",
  "italiano",
  "português",
  "русский",
  "中文",
  "日本語",
  "العربية",
] as const;

function CyclingLanguages() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const HOLD = 1900;
    const FADE = 420;
    const interval = setInterval(() => {
      setVisible(false); // fondu sortant
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % TARGET_LANGS.length);
        setVisible(true); // fondu entrant de la langue suivante
      }, FADE);
    }, HOLD + FADE);
    return () => clearInterval(interval);
  }, []);

  const lang = TARGET_LANGS[index];
  const isRtl = lang === "العربية";

  return (
    <span
      dir={isRtl ? "rtl" : undefined}
      className={`font-display italic font-light text-rouge-500 inline-block transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      {lang}
    </span>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-ivory-50 pt-16 pb-24 md:pt-24 md:pb-32"
    >
      {/* Grain papier en fond */}
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      {/* Lignes manuscrites discrètes en fond */}
      <div className="absolute inset-0 paper-lines pointer-events-none opacity-40" aria-hidden />

      <div className="relative container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* ─── Texte ─── */}
          <div className="lg:col-span-7 max-w-2xl">
            {/* Headline — Fraunces, mix de droit et italique */}
            <h1 className="font-display font-medium text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.4rem] leading-[1.02] tracking-[-0.025em] text-ink-900">
              <span className="block">Vos vidéos</span>
              <span className="block">
                <HandUnderline variant="rouge" style="wavy">
                  françaises
                </HandUnderline>
                ,
              </span>
              <span className="block mt-2">sous-titrées</span>
              <span className="block">
                en <CyclingLanguages />
                <span className="pen-caret" aria-hidden />
              </span>
            </h1>

            {/* Sous-titre / explication */}
            <p className="mt-10 text-lg md:text-xl text-ink-600 leading-relaxed max-w-xl">
              L&apos;outil de sous-titrage vidéo pour créateurs, artistes et
              vidéastes de tous horizons. En français, à{" "}
              <span className="font-semibold text-ink-900 tabular-nums">
                12&nbsp;€/mois
              </span>
              , sans engagement.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="btn-pen group text-base"
              >
                Créer mon atelier
                <ArrowRight
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
              <a
                href="#how-it-works"
                className="btn-outline text-base"
              >
                Voir comment ça marche
              </a>
            </div>

            <p className="mt-6 text-sm text-ink-500 font-mono">
              › première vidéo gratuite (&lt; 5 min) &middot; aucune carte demandée
            </p>
          </div>

          {/* ─── Mockup ─── */}
          <div className="lg:col-span-5">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
