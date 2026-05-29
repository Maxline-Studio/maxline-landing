"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { REFERRAL_BONUS_MINUTES } from "@/lib/atelier";

/**
 * Carte de parrainage : affiche le lien personnel et permet de le copier.
 * Le crédit des minutes intervient quand l'invité passe à un plan payant.
 */
export function ReferralCard({
  code,
  validatedCount,
  pendingCount,
}: {
  code: string;
  validatedCount: number;
  pendingCount: number;
}) {
  const [copied, setCopied] = useState(false);

  // Construit le lien côté client pour rester correct quel que soit le domaine.
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${code}`
      : `/r/${code}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible : sélection manuelle via l'input
    }
  }

  return (
    <article className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 mb-3">
        <Share2 className="h-3.5 w-3.5 text-rouge-500" aria-hidden />
        Votre lien de parrainage
      </div>

      <p className="text-sm text-ink-600 leading-relaxed mb-4">
        Invitez un créateur. Quand il passe à un plan payant, vous recevez{" "}
        <span className="font-semibold text-ink-900">
          {REFERRAL_BONUS_MINUTES} minutes
        </span>{" "}
        chacun.
      </p>

      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Lien de parrainage"
          className="flex-1 min-w-0 px-3 py-2 bg-white border-2 border-ink-900 rounded-sm font-mono text-sm text-ink-800 truncate"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-ink-900 text-ivory-50 rounded-sm font-bold text-sm hover:bg-rouge-500 transition-colors flex-shrink-0"
          aria-label="Copier le lien"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Copié
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden /> Copier
            </>
          )}
        </button>
      </div>

      {(validatedCount > 0 || pendingCount > 0) && (
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="font-display font-bold text-ink-900 tabular-nums">
              {validatedCount}
            </span>{" "}
            <span className="text-ink-500">validé{validatedCount > 1 ? "s" : ""}</span>
          </div>
          {pendingCount > 0 && (
            <div>
              <span className="font-display font-bold text-ink-900 tabular-nums">
                {pendingCount}
              </span>{" "}
              <span className="text-ink-500">en attente</span>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
