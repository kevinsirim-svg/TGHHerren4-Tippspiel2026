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

const CHUNK_DAYS = 14;

/**
 * Holt alle Playoff-Events (seasontype=3) im angegebenen Datumsbereich.
 * ESPN ignoriert den seasontype-Filter bei grossen Ranges (>~30 Tage) und
 * liefert dann regulaere Saison-Games. Wir teilen den Range deshalb in
 * Chunks von 14 Tagen und filtern zur Sicherheit lokal auf season.type=3.
 */
export async function fetchPlayoffScoreboardRange(start: Date, end: Date): Promise<EspnEvent[]> {
  const all: EspnEvent[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setUTCDate(chunkEnd.getUTCDate() + CHUNK_DAYS - 1);
    if (chunkEnd > end) chunkEnd.setTime(end.getTime());

    const range = `${formatDateForEspn(cursor)}-${formatDateForEspn(chunkEnd)}`;
    const url = `${ESPN_BASE}/scoreboard?dates=${range}&seasontype=3&limit=200`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "nba-tipspiel/1.0" },
    });
    if (res.ok) {
      const data = (await res.json()) as EspnScoreboard;
      for (const ev of data.events ?? []) {
        if (ev.season?.type === 3) all.push(ev);
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + CHUNK_DAYS);
  }

  // Dedupe nach id (sollte zwischen Chunks nicht ueberlappen, aber safety).
  const seen = new Set<string>();
  return all.filter((ev) => {
    if (seen.has(ev.id)) return false;
    seen.add(ev.id);
    return true;
  });
}
