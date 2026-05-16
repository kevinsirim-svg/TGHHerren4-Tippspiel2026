import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { signOut } from "./login/actions";
import { getActiveSeries, getUpcomingAndRecentGames } from "@/lib/tips/queries";
import { GameCard } from "./_components/GameCard";
import { SeriesCard } from "./_components/SeriesCard";

// Tipps muessen sofort nach Abgabe sichtbar werden -> kein Caching dieser Page.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { user, profile } = await requireUser();
  const [series, games] = await Promise.all([getActiveSeries(user.id), getUpcomingAndRecentGames(user.id)]);

  // Aktive Serien (laufend oder bevorstehend) zuerst, abgeschlossene weiter unten
  const openSeries = series.filter((s) => s.status !== "finished");
  const finishedSeries = series.filter((s) => s.status === "finished");

  // Spiele aufteilen: kommend (noch tippbar) zuerst, vergangen (gespielt) weiter unten
  const now = new Date();
  const upcomingGames = games.filter((g) => g.status !== "final" && new Date(g.tip_off) > now);
  const pastGames = games
    .filter((g) => g.status === "final" || new Date(g.tip_off) <= now)
    .sort((a, b) => new Date(b.tip_off).getTime() - new Date(a.tip_off).getTime());

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">NBA Tippspiel</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Hi {profile?.display_name ?? ""}!</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/leaderboard"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Tabelle
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Serien</h2>
        {openSeries.length === 0 ? (
          <p className="text-sm text-zinc-500">Keine offenen Serien.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {openSeries.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Kommende Spiele</h2>
        {upcomingGames.length === 0 ? (
          <p className="text-sm text-zinc-500">Keine kommenden Spiele in den naechsten Tagen.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        )}
      </section>

      {pastGames.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Vergangene Spiele</h2>
          <div className="flex flex-col gap-3">
            {pastGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {finishedSeries.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Abgeschlossene Serien</h2>
          <div className="flex flex-col gap-3">
            {finishedSeries.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
