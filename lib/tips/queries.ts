import { createClient } from "@/lib/supabase/server";
import type {
  Team,
  Game,
  Series,
  GameTip,
  SeriesTip,
  SeriesConference,
} from "@/lib/types/database";

export type GameWithDetails = Game & {
  home_team: Team;
  away_team: Team;
  series_round: number | null;
  series_conference: SeriesConference | null;
  my_tip: Pick<GameTip, "predicted_winner_team_id" | "points_awarded"> | null;
};

export type SeriesWithDetails = Series & {
  team_a: Team;
  team_b: Team;
  wins_team_a: number;
  wins_team_b: number;
  my_tip: Pick<SeriesTip, "predicted_winner_team_id" | "predicted_games" | "points_awarded"> | null;
};

export async function getTeamsMap(): Promise<Map<number, Team>> {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*");
  return new Map((data ?? []).map((t) => [t.id, t as Team]));
}

export async function getUpcomingAndRecentGames(userId: string): Promise<GameWithDetails[]> {
  const supabase = await createClient();
  const teams = await getTeamsMap();

  const past = new Date();
  past.setDate(past.getDate() - 3);
  const future = new Date();
  future.setDate(future.getDate() + 14);

  const { data: games } = await supabase
    .from("games")
    .select("*")
    .gte("tip_off", past.toISOString())
    .lte("tip_off", future.toISOString())
    .order("tip_off", { ascending: true });
  if (!games) return [];

  const seriesIds = Array.from(new Set(games.map((g) => g.series_id).filter((id): id is string => !!id)));
  const { data: seriesData } = seriesIds.length
    ? await supabase.from("series").select("id, round, conference, status").in("id", seriesIds)
    : { data: [] };
  const seriesById = new Map<string, { round: number; conference: SeriesConference; status: string }>();
  for (const s of seriesData ?? []) seriesById.set(s.id, { round: s.round, conference: s.conference, status: s.status });

  // Spiele aus bereits entschiedenen Serien rausfiltern (z.B. Game 5-7
  // die bei einem Sweep nie stattfinden, aber im ESPN-Plan stehen).
  const relevantGames = games.filter((g) => {
    if (!g.series_id) return true;
    const series = seriesById.get(g.series_id);
    return !series || series.status !== "finished";
  });

  const gameIds = relevantGames.map((g) => g.id);
  const { data: myTips } = gameIds.length
    ? await supabase
        .from("game_tips")
        .select("game_id, predicted_winner_team_id, points_awarded")
        .eq("user_id", userId)
        .in("game_id", gameIds)
    : { data: [] };
  const myTipsByGame = new Map((myTips ?? []).map((t) => [t.game_id, t]));

  return relevantGames.map((g) => {
    const series = g.series_id ? seriesById.get(g.series_id) : null;
    return {
      ...(g as Game),
      home_team: teams.get(g.home_team_id)!,
      away_team: teams.get(g.away_team_id)!,
      series_round: series?.round ?? null,
      series_conference: series?.conference ?? null,
      my_tip: myTipsByGame.get(g.id) ?? null,
    };
  });
}

export async function getActiveSeries(userId: string): Promise<SeriesWithDetails[]> {
  const supabase = await createClient();
  const teams = await getTeamsMap();

  const { data: series } = await supabase
    .from("series")
    .select("*")
    .order("round", { ascending: true });
  if (!series) return [];

  const seriesIds = series.map((s) => s.id);
  const { data: finalGames } = seriesIds.length
    ? await supabase
        .from("games")
        .select("series_id, winner_team_id")
        .in("series_id", seriesIds)
        .eq("status", "final")
    : { data: [] };

  const winsBySeries = new Map<string, Map<number, number>>();
  for (const g of finalGames ?? []) {
    if (!g.series_id || !g.winner_team_id) continue;
    if (!winsBySeries.has(g.series_id)) winsBySeries.set(g.series_id, new Map());
    const m = winsBySeries.get(g.series_id)!;
    m.set(g.winner_team_id, (m.get(g.winner_team_id) ?? 0) + 1);
  }

  const { data: myTips } = seriesIds.length
    ? await supabase
        .from("series_tips")
        .select("series_id, predicted_winner_team_id, predicted_games, points_awarded")
        .eq("user_id", userId)
        .in("series_id", seriesIds)
    : { data: [] };
  const myTipsBySeries = new Map((myTips ?? []).map((t) => [t.series_id, t]));

  return series.map((s) => {
    const wins = winsBySeries.get(s.id);
    return {
      ...(s as Series),
      team_a: teams.get(s.team_a_id)!,
      team_b: teams.get(s.team_b_id)!,
      wins_team_a: wins?.get(s.team_a_id) ?? 0,
      wins_team_b: wins?.get(s.team_b_id) ?? 0,
      my_tip: myTipsBySeries.get(s.id) ?? null,
    };
  });
}

export function roundLabel(round: number | null, conference: SeriesConference | null): string {
  if (!round) return "";
  if (round === 4) return "NBA Finals";
  const confLabel = conference === "East" ? "East" : conference === "West" ? "West" : "";
  if (round === 1) return `${confLabel} 1st Round`.trim();
  if (round === 2) return `${confLabel} Semifinals`.trim();
  if (round === 3) return `${confLabel} Conf Finals`.trim();
  return "";
}
