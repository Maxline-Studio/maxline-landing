import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { computeRank, RANK_ORDER, RANK_THRESHOLDS } from "@/lib/atelier";
import { listGlossary } from "@/lib/glossary-actions";
import { GlossaryClient } from "./glossary-client";

export const metadata: Metadata = {
  title: "Glossaire",
  robots: { index: false, follow: false },
};

export default async function GlossaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("lifetime_minutes_used")
    .eq("id", user.id)
    .single();

  const lifetime = profile?.lifetime_minutes_used ?? 0;
  const rank = computeRank(lifetime);
  const hasAccess =
    RANK_ORDER.indexOf(rank) >= RANK_ORDER.indexOf("correcteur");

  const entries = hasAccess ? await listGlossary() : [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="annotation">§ Glossaire</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          perk Correcteur
        </span>
      </div>

      <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-3">
        Vos termes,{" "}
        <span className="font-display italic font-light text-rouge-500">
          toujours bien traduits.
        </span>
      </h1>
      <p className="text-ink-600 leading-relaxed mb-10 max-w-xl">
        Imposez la traduction d&apos;un nom, d&apos;une marque ou d&apos;un terme
        métier. Maxline l&apos;appliquera à chaque traduction de vidéo, pour
        rester cohérent.
      </p>

      {hasAccess ? (
        <GlossaryClient initialEntries={entries} />
      ) : (
        <div className="bg-ivory-100 border-2 border-dashed border-ivory-300 rounded-sm p-10 text-center">
          <h2 className="font-display font-medium text-xl text-ink-900 mb-2">
            Bientôt débloqué.
          </h2>
          <p className="text-sm text-ink-600 max-w-md mx-auto mb-2">
            Le glossaire personnalisé s&apos;active au rang{" "}
            <strong>Correcteur</strong> ({RANK_THRESHOLDS.correcteur} minutes
            cumulées à vie).
          </p>
          <p className="text-sm text-ink-500 mb-6">
            Il vous reste{" "}
            <strong className="text-ink-900">
              {Math.max(0, RANK_THRESHOLDS.correcteur - lifetime).toFixed(0)} min
            </strong>{" "}
            à parcourir.
          </p>
          <Link
            href="/app/upload"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-rouge-500 hover:gap-2 transition-all"
          >
            Sous-titrer une vidéo
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
