import { Crown } from "lucide-react";
import type { Rank } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * Marqueur visuel du rang Atelier, identique à la landing.
 * Inclut le filet horizontal pour Éditeur en chef et la couronne pour Maître d'œuvre.
 */
export function RankBadge({
  rank,
  size = "md",
}: {
  rank: Rank;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { dot: "h-4 w-4", crown: "h-2 w-2", crownTop: "-top-2" },
    md: { dot: "h-6 w-6", crown: "h-3 w-3", crownTop: "-top-3" },
    lg: { dot: "h-9 w-9", crown: "h-4 w-4", crownTop: "-top-4" },
  };
  const s = sizes[size];

  if (rank === "apprenti") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border-2 border-ivory-50 bg-ivory-100",
          s.dot,
        )}
        aria-label="Rang Apprenti"
      />
    );
  }

  if (rank === "correcteur") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border-2 border-ivory-50 bg-rouge-500",
          s.dot,
        )}
        aria-label="Rang Correcteur"
      />
    );
  }

  if (rank === "editeur_en_chef") {
    return (
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-full border-2 border-ivory-50 bg-rouge-500",
          s.dot,
        )}
        aria-label="Rang Éditeur en chef"
      >
        <span className="absolute -top-1.5 inset-x-0 h-[2px] bg-ivory-50" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border-2 border-ivory-50 bg-rouge-500",
        s.dot,
      )}
      aria-label="Rang Maître d'œuvre"
    >
      <span className="absolute -top-1.5 inset-x-0 h-[2px] bg-ivory-50" />
      <Crown className={cn("absolute text-ivory-50", s.crown, s.crownTop)} strokeWidth={2.5} />
    </span>
  );
}
