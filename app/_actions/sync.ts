"use server";

import { revalidatePath } from "next/cache";
import { syncNBA } from "@/lib/sync/nba";

/**
 * User-initiated Sync ueber den "Sync"-Button im Header.
 * Nutzt intern den Admin-Client (bypassed RLS) - daher ist es OK,
 * dass es ohne CRON_SECRET-Header aus dem UI heraus aufgerufen wird.
 * Server Actions sind nur aus dem eigenen Frontend aufrufbar.
 */
export async function userTriggeredSync(): Promise<void> {
  try {
    await syncNBA();
  } catch (err) {
    console.error("user-triggered sync failed", err);
  }
  revalidatePath("/", "layout");
}
