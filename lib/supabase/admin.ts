import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Client Supabase admin (service_role_key).
 *
 * À utiliser UNIQUEMENT dans des routes API serveur où on a besoin de bypasser
 * RLS (webhooks Stripe, cron jobs, opérations d'admin). NE JAMAIS exposer au
 * client. Ne pas mettre dans une route Client Component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase admin env vars missing (URL or SERVICE_ROLE_KEY)");
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
