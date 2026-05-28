"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HandUnderline } from "@/components/hand-underline";

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
      "Au lancement : français vers anglais uniquement (cible créateurs FR voulant percer à l'international). L'espagnol et l'allemand arriveront en v1 selon les retours utilisateurs.",
  },
  {
    question: "Y aura-t-il un doublage avec voix clonée ?",
    answer:
      "Pas au lancement (focus sur la qualité du sous-titrage). En v2 si la traction le justifie, avec ElevenLabs en backend et consentement vocal explicite. Pas de lip-sync deepfake, jamais.",
  },
  {
    question: "Comment fonctionne l'Atelier (système de fidélité) ?",
    answer:
      "Vos minutes utilisées s'accumulent à vie. Vous progressez dans 4 rangs — Apprenti, Correcteur, Éditeur en chef, Maître d'œuvre — et à chaque palier votre outil s'enrichit de fonctions, priorités et bonus offerts (minutes supplémentaires tous les 3 mois, bonus anniversaire, exports débloqués, etc.). Inclus dans tous les plans, sans frais. Aucun reset, jamais. Le système complet est documenté en transparence : seuils, mécaniques et calculs accessibles à tous.",
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
    <div className="border-b border-ivory-200 last:border-b-0">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`${id}-content`}
          id={`${id}-button`}
          className="w-full py-5 flex items-center justify-between gap-4 text-left transition-colors group focus-visible:outline-none"
        >
          <span className="font-display text-lg md:text-xl text-ink-900 group-hover:text-rouge-500 transition-colors">
            {question}
          </span>
          <span className="flex-shrink-0 h-8 w-8 rounded-sm border border-ink-900 flex items-center justify-center group-hover:bg-ink-900 group-hover:text-ivory-50 transition-colors">
            {isOpen ? (
              <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            ) : (
              <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            )}
          </span>
        </button>
      </h3>
      <div
        id={`${id}-content`}
        role="region"
        aria-labelledby={`${id}-button`}
        hidden={!isOpen}
        className="pb-6 pr-12"
      >
        <p className="text-ink-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative py-24 md:py-32 bg-ivory-50 overflow-hidden"
    >
      <div className="absolute inset-0 paper-grain pointer-events-none" aria-hidden />

      <div className="container mx-auto max-w-3xl px-4 md:px-6 lg:px-8 relative">
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="annotation">§07 · FAQ</span>
          </div>
          <h2 className="font-display font-medium text-4xl md:text-5xl lg:text-6xl text-ink-900 leading-[1.05] tracking-[-0.02em]">
            Questions
            <br />
            <span className="font-display italic font-light text-rouge-500">
              <HandUnderline variant="rouge" style="straight">
                fréquentes
              </HandUnderline>
            </span>
            .
          </h2>
          <p className="mt-6 text-lg text-ink-600">
            Tout ce qu&apos;il faut savoir avant de s&apos;inscrire.
          </p>
        </div>

        <div>
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

        <p className="mt-10 text-center text-sm text-ink-600">
          Une autre question ?{" "}
          <a
            href="mailto:contact@maxlinestudio.fr"
            className="link-pen"
          >
            Écrivez-nous
          </a>
        </p>
      </div>
    </section>
  );
}
