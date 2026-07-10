"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Check, X } from "lucide-react";
import { deleteVideo } from "@/lib/video-actions";

/**
 * Bouton de suppression d'une vidéo DEPUIS LA LISTE (sans ouvrir la vidéo).
 * Confirmation en deux temps (clic → « Supprimer / Annuler ») pour éviter les
 * suppressions accidentelles. Rendu au-dessus du <Link> de la ligne : on stoppe
 * la propagation pour ne pas naviguer vers la vidéo.
 */
export function DeleteVideoButton({
  videoId,
  filename,
}: {
  videoId: string;
  filename: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDelete = (e: React.MouseEvent) => {
    stop(e);
    startTransition(async () => {
      await deleteVideo(videoId);
      router.refresh();
    });
  };

  if (!confirm) {
    return (
      <button
        type="button"
        aria-label={`Supprimer ${filename}`}
        title="Supprimer"
        onClick={(e) => {
          stop(e);
          setConfirm(true);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-400 hover:text-rouge-600 hover:bg-rouge-50 transition-colors"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1" onClick={stop}>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label="Confirmer la suppression"
        className="inline-flex h-8 items-center gap-1 px-2 rounded-sm bg-rouge-500 text-ivory-50 text-xs font-semibold hover:bg-rouge-600 transition-colors disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Check className="h-3.5 w-3.5" aria-hidden />
        )}
        Supprimer
      </button>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setConfirm(false);
        }}
        aria-label="Annuler"
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 hover:bg-ivory-200 transition-colors"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </span>
  );
}
