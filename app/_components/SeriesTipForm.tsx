"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitSeriesTip } from "@/app/_actions/tips";
import { TeamLogo } from "./TeamLogo";
import { teamColor } from "@/lib/teams/info";

type Team = { id: number; abbreviation: string };

export function SeriesTipForm({
  seriesId,
  teamA,
  teamB,
}: {
  seriesId: string;
  teamA: Team;
  teamB: Team;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedGames, setSelectedGames] = useState<number>(6);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!selectedTeamId) return;
    const formData = new FormData();
    formData.set("series_id", seriesId);
    formData.set("predicted_winner_team_id", String(selectedTeamId));
    formData.set("predicted_games", String(selectedGames));
    startTransition(async () => {
      await submitSeriesTip(formData);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <SelectButton
          team={teamA}
          selected={selectedTeamId === teamA.id}
          onClick={() => setSelectedTeamId(teamA.id)}
        />
        <SelectButton
          team={teamB}
          selected={selectedTeamId === teamB.id}
          onClick={() => setSelectedTeamId(teamB.id)}
        />
      </div>
      <div className="flex items-center gap-2 text-sm">
        <label className="flex flex-1 items-center gap-2 text-zinc-600 dark:text-zinc-400">
          In wie vielen Spielen?
          <select
            value={selectedGames}
            onChange={(e) => setSelectedGames(Number(e.target.value))}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {[4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={selectedTeamId === null || isPending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending ? "Speichere..." : "Tipp abgeben (final)"}
        </button>
      </div>
      <p className="text-xs italic text-zinc-500">
        Hinweis: Tipps koennen nach Abgabe nicht mehr geaendert werden.
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
      className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 bg-white px-3 py-2 text-sm font-bold transition-colors hover:opacity-90 dark:bg-zinc-950"
    >
      <TeamLogo abbreviation={team.abbreviation} size={22} />
      {selected ? "✓ " : ""}{team.abbreviation}
    </button>
  );
}
