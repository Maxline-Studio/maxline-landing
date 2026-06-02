import { STAGE_LABELS, type VideoStatus } from "@/lib/video-types";

/** Badge de statut d'une vidéo, cohérent avec l'identité Atelier. */
export function VideoStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    done: { label: "Terminé", className: "bg-rouge-500 text-ivory-50" },
    failed: { label: "Échec", className: "bg-ink-900 text-rouge-400" },
    queued: { label: "En attente", className: "bg-ivory-200 text-ink-900" },
    cancelled: { label: "Annulé", className: "bg-ivory-200 text-ink-700" },
  };
  const c = config[status] || {
    label: "En cours",
    className: "bg-encre-500 text-ivory-50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-mono text-[9px] uppercase tracking-widest font-bold ${c.className}`}
    >
      {!["done", "failed", "queued", "cancelled"].includes(status) && (
        <span className="h-1.5 w-1.5 rounded-full bg-ivory-50 animate-pulse-soft" />
      )}
      {c.label}
    </span>
  );
}

export function stageLabel(status: string): string {
  return STAGE_LABELS[status as VideoStatus] || status;
}
