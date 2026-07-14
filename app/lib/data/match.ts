// Server-side: a full match scorecard for the Match Centre. Pulls the live scorecard
// from CricClubs and pairs it with the DB match row (teams, result, date, series).

import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { getScoreCard } from "../cricclubs/endpoints";
import { formatDismissal } from "./scorecardText";

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
const oversFromBalls = (b: number) => `${Math.floor(b / 6)}.${b % 6}`;

type Row = Record<string, unknown>;

function shapeExtras(ex: unknown) {
  if (ex && typeof ex === "object") {
    const e = ex as Row;
    const b = num(e.b);
    const lb = num(e.lb);
    const wd = num(e.wd);
    const nb = num(e.nb);
    const pn = num(e.pn);
    return { b, lb, wd, nb, pn, total: b + lb + wd + nb + pn };
  }
  return { b: 0, lb: 0, wd: 0, nb: 0, pn: 0, total: num(ex) };
}

function shapeInnings(inn: Row | undefined) {
  if (!inn) return null;
  const battingRaw = Array.isArray(inn.batting) ? (inn.batting as Row[]) : [];
  const bowling = Array.isArray(inn.bowling) ? (inn.bowling as Row[]) : [];
  if (battingRaw.length === 0 && num(inn.total) === 0) return null;

  // CricClubs marks players who didn't bat with outStringNoLink === "DNB".
  const isDnb = (b: Row) => str(b.outStringNoLink).toUpperCase() === "DNB";
  const batted = battingRaw.filter((b) => !isDnb(b));
  const didNotBat = battingRaw
    .filter(isDnb)
    .map((b) => fullName(b.firstName, b.lastName))
    .filter(Boolean);

  const fallOfWickets = (
    Array.isArray(inn.fallOfWickets) ? (inn.fallOfWickets as Row[]) : []
  ).map((f) => {
    const t = str(f.total); // e.g. "26-1 (3.4 ov)"
    const m = t.match(/(\d+)\s*-\s*(\d+)\s*\(([\d.]+)/);
    return {
      runs: m ? Number(m[1]) : 0,
      wicket: m ? Number(m[2]) : 0,
      over: m ? m[3] : "",
      player: str(f.playerName),
    };
  });

  return {
    teamName: str(inn.teamName) || "Team",
    total: num(inn.total),
    wickets: num(inn.wickets),
    overs: str(inn.overs),
    runRate: str(inn.runRate),
    extras: shapeExtras(inn.extras),
    didNotBat,
    fallOfWickets,
    batting: batted.map((b) => {
      const runs = num(b.runsScored);
      const balls = num(b.ballsFaced);
      return {
        playerId: num(b.playerID),
        name: fullName(b.firstName, b.lastName),
        dismissal:
          formatDismissal(b.outStringNoLink) ||
          (str(b.isOut) === "1" ? "out" : "not out"),
        notOut: str(b.isOut) === "0",
        runs,
        balls,
        fours: num(b.fours),
        sixes: num(b.sixers),
        sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0",
      };
    }),
    bowling: bowling.map((b) => {
      const balls = num(b.balls);
      const runs = num(b.runs);
      return {
        playerId: num(b.playerID),
        name: fullName(b.firstName, b.lastName),
        overs: str(b.overs) || oversFromBalls(balls),
        maidens: num(b.maidens),
        runs,
        wickets: num(b.wickets),
        wides: num(b.wides),
        noBalls: num(b.noBalls),
        econ: balls > 0 ? (runs / (balls / 6)).toFixed(1) : "0.0",
      };
    }),
  };
}

async function buildMatchCard(matchId: number) {
  const [stored, dbMatch] = await Promise.all([
    prisma.matchScorecard.findUnique({ where: { matchId } }),
    prisma.match.findUnique({ where: { id: matchId } }),
  ]);

  // Scorecards come from the DB (stored once a match finishes). If a *real* match (one we've
  // synced) has no stored scorecard yet — e.g. an older match nobody has opened — fetch it
  // once and store it. Gating on `dbMatch` is the security control: it stops unauthenticated
  // callers from spraying random IDs to burn the shared CricClubs quota. Steady state: 0
  // live calls per page view.
  let sc = (stored?.data as unknown as Row | null) ?? null;
  if (!sc && dbMatch) {
    sc = (await getScoreCard(matchId).catch(() => null)) as unknown as Row | null;
    if (sc) {
      await prisma.matchScorecard
        .upsert({
          where: { matchId },
          create: { matchId, data: sc as unknown as Prisma.InputJsonValue },
          update: { data: sc as unknown as Prisma.InputJsonValue },
        })
        .catch(() => {});
    }
  }

  const innings = [sc?.innings1, sc?.innings2, sc?.innings3, sc?.innings4]
    .map((i) => shapeInnings(i as Row | undefined))
    .filter((i): i is NonNullable<typeof i> => i !== null);

  // Only CCC roster members have profile pages, so keep playerId solely for rows
  // whose id exists in our Player mirror; everyone else renders as plain text.
  const scorecardIds = new Set<number>();
  for (const inn of innings) {
    inn.batting.forEach((b) => b.playerId && scorecardIds.add(b.playerId));
    inn.bowling.forEach((b) => b.playerId && scorecardIds.add(b.playerId));
  }
  const knownIds = scorecardIds.size
    ? new Set(
        (
          await prisma.player.findMany({
            where: { id: { in: [...scorecardIds] } },
            select: { id: true },
          })
        ).map((p) => p.id)
      )
    : new Set<number>();
  for (const inn of innings) {
    inn.batting.forEach((b) => {
      if (!knownIds.has(b.playerId)) b.playerId = 0;
    });
    inn.bowling.forEach((b) => {
      if (!knownIds.has(b.playerId)) b.playerId = 0;
    });
  }

  const teamOne =
    dbMatch?.teamOneName || innings[0]?.teamName || "Team 1";
  const teamTwo =
    dbMatch?.teamTwoName || innings[1]?.teamName || "Team 2";

  return {
    matchId,
    found: innings.length > 0 || !!dbMatch,
    teamOne,
    teamTwo,
    teamOneLogo: img(dbMatch?.teamOneLogo),
    teamTwoLogo: img(dbMatch?.teamTwoLogo),
    result: dbMatch?.result ?? "",
    date: dbMatch?.matchDate ?? "",
    seriesName: dbMatch?.seriesName ?? "",
    location: dbMatch?.location ?? "",
    innings,
  };
}

// Completed scorecards don't change, so cache aggressively (revalidated by sync tag).
export const getMatchCard = unstable_cache(buildMatchCard, ["match-card"], {
  revalidate: 600,
  tags: ["cricclubs"],
});
