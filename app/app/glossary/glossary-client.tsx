"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import {
  addGlossaryEntry,
  deleteGlossaryEntry,
  type GlossaryEntry,
} from "@/lib/glossary-actions";
import { LANG_OPTIONS, langShort, type Lang } from "@/lib/langs";

export function GlossaryClient({
  initialEntries,
}: {
  initialEntries: GlossaryEntry[];
}) {
  const [entries, setEntries] = useState<GlossaryEntry[]>(initialEntries);
  const [sourceTerm, setSourceTerm] = useState("");
  const [targetTerm, setTargetTerm] = useState("");
  const [sourceLang, setSourceLang] = useState<Lang>("fr");
  const [targetLang, setTargetLang] = useState<Lang>("en");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = () => {
    setError(null);
    startTransition(async () => {
      const res = await addGlossaryEntry({
        sourceTerm,
        targetTerm,
        sourceLang,
        targetLang,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur.");
        return;
      }
      // Recharge optimiste : on insère en tête (id provisoire remplacé au refresh).
      setEntries((prev) => [
        {
          id: `tmp-${Date.now()}`,
          source_term: sourceTerm.trim(),
          target_term: targetTerm.trim(),
          source_lang: sourceLang,
          target_lang: targetLang,
        },
        ...prev,
      ]);
      setSourceTerm("");
      setTargetTerm("");
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteGlossaryEntry(id);
      if (res.ok) setEntries((prev) => prev.filter((e) => e.id !== id));
      else setError(res.error ?? "Erreur.");
    });
  };

  return (
    <div>
      {/* Formulaire d'ajout */}
      <div className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-5 md:p-6 mb-8">
        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-1.5">
              Terme ({langShort(sourceLang)})
            </label>
            <input
              type="text"
              value={sourceTerm}
              onChange={(e) => setSourceTerm(e.target.value)}
              placeholder="ex. Maxline Studio"
              className="w-full h-10 px-3 rounded-sm border border-ivory-300 focus:border-rouge-500 focus:outline-none text-sm"
            />
          </div>
          <span className="pb-2.5 text-ink-300" aria-hidden>
            →
          </span>
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-1.5">
              Traduit par ({langShort(targetLang)})
            </label>
            <input
              type="text"
              value={targetTerm}
              onChange={(e) => setTargetTerm(e.target.value)}
              placeholder="ex. Maxline Studio"
              className="w-full h-10 px-3 rounded-sm border border-ivory-300 focus:border-rouge-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              De
            </span>
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSourceLang(o.id)}
                className={`px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
                  sourceLang === o.id
                    ? "border-rouge-500 bg-rouge-50 text-ink-900"
                    : "border-ivory-300 text-ink-600 hover:border-ink-400"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Vers
            </span>
            {LANG_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setTargetLang(o.id)}
                className={`px-2.5 py-1 rounded-sm border text-xs font-medium transition-colors ${
                  targetLang === o.id
                    ? "border-rouge-500 bg-rouge-50 text-ink-900"
                    : "border-ivory-300 text-ink-600 hover:border-ink-400"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={add}
            disabled={pending || !sourceTerm.trim() || !targetTerm.trim()}
            className="btn-pen text-sm ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            Ajouter
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-1.5 text-sm text-rouge-700"
          >
            <AlertCircle className="h-4 w-4" aria-hidden />
            {error}
          </p>
        )}
      </div>

      {/* Liste */}
      {entries.length === 0 ? (
        <p className="text-sm text-ink-500 text-center py-8">
          Aucune entrée pour l&apos;instant. Ajoutez votre premier terme
          ci-dessus.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 bg-ivory-50 border border-ivory-300 rounded-sm px-4 py-3"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400 w-16 shrink-0">
                {langShort(e.source_lang as Lang)} → {langShort(e.target_lang as Lang)}
              </span>
              <span className="font-medium text-ink-900 truncate">
                {e.source_term}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-ink-300 shrink-0" aria-hidden />
              <span className="text-ink-700 truncate flex-1">{e.target_term}</span>
              <button
                type="button"
                onClick={() => remove(e.id)}
                disabled={pending}
                aria-label={`Supprimer ${e.source_term}`}
                className="p-1.5 text-ink-400 hover:text-rouge-500 transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
