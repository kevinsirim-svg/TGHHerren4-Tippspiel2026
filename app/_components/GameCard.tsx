import Link from "next/link";
import type { GameWithDetails } from "@/lib/tips/queries";
import { roundLabel } from "@/lib/tips/queries";
import { teamColor } from "@/lib/teams/info";
import { TeamLogo } from "./TeamLogo";
import { GameTipForm } from "./GameTipForm";

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
  const isLive = game.status === "live";
  const isPast = isFinal || tipOffPassed;
  const myTip = game.my_tip;

  const tipped =
    myTip
      ? myTip.predicted_winner_team_id === game.home_team.id
        ? game.home_team
        : game.away_team
      : null;
  const correct =
    isFinal && myTip && game.winner_team_id === myTip.predicted_winner_team_id;

  const accentColor = tipped ? teamColor(tipped.abbreviation) : "#475569";

  return (
    <article
      className={`nba-card flex flex-col gap-3 ${isPast ? "nba-card-past" : "nba-card-upcoming"}`}
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <div className="flex flex-col gap-3 px-4 py-3">
        <header className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-400/80">
              {roundLabel(game.series_round, game.series_conference)}
            </p>
            <p className="text-sm text-zinc-400">
              {TIME_FMT.format(new Date(game.tip_off))} Uhr
            </p>
          </div>
          {isLive && <span className="nba-badge-live">Live</span>}
          {isFinal && <span className="nba-badge-final">Final</span>}
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

        {!isFinal && !tipOffPassed && !myTip && (
          <GameTipForm
            gameId={game.id}
            awayTeam={{ id: game.away_team.id, abbreviation: game.away_team.abbreviation }}
            homeTeam={{ id: game.home_team.id, abbreviation: game.home_team.abbreviation }}
          />
        )}

        {(tipOffPassed || tipped) && (
          <div className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-400">
              {tipped ? (
                <>
                  Dein Tipp: <b style={{ color: teamColor(tipped.abbreviation) }}>{tipped.abbreviation}</b>
                  {isFinal && (
                    <span
                      className={
                        correct
                          ? "ml-2 font-semibold text-emerald-400"
                          : "ml-2 font-semibold text-rose-400"
                      }
                    >
                      {correct ? "+1 Pkt" : "0 Pkt"}
                    </span>
                  )}
                </>
              ) : (
                <span className="italic">Kein Tipp abgegeben</span>
              )}
            </span>
            <Link
              href={`/game/${game.id}`}
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
  const color = teamColor(team.abbreviation);
  return (
    <div className={`flex items-center gap-3 ${alignRight ? "justify-end" : ""}`}>
      {!alignRight && <TeamLogo abbreviation={team.abbreviation} size={40} />}
      <div className={alignRight ? "text-right" : ""}>
        <p
          className="text-base font-extrabold tracking-wide"
          style={{ color, textShadow: `0 0 12px ${color}40` }}
        >
          {team.abbreviation}
        </p>
        <p className="text-xs text-zinc-500 truncate">{team.full_name}</p>
        {score !== null && (
          <p className={`text-2xl font-extrabold tabular-nums ${isWinner ? "text-white" : "text-zinc-500"}`}>{score}</p>
        )}
      </div>
      {alignRight && <TeamLogo abbreviation={team.abbreviation} size={40} />}
    </div>
  );
}

