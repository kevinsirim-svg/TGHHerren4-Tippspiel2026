export type Conference = "East" | "West";
export type SeriesConference = Conference | "Finals";
export type SeriesStatus = "upcoming" | "live" | "finished";
export type GameStatus = "scheduled" | "live" | "final";

export type Team = {
  id: number;
  abbreviation: string;
  full_name: string;
  conference: Conference;
};

export type Profile = {
  id: string;
  display_name: string;
  has_seen_welcome: boolean;
  created_at: string;
};

export type Series = {
  id: string;
  round: 1 | 2 | 3 | 4;
  conference: SeriesConference;
  team_a_id: number;
  team_b_id: number;
  starts_at: string | null;
  winner_team_id: number | null;
  games_played: number | null;
  status: SeriesStatus;
  created_at: string;
};

export type Game = {
  id: string;
  external_id: string | null;
  series_id: string | null;
  home_team_id: number;
  away_team_id: number;
  tip_off: string;
  home_score: number | null;
  away_score: number | null;
  winner_team_id: number | null;
  status: GameStatus;
  created_at: string;
  updated_at: string;
};

export type GameTip = {
  user_id: string;
  game_id: string;
  predicted_winner_team_id: number;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
};

export type SeriesTip = {
  user_id: string;
  series_id: string;
  predicted_winner_team_id: number;
  predicted_games: 4 | 5 | 6 | 7;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
};

export type ChampionTip = {
  user_id: string;
  predicted_champion_team_id: number;
  points_awarded: number | null;
  created_at: string;
  updated_at: string;
};

/** Punkte fuer korrekten Champion-Tipp. */
export const CHAMPION_POINTS = 10;
