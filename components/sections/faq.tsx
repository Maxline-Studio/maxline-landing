"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { HandUnderline } from "@/components/hand-underline";
import { faqs } from "@/lib/faq-data";

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
            <span className="annotation">§09 · FAQ</span>
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
