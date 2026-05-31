import { RankBadge } from "./rank-badge";
import type { Rank } from "@/lib/supabase/types";

/** Avatar par défaut : le logo Maxline (M.) — utilisé tant qu'aucune photo n'est définie. */
export const DEFAULT_AVATAR = "/maxline-avatar.png";

const SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
  xl: "h-24 w-24",
} as const;

/**
 * Photo de profil de l'utilisateur (ou logo Maxline par défaut), avec un petit
 * badge de rang optionnel en incrustation. Utilise une <img> simple (le bucket
 * avatars est public) pour éviter la config next/image.
 */
export function Avatar({
  src,
  rank,
  size = "md",
  showRank = true,
  className = "border-2 border-ivory-50",
}: {
  src?: string | null;
  rank?: Rank;
  size?: keyof typeof SIZES;
  showRank?: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex flex-shrink-0 ${SIZES[size]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || DEFAULT_AVATAR}
        alt="Photo de profil"
        className={`h-full w-full rounded-full object-cover bg-ink-900 ${className}`}
      />
      {showRank && rank && (
        <span className="absolute -bottom-0.5 -right-0.5">
          <RankBadge rank={rank} size="sm" />
        </span>
      )}
    </span>
  );
}
