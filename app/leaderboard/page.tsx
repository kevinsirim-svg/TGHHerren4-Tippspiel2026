import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { user, supabase } = await requireUser();

  const [{ data: profiles }, { data: gameTips }, { data: seriesTips }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("game_tips").select("user_id, points_awarded"),
    supabase.from("series_tips").select("user_id, points_awarded"),
  ]);

  type Pts = { game: number; series: number; gameCorrect: number; seriesCorrect: number; tipped: number };
  const map = new Map<string, Pts>();

  for (const t of gameTips ?? []) {
    const e = map.get(t.user_id) ?? { game: 0, series: 0, gameCorrect: 0, seriesCorrect: 0, tipped: 0 };
    e.tipped += 1;
    if (t.points_awarded != null) {
      e.game += t.points_awarded;
      if (t.points_awarded > 0) e.gameCorrect += 1;
    }
    map.set(t.user_id, e);
  }
  for (const t of seriesTips ?? []) {
    const e = map.get(t.user_id) ?? { game: 0, series: 0, gameCorrect: 0, seriesCorrect: 0, tipped: 0 };
    e.tipped += 1;
    if (t.points_awarded != null) {
      e.series += t.points_awarded;
      if (t.points_awarded > 0) e.seriesCorrect += 1;
    }
    map.set(t.user_id, e);
  }

  const rows = (profiles ?? [])
    .map((p) => {
      const pts = map.get(p.id) ?? { game: 0, series: 0, gameCorrect: 0, seriesCorrect: 0, tipped: 0 };
      return {
        id: p.id,
        display_name: p.display_name,
        game_points: pts.game,
        series_points: pts.series,
        total: pts.game + pts.series,
        tipped: pts.tipped,
      };
    })
    .sort((a, b) => b.total - a.total || a.display_name.localeCompare(b.display_name));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400">
        ← Zurück
      </Link>

      <header>
        <h1 className="text-2xl font-bold">Tabelle</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          1 Pkt pro Spiel · 3 Pkt pro Serien-Sieger · +2 Bonus fuer richtige Spielanzahl
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Noch keine Spieler.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-2 w-8">#</th>
              <th className="py-2">Spieler</th>
              <th className="py-2 text-right">Spiele</th>
              <th className="py-2 text-right">Serien</th>
              <th className="py-2 text-right">Tipps</th>
              <th className="py-2 text-right font-bold">Summe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id}
                className={
                  "border-t border-zinc-200 dark:border-zinc-800 " +
                  (r.id === user.id ? "bg-zinc-50 dark:bg-zinc-900" : "")
                }
              >
                <td className="py-2 text-zinc-500">{i + 1}</td>
                <td className="py-2">
                  {r.display_name}
                  {r.id === user.id && <span className="ml-1 text-zinc-500">(du)</span>}
                </td>
                <td className="py-2 text-right">{r.game_points}</td>
                <td className="py-2 text-right">{r.series_points}</td>
                <td className="py-2 text-right text-zinc-500">{r.tipped}</td>
                <td className="py-2 text-right font-bold">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
