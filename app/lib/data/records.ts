// Server-side: all-time Club Cricket of Chicago records & milestones, aggregated
// from the per-series stat tables across every tracked season (2022 → 2026).
//
// "Career" here means the player's CCC club career: the sum of their CCC stat rows
// across TRACKED_SERIES. (PlayerCareer.careerStats is NOT used — it spans a player's
// whole CricClubs history including other clubs' teams, and only covers players whose
// profiles have been synced, so it can't scope to club-only records.)
// Values are shown raw, exactly as CricClubs reports them.

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { TRACKED_SERIES, TRACKED_SERIES_IDS } from "../cricclubs/config";
import { isCCCSide } from "./ccc";

const IMG = "https://media.cricclubs.com";
const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";
const fullName = (f?: string | null, l?: string | null) =>
  [f, l].filter(Boolean).join(" ");

const YEAR_BY_SERIES = new Map(TRACKED_SERIES.map((s) => [s.id, s.year]));
const SEASON_YEARS = [...new Set(TRACKED_SERIES.map((s) => s.year))].sort();

/** Milestone ladders — the highest threshold crossed wins. */
const RUN_THRESHOLDS = [1500, 1000, 500];
const WICKET_THRESHOLDS = [75, 50, 25];
/** Best-economy qualification: at least 10 overs (60 balls) bowled in the season. */
const MIN_ECONOMY_BALLS = 60;

export interface CareerLeader {
  playerId: number;
  name: string;
  pic: string;
  value: number;
  /** Distinct seasons (years) the player appears in for this discipline. */
  seasons: number;
}
export interface SeasonBestItem {
  name: string;
  value: number;
}
export interface SeasonBests {
  year: string;
  mostRuns: SeasonBestItem | null;
  mostWickets: SeasonBestItem | null;
  /** Highest individual score (PlayerBattingStat.highestScore), when reported. */
  highestScore: SeasonBestItem | null;
  /** Lowest economy among CCC bowlers with >= 10 overs that season (runs*6/balls). */
  bestEconomy: SeasonBestItem | null;
}
export interface MilestoneEntry {
  playerId: number;
  name: string;
  pic: string;
  kind: "runs" | "wickets";
  threshold: number;
  total: number;
}
export interface ClubRecords {
  years: string[];
  careerLeaders: {
    runs: CareerLeader[];
    wickets: CareerLeader[];
    dismissals: CareerLeader[];
  };
  seasonBests: SeasonBests[];
  milestones: MilestoneEntry[];
}

interface StatRow {
  seriesId: number;
  playerId: number;
  teamId: number | null;
  teamName: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePic: string | null;
}

interface CareerAgg {
  playerId: number;
  name: string;
  pic: string;
  value: number;
  years: Set<string>;
}

/** Sum `value(row)` per player across their CCC stat rows (any subset of seasons). */
function aggregateByPlayer<T extends StatRow>(
  rows: T[],
  value: (r: T) => number
): CareerAgg[] {
  const byPlayer = new Map<number, CareerAgg>();
  for (const r of rows) {
    const e =
      byPlayer.get(r.playerId) ??
      {
        playerId: r.playerId,
        name: fullName(r.firstName, r.lastName),
        pic: img(r.profilePic),
        value: 0,
        years: new Set<string>(),
      };
    e.value += value(r);
    const year = YEAR_BY_SERIES.get(r.seriesId);
    if (year) e.years.add(year);
    if (!e.pic) e.pic = img(r.profilePic);
    byPlayer.set(r.playerId, e);
  }
  return [...byPlayer.values()];
}

const topLeaders = (aggs: CareerAgg[], n = 8): CareerLeader[] =>
  aggs
    .filter((a) => a.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map(({ playerId, name, pic, value, years }) => ({
      playerId,
      name,
      pic,
      value,
      seasons: years.size,
    }));

const milestonesFor = (
  aggs: CareerAgg[],
  thresholds: number[],
  kind: MilestoneEntry["kind"]
): MilestoneEntry[] =>
  aggs
    .flatMap((a) => {
      const threshold = thresholds.find((t) => a.value >= t);
      return threshold
        ? [{ playerId: a.playerId, name: a.name, pic: a.pic, kind, threshold, total: a.value }]
        : [];
    })
    .sort((a, b) => b.threshold - a.threshold || b.total - a.total);

async function buildClubRecords(): Promise<ClubRecords> {
  const [battingAll, bowlingAll, fieldingAll] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { seriesId: { in: TRACKED_SERIES_IDS } } }),
    prisma.playerBowlingStat.findMany({ where: { seriesId: { in: TRACKED_SERIES_IDS } } }),
    prisma.playerFieldingStat.findMany({ where: { seriesId: { in: TRACKED_SERIES_IDS } } }),
  ]);
  // CCC rows only — by any of its team names OR its variant-team ids (see ccc.ts).
  const batting = battingAll.filter((r) => isCCCSide(r.teamName, r.teamId));
  const bowling = bowlingAll.filter((r) => isCCCSide(r.teamName, r.teamId));
  const fielding = fieldingAll.filter((r) => isCCCSide(r.teamName, r.teamId));

  // ---- Career leaders (all seasons) ----
  const runsCareer = aggregateByPlayer(batting, (r) => r.runs);
  const wicketsCareer = aggregateByPlayer(bowling, (r) => r.wickets);
  const dismissalsCareer = aggregateByPlayer(fielding, (r) => r.total);

  // ---- Season bests (one entry per tracked year, 2022 → 2026) ----
  const seasonBests: SeasonBests[] = SEASON_YEARS.map((year) => {
    const bat = batting.filter((r) => YEAR_BY_SERIES.get(r.seriesId) === year);
    const bowl = bowling.filter((r) => YEAR_BY_SERIES.get(r.seriesId) === year);

    const runLeader = aggregateByPlayer(bat, (r) => r.runs)
      .filter((a) => a.value > 0)
      .sort((a, b) => b.value - a.value)[0];
    const wicketLeader = aggregateByPlayer(bowl, (r) => r.wickets)
      .filter((a) => a.value > 0)
      .sort((a, b) => b.value - a.value)[0];

    // Highest individual score, when CricClubs reports one on a stat row.
    let highestScore: SeasonBestItem | null = null;
    for (const r of bat) {
      if (r.highestScore != null && (!highestScore || r.highestScore > highestScore.value)) {
        highestScore = { name: fullName(r.firstName, r.lastName), value: r.highestScore };
      }
    }

    // Best (lowest) economy across the season: aggregate balls/runs per player,
    // qualify at >= 10 overs, then economy = runs conceded per 6 balls.
    const eco = new Map<number, { name: string; balls: number; runs: number }>();
    for (const r of bowl) {
      const e =
        eco.get(r.playerId) ??
        { name: fullName(r.firstName, r.lastName), balls: 0, runs: 0 };
      e.balls += r.balls;
      e.runs += r.runs;
      eco.set(r.playerId, e);
    }
    const bestEconomy =
      [...eco.values()]
        .filter((e) => e.balls >= MIN_ECONOMY_BALLS)
        .map((e) => ({
          name: e.name,
          value: Math.round(((e.runs * 6) / e.balls) * 100) / 100,
        }))
        .sort((a, b) => a.value - b.value)[0] ?? null;

    return {
      year,
      mostRuns: runLeader ? { name: runLeader.name, value: runLeader.value } : null,
      mostWickets: wicketLeader
        ? { name: wicketLeader.name, value: wicketLeader.value }
        : null,
      highestScore,
      bestEconomy,
    };
  });

  // ---- Milestones (highest career threshold crossed per player) ----
  const milestones = [
    ...milestonesFor(runsCareer, RUN_THRESHOLDS, "runs"),
    ...milestonesFor(wicketsCareer, WICKET_THRESHOLDS, "wickets"),
  ];

  return {
    years: SEASON_YEARS,
    careerLeaders: {
      runs: topLeaders(runsCareer),
      wickets: topLeaders(wicketsCareer),
      dismissals: topLeaders(dismissalsCareer),
    },
    seasonBests,
    milestones,
  };
}

export const getClubRecords = unstable_cache(buildClubRecords, ["club-records"], {
  revalidate: 600,
  tags: ["cricclubs"],
});
