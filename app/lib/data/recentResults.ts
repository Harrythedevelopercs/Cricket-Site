// Server-side: Club Cricket of Chicago's most recent completed matches, from the DB.
// Used by the home "Recent Results" widget. Scores/result are from CCC's perspective.

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { cccMatchOr, isCCCSide } from "./ccc";

const IMG = "https://media.cricclubs.com";
const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";

export interface RecentResult {
  id: number;
  seriesName: string;
  date: string;
  opponentName: string;
  opponentLogo: string;
  cccLogo: string;
  cccScore: string;
  oppScore: string;
  cccWon: boolean;
  result: string;
}

// Stored match dates are CricClubs "MM/DD/YYYY" strings; parse for ordering only.
const dateKey = (s?: string | null) => {
  const m = (s ?? "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? Date.UTC(+m[3], +m[1] - 1, +m[2]) : 0;
};

async function buildRecentResults(limit = 6): Promise<RecentResult[]> {
  // No DB-side ordering: matchDate is a string column, and lastUpdated tracks scorer
  // EDITS, not recency — a years-old match corrected yesterday would sort first.
  const candidates = await prisma.match.findMany({
    where: {
      isComplete: true,
      OR: cccMatchOr,
      NOT: { result: { contains: "Abandon", mode: "insensitive" } },
    },
  });

  // Drop matches with no real scoreline (e.g. forfeits recorded as 0/0), then take the
  // most recent by actual match date (id breaks same-day ties).
  const matches = candidates
    .filter((m) => (m.t1Total ?? 0) > 0 || (m.t2Total ?? 0) > 0)
    .sort((a, b) => dateKey(b.matchDate) - dateKey(a.matchDate) || b.id - a.id)
    .slice(0, limit);

  return matches.map((m) => {
    const cccIsT1 = isCCCSide(m.teamOneName, m.teamOneId);
    const score = (t: number | null, w: number | null) => `${t ?? 0}/${w ?? 0}`;
    const cccWon =
      m.winner != null &&
      ((cccIsT1 && m.winner === m.teamOneId) ||
        (!cccIsT1 && m.winner === m.teamTwoId));

    return {
      id: m.id,
      seriesName: m.seriesName ?? "",
      date: m.matchDate ?? "",
      opponentName: (cccIsT1 ? m.teamTwoName : m.teamOneName) ?? "TBD",
      opponentLogo: img(cccIsT1 ? m.teamTwoLogo : m.teamOneLogo),
      cccLogo: img(cccIsT1 ? m.teamOneLogo : m.teamTwoLogo),
      cccScore: cccIsT1 ? score(m.t1Total, m.t1Wickets) : score(m.t2Total, m.t2Wickets),
      oppScore: cccIsT1 ? score(m.t2Total, m.t2Wickets) : score(m.t1Total, m.t1Wickets),
      cccWon,
      result: m.result ?? "",
    };
  });
}

export const getRecentResults = unstable_cache(
  buildRecentResults,
  ["recent-results"],
  { revalidate: 120, tags: ["cricclubs"] }
);
