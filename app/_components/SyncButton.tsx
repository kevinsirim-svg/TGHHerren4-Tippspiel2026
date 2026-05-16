"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { userTriggeredSync } from "@/app/_actions/sync";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function trigger() {
    startTransition(async () => {
      await userTriggeredSync();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={isPending}
      title="Spielergebnisse von ESPN neu laden"
      className="rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-orange-500/60 hover:bg-zinc-800 disabled:opacity-60"
    >
      {isPending ? "Sync..." : "↻ Sync"}
    </button>
  );
}
