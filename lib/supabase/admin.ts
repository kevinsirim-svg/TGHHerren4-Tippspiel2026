import { createClient } from "@supabase/supabase-js";

/**
 * Service-Role-Client. Umgeht RLS - NUR auf Server (API routes, server actions, sync jobs).
 * Niemals an Client senden.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
