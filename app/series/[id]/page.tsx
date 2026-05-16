import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getTeamsMap, roundLabel } from "@/lib/tips/queries";

export const dynamic = "force-dynamic";

export default async function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase } = await requireUser();
  const teams = await getTeamsMap();

  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!series) notFound();

  const teamA = teams.get(series.team_a_id);
  const teamB = teams.get(series.team_b_id);
  if (!teamA || !teamB) notFound();

  const startsAt = series.starts_at ? new Date(series.starts_at) : null;
  const lockPassed = startsAt ? startsAt <= new Date() : false;
  const isFinished = series.status === "finished";

  const { data: ownTip } = await supabase
    .from("series_tips")
    .select("predicted_winner_team_id, predicted_games, points_awarded")
    .eq("series_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: allTips } = await supabase
    .from("series_tips")
    .select("user_id, predicted_winner_team_id, predicted_games, points_awarded")
    .eq("series_id", id);

  const userIds = Array.from(new Set((allTips ?? []).map((t) => t.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const canSeeOthers = !!ownTip || lockPassed;

  // Aktuelle Wins
  const { data: finalGames } = await supabase
    .from("games")
    .select("winner_team_id")
    .eq("series_id", id)
    .eq("status", "final");
  const winsA = (finalGames ?? []).filter((g) => g.winner_team_id === series.team_a_id).length;
  const winsB = (finalGames ?? []).filter((g) => g.winner_team_id === series.team_b_id).length;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400">
        ← Zurück
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {roundLabel(series.round, series.conference)}
        </p>
        <h1 className="text-2xl font-bold">
          {teamA.full_name} <span className="text-zinc-400">vs.</span> {teamB.full_name}
        </h1>
        <p className="text-base">
          Stand: <b>{teamA.abbreviation}</b> {winsA} – {winsB} <b>{teamB.abbreviation}</b>
        </p>
        {isFinished && series.winner_team_id && (
          <p className="text-lg font-semibold">
            Sieger: {series.winner_team_id === teamA.id ? teamA.abbreviation : teamB.abbreviation} in{" "}
            {series.games_played} Spielen
          </p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tipps</h2>
        {!canSeeOthers ? (
          <p className="text-sm text-zinc-500">
            Andere Tipps werden sichtbar, sobald du selbst getippt hast oder die Serie begonnen hat.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Spieler</th>
                <th className="py-2">Sieger</th>
                <th className="py-2">Spiele</th>
                <th className="py-2 text-right">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {(allTips ?? []).map((t) => {
                const team = t.predicted_winner_team_id === teamA.id ? teamA : teamB;
                const correctWinner =
                  isFinished && series.winner_team_id === t.predicted_winner_team_id;
                const correctGames = isFinished && t.predicted_games === series.games_played;
                const points = correctWinner ? (correctGames ? 5 : 3) : 0;
                return (
                  <tr key={t.user_id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2">
                      {profileById.get(t.user_id) ?? "?"}
                      {t.user_id === user.id && <span className="ml-1 text-zinc-500">(du)</span>}
                    </td>
                    <td className="py-2 font-medium">{team.abbreviation}</td>
                    <td className="py-2">{t.predicted_games}</td>
                    <td className="py-2 text-right">
                      {isFinished ? (
                        <span
                          className={
                            points > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-500"
                          }
                        >
                          +{points}
                        </span>
                      ) : (
                        <span className="text-zinc-400">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
