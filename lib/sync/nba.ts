import { createAdminClient } from "@/lib/supabase/admin";
import { fetchPlayoffScoreboardRange } from "@/lib/espn/client";
import { mapEvent, type MappedGame, type SeriesConference } from "@/lib/espn/mapper";
import { recalcAllPoints } from "./scoring";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SyncStats = {
  events_fetched: number;
  events_skipped: number;
  games_upserted: number;
  series_upserted: number;
  series_finished: number;
  errors: string[];
};

const PLAYOFFS_LOOKBACK_DAYS = 14;
const PLAYOFFS_LOOKAHEAD_DAYS = 60;

export async function syncNBA(): Promise<SyncStats> {
  const stats: SyncStats = {
    events_fetched: 0,
    events_skipped: 0,
    games_upserted: 0,
    series_upserted: 0,
    series_finished: 0,
    errors: [],
  };

  const supabase = createAdminClient();

  // Teams einmalig laden fuer Abkuerzung -> id Lookup.
  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("id, abbreviation");
  if (teamsError || !teamsData) {
    throw new Error(`Failed to load teams: ${teamsError?.message ?? "no data"}`);
  }
  const teamByAbbr = new Map<string, number>(teamsData.map((t) => [t.abbreviation, t.id]));

  // ESPN-Events laden.
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - PLAYOFFS_LOOKBACK_DAYS);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() + PLAYOFFS_LOOKAHEAD_DAYS);
  const events = await fetchPlayoffScoreboardRange(start, end);
  stats.events_fetched = events.length;

  // Spiele nach Serie gruppieren (round + conference + sortierte Team-Paarung).
  type GroupedGame = {
    mapped: MappedGame;
    home_team_id: number;
    away_team_id: number;
    team_a_id: number;
    team_b_id: number;
  };
  const seriesGroups = new Map<string, GroupedGame[]>();

  for (const ev of events) {
    const m = mapEvent(ev);
    if (!m) {
      stats.events_skipped++;
      continue;
    }
    if (!m.round || !m.conference) {
      stats.events_skipped++;
      continue;
    }
    const home_team_id = teamByAbbr.get(m.home_abbr);
    const away_team_id = teamByAbbr.get(m.away_abbr);
    if (!home_team_id || !away_team_id) {
      if (m.home_abbr !== "TBD" && m.away_abbr !== "TBD") {
        stats.errors.push(`Unknown team abbreviation: ${m.home_abbr} or ${m.away_abbr}`);
      }
      stats.events_skipped++;
      continue;
    }
    const team_a_id = Math.min(home_team_id, away_team_id);
    const team_b_id = Math.max(home_team_id, away_team_id);
    const key = `${m.round}|${m.conference}|${team_a_id}|${team_b_id}`;

    const arr = seriesGroups.get(key) ?? [];
    arr.push({ mapped: m, home_team_id, away_team_id, team_a_id, team_b_id });
    seriesGroups.set(key, arr);
  }

  // 1) Pro Serie aus ESPN: upsert series + upsert games + starts_at.
  //    (Winner-Ableitung erfolgt in Schritt 2, damit auch Series ausserhalb
  //    des ESPN-Fensters geprueft werden.)
  for (const [, games] of seriesGroups) {
    const first = games[0];
    const { mapped: m, team_a_id, team_b_id } = first;
    const round = m.round!;
    const conference = m.conference! as SeriesConference;

    let seriesId: string;
    const { data: existing } = await supabase
      .from("series")
      .select("id")
      .eq("round", round)
      .eq("conference", conference)
      .eq("team_a_id", team_a_id)
      .eq("team_b_id", team_b_id)
      .maybeSingle();

    if (existing) {
      seriesId = existing.id;
    } else {
      const { data: created, error: insertErr } = await supabase
        .from("series")
        .insert({ round, conference, team_a_id, team_b_id })
        .select("id")
        .single();
      if (insertErr || !created) {
        stats.errors.push(`Insert series failed (round=${round} conf=${conference} ${team_a_id}-${team_b_id}): ${insertErr?.message}`);
        continue;
      }
      seriesId = created.id;
      stats.series_upserted++;
    }

    let earliestTipOff: string | null = null;

    for (const g of games) {
      const winner_team_id = g.mapped.winner_abbr ? teamByAbbr.get(g.mapped.winner_abbr) ?? null : null;
      const { error: upsertErr } = await supabase.from("games").upsert(
        {
          external_id: g.mapped.external_id,
          series_id: seriesId,
          home_team_id: g.home_team_id,
          away_team_id: g.away_team_id,
          tip_off: g.mapped.tip_off,
          home_score: g.mapped.home_score,
          away_score: g.mapped.away_score,
          winner_team_id,
          status: g.mapped.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "external_id" },
      );
      if (upsertErr) {
        stats.errors.push(`Upsert game ${g.mapped.external_id} failed: ${upsertErr.message}`);
        continue;
      }
      stats.games_upserted++;
      if (!earliestTipOff || g.mapped.tip_off < earliestTipOff) earliestTipOff = g.mapped.tip_off;
    }

    if (earliestTipOff) {
      await supabase.from("series").update({ starts_at: earliestTipOff }).eq("id", seriesId);
    }
  }

  // 2) ALLE noch nicht abgeschlossenen Serien re-evaluieren - unabhaengig vom ESPN-Fenster.
  //    Das deckt Serien ab, deren Spiele aelter sind als unsere Lookback-Range.
  const { data: openSeries } = await supabase
    .from("series")
    .select("id")
    .neq("status", "finished");

  if (openSeries) {
    for (const s of openSeries) {
      const finished = await evaluateSeriesWinner(supabase, s.id);
      if (finished) stats.series_finished++;
    }
  }

  // Punkte fuer alle Tipps neu berechnen.
  await recalcAllPoints(supabase);

  return stats;
}

/**
 * Wertet die finalen Spiele einer Serie aus.
 * - 4 Siege -> series.status = 'finished' + winner + games_played
 * - sonst, wenn schon finale Spiele -> series.status = 'live'
 * Returns true, wenn die Serie als finished markiert wurde.
 */
async function evaluateSeriesWinner(supabase: SupabaseClient, seriesId: string): Promise<boolean> {
  const { data: finalGames } = await supabase
    .from("games")
    .select("winner_team_id")
    .eq("series_id", seriesId)
    .eq("status", "final");

  if (!finalGames || finalGames.length === 0) return false;

  const wins = new Map<number, number>();
  for (const fg of finalGames) {
    if (fg.winner_team_id) wins.set(fg.winner_team_id, (wins.get(fg.winner_team_id) ?? 0) + 1);
  }
  const totalGames = Array.from(wins.values()).reduce((a, b) => a + b, 0);
  let winner: number | null = null;
  for (const [teamId, w] of wins) {
    if (w >= 4) winner = teamId;
  }

  if (winner) {
    await supabase
      .from("series")
      .update({ winner_team_id: winner, games_played: totalGames, status: "finished" })
      .eq("id", seriesId);
    return true;
  }
  await supabase.from("series").update({ status: "live" }).eq("id", seriesId);
  return false;
}
