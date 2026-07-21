// Club-level totals across every CCC season mirrored from CricClubs (2022 → now).
// Batting/bowling leaderboards are the trusted source for runs and wickets because
// they match the figures used by the records book. Completed matches are counted
// directly so one match is never multiplied by the number of players involved.

import { unstable_cache } from "next/cache";
import { TRACKED_SERIES, TRACKED_SERIES_IDS } from "../cricclubs/config";
import { prisma } from "../db/prisma";
import { cccMatchOr, isCCCSide } from "./ccc";

interface ClubStatRow {
  teamId: number | null;
  teamName: string | null;
}

interface BattingRow extends ClubStatRow {
  runs: number;
}

interface BowlingRow extends ClubStatRow {
  wickets: number;
}

export interface ClubHistoryTotals {
  since: number;
  matches: number;
  runs: number;
  wickets: number;
}

interface ClubHistoryInput {
  matches: number;
  batting: BattingRow[];
  bowling: BowlingRow[];
}

const HISTORY_START_YEAR = Math.min(
  ...TRACKED_SERIES.map((series) => Number(series.year))
);

export function calculateClubHistoryTotals({
  matches,
  batting,
  bowling,
}: ClubHistoryInput): ClubHistoryTotals {
  return {
    since: HISTORY_START_YEAR,
    matches,
    runs: batting
      .filter((row) => isCCCSide(row.teamName, row.teamId))
      .reduce((sum, row) => sum + row.runs, 0),
    wickets: bowling
      .filter((row) => isCCCSide(row.teamName, row.teamId))
      .reduce((sum, row) => sum + row.wickets, 0),
  };
}

async function buildClubHistoryTotals(): Promise<ClubHistoryTotals> {
  const [matches, batting, bowling] = await Promise.all([
    prisma.match.count({
      where: {
        seriesId: { in: TRACKED_SERIES_IDS },
        isComplete: true,
        OR: cccMatchOr,
      },
    }),
    prisma.playerBattingStat.findMany({
      where: { seriesId: { in: TRACKED_SERIES_IDS } },
      select: { teamId: true, teamName: true, runs: true },
    }),
    prisma.playerBowlingStat.findMany({
      where: { seriesId: { in: TRACKED_SERIES_IDS } },
      select: { teamId: true, teamName: true, wickets: true },
    }),
  ]);

  return calculateClubHistoryTotals({ matches, batting, bowling });
}

export const getClubHistoryTotals = unstable_cache(
  buildClubHistoryTotals,
  ["club-history-totals"],
  { revalidate: 600, tags: ["cricclubs"] }
);
