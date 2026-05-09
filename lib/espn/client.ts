const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

export type EspnNote = { type?: string; headline?: string };

export type EspnTeam = {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  name?: string;
  location?: string;
};

export type EspnCompetitor = {
  id: string;
  homeAway: "home" | "away";
  winner?: boolean;
  score?: string;
  team: EspnTeam;
};

export type EspnStatus = {
  type: { id: string; name: string; state: string; completed: boolean; description: string };
};

export type EspnCompetition = {
  id: string;
  competitors: EspnCompetitor[];
  notes?: EspnNote[];
  status: EspnStatus;
};

export type EspnEvent = {
  id: string;
  date: string; // ISO
  name: string;
  shortName: string;
  season: { year: number; type: number };
  competitions: EspnCompetition[];
};

export type EspnScoreboard = {
  events: EspnEvent[];
};

function formatDateForEspn(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/**
 * Holt alle Playoff-Events (seasontype=3) im angegebenen Datumsbereich.
 * ESPN unterstuetzt YYYYMMDD-YYYYMMDD als Range.
 */
export async function fetchPlayoffScoreboardRange(start: Date, end: Date): Promise<EspnEvent[]> {
  const range = `${formatDateForEspn(start)}-${formatDateForEspn(end)}`;
  const url = `${ESPN_BASE}/scoreboard?dates=${range}&seasontype=3&limit=200`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "nba-tipspiel/1.0" },
  });
  if (!res.ok) {
    throw new Error(`ESPN API error ${res.status}: ${res.statusText}`);
  }
  const data = (await res.json()) as EspnScoreboard;
  return data.events ?? [];
}
