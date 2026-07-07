// Server-side: rich home-page data for Club Cricket of Chicago's current season
// (Summer 2026 divisions), aggregated from the DB. Powers the home "season hub":
// stat highlights, top performers, and a division standings snapshot.

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { TRACKED_SERIES } from "../cricclubs/config";
import { CCC_NAME, isCCCName, isCCCSide, cccMatchOr } from "./ccc";

const IMG = "https://media.cricclubs.com";
const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";
const fullName = (f?: string | null, l?: string | null) =>
  [f, l].filter(Boolean).join(" ");
// CCC's stat rows can carry any of its team names across divisions.
const CCC_TEAM_NAMES = [CCC_NAME, "Club Cricket Of Chicago Seekers", "CCC Stars"];

const SEASON = "Summer 2026";
const SEASON_SERIES = TRACKED_SERIES.filter((s) => s.year === "2026");
const SEASON_IDS = SEASON_SERIES.map((s) => s.id);

export interface Performer {
  name: string;
  pic: string;
  value: number;
  team: string;
}
/** One completed match in a division's recent form, oldest → newest. */
export type FormLetter = "W" | "L" | "T" | "N";
export interface DivisionSnapshot {
  name: string;
  slug: string;
  year: string;
  teams: number;
  position: number | null;
  played: number;
  won: number;
  lost: number;
  points: number;
  /** Last up-to-5 completed CCC results in this division, oldest first. */
  form: FormLetter[];
}
/** A completed CCC match from a previous season played around this calendar date. */
export interface OnThisDay {
  dateLabel: string; // e.g. "Jul 28, 2025"
  seriesName: string;
  opponentName: string;
  cccScore: string;
  oppScore: string;
  cccWon: boolean;
  result: string; // raw CricClubs result string
}
export interface HomeData {
  season: string;
  stats: { matches: number; runs: number; wickets: number; sixes: number };
  topBatsmen: Performer[];
  topBowlers: Performer[];
  divisions: DivisionSnapshot[];
  /** When the CricClubs mirror last synced (max across entities), ISO string. */
  syncedAt: string | null;
  onThisDay: OnThisDay | null;
}

async function buildHomeData(): Promise<HomeData> {
  const [battingRows, bowlingRows, standings, formMatches, syncAgg, pastMatches] =
    await Promise.all([
    prisma.playerBattingStat.findMany({
      where: { seriesId: { in: SEASON_IDS }, teamName: { in: CCC_TEAM_NAMES } },
    }),
    prisma.playerBowlingStat.findMany({
      where: { seriesId: { in: SEASON_IDS }, teamName: { in: CCC_TEAM_NAMES } },
    }),
    prisma.standing.findMany({
      where: { seriesId: { in: SEASON_IDS } },
      orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
    }),
    prisma.match.findMany({
      where: { seriesId: { in: SEASON_IDS }, isComplete: true, OR: cccMatchOr },
      orderBy: [{ lastUpdated: "desc" }, { id: "desc" }],
    }),
    prisma.syncState.aggregate({ _max: { lastSyncedAt: true } }),
    prisma.match.findMany({
      where: { isComplete: true, OR: cccMatchOr, NOT: { seriesId: { in: SEASON_IDS } } },
      select: {
        matchDate: true, seriesName: true, result: true, winner: true,
        teamOneId: true, teamTwoId: true, teamOneName: true, teamTwoName: true,
        t1Total: true, t1Wickets: true, t2Total: true, t2Wickets: true,
      },
    }),
  ]);

  // Per-division recent form, W/L/T/N from CCC's perspective (raw result strings decide
  // ties/no-results; anything without a winner or tie marker counts as N, not L).
  const formBySeries = new Map<number, FormLetter[]>();
  for (const m of formMatches) {
    const list = formBySeries.get(m.seriesId) ?? [];
    if (list.length >= 5) continue;
    const cccIsT1 = isCCCSide(m.teamOneName, m.teamOneId);
    const result = (m.result ?? "").toLowerCase();
    let letter: FormLetter;
    if (result.includes("tie")) letter = "T";
    else if (result.includes("abandon") || result.includes("no result")) letter = "N";
    else if (m.winner != null)
      letter =
        (cccIsT1 && m.winner === m.teamOneId) || (!cccIsT1 && m.winner === m.teamTwoId)
          ? "W"
          : "L";
    else letter = "N";
    list.push(letter);
    formBySeries.set(m.seriesId, list);
  }

  // Aggregate per player across the season's divisions.
  const batAgg = new Map<number, Performer & { sixes: number }>();
  for (const b of battingRows) {
    const e =
      batAgg.get(b.playerId) ??
      { name: fullName(b.firstName, b.lastName), pic: img(b.profilePic), value: 0, sixes: 0, team: CCC_NAME };
    e.value += b.runs;
    e.sixes += b.sixes;
    if (!e.pic) e.pic = img(b.profilePic);
    batAgg.set(b.playerId, e);
  }
  const bowlAgg = new Map<number, Performer>();
  for (const b of bowlingRows) {
    const e =
      bowlAgg.get(b.playerId) ??
      { name: fullName(b.firstName, b.lastName), pic: img(b.profilePic), value: 0, team: CCC_NAME };
    e.value += b.wickets;
    if (!e.pic) e.pic = img(b.profilePic);
    bowlAgg.set(b.playerId, e);
  }

  const topBatsmen = [...batAgg.values()]
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(({ name, pic, value, team }) => ({ name, pic, value, team }));
  const topBowlers = [...bowlAgg.values()]
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const runs = [...batAgg.values()].reduce((s, e) => s + e.value, 0);
  const sixes = [...batAgg.values()].reduce((s, e) => s + e.sixes, 0);
  const wickets = [...bowlAgg.values()].reduce((s, e) => s + e.value, 0);
  const matches = standings
    .filter((s) => isCCCName(s.teamName))
    .reduce((s, r) => s + r.matches, 0);

  const divisions: DivisionSnapshot[] = SEASON_SERIES.map((s) => {
    const table = standings.filter((r) => r.seriesId === s.id); // points-desc order preserved
    const idx = table.findIndex((r) => isCCCName(r.teamName));
    const row = idx >= 0 ? table[idx] : null;
    return {
      name: s.name,
      slug: String(s.id),
      year: s.year,
      teams: table.length,
      position: idx >= 0 ? idx + 1 : null,
      played: row?.matches ?? 0,
      won: row?.won ?? 0,
      lost: row?.lost ?? 0,
      points: row?.points ?? 0,
      form: (formBySeries.get(s.id) ?? []).slice().reverse(), // oldest → newest
    };
  });

  // "This week in club history": a completed CCC match from a previous season
  // played within ±10 days of today's calendar date. Prefer wins, then recency.
  const now = new Date();
  const dayOfYear = (m: number, d: number) => m * 31 + d; // ordering proxy, fine at ±10d
  const todayKey = dayOfYear(now.getUTCMonth() + 1, now.getUTCDate());
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  type Candidate = { onThisDay: OnThisDay; won: boolean; year: number; dist: number };
  const candidates: Candidate[] = [];
  for (const m of pastMatches) {
    const md = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec((m.matchDate ?? "").trim());
    if (!md) continue;
    const [, mm, dd, yyyy] = md.map(Number);
    if (yyyy >= now.getUTCFullYear()) continue;
    const dist = Math.abs(dayOfYear(mm, dd) - todayKey);
    if (dist > 10) continue;
    if ((m.t1Total ?? 0) === 0 && (m.t2Total ?? 0) === 0) continue; // forfeits
    const cccIsT1 = isCCCSide(m.teamOneName, m.teamOneId);
    const won =
      m.winner != null &&
      ((cccIsT1 && m.winner === m.teamOneId) || (!cccIsT1 && m.winner === m.teamTwoId));
    const score = (t: number | null, w: number | null) => `${t ?? 0}/${w ?? 0}`;
    candidates.push({
      won,
      year: yyyy,
      dist,
      onThisDay: {
        dateLabel: `${MONTHS[mm - 1]} ${dd}, ${yyyy}`,
        seriesName: m.seriesName ?? "",
        opponentName: (cccIsT1 ? m.teamTwoName : m.teamOneName) ?? "",
        cccScore: cccIsT1 ? score(m.t1Total, m.t1Wickets) : score(m.t2Total, m.t2Wickets),
        oppScore: cccIsT1 ? score(m.t2Total, m.t2Wickets) : score(m.t1Total, m.t1Wickets),
        cccWon: won,
        result: m.result ?? "",
      },
    });
  }
  candidates.sort(
    (a, b) => Number(b.won) - Number(a.won) || b.year - a.year || a.dist - b.dist
  );

  return {
    season: SEASON,
    stats: { matches, runs, wickets, sixes },
    topBatsmen,
    topBowlers,
    divisions,
    syncedAt: syncAgg._max.lastSyncedAt?.toISOString() ?? null,
    onThisDay: candidates[0]?.onThisDay ?? null,
  };
}

export const getHomeData = unstable_cache(buildHomeData, ["home-data"], {
  revalidate: 120,
  tags: ["cricclubs"],
});
