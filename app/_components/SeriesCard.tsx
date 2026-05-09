import Link from "next/link";
import { submitSeriesTip } from "@/app/_actions/tips";
import type { SeriesWithDetails } from "@/lib/tips/queries";
import { roundLabel } from "@/lib/tips/queries";
import { teamColor } from "@/lib/teams/info";
import { TeamLogo } from "./TeamLogo";

export function SeriesCard({ series }: { series: SeriesWithDetails }) {
  const isFinished = series.status === "finished";
  const myTip = series.my_tip;

  const tippedTeam = myTip
    ? myTip.predicted_winner_team_id === series.team_a.id
      ? series.team_a
      : series.team_b
    : null;

  const winnerTeam = isFinished
    ? series.winner_team_id === series.team_a.id
      ? series.team_a
      : series.winner_team_id === series.team_b.id
        ? series.team_b
        : null
    : null;

  const correctWinner = isFinished && myTip && myTip.predicted_winner_team_id === series.winner_team_id;
  const correctGames = isFinished && myTip && myTip.predicted_games === series.games_played;

  const accentColor = tippedTeam ? teamColor(tippedTeam.abbreviation) : "#e4e4e7";
  const colorA = teamColor(series.team_a.abbreviation);
  const colorB = teamColor(series.team_b.abbreviation);

  const aLeads = series.wins_team_a > series.wins_team_b;
  const bLeads = series.wins_team_b > series.wins_team_a;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {roundLabel(series.round, series.conference)}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <TeamLogo abbreviation={series.team_a.abbreviation} size={44} />
            <div>
              <p className="text-base font-bold leading-none" style={{ color: colorA }}>
                {series.team_a.abbreviation}
              </p>
              <p className="text-xs text-zinc-500">{series.team_a.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
            <span className={aLeads ? "" : "text-zinc-400"}>{series.wins_team_a}</span>
            <span className="text-zinc-300">:</span>
            <span className={bLeads ? "" : "text-zinc-400"}>{series.wins_team_b}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="text-right">
              <p className="text-base font-bold leading-none" style={{ color: colorB }}>
                {series.team_b.abbreviation}
              </p>
              <p className="text-xs text-zinc-500">{series.team_b.full_name}</p>
            </div>
            <TeamLogo abbreviation={series.team_b.abbreviation} size={44} />
          </div>
        </div>

        {!isFinished && (
          <form action={submitSeriesTip} className="flex flex-col gap-2 pt-1">
            <input type="hidden" name="series_id" value={series.id} />
            <div className="flex gap-2">
              <TeamRadio
                teamId={series.team_a.id}
                abbreviation={series.team_a.abbreviation}
                selected={myTip?.predicted_winner_team_id === series.team_a.id}
              />
              <TeamRadio
                teamId={series.team_b.id}
                abbreviation={series.team_b.abbreviation}
                selected={myTip?.predicted_winner_team_id === series.team_b.id}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="flex flex-1 items-center gap-2 text-zinc-600 dark:text-zinc-400">
                In wie vielen Spielen?
                <select
                  name="predicted_games"
                  defaultValue={myTip?.predicted_games ?? 6}
                  required
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
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                {myTip ? "Aktualisieren" : "Tipp abgeben"}
              </button>
            </div>
          </form>
        )}

        {(tippedTeam || isFinished) && (
          <footer className="flex flex-col gap-1 border-t border-zinc-200 pt-2 text-sm dark:border-zinc-800">
            {tippedTeam && (
              <span className="text-zinc-600 dark:text-zinc-400">
                Dein Tipp: <b style={{ color: teamColor(tippedTeam.abbreviation) }}>{tippedTeam.abbreviation}</b> in {myTip!.predicted_games} Spielen
                {isFinished && (
                  <span
                    className={
                      correctWinner
                        ? "ml-2 font-semibold text-green-600 dark:text-green-400"
                        : "ml-2 font-semibold text-red-600 dark:text-red-400"
                    }
                  >
                    {correctWinner
                      ? correctGames
                        ? "+5 Pkt (Sieger + Spiele)"
                        : "+3 Pkt (Sieger)"
                      : "0 Pkt"}
                  </span>
                )}
              </span>
            )}
            {isFinished && winnerTeam && (
              <span className="text-zinc-600 dark:text-zinc-400">
                Ergebnis: <b style={{ color: teamColor(winnerTeam.abbreviation) }}>{winnerTeam.abbreviation}</b> in {series.games_played} Spielen
              </span>
            )}
            <Link
              href={`/series/${series.id}`}
              className="self-start text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
            >
              Vergleich →
            </Link>
          </footer>
        )}
      </div>
    </article>
  );
}

function TeamRadio({
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
    <label
      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 bg-white px-3 py-2 text-sm font-bold transition-colors hover:opacity-90 dark:bg-zinc-950"
      style={style}
    >
      <input type="radio" name="predicted_winner_team_id" value={teamId} defaultChecked={selected} className="sr-only" required />
      <TeamLogo abbreviation={abbreviation} size={22} />
      {selected ? "✓ " : ""}{abbreviation}
    </label>
  );
}
