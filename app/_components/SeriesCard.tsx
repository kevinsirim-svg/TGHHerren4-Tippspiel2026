import Link from "next/link";
import type { SeriesWithDetails } from "@/lib/tips/queries";
import { roundLabel } from "@/lib/tips/queries";
import { teamColor } from "@/lib/teams/info";
import { TeamLogo } from "./TeamLogo";
import { SeriesTipForm } from "./SeriesTipForm";

export function SeriesCard({ series }: { series: SeriesWithDetails }) {
  const isFinished = series.status === "finished";
  // Series-Tipps nur vor dem ersten Spiel (oder solange noch kein Termin steht).
  const seriesStarted = series.starts_at ? new Date(series.starts_at) <= new Date() : false;
  const myTip = series.my_tip;
  const canTip = !isFinished && !seriesStarted && !myTip;

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

  const accentColor = tippedTeam ? teamColor(tippedTeam.abbreviation) : "#475569";
  const colorA = teamColor(series.team_a.abbreviation);
  const colorB = teamColor(series.team_b.abbreviation);

  const aLeads = series.wins_team_a > series.wins_team_b;
  const bLeads = series.wins_team_b > series.wins_team_a;

  return (
    <article
      className={`nba-card flex flex-col ${isFinished ? "nba-card-past" : "nba-card-upcoming"}`}
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-400/80">
          {roundLabel(series.round, series.conference)}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center gap-2">
            <TeamLogo abbreviation={series.team_a.abbreviation} size={48} />
            <div>
              <p
                className="text-base font-extrabold leading-none tracking-wide"
                style={{ color: colorA, textShadow: `0 0 12px ${colorA}40` }}
              >
                {series.team_a.abbreviation}
              </p>
              <p className="text-xs text-zinc-500">{series.team_a.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-3xl font-extrabold tabular-nums">
            <span className={aLeads ? "text-white" : "text-zinc-500"}>{series.wins_team_a}</span>
            <span className="text-zinc-600">:</span>
            <span className={bLeads ? "text-white" : "text-zinc-500"}>{series.wins_team_b}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="text-right">
              <p
                className="text-base font-extrabold leading-none tracking-wide"
                style={{ color: colorB, textShadow: `0 0 12px ${colorB}40` }}
              >
                {series.team_b.abbreviation}
              </p>
              <p className="text-xs text-zinc-500">{series.team_b.full_name}</p>
            </div>
            <TeamLogo abbreviation={series.team_b.abbreviation} size={48} />
          </div>
        </div>

        {canTip && (
          <div className="pt-1">
            <SeriesTipForm
              seriesId={series.id}
              teamA={{ id: series.team_a.id, abbreviation: series.team_a.abbreviation }}
              teamB={{ id: series.team_b.id, abbreviation: series.team_b.abbreviation }}
            />
          </div>
        )}

        {!canTip && (
          <div className="flex flex-col gap-2 border-t border-zinc-800 pt-2 text-sm">
            {tippedTeam && (
              <span className="text-zinc-400">
                Dein Tipp: <b style={{ color: teamColor(tippedTeam.abbreviation) }}>{tippedTeam.abbreviation}</b> in {myTip!.predicted_games} Spielen
                {isFinished && (
                  <span
                    className={
                      correctWinner
                        ? "ml-2 font-semibold text-emerald-400"
                        : "ml-2 font-semibold text-rose-400"
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
            {!tippedTeam && seriesStarted && !isFinished && (
              <span className="italic text-zinc-500">Serie laeuft bereits - keine Tipp-Abgabe mehr moeglich.</span>
            )}
            {isFinished && winnerTeam && (
              <span className="text-zinc-400">
                Ergebnis: <b style={{ color: teamColor(winnerTeam.abbreviation) }}>{winnerTeam.abbreviation}</b> in {series.games_played} Spielen
              </span>
            )}
            <Link
              href={`/series/${series.id}`}
              className="rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-center text-sm font-semibold tracking-wide text-zinc-200 hover:border-orange-500/60 hover:bg-zinc-800"
            >
              Tipps der anderen anzeigen →
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

