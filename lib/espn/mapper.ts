import type { EspnEvent, EspnNote } from "./client";

// ESPN nutzt teils kuerzere Codes als unsere Stammdaten - normalisieren.
const ESPN_TO_OUR_ABBR: Record<string, string> = {
  NY: "NYK",
  GS: "GSW",
  NO: "NOP",
  SA: "SAS",
  UTAH: "UTA",
};

export function normalizeAbbr(abbr: string): string {
  return ESPN_TO_OUR_ABBR[abbr.toUpperCase()] ?? abbr.toUpperCase();
}

export type GameStatus = "scheduled" | "live" | "final";
export type SeriesConference = "East" | "West" | "Finals";

export type MappedGame = {
  external_id: string;
  tip_off: string; // ISO
  home_abbr: string;
  away_abbr: string;
  home_score: number | null;
  away_score: number | null;
  winner_abbr: string | null;
  status: GameStatus;
  round: 1 | 2 | 3 | 4 | null;
  conference: SeriesConference | null;
};

function mapStatus(name: string): GameStatus {
  if (name === "STATUS_SCHEDULED") return "scheduled";
  if (name === "STATUS_FINAL") return "final";
  return "live"; // STATUS_IN_PROGRESS, STATUS_HALFTIME, STATUS_END_PERIOD, ...
}

/**
 * Ableitung von Round + Conference aus den ESPN-Headlines.
 * Beispiele:
 *   "East 1st Round - Game 2"       -> round 1, conference East
 *   "West Semifinals - Game 1"      -> round 2, conference West
 *   "East Conf Finals - Game 4"     -> round 3, conference East
 *   "NBA Finals - Game 7"           -> round 4, conference Finals
 */
function parseRoundFromNotes(notes: EspnNote[]): { round: 1 | 2 | 3 | 4 | null; conference: SeriesConference | null } {
  for (const n of notes) {
    const h = (n.headline ?? "").trim();
    if (!h) continue;

    if (/NBA Finals/i.test(h)) {
      return { round: 4, conference: "Finals" };
    }
    const isEast = /\bEast\b/i.test(h);
    const isWest = /\bWest\b/i.test(h);
    const conf: SeriesConference | null = isEast ? "East" : isWest ? "West" : null;

    if (/(Conf(?:erence)?\s*Finals)/i.test(h)) return { round: 3, conference: conf };
    if (/Semifinals|Semis/i.test(h)) return { round: 2, conference: conf };
    if (/1st Round|First Round/i.test(h)) return { round: 1, conference: conf };
  }
  return { round: null, conference: null };
}

export function mapEvent(ev: EspnEvent): MappedGame | null {
  const comp = ev.competitions?.[0];
  if (!comp) return null;

  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  if (!home || !away) return null;

  const home_abbr = normalizeAbbr(home.team.abbreviation);
  const away_abbr = normalizeAbbr(away.team.abbreviation);

  const status = mapStatus(comp.status.type.name);

  const home_score = status === "scheduled" || home.score == null ? null : Number(home.score);
  const away_score = status === "scheduled" || away.score == null ? null : Number(away.score);

  let winner_abbr: string | null = null;
  if (status === "final") {
    if (home.winner) winner_abbr = home_abbr;
    else if (away.winner) winner_abbr = away_abbr;
  }

  const { round, conference } = parseRoundFromNotes(comp.notes ?? []);

  return {
    external_id: ev.id,
    tip_off: ev.date,
    home_abbr,
    away_abbr,
    home_score,
    away_score,
    winner_abbr,
    status,
    round,
    conference,
  };
}
