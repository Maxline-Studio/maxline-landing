import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";
import type { Profile } from "@/lib/supabase/types";

/**
 * Layout pour les routes authentifiées (/app/*).
 * - Vérifie la session côté serveur (le middleware redirige déjà si pas de user,
 *   mais on double-check ici par sécurité défensive)
 * - Charge le profil utilisateur depuis la table profiles
 * - Rend l'AppShell (header user + sidebar) avec children au centre
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Edge case : auth user existe mais pas de profil créé (trigger raté).
    // On déconnecte et redirige vers login.
    await supabase.auth.signOut();
    redirect("/login?error=profile_missing");
  }

  return <AppShell profile={profile as Profile}>{children}</AppShell>;
}
