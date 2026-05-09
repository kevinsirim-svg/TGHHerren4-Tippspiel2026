import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Holt den eingeloggten User + Profile.
 * - Nicht eingeloggt -> /login
 * - Eingeloggt aber Welcome noch nicht gesehen -> /welcome
 *   (mit { skipWelcomeRedirect: true } unterdrueckbar - z.B. fuer /welcome selbst)
 */
export async function requireUser(opts?: { skipWelcomeRedirect?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, has_seen_welcome")
    .eq("id", user.id)
    .single();

  if (!opts?.skipWelcomeRedirect && profile && !profile.has_seen_welcome) {
    redirect("/welcome");
  }

  return { user, profile, supabase };
}
