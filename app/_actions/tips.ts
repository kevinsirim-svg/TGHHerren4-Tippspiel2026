"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitGameTip(formData: FormData): Promise<void> {
  const gameId = String(formData.get("game_id") ?? "");
  const predictedWinnerTeamId = Number(formData.get("predicted_winner_team_id"));

  if (!gameId || !Number.isFinite(predictedWinnerTeamId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // RLS-Policy verhindert Insert/Update nach tip_off - kein zusaetzlicher Check noetig.
  await supabase.from("game_tips").upsert({
    user_id: user.id,
    game_id: gameId,
    predicted_winner_team_id: predictedWinnerTeamId,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/");
  revalidatePath(`/game/${gameId}`);
}

export async function submitSeriesTip(formData: FormData): Promise<void> {
  const seriesId = String(formData.get("series_id") ?? "");
  const predictedWinnerTeamId = Number(formData.get("predicted_winner_team_id"));
  const predictedGames = Number(formData.get("predicted_games"));

  if (!seriesId || !Number.isFinite(predictedWinnerTeamId)) return;
  if (!Number.isFinite(predictedGames) || predictedGames < 4 || predictedGames > 7) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("series_tips").upsert({
    user_id: user.id,
    series_id: seriesId,
    predicted_winner_team_id: predictedWinnerTeamId,
    predicted_games: predictedGames,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/");
  revalidatePath(`/series/${seriesId}`);
}
