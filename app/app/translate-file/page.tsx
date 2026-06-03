import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { TranslateFileClient } from "./translate-file-client";

export const metadata: Metadata = {
  title: "Traduire un fichier",
  robots: { index: false, follow: false },
};

export default async function TranslateFilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let minutesAvailable = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("quota_minutes_total, quota_minutes_used, credits_minutes")
      .eq("id", user.id)
      .single();
    if (profile) {
      minutesAvailable =
        Math.max(profile.quota_minutes_total - profile.quota_minutes_used, 0) +
        profile.credits_minutes;
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="annotation">§ Traduire un fichier</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {minutesAvailable.toFixed(0)} min disponibles
        </span>
      </div>

      <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-3">
        Vous avez déjà vos sous-titres ?
        <br />
        <span className="font-display italic font-light text-rouge-500">
          On les traduit.
        </span>
      </h1>
      <p className="text-ink-600 leading-relaxed mb-10 max-w-xl">
        Importez un fichier <strong>.srt</strong>, <strong>.vtt</strong> ou{" "}
        <strong>.txt</strong> : on traduit le texte en gardant les timecodes, et
        vous récupérez le fichier traduit. Pas de vidéo à uploader.
      </p>

      <TranslateFileClient minutesAvailable={minutesAvailable} />
    </div>
  );
}
