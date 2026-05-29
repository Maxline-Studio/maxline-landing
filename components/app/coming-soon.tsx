import { Construction } from "lucide-react";

/**
 * Placeholder utilisé pour les pages app pas encore implémentées
 * (upload, videos, atelier perso, billing, settings).
 * Sera remplacé sprint par sprint.
 */
export function ComingSoon({
  title,
  annotation,
  sprint,
  description,
}: {
  title: string;
  annotation: string;
  sprint: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="annotation">{annotation}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {sprint}
        </span>
      </div>

      <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-6">
        {title}
      </h1>

      <div className="bg-ivory-100 border-2 border-dashed border-ivory-300 rounded-sm p-10 text-center">
        <div className="inline-flex h-12 w-12 rounded-sm bg-ivory-50 border-2 border-ink-900 items-center justify-center mb-4">
          <Construction
            className="h-5 w-5 text-ink-900"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
        <h2 className="font-display font-medium text-xl text-ink-900 mb-2">
          En cours de construction
        </h2>
        <p className="text-sm text-ink-600 leading-relaxed max-w-md mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
}
