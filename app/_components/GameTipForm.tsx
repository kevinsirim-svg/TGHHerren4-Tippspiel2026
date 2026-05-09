"use client";

import { useState, useTransition } from "react";
import { submitGameTip } from "@/app/_actions/tips";
import { TeamLogo } from "./TeamLogo";
import { teamColor } from "@/lib/teams/info";

type Team = { id: number; abbreviation: string };

export function GameTipForm({
  gameId,
  awayTeam,
  homeTeam,
  currentTipTeamId,
}: {
  gameId: string;
  awayTeam: Team;
  homeTeam: Team;
  currentTipTeamId: number | null;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(currentTipTeamId);
  const [isPending, startTransition] = useTransition();

  const hasChanged = selectedId !== null && selectedId !== currentTipTeamId;

  function submit() {
    if (!selectedId) return;
    const formData = new FormData();
    formData.set("game_id", gameId);
    formData.set("predicted_winner_team_id", String(selectedId));
    startTransition(async () => {
      await submitGameTip(formData);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <SelectButton
          team={awayTeam}
          selected={selectedId === awayTeam.id}
          onClick={() => setSelectedId(awayTeam.id)}
        />
        <SelectButton
          team={homeTeam}
          selected={selectedId === homeTeam.id}
          onClick={() => setSelectedId(homeTeam.id)}
        />
      </div>
      {hasChanged && (
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isPending
            ? "Speichere..."
            : currentTipTeamId
              ? "Tipp aktualisieren"
              : "Tipp bestaetigen"}
        </button>
      )}
      {currentTipTeamId !== null && selectedId === currentTipTeamId && (
        <p className="text-xs italic text-zinc-500">
          Tipp gespeichert. Klick auf das andere Team, um zu aendern.
        </p>
      )}
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
