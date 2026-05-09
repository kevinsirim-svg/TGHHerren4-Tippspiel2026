// NBA-Team Meta-Daten: Logo (ESPN CDN) und Primaerfarbe.
// Keys sind unsere normalisierten Abkuerzungen (siehe lib/espn/mapper.ts).

type TeamMeta = {
  /** ESPN CDN Slug fuer das Team-Logo (z.B. "bos" -> https://a.espncdn.com/i/teamlogos/nba/500/bos.png) */
  espn: string;
  /** Primaerfarbe als Hex (offizielle Team-Farbe). */
  color: string;
};

const TEAM_META: Record<string, TeamMeta> = {
  ATL: { espn: "atl", color: "#E03A3E" },
  BOS: { espn: "bos", color: "#007A33" },
  BKN: { espn: "bkn", color: "#000000" },
  CHA: { espn: "cha", color: "#1D1160" },
  CHI: { espn: "chi", color: "#CE1141" },
  CLE: { espn: "cle", color: "#860038" },
  DAL: { espn: "dal", color: "#00538C" },
  DEN: { espn: "den", color: "#0E2240" },
  DET: { espn: "det", color: "#C8102E" },
  GSW: { espn: "gs", color: "#1D428A" },
  HOU: { espn: "hou", color: "#CE1141" },
  IND: { espn: "ind", color: "#002D62" },
  LAC: { espn: "lac", color: "#C8102E" },
  LAL: { espn: "lal", color: "#552583" },
  MEM: { espn: "mem", color: "#5D76A9" },
  MIA: { espn: "mia", color: "#98002E" },
  MIL: { espn: "mil", color: "#00471B" },
  MIN: { espn: "min", color: "#0C2340" },
  NOP: { espn: "no", color: "#0C2340" },
  NYK: { espn: "ny", color: "#006BB6" },
  OKC: { espn: "okc", color: "#007AC1" },
  ORL: { espn: "orl", color: "#0077C0" },
  PHI: { espn: "phi", color: "#006BB6" },
  PHX: { espn: "phx", color: "#1D1160" },
  POR: { espn: "por", color: "#E03A3E" },
  SAC: { espn: "sac", color: "#5A2D81" },
  SAS: { espn: "sa", color: "#000000" },
  TOR: { espn: "tor", color: "#CE1141" },
  UTA: { espn: "utah", color: "#002B5C" },
  WAS: { espn: "wsh", color: "#002B5C" },
};

const FALLBACK: TeamMeta = { espn: "", color: "#71717a" };

export function teamLogoUrl(abbreviation: string): string | null {
  const meta = TEAM_META[abbreviation.toUpperCase()];
  if (!meta?.espn) return null;
  return `https://a.espncdn.com/i/teamlogos/nba/500/${meta.espn}.png`;
}

export function teamColor(abbreviation: string): string {
  return TEAM_META[abbreviation.toUpperCase()]?.color ?? FALLBACK.color;
}
