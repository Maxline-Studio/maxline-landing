import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { UploadClient } from "./upload-client";

export const metadata: Metadata = {
  title: "Nouvelle vidéo",
  robots: { index: false, follow: false },
};

export default async function UploadPage() {
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
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <span className="annotation">§ Nouvelle vidéo</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {minutesAvailable.toFixed(0)} min disponibles
        </span>
      </div>

      <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900 mb-3">
        Glissez votre vidéo.
        <br />
        <span className="font-display italic font-light text-rouge-500">
          On s&apos;occupe du reste.
        </span>
      </h1>
      <p className="text-ink-600 leading-relaxed mb-10 max-w-xl">
        Formats acceptés : MP4, MOV, AVI, MKV, WebM. Jusqu&apos;à 1 Go et 30
        minutes. La traduction française → anglaise se fait automatiquement.
      </p>

      <UploadClient minutesAvailable={minutesAvailable} />
    </div>
  );
}
