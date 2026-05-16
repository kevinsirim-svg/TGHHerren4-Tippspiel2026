"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitChampionTip } from "@/app/_actions/tips";
import { TeamLogo } from "./TeamLogo";
import { teamColor } from "@/lib/teams/info";
import type { Team } from "@/lib/types/database";

export function ChampionTipForm({ teams }: { teams: Team[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!selectedId) return;
    const fd = new FormData();
    fd.set("predicted_champion_team_id", String(selectedId));
    startTransition(async () => {
      await submitChampionTip(fd);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {teams.map((t) => (
          <SelectButton
            key={t.id}
            team={t}
            selected={selectedId === t.id}
            onClick={() => setSelectedId(t.id)}
          />
        ))}
      </div>
      {selectedId !== null && (
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-gradient-to-r from-orange-500 to-rose-500 px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-rose-400 disabled:opacity-60"
        >
          {isPending ? "Speichere..." : "Champion-Tipp abgeben (final)"}
        </button>
      )}
      <p className="text-xs italic text-zinc-500">
        10 Punkte fuer den richtigen Tipp. Tipps koennen nach Abgabe nicht mehr geaendert werden.
      </p>
    </div>
  );
}

function SelectButton({
  team,
  selected,
  onClick,
}: {
  team: Team;
  selected: boolean;
  onClick: () => void;
}) {
  const color = teamColor(team.abbreviation);
  const style = selected
    ? { backgroundColor: color, borderColor: color, color: "#fff" }
    : { borderColor: color, color };
  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="flex items-center justify-center gap-2 rounded-md border-2 bg-zinc-950 px-2 py-2.5 text-sm font-bold transition-colors hover:opacity-90"
    >
      <TeamLogo abbreviation={team.abbreviation} size={24} />
      {selected ? "✓ " : ""}{team.abbreviation}
    </button>
  );
}
