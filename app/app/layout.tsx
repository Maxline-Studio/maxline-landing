import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";

/**
 * Layout pour les routes authentifiées (/app/*).
 * - Vérifie la session côté serveur (le middleware redirige déjà si pas de user,
 *   mais on double-check ici par sécurité défensive)
 * - Charge le profil utilisateur depuis la table profiles
 * - Rend l'AppShell (header user + sidebar) avec children au centre
 *
 * Session et profil passent par lib/auth.ts, dédupliqués par React `cache()` :
 * si une page enfant en a besoin, elle les redemande sans nouvel aller-retour.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile) {
    // Edge case : auth user existe mais pas de profil créé (trigger raté).
    // On déconnecte et redirige vers login.
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?error=profile_missing");
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
