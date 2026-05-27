import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur (utilise la service_role_key).
 * À utiliser UNIQUEMENT dans les routes API serveur — jamais exposé au client.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase env vars missing");
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
