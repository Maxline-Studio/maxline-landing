"use client";

/**
 * Barre d'actions mobile/tablette (masquée en desktop) : grosses cibles
 * tactiles ≥ 44px, fixée sous la timeline. « Texte » et « Style » ouvrent la
 * feuille du bas ; les autres agissent sur la ligne sélectionnée.
 */
import {
  Type,
  Palette,
  Scissors,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

export type ActionBarAction =
  | "text"
  | "style"
  | "split"
  | "add"
  | "delete"
  | "export";

const ACTIONS: {
  id: ActionBarAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}[] = [
  { id: "text", label: "Texte", icon: Type },
  { id: "style", label: "Style", icon: Palette },
  { id: "split", label: "Diviser", icon: Scissors },
  { id: "add", label: "Ajouter", icon: Plus },
  { id: "delete", label: "Suppr.", icon: Trash2 },
  { id: "export", label: "Exporter", icon: Upload, primary: true },
];

export function ActionBar({
  onAction,
}: {
  onAction: (action: ActionBarAction) => void;
}) {
  return (
    <nav
      aria-label="Actions d'édition"
      className="lg:hidden flex items-stretch border-t border-ivory-200 bg-ivory-50 pb-[env(safe-area-inset-bottom)]"
    >
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onAction(a.id)}
            className={`flex-1 min-h-[56px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 font-mono text-[8.5px] uppercase tracking-widest transition-colors ${
              a.primary
                ? "text-rouge-600 hover:bg-rouge-50"
                : "text-ink-500 hover:bg-ivory-200 hover:text-ink-900"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {a.label}
          </button>
        );
      })}
    </nav>
  );
}
