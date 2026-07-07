// Server-side: Club Cricket of Chicago's squad from the DB, shaped like the CMS
// `playerDetailedCard_Entry` array the players page expects. Tier (scorebycaptain) is
// not used — every player is shown uniformly. Per-player matches/runs/wickets are
// aggregated across CCC's tracked series. (Full career stats live on the player profile
// page, served from the DB — see app/lib/data/player.ts.)

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { CCC_TEAM_IDS, TRACKED_SERIES_IDS, TRACKED_SERIES } from "../cricclubs/config";

// Current-season divisions, for naming which side a captain leads.
const SEASON_YEAR = String(Math.max(...TRACKED_SERIES.map((s) => Number(s.year))));
const SEASON_SERIES = TRACKED_SERIES.filter((s) => s.year === SEASON_YEAR);
const SEASON_IDS = SEASON_SERIES.map((s) => s.id);

const IMG = "https://media.cricclubs.com";
const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";
const fullName = (f?: string | null, l?: string | null) =>
  [f, l].filter(Boolean).join(" ");

type Entry = Record<string, unknown>;

async function buildPlayerEntries(): Promise<{ entries: Entry[] }> {
  const rosterRows = await prisma.teamRoster.findMany({
    where: { teamId: { in: CCC_TEAM_IDS } },
  });
  const playerIds = [...new Set(rosterRows.map((r) => r.playerId))];
  if (playerIds.length === 0) return { entries: [] };

  const [players, batting, bowling, cccTeams, teamStandings] = await Promise.all([
    prisma.player.findMany({ where: { id: { in: playerIds } } }),
    prisma.playerBattingStat.findMany({
      where: { seriesId: { in: TRACKED_SERIES_IDS }, playerId: { in: playerIds } },
      select: { playerId: true, seriesId: true, teamId: true, runs: true, matches: true },
    }),
    prisma.playerBowlingStat.findMany({
      where: { seriesId: { in: TRACKED_SERIES_IDS }, playerId: { in: playerIds } },
      select: { playerId: true, seriesId: true, teamId: true, wickets: true, matches: true },
    }),
    prisma.team.findMany({
      where: { id: { in: CCC_TEAM_IDS } },
      select: { id: true, captainId: true, viceCaptainId: true },
    }),
    prisma.standing.findMany({
      where: { teamId: { in: CCC_TEAM_IDS }, seriesId: { in: SEASON_IDS } },
      select: { teamId: true, seriesId: true },
    }),
  ]);

  // CricClubs records a captain + vice-captain per side; CCC fields one side per
  // division, so a player can lead any of them. The team → division mapping comes
  // from where each team id stands this season.
  const divisionByTeam = new Map<number, string>();
  for (const s of teamStandings) {
    const name = SEASON_SERIES.find((x) => x.id === s.seriesId)?.name;
    if (name && !divisionByTeam.has(s.teamId)) divisionByTeam.set(s.teamId, name);
  }
  const captainDivision = new Map<number, string | undefined>();
  const viceCaptainDivision = new Map<number, string | undefined>();
  for (const t of cccTeams) {
    if (t.captainId && !captainDivision.has(t.captainId))
      captainDivision.set(t.captainId, divisionByTeam.get(t.id));
    if (t.viceCaptainId && !viceCaptainDivision.has(t.viceCaptainId))
      viceCaptainDivision.set(t.viceCaptainId, divisionByTeam.get(t.id));
  }
  const captainIds = new Set(captainDivision.keys());
  const viceCaptainIds = new Set(viceCaptainDivision.keys());

  const runs = new Map<number, number>();
  const wkts = new Map<number, number>();
  // matches counted once per (series, team) — batting and bowling rows for the same
  // side repeat the same appearances (max), while rows for different teams in the same
  // series are separate appearances (summed).
  const matchesBySeries = new Map<number, Map<string, number>>();
  const addMatches = (pid: number, key: string, m: number) => {
    const inner = matchesBySeries.get(pid) ?? new Map<string, number>();
    inner.set(key, Math.max(inner.get(key) ?? 0, m ?? 0));
    matchesBySeries.set(pid, inner);
  };
  batting.forEach((b) => {
    runs.set(b.playerId, (runs.get(b.playerId) ?? 0) + b.runs);
    addMatches(b.playerId, `${b.seriesId}:${b.teamId}`, b.matches);
  });
  bowling.forEach((b) => {
    wkts.set(b.playerId, (wkts.get(b.playerId) ?? 0) + b.wickets);
    addMatches(b.playerId, `${b.seriesId}:${b.teamId}`, b.matches);
  });
  const totalMatches = (pid: number) =>
    [...(matchesBySeries.get(pid)?.values() ?? [])].reduce((a, b) => a + b, 0);

  // jersey: prefer a non-zero number across the player's roster rows
  const jersey = new Map<number, string>();
  for (const r of rosterRows) {
    const cur = jersey.get(r.playerId);
    if (r.jerseyNumber && r.jerseyNumber !== "0") jersey.set(r.playerId, r.jerseyNumber);
    else if (!cur) jersey.set(r.playerId, r.jerseyNumber ?? "0");
  }

  const entries: Entry[] = players.map((p) => ({
    id: String(p.id),
    title: fullName(p.firstName, p.lastName),
    // CricClubs exposes no nationality, so default everyone to the Indian flag (in.svg).
    country: "in",
    teamName: "Club Cricket of Chicago",
    playerImage: [{ url: img(p.profilePic) }],
    nationalFlag: [],
    jerseyNumber: Number(jersey.get(p.id) ?? "0") || 0,
    matches: totalMatches(p.id),
    totalruns: runs.get(p.id) ?? 0,
    wickets: wkts.get(p.id) ?? 0,
    scorebycaptain: 0,
    playerid: p.id,
    isCaptain: captainIds.has(p.id),
    isViceCaptain: !captainIds.has(p.id) && viceCaptainIds.has(p.id),
    leadershipLabel: captainIds.has(p.id)
      ? `Captain${captainDivision.get(p.id) ? ` — ${captainDivision.get(p.id)}` : ""}`
      : viceCaptainIds.has(p.id)
      ? `Vice-captain${viceCaptainDivision.get(p.id) ? ` — ${viceCaptainDivision.get(p.id)}` : ""}`
      : null,
  }));

  entries.sort(
    (a, b) =>
      (b.totalruns as number) - (a.totalruns as number) ||
      (a.title as string).localeCompare(b.title as string)
  );

  return { entries };
}

export const getPlayerEntries = unstable_cache(
  buildPlayerEntries,
  ["player-entries"],
  { revalidate: 600, tags: ["cricclubs"] }
);
