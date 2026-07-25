import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/**
 * Accès à la session, DÉDUPLIQUÉ à l'échelle d'un rendu.
 *
 * `supabase.auth.getUser()` n'est pas une lecture de cookie : c'est une requête
 * HTTP au serveur d'auth Supabase (en Irlande). Elle était appelée jusqu'à trois
 * fois pour une seule navigation — dans le middleware, dans le layout /app, puis
 * dans la page. Le `cache()` de React mémorise le résultat pour la durée d'UN
 * rendu serveur : le layout et la page se partagent désormais un seul appel.
 *
 * (Le middleware garde le sien : il tourne avant le rendu et rafraîchit le
 * cookie de session — c'est lui qui garantit que le token est valide.)
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Profil de l'utilisateur courant, également dédupliqué par rendu. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();
  return data ?? null;
});
