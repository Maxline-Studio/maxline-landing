"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, FileText, Pencil, Download, X } from "lucide-react";

const DISMISS_KEY = "ml_onboarding_dismissed";

/**
 * Bannière d'accueil pour les nouveaux inscrits (affichée par le dashboard quand
 * l'utilisateur n'a encore aucune vidéo). Explique le parcours en 3 étapes et
 * les deux points d'entrée. Masquable (persistance localStorage) — ne réapparaît
 * pas une fois fermée, et le dashboard cesse de l'afficher dès la 1re vidéo.
 */
export function OnboardingBanner() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  };

  const steps = [
    {
      icon: Upload,
      title: "1 · Déposez",
      text: "Une vidéo (FR ou EN) ou un fichier de sous-titres déjà prêt.",
    },
    {
      icon: Pencil,
      title: "2 · Ajustez",
      text: "Relisez, corrigez chaque ligne, choisissez le style des sous-titres.",
    },
    {
      icon: Download,
      title: "3 · Exportez",
      text: "Fichiers .srt / .vtt / .txt, ou la vidéo MP4 sous-titrée.",
    },
  ];

  return (
    <div className="relative mb-10 bg-ivory-100 border-2 border-ink-900 rounded-sm p-6 md:p-8">
      <button
        onClick={dismiss}
        aria-label="Masquer le guide de démarrage"
        className="absolute top-3 right-3 p-1.5 text-ink-400 hover:text-ink-900 transition-colors"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <div className="flex items-center gap-3 mb-5">
        <span className="annotation">§ Bienvenue</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          première vidéo offerte
        </span>
      </div>

      <h2 className="font-display font-medium text-2xl md:text-3xl text-ink-900 leading-tight mb-6">
        Votre atelier est prêt.{" "}
        <span className="font-display italic font-light text-rouge-500">
          Trois étapes, c&apos;est tout.
        </span>
      </h2>

      <div className="grid sm:grid-cols-3 gap-5 mb-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="flex flex-col gap-2">
              <div className="inline-flex h-9 w-9 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center">
                <Icon className="h-4 w-4 text-ink-900" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="font-display font-semibold text-ink-900">{s.title}</p>
              <p className="text-sm text-ink-600 leading-relaxed">{s.text}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/app/upload" className="btn-pen text-sm">
          <Upload className="h-4 w-4" aria-hidden />
          Sous-titrer une vidéo
        </Link>
        <Link
          href="/app/translate-file"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ivory-50 border-2 border-ink-900 rounded-sm text-sm font-semibold text-ink-900 hover:bg-ink-900 hover:text-ivory-50 transition-colors"
        >
          <FileText className="h-4 w-4" aria-hidden />
          Traduire un fichier
        </Link>
      </div>
    </div>
  );
}
