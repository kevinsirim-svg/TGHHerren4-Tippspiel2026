import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { user, supabase } = await requireUser();

  const [{ data: profiles }, { data: gameTips }, { data: seriesTips }, { data: championTips }] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("game_tips").select("user_id, points_awarded"),
    supabase.from("series_tips").select("user_id, points_awarded"),
    supabase.from("champion_tips").select("user_id, points_awarded"),
  ]);

  type Pts = { game: number; series: number; champion: number; tipped: number };
  const map = new Map<string, Pts>();

  for (const t of gameTips ?? []) {
    const e = map.get(t.user_id) ?? { game: 0, series: 0, champion: 0, tipped: 0 };
    e.tipped += 1;
    if (t.points_awarded != null) e.game += t.points_awarded;
    map.set(t.user_id, e);
  }
  for (const t of seriesTips ?? []) {
    const e = map.get(t.user_id) ?? { game: 0, series: 0, champion: 0, tipped: 0 };
    e.tipped += 1;
    if (t.points_awarded != null) e.series += t.points_awarded;
    map.set(t.user_id, e);
  }
  for (const t of championTips ?? []) {
    const e = map.get(t.user_id) ?? { game: 0, series: 0, champion: 0, tipped: 0 };
    e.tipped += 1;
    if (t.points_awarded != null) e.champion += t.points_awarded;
    map.set(t.user_id, e);
  }

  const rows = (profiles ?? [])
    .map((p) => {
      const pts = map.get(p.id) ?? { game: 0, series: 0, champion: 0, tipped: 0 };
      return {
        id: p.id,
        display_name: p.display_name,
        game_points: pts.game,
        series_points: pts.series,
        champion_points: pts.champion,
        total: pts.game + pts.series + pts.champion,
        tipped: pts.tipped,
      };
    })
    .sort((a, b) => b.total - a.total || a.display_name.localeCompare(b.display_name));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6">
      <Link href="/" className="text-sm font-bold uppercase tracking-wider text-zinc-400 hover:text-orange-400">
        ← Zurueck
      </Link>

      <header className="border-b border-zinc-800 pb-3">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          <span className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">Tabelle</span>
        </h1>
        <p className="text-xs text-zinc-500">
          1 Pkt pro Spiel · 3 Pkt pro Serien-Sieger (+2 Bonus fuer Spielanzahl) · 10 Pkt Champion
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Noch keine Spieler.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="py-2 w-8">#</th>
                <th className="py-2">Spieler</th>
                <th className="py-2 text-right">Spiele</th>
                <th className="py-2 text-right">Serien</th>
                <th className="py-2 text-right">Champ</th>
                <th className="py-2 text-right">Tipps</th>
                <th className="py-2 text-right font-bold">Summe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={
                    "border-t border-zinc-800 " + (r.id === user.id ? "bg-orange-500/5" : "")
                  }
                >
                  <td className="py-2 font-bold text-zinc-500">{i + 1}</td>
                  <td className="py-2">
                    {r.display_name}
                    {r.id === user.id && <span className="ml-1 text-zinc-500">(du)</span>}
                  </td>
                  <td className="py-2 text-right tabular-nums">{r.game_points}</td>
                  <td className="py-2 text-right tabular-nums">{r.series_points}</td>
                  <td className="py-2 text-right tabular-nums">{r.champion_points}</td>
                  <td className="py-2 text-right tabular-nums text-zinc-500">{r.tipped}</td>
                  <td className="py-2 text-right font-extrabold tabular-nums text-orange-400">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
