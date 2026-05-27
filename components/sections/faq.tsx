"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Quels formats vidéo sont supportés ?",
    answer:
      "Au lancement : MP4, MOV, AVI, MKV et WebM. Avec une limite de 1 Go et 30 minutes par vidéo en MVP. Ces limites évolueront selon les retours.",
  },
  {
    question: "Combien de temps faut-il pour une vidéo de 10 minutes ?",
    answer:
      "Environ 10 minutes, parfois moins. Notre pipeline (extraction audio → transcription → traduction → génération sous-titres → vidéo finale) est optimisé pour rester sous la durée de la vidéo elle-même.",
  },
  {
    question: "Mes vidéos sont-elles vraiment supprimées ?",
    answer:
      "Oui. Suppression automatique sous 30 jours par défaut (configurable à 7 ou 14 jours). Aucune donnée n'est conservée au-delà, et aucune n'est utilisée pour entraîner une IA. Hébergement en Europe.",
  },
  {
    question: "Puis-je annuler mon abonnement à tout moment ?",
    answer:
      "Oui, en 2 clics, sans démarche par email, sans frais. L'annulation prend effet à la fin de la période en cours. Vos crédits déjà achetés restent acquis sans expiration.",
  },
  {
    question: "Pourquoi Maxline Studio est moins cher que HeyGen ou Rask ?",
    answer:
      "Parce que nous sommes une équipe de 1 personne avec une infrastructure self-hosted minimaliste. Pas d'investisseurs à rémunérer, pas de bureaux à Manhattan. On vous facture le service, pas la levée de fonds.",
  },
  {
    question: "Quand le lancement officiel est-il prévu ?",
    answer:
      "Bêta privée prévue dans les prochaines semaines, lancement public officiel dans 2-3 mois. Inscrivez-vous pour être prévenu en priorité — les premiers inscrits auront un accès gratuit prolongé.",
  },
  {
    question: "Quelles langues seront supportées ?",
    answer:
      "Au lancement : français vers anglais uniquement (cible créateurs FR voulant percer à l'international). L'espagnol et l'allemand arriveront en v1 selon les retours utilisateurs. À terme, l'objectif est any-to-any.",
  },
  {
    question: "Y aura-t-il un doublage avec voix clonée ?",
    answer:
      "Pas au lancement (focus sur la qualité du sous-titrage). En v2 si la traction le justifie, avec ElevenLabs en backend et consentement vocal explicite. Pas de lip-sync deepfake, jamais.",
  },
];

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}

function FaqItem({ question, answer, isOpen, onToggle, id }: FaqItemProps) {
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
          id={`${id}-button`}
          className="w-full py-5 px-2 flex items-center justify-between gap-4 text-left hover:bg-cream-50 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500"
        >
          <span className="text-base md:text-lg font-semibold text-neutral-900">
            {question}
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-neutral-500 flex-shrink-0 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </h3>
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-button`}
        hidden={!isOpen}
        className="pb-5 px-2"
      >
        <p className="text-neutral-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 md:py-32 bg-white overflow-hidden">
      <div className="absolute inset-0 -z-0 tape-lines-light pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="timecode-cobalt">CH. 07 · FAQ</span>
          </div>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-neutral-900 leading-[1.0] tracking-tighter">
            Questions
            <br />
            <span className="slab-cobalt">fréquentes</span>.
          </h2>
          <p className="mt-6 text-lg text-neutral-700">
            Tout ce qu&apos;il faut savoir avant de s&apos;inscrire.
          </p>
        </div>

        <div className="bg-cream-50 rounded-sm border-2 border-neutral-900 px-6 md:px-8">
          {faqs.map((faq, idx) => (
            <FaqItem
              key={idx}
              id={`faq-${idx}`}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-neutral-700 font-mono uppercase tracking-widest">
          Une autre question ?{" "}
          <a
            href="mailto:contact@maxlinestudio.fr"
            className="text-cobalt-600 hover:text-cobalt-700 underline underline-offset-4 decoration-2 font-bold"
          >
            Écrivez-nous
          </a>
        </p>
      </div>
    </section>
  );
}
