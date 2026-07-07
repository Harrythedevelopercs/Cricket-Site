// Server-side: auto-generated match reports for CCC's recent completed matches.
// Each report is a deterministic template composed from real numbers — the Match row
// (scores, result, venue) plus the stored MatchScorecard JSON (top CCC batter/bowler).
// Raw CricClubs values are shown as-is; nothing is clamped or normalized.

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { cccMatchOr, isCCCSide } from "./ccc";

const IMG = "https://media.cricclubs.com";
const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";
const fullName = (f?: unknown, l?: unknown) =>
  [f, l].filter((x) => typeof x === "string" && x).join(" ");
const num = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

type Row = Record<string, unknown>;

export interface MatchReport {
  matchId: number;
  date: string; // raw stored match date string (e.g. "06/28/2026")
  seriesName: string;
  headline: string;
  recap: string;
  cccScore: string;
  oppScore: string;
  opponentName: string;
  opponentLogo: string;
  cccWon: boolean;
  result: string; // raw CricClubs result string
  topBat: { name: string; runs: number; balls: number } | null;
  topBowl: { name: string; wickets: number; runs: number } | null;
  location: string;
}

// Match dates are stored as CricClubs strings (usually "MM/DD/YYYY"). Parse to a UTC
// instant and format with timeZone "UTC" (same rule as HeroBanner's formatMatch) so
// the rendered day never shifts by one.
function formatDateUTC(s: string): string {
  if (!s) return "";
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const d = m
    ? new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])))
    : new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface InningsView {
  cccBatting: boolean;
  batting: Row[];
  bowling: Row[];
}

// The stored getScoreCard payload: { innings1..innings4 (null when unused), matchInfo,
// partnershipMap }. Each innings: { teamId, teamName, total, wickets, overs, batting[],
// bowling[] } where batting rows carry firstName/lastName/runsScored/ballsFaced and
// outStringNoLink === "DNB" for players who didn't bat, and bowling rows carry the
// BOWLING side's teamId plus balls/runs/wickets.
function readInnings(sc: Row, cccTeamId: number | null): InningsView[] {
  return [sc.innings1, sc.innings2, sc.innings3, sc.innings4]
    .filter((i): i is Row => !!i && typeof i === "object")
    .map((inn) => ({
      cccBatting:
        (cccTeamId != null && num(inn.teamId) === cccTeamId) ||
        isCCCSide(str(inn.teamName), num(inn.teamId)),
      batting: Array.isArray(inn.batting) ? (inn.batting as Row[]) : [],
      bowling: Array.isArray(inn.bowling) ? (inn.bowling as Row[]) : [],
    }));
}

const isDnb = (b: Row) => str(b.outStringNoLink).toUpperCase() === "DNB";

function findTopBat(innings: InningsView[]): MatchReport["topBat"] {
  let top: MatchReport["topBat"] = null;
  for (const inn of innings) {
    if (!inn.cccBatting) continue;
    for (const b of inn.batting) {
      if (isDnb(b)) continue;
      const name = fullName(b.firstName, b.lastName);
      if (!name) continue;
      const runs = num(b.runsScored);
      const balls = num(b.ballsFaced);
      if (!top || runs > top.runs || (runs === top.runs && balls < top.balls)) {
        top = { name, runs, balls };
      }
    }
  }
  return top;
}

function findTopBowl(innings: InningsView[]): MatchReport["topBowl"] {
  let top: MatchReport["topBowl"] = null;
  for (const inn of innings) {
    if (inn.cccBatting) continue; // opponent batting -> the bowling card is CCC's
    for (const b of inn.bowling) {
      const name = fullName(b.firstName, b.lastName);
      if (!name) continue;
      const wickets = num(b.wickets);
      const runs = num(b.runs);
      if (
        !top ||
        wickets > top.wickets ||
        (wickets === top.wickets && runs < top.runs)
      ) {
        top = { name, wickets, runs };
      }
    }
  }
  return top;
}

// "CCC beat Black Caps by 65 runs" / "Chicago Tigers won by 13 runs" — derived from
// the raw result string ("Club Cricket of Chicago won by 65 Runs").
function buildHeadline(
  result: string,
  cccWon: boolean,
  opponentName: string
): string {
  if (/\btie(d)?\b/i.test(result)) return `CCC tied with ${opponentName}`;
  const margin = result.match(/\bwon by\s+(.+?)\.?\s*$/i)?.[1]?.toLowerCase();
  if (margin) {
    return cccWon
      ? `CCC beat ${opponentName} by ${margin}`
      : `${opponentName} won by ${margin}`;
  }
  return result || `CCC vs ${opponentName}`;
}

function buildRecap(r: {
  hasScorecard: boolean;
  cccBattedFirst: boolean;
  cccScore: string;
  oppScore: string;
  opponentName: string;
  topBat: MatchReport["topBat"];
  topBowl: MatchReport["topBowl"];
  seriesName: string;
  location: string;
  date: string;
}): string {
  const sentences: string[] = [];

  if (r.hasScorecard) {
    const [firstName_, firstScore, secondName, secondScore] = r.cccBattedFirst
      ? ["CCC", r.cccScore, r.opponentName, r.oppScore]
      : [r.opponentName, r.oppScore, "CCC", r.cccScore];
    sentences.push(
      `${firstName_} posted ${firstScore} and ${secondName} replied with ${secondScore}.`
    );
  } else {
    sentences.push(`CCC ${r.cccScore}, ${r.opponentName} ${r.oppScore}.`);
  }

  const batLine = r.topBat
    ? `${r.topBat.name} top-scored for CCC with ${r.topBat.runs}${
        r.topBat.balls > 0 ? ` off ${r.topBat.balls} balls` : ""
      }`
    : "";
  const bowlLine = r.topBowl
    ? `${r.topBowl.name} led the attack with ${r.topBowl.wickets}/${r.topBowl.runs}`
    : "";
  if (batLine && bowlLine) sentences.push(`${batLine}, while ${bowlLine}.`);
  else if (batLine) sentences.push(`${batLine}.`);
  else if (bowlLine) sentences.push(`${bowlLine[0].toUpperCase()}${bowlLine.slice(1)}.`);

  const when = formatDateUTC(r.date);
  const whereWhen = [
    r.location ? `at ${r.location}` : "",
    r.seriesName ? `in the ${r.seriesName}` : "",
    when ? `on ${when}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (whereWhen) sentences.push(`Played ${whereWhen}.`);

  return sentences.join(" ");
}

async function buildMatchReports(limit = 6): Promise<MatchReport[]> {
  const candidates = await prisma.match.findMany({
    where: {
      isComplete: true,
      OR: cccMatchOr,
      NOT: { result: { contains: "Abandon", mode: "insensitive" } },
    },
    orderBy: [{ lastUpdated: "desc" }, { id: "desc" }],
    take: limit * 4,
  });

  // Drop matches with no real scoreline (e.g. forfeits recorded as 0/0).
  const matches = candidates
    .filter((m) => (m.t1Total ?? 0) > 0 || (m.t2Total ?? 0) > 0)
    .slice(0, limit);

  // No enforced FKs in the schema, so join scorecards manually by matchId.
  const cards = await prisma.matchScorecard.findMany({
    where: { matchId: { in: matches.map((m) => m.id) } },
  });
  const scByMatch = new Map(cards.map((c) => [c.matchId, c.data as unknown as Row]));

  return matches.map((m) => {
    const cccIsT1 = isCCCSide(m.teamOneName, m.teamOneId);
    const score = (t: number | null, w: number | null) => `${t ?? 0}/${w ?? 0}`;
    const cccScore = cccIsT1
      ? score(m.t1Total, m.t1Wickets)
      : score(m.t2Total, m.t2Wickets);
    const oppScore = cccIsT1
      ? score(m.t2Total, m.t2Wickets)
      : score(m.t1Total, m.t1Wickets);
    const opponentName = (cccIsT1 ? m.teamTwoName : m.teamOneName) ?? "TBD";
    const cccWon =
      m.winner != null &&
      ((cccIsT1 && m.winner === m.teamOneId) ||
        (!cccIsT1 && m.winner === m.teamTwoId));

    const sc = scByMatch.get(m.id) ?? null;
    const cccTeamId = (cccIsT1 ? m.teamOneId : m.teamTwoId) ?? null;
    const innings = sc ? readInnings(sc, cccTeamId) : [];
    const topBat = findTopBat(innings);
    const topBowl = findTopBowl(innings);

    const result = m.result ?? "";
    const seriesName = m.seriesName ?? "";
    const location = m.location ?? "";
    const date = m.matchDate ?? "";

    return {
      matchId: m.id,
      date,
      seriesName,
      headline: buildHeadline(result, cccWon, opponentName),
      recap: buildRecap({
        hasScorecard: innings.length > 0,
        cccBattedFirst: innings[0]?.cccBatting ?? cccIsT1,
        cccScore,
        oppScore,
        opponentName,
        topBat,
        topBowl,
        seriesName,
        location,
        date,
      }),
      cccScore,
      oppScore,
      opponentName,
      opponentLogo: img(cccIsT1 ? m.teamTwoLogo : m.teamOneLogo),
      cccWon,
      result,
      topBat,
      topBowl,
      location,
    };
  });
}

export const getMatchReports = unstable_cache(
  buildMatchReports,
  ["match-reports"],
  { revalidate: 120, tags: ["cricclubs"] }
);
