import Link from "next/link";
import { submitGameTip } from "@/app/_actions/tips";
import type { GameWithDetails } from "@/lib/tips/queries";
import { roundLabel } from "@/lib/tips/queries";
import { teamColor } from "@/lib/teams/info";
import { TeamLogo } from "./TeamLogo";

const TIME_FMT = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export function GameCard({ game }: { game: GameWithDetails }) {
  const tipOffPassed = new Date(game.tip_off) <= new Date();
  const isFinal = game.status === "final";
  const myTip = game.my_tip;

  const tipped =
    myTip
      ? myTip.predicted_winner_team_id === game.home_team.id
        ? game.home_team
        : game.away_team
      : null;
  const correct =
    isFinal && myTip && game.winner_team_id === myTip.predicted_winner_team_id;

  const accentColor = tipped ? teamColor(tipped.abbreviation) : "#e4e4e7";

  return (
    <article
      className="flex flex-col gap-3 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <header className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {roundLabel(game.series_round, game.series_conference)}
            </p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {TIME_FMT.format(new Date(game.tip_off))} Uhr
            </p>
          </div>
          {isFinal && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">
              Endstand
            </span>
          )}
        </header>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamBlock
            team={game.away_team}
            score={game.away_score}
            isWinner={isFinal && game.winner_team_id === game.away_team.id}
          />
          <span className="text-zinc-400">@</span>
          <TeamBlock
            team={game.home_team}
            score={game.home_score}
            isWinner={isFinal && game.winner_team_id === game.home_team.id}
            alignRight
          />
        </div>

        {!isFinal && !tipOffPassed && (
          <form action={submitGameTip} className="flex gap-2">
            <input type="hidden" name="game_id" value={game.id} />
            <TipButton
              teamId={game.away_team.id}
              abbreviation={game.away_team.abbreviation}
              selected={myTip?.predicted_winner_team_id === game.away_team.id}
            />
            <TipButton
              teamId={game.home_team.id}
              abbreviation={game.home_team.abbreviation}
              selected={myTip?.predicted_winner_team_id === game.home_team.id}
            />
          </form>
        )}

        {(tipOffPassed || tipped) && (
          <footer className="flex items-center justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              {tipped ? (
                <>
                  Dein Tipp: <b style={{ color: teamColor(tipped.abbreviation) }}>{tipped.abbreviation}</b>
                  {isFinal && (
                    <span
                      className={
                        correct
                          ? "ml-2 font-semibold text-green-600 dark:text-green-400"
                          : "ml-2 font-semibold text-red-600 dark:text-red-400"
                      }
                    >
                      {correct ? "+1 Pkt" : "0 Pkt"}
                    </span>
                  )}
                </>
              ) : tipOffPassed ? (
                <span className="italic">Kein Tipp abgegeben</span>
              ) : null}
            </span>
            {(tipped || tipOffPassed) && (
              <Link
                href={`/game/${game.id}`}
                className="text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
              >
                Vergleich →
              </Link>
            )}
          </footer>
        )}
      </div>
    </article>
  );
}

function TeamBlock({
  team,
  score,
  isWinner,
  alignRight,
}: {
  team: { abbreviation: string; full_name: string };
  score: number | null;
  isWinner: boolean;
  alignRight?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${alignRight ? "justify-end" : ""}`}>
      {!alignRight && <TeamLogo abbreviation={team.abbreviation} size={36} />}
      <div className={alignRight ? "text-right" : ""}>
        <p className="text-base font-bold" style={{ color: teamColor(team.abbreviation) }}>
          {team.abbreviation}
        </p>
        <p className="text-xs text-zinc-500 truncate">{team.full_name}</p>
        {score !== null && (
          <p className={`text-xl font-bold ${isWinner ? "" : "text-zinc-400"}`}>{score}</p>
        )}
      </div>
      {alignRight && <TeamLogo abbreviation={team.abbreviation} size={36} />}
    </div>
  );
}

function TipButton({
  teamId,
  abbreviation,
  selected,
}: {
  teamId: number;
  abbreviation: string;
  selected: boolean;
}) {
  const color = teamColor(abbreviation);
  const style = selected
    ? { backgroundColor: color, borderColor: color, color: "#fff" }
    : { borderColor: color, color };
  return (
    <button
      type="submit"
      name="predicted_winner_team_id"
      value={teamId}
      style={style}
      className="flex flex-1 items-center justify-center gap-2 rounded-md border-2 bg-white px-3 py-2 text-sm font-bold transition-colors hover:opacity-90 dark:bg-zinc-950"
    >
      <TeamLogo abbreviation={abbreviation} size={22} />
      {selected ? "✓ " : ""}{abbreviation}
    </button>
  );
}
