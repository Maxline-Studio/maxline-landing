"use client";

/**
 * File d'attente, bandeau affiché pendant qu'une vidéo attend son tour.
 *
 * Objectif : lever l'angoisse du « ça charge en boucle ». On montre (1) que
 * l'attente est NORMALE et partagée, (2) la POSITION réelle dans la file, (3)
 * un mot qui défile dans les 10 langues en écriture native, compréhensible
 * sans traduction, et cohérent avec l'animation multilingue de la landing.
 *
 * Le défilement est purement décoratif (aria-hidden) : les lecteurs d'écran
 * reçoivent une phrase stable en français. Respecte prefers-reduced-motion.
 */
import { useEffect, useState } from "react";

/** « En attente » dans les 10 langues supportées, en écriture native. */
const WAITING: { lang: string; word: string; rtl?: boolean }[] = [
  { lang: "fr", word: "En attente" },
  { lang: "en", word: "Waiting" },
  { lang: "es", word: "En espera" },
  { lang: "de", word: "In Warteschlange" },
  { lang: "it", word: "In attesa" },
  { lang: "pt", word: "Em espera" },
  { lang: "ru", word: "В очереди" },
  { lang: "zh", word: "排队中" },
  { lang: "ja", word: "待機中" },
  { lang: "ar", word: "في الانتظار", rtl: true },
];

/** Nombre max de jetons dessinés (au-delà, on résume « +N »). */
const MAX_DOTS = 8;

export function QueueStatus({ ahead }: { ahead: number | null }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Pas d'animation si l'utilisateur a demandé moins de mouvement.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const interval = setInterval(() => {
      // Fondu sortant, changement de mot, fondu entrant.
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % WAITING.length);
        setVisible(true);
      }, 260);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const current = WAITING[idx]!;
  const isNext = ahead === 0;
  const dots = ahead == null ? 0 : Math.min(ahead, MAX_DOTS);
  const overflow = ahead != null && ahead > MAX_DOTS ? ahead - MAX_DOTS : 0;

  // Phrase stable (lecteurs d'écran + repli si le comptage a échoué).
  const label =
    ahead == null
      ? "Votre vidéo est en attente de traitement."
      : isNext
        ? "Votre vidéo est la prochaine à être traitée."
        : `${ahead} vidéo${ahead > 1 ? "s" : ""} avant la vôtre dans la file.`;

  return (
    <div className="mt-5 pt-5 border-t border-ink-800">
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-300">
          File d&apos;attente
        </span>
        {/* Mot multilingue défilant, décoratif, compris de tous. */}
        <span
          aria-hidden
          dir={current.rtl ? "rtl" : undefined}
          lang={current.lang}
          className={`font-display text-base text-ivory-50/90 transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          {current.word}
          <span className="text-rouge-400">…</span>
        </span>
      </div>

      {/* Représentation visuelle : jetons devant vous + le vôtre (rouge). */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
        {Array.from({ length: dots }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="h-2.5 w-6 rounded-full bg-ink-700"
          />
        ))}
        {overflow > 0 && (
          <span
            aria-hidden
            className="font-mono text-[10px] text-ink-400 px-1 tabular-nums"
          >
            +{overflow}
          </span>
        )}
        {/* La vôtre : toujours visible, en accent, légèrement pulsée. */}
        <span
          aria-hidden
          className="h-2.5 w-10 rounded-full bg-rouge-500 animate-pulse-soft"
        />
      </div>

      <p className="text-sm text-ivory-50/80">
        {ahead == null ? (
          label
        ) : isNext ? (
          <>
            <strong className="font-semibold text-ivory-50">
              Votre vidéo est la prochaine.
            </strong>{" "}
            Le traitement démarre dans un instant.
          </>
        ) : (
          <>
            <strong className="font-semibold text-ivory-50 tabular-nums">
              {ahead} vidéo{ahead > 1 ? "s" : ""}
            </strong>{" "}
            avant la vôtre. Plusieurs vidéos sont traitées en parallèle,
            inutile de rafraîchir, la page se met à jour toute seule.
          </>
        )}
      </p>
      {/* Phrase stable pour les technologies d'assistance. */}
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </div>
  );
}
