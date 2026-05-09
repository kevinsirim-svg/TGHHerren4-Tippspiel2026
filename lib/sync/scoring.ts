import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Punkteregeln:
 *   game_tips    : 1 Pkt wenn predicted_winner_team_id == game.winner_team_id, sonst 0.
 *                  Nur fuer games mit status='final'.
 *   series_tips  : 3 Pkt wenn winner stimmt, +2 Bonus wenn games_played stimmt, sonst 0.
 *                  Nur fuer series mit status='finished'.
 * Tipps zu noch nicht abgeschlossenen Spielen/Serien -> points_awarded=null.
 */
export async function recalcAllPoints(supabase: SupabaseClient) {
  await recalcGameTips(supabase);
  await recalcSeriesTips(supabase);
}

async function recalcGameTips(supabase: SupabaseClient) {
  const { data: games, error } = await supabase
    .from("games")
    .select("id, winner_team_id, status");
  if (error) throw error;
  if (!games) return;

  for (const g of games) {
    if (g.status !== "final" || !g.winner_team_id) {
      await supabase
        .from("game_tips")
        .update({ points_awarded: null })
        .eq("game_id", g.id)
        .not("points_awarded", "is", null);
      continue;
    }

    const { data: tips } = await supabase
      .from("game_tips")
      .select("user_id, predicted_winner_team_id, points_awarded")
      .eq("game_id", g.id);
    if (!tips) continue;

    for (const t of tips) {
      const points = t.predicted_winner_team_id === g.winner_team_id ? 1 : 0;
      if (t.points_awarded === points) continue;
      await supabase
        .from("game_tips")
        .update({ points_awarded: points })
        .eq("user_id", t.user_id)
        .eq("game_id", g.id);
    }
  }
}

async function recalcSeriesTips(supabase: SupabaseClient) {
  const { data: series, error } = await supabase
    .from("series")
    .select("id, winner_team_id, games_played, status");
  if (error) throw error;
  if (!series) return;

  for (const s of series) {
    if (s.status !== "finished" || !s.winner_team_id || !s.games_played) {
      await supabase
        .from("series_tips")
        .update({ points_awarded: null })
        .eq("series_id", s.id)
        .not("points_awarded", "is", null);
      continue;
    }

    const { data: tips } = await supabase
      .from("series_tips")
      .select("user_id, predicted_winner_team_id, predicted_games, points_awarded")
      .eq("series_id", s.id);
    if (!tips) continue;

    for (const t of tips) {
      let points = 0;
      if (t.predicted_winner_team_id === s.winner_team_id) {
        points += 3;
        if (t.predicted_games === s.games_played) points += 2;
      }
      if (t.points_awarded === points) continue;
      await supabase
        .from("series_tips")
        .update({ points_awarded: points })
        .eq("user_id", t.user_id)
        .eq("series_id", s.id);
    }
  }
}
