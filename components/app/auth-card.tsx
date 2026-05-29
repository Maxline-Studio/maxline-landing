import { ReactNode } from "react";

/**
 * Wrapper visuel pour les pages auth — fiche cartonnée signature Maxline.
 */
export function AuthCard({
  annotation,
  title,
  subtitle,
  children,
  footer,
}: {
  annotation: string;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <article className="bg-ivory-50 border-2 border-ink-900 rounded-sm p-8 md:p-10 shadow-[6px_6px_0_0_rgba(26,24,20,1)] relative">
      {/* Tag annotation */}
      <div className="flex items-center gap-3 mb-6">
        <span className="annotation">{annotation}</span>
      </div>

      {/* Titre */}
      <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-3">
        {title}
      </h1>

      {subtitle && (
        <p className="text-ink-600 leading-relaxed mb-8">{subtitle}</p>
      )}

      {children}

      {footer && (
        <div className="mt-8 pt-6 border-t border-ivory-200 text-sm text-ink-600">
          {footer}
        </div>
      )}
    </article>
  );
}
