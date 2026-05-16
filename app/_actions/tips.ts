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

  // Tipps sind final - wenn bereits einer existiert, nicht ueberschreiben.
  const { data: existing } = await supabase
    .from("game_tips")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .maybeSingle();
  if (existing) return;

  // RLS verhindert Insert nach tip_off.
  await supabase.from("game_tips").insert({
    user_id: user.id,
    game_id: gameId,
    predicted_winner_team_id: predictedWinnerTeamId,
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

  const { data: existing } = await supabase
    .from("series_tips")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("series_id", seriesId)
    .maybeSingle();
  if (existing) return;

  // Series-Tipps nur vor Beginn der Serie zulassen.
  const { data: series } = await supabase
    .from("series")
    .select("starts_at, status")
    .eq("id", seriesId)
    .single();
  if (!series) return;
  if (series.status === "finished") return;
  if (series.starts_at && new Date(series.starts_at) <= new Date()) return;

  await supabase.from("series_tips").insert({
    user_id: user.id,
    series_id: seriesId,
    predicted_winner_team_id: predictedWinnerTeamId,
    predicted_games: predictedGames,
  });

  revalidatePath("/");
  revalidatePath(`/series/${seriesId}`);
}
