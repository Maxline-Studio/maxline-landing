import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Rank } from "@/lib/supabase/types";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Paramètres",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("delete_after_days, email_notifications, avatar_url, display_name, rank")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="annotation">§ Paramètres</span>
        </div>
        <h1 className="font-display font-medium text-3xl md:text-4xl leading-[1.05] tracking-[-0.02em] text-ink-900">
          Préférences et confidentialité.
        </h1>
      </div>

      <SettingsClient
        userId={user.id}
        rank={(profile?.rank ?? "apprenti") as Rank}
        initialDisplayName={profile?.display_name ?? ""}
        initialAvatarUrl={profile?.avatar_url ?? null}
        initialRetention={profile?.delete_after_days ?? 30}
        initialEmailNotifications={profile?.email_notifications ?? true}
      />
    </div>
  );
}
