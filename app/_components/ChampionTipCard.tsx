import { teamColor } from "@/lib/teams/info";
import type { Team } from "@/lib/types/database";
import { TeamLogo } from "./TeamLogo";
import { ChampionTipForm } from "./ChampionTipForm";

type Props = {
  eligibleTeams: Team[];
  locked: boolean;
  myTip: { predicted_champion_team_id: number; points_awarded: number | null } | null;
  /** Falls die NBA Finals durch sind, kann der echte Champion uebergeben werden. */
  actualChampion?: Team | null;
};

export function ChampionTipCard({ eligibleTeams, locked, myTip, actualChampion }: Props) {
  // Card erst zeigen, wenn beide Conf Finals stehen (4 Teams) ODER eigener Tipp existiert.
  if (eligibleTeams.length < 4 && !myTip) return null;

  const tippedTeam = myTip ? eligibleTeams.find((t) => t.id === myTip.predicted_champion_team_id) : null;
  const isResolved = actualChampion !== undefined && actualChampion !== null;
  const correct = isResolved && myTip && actualChampion.id === myTip.predicted_champion_team_id;

  const accentColor = tippedTeam ? teamColor(tippedTeam.abbreviation) : "#f97316"; // orange default

  return (
    <article
      className="nba-card nba-card-upcoming flex flex-col gap-3 px-4 py-3"
      style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-orange-400">
            Larry O&apos;Brien Trophy
          </p>
          <h3 className="text-lg font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent">
              NBA Champion
            </span>
            <span className="text-zinc-200"> 2026</span>
          </h3>
        </div>
        <span className="nba-badge-final">10 Pkt</span>
      </header>

      {!myTip && !locked && eligibleTeams.length >= 4 && <ChampionTipForm teams={eligibleTeams} />}

      {!myTip && locked && (
        <p className="text-sm italic text-zinc-500">
          Conf Finals haben begonnen - kein Champion-Tipp mehr moeglich.
        </p>
      )}

      {myTip && tippedTeam && (
        <div className="flex flex-col gap-2 border-t border-zinc-800 pt-2 text-sm">
          <span className="text-zinc-400">
            Dein Champion-Tipp:{" "}
            <b style={{ color: teamColor(tippedTeam.abbreviation) }}>{tippedTeam.full_name}</b>
            {isResolved && (
              <span
                className={
                  correct
                    ? "ml-2 font-semibold text-emerald-400"
                    : "ml-2 font-semibold text-rose-400"
                }
              >
                {correct ? "+10 Pkt" : "0 Pkt"}
              </span>
            )}
          </span>
          {isResolved && actualChampion && (
            <span className="text-zinc-400">
              Champion:{" "}
              <b style={{ color: teamColor(actualChampion.abbreviation) }}>{actualChampion.full_name}</b>
            </span>
          )}
        </div>
      )}

      {myTip && tippedTeam && eligibleTeams.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {eligibleTeams.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400"
              style={
                t.id === tippedTeam.id
                  ? { borderColor: teamColor(t.abbreviation), color: teamColor(t.abbreviation) }
                  : undefined
              }
            >
              <TeamLogo abbreviation={t.abbreviation} size={16} />
              {t.abbreviation}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
