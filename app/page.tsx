import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { signOut } from "./login/actions";
import { getActiveSeries, getChampionTipState, getUpcomingAndRecentGames } from "@/lib/tips/queries";
import { GameCard } from "./_components/GameCard";
import { SeriesCard } from "./_components/SeriesCard";
import { ChampionTipCard } from "./_components/ChampionTipCard";
import { SyncButton } from "./_components/SyncButton";

// Tipps muessen sofort nach Abgabe sichtbar werden -> kein Caching dieser Page.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { user, profile } = await requireUser();
  const [series, games, championState] = await Promise.all([
    getActiveSeries(user.id),
    getUpcomingAndRecentGames(user.id),
    getChampionTipState(user.id),
  ]);

  // Falls NBA Finals beendet - echten Champion fuer Anzeige bestimmen.
  const finalsSeries = series.find((s) => s.round === 4 && s.status === "finished");
  const actualChampion = finalsSeries
    ? finalsSeries.winner_team_id === finalsSeries.team_a.id
      ? finalsSeries.team_a
      : finalsSeries.winner_team_id === finalsSeries.team_b.id
        ? finalsSeries.team_b
        : null
    : null;

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
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">NBA</span>
            <span className="text-white"> Tippspiel</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-zinc-500">Hi {profile?.display_name ?? ""}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <SyncButton />
          <Link
            href="/welcome?from=rules"
            className="rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-orange-500/60 hover:bg-zinc-800"
          >
            Regeln
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-orange-500/60 hover:bg-zinc-800"
          >
            Tabelle
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-200 hover:border-orange-500/60 hover:bg-zinc-800"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <ChampionTipCard
        eligibleTeams={championState.eligibleTeams}
        locked={championState.locked}
        myTip={championState.myTip}
        actualChampion={actualChampion}
      />

      <section>
        <h2 className="nba-section-title mb-4">Serien</h2>
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
        <h2 className="nba-section-title mb-4">Kommende Spiele</h2>
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
          <h2 className="nba-section-title mb-4">Vergangene Spiele</h2>
          <div className="flex flex-col gap-3">
            {pastGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {finishedSeries.length > 0 && (
        <section>
          <h2 className="nba-section-title mb-4">Abgeschlossene Serien</h2>
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
