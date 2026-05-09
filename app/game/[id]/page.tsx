import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/auth";
import { getTeamsMap, roundLabel } from "@/lib/tips/queries";

const TIME_FMT = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase } = await requireUser();
  const teams = await getTeamsMap();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!game) notFound();

  const series = game.series_id
    ? (
        await supabase
          .from("series")
          .select("round, conference")
          .eq("id", game.series_id)
          .maybeSingle()
      ).data
    : null;

  const home = teams.get(game.home_team_id);
  const away = teams.get(game.away_team_id);
  if (!home || !away) notFound();

  const tipOffPassed = new Date(game.tip_off) <= new Date();
  const isFinal = game.status === "final";

  // Eigener Tipp
  const { data: ownTip } = await supabase
    .from("game_tips")
    .select("predicted_winner_team_id, points_awarded")
    .eq("game_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Alle Tipps - RLS erlaubt fremde Tipps nur wenn (eigener Tipp existiert) oder (tip_off vorbei).
  // Wenn beides nicht zutrifft, kommen wir nur an den eigenen Tipp.
  const { data: allTips } = await supabase
    .from("game_tips")
    .select("user_id, predicted_winner_team_id, points_awarded")
    .eq("game_id", id);

  // Profile fuer Display-Names
  const userIds = Array.from(new Set((allTips ?? []).map((t) => t.user_id)));
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  const canSeeOthers = !!ownTip || tipOffPassed;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400">
        ← Zurück
      </Link>

      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {roundLabel(series?.round ?? null, series?.conference ?? null)}
        </p>
        <h1 className="text-2xl font-bold">
          {away.full_name} <span className="text-zinc-400">@</span> {home.full_name}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {TIME_FMT.format(new Date(game.tip_off))} Uhr
        </p>
        {isFinal && (
          <p className="text-lg font-semibold">
            Endstand: {away.abbreviation} {game.away_score} – {game.home_score} {home.abbreviation}
          </p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tipps</h2>
        {!canSeeOthers ? (
          <p className="text-sm text-zinc-500">
            Andere Tipps werden sichtbar, sobald du selbst getippt hast oder der Tip-Off begonnen hat.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2">Spieler</th>
                <th className="py-2">Tipp</th>
                <th className="py-2 text-right">Punkte</th>
              </tr>
            </thead>
            <tbody>
              {(allTips ?? []).map((t) => {
                const team = t.predicted_winner_team_id === home.id ? home : away;
                const correct =
                  isFinal && game.winner_team_id === t.predicted_winner_team_id;
                return (
                  <tr key={t.user_id} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2">
                      {profileById.get(t.user_id) ?? "?"}
                      {t.user_id === user.id && <span className="ml-1 text-zinc-500">(du)</span>}
                    </td>
                    <td className="py-2 font-medium">{team.abbreviation}</td>
                    <td className="py-2 text-right">
                      {isFinal ? (
                        <span
                          className={
                            correct ? "text-green-600 dark:text-green-400" : "text-zinc-500"
                          }
                        >
                          {correct ? "+1" : "0"}
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
