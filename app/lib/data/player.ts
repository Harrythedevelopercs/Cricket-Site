// Server-side: a full player profile for Club Cricket of Chicago — bio + career stats
// pulled live from CricClubs, plus this season's stats from the DB.

import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { TRACKED_SERIES } from "../cricclubs/config";
import { getCareerStats } from "../cricclubs/endpoints";

const IMG = "https://media.cricclubs.com";
const img = (p?: unknown) =>
  typeof p === "string" && p
    ? `${IMG}${p.startsWith("/") ? p : `/${p}`}`
    : "";
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
// CricClubs already computes average / strike-rate / economy. Show those verbatim so
// the profile matches the official CricClubs figures exactly (e.g. 24.25, not 24.3);
// only tidy their "--" / "-" / empty placeholders to an em dash.
const ccStat = (v: unknown) => {
  const s = str(v).trim();
  return s === "" || s === "--" || s === "-" ? "—" : s;
};
const oversFromBalls = (b: number) => `${Math.floor(b / 6)}.${b % 6}`;
const SEASON_IDS = TRACKED_SERIES.filter((s) => s.year === "2026").map((s) => s.id);

type Row = Record<string, unknown>;
type CareerStats = { battingStats?: Row[]; bowlingStats?: Row[] };

async function buildPlayerProfile(playerId: number) {
  const [careerRow, dbPlayer, batting, bowling] = await Promise.all([
    prisma.playerCareer.findUnique({ where: { playerId } }),
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.playerBattingStat.findMany({
      where: { playerId, seriesId: { in: SEASON_IDS } },
    }),
    prisma.playerBowlingStat.findMany({
      where: { playerId, seriesId: { in: SEASON_IDS } },
    }),
  ]);

  // Career stats come from the DB (refreshed after matches). If a *known* player (one in our
  // DB) has none stored yet, fetch once and store it. Gating on `dbPlayer` is the security
  // control: it stops unauthenticated callers from spraying random IDs to burn the shared
  // CricClubs quota. Steady state: zero CricClubs calls per view.
  let career = (careerRow?.careerStats as unknown as CareerStats | null) ?? null;
  if (!career && dbPlayer) {
    career = await getCareerStats(playerId).catch(() => null);
    if (career) {
      await prisma.playerCareer
        .upsert({
          where: { playerId },
          create: { playerId, careerStats: career as unknown as Prisma.InputJsonValue },
          update: { careerStats: career as unknown as Prisma.InputJsonValue },
        })
        .catch(() => {});
    }
  }

  // Season totals (count matches once per division side — batting and bowling rows for
  // the same (series, team) repeat the same appearances; rows for different teams add)
  const matchesBySeries = new Map<string, number>();
  for (const b of batting) {
    const k = `${b.seriesId}:${b.teamId}`;
    matchesBySeries.set(k, Math.max(matchesBySeries.get(k) ?? 0, b.matches));
  }
  for (const b of bowling) {
    const k = `${b.seriesId}:${b.teamId}`;
    matchesBySeries.set(k, Math.max(matchesBySeries.get(k) ?? 0, b.matches));
  }

  const season = {
    matches: [...matchesBySeries.values()].reduce((s, n) => s + n, 0),
    runs: batting.reduce((s, b) => s + b.runs, 0),
    highestScore: batting.reduce((m, b) => Math.max(m, b.highestScore ?? 0), 0),
    sixes: batting.reduce((s, b) => s + b.sixes, 0),
    wickets: bowling.reduce((s, b) => s + b.wickets, 0),
  };

  // Bio is read from the Player row (the sync populates it from getUserDetails once).
  const bio = dbPlayer
    ? {
        firstName: str(dbPlayer.firstName),
        lastName: str(dbPlayer.lastName),
        playingRole: str(dbPlayer.playingRole),
        battingStyle: str(dbPlayer.battingStyle),
        bowlingStyle: str(dbPlayer.bowlingStyle),
        age: dbPlayer.age ?? null,
        photo: img(dbPlayer.profilePic),
      }
    : null;

  const careerBatting = (
    Array.isArray(career?.battingStats) ? career!.battingStats : []
  ).map((b) => ({
    format: str(b.seriesType) || "Overall",
    matches: num(b.matches),
    innings: num(b.innings),
    runs: num(b.runsScored),
    highestScore: num(b.highestScore),
    // CricClubs' own figures, verbatim.
    average: ccStat(b.average),
    strikeRate: ccStat(b.strikeRate),
    fours: num(b.fours),
    sixes: num(b.sixers),
    fifties: num(b.fifties),
    hundreds: num(b.hundreds),
  }));

  const careerBowling = (
    Array.isArray(career?.bowlingStats) ? career!.bowlingStats : []
  ).map((b) => {
    const balls = num(b.balls);
    const wickets = num(b.wickets);
    return {
      format: str(b.seriesType) || "Overall",
      matches: num(b.matches),
      innings: num(b.innings),
      overs: oversFromBalls(balls), // CricClubs doesn't return overs; derive from balls
      runs: num(b.runs),
      wickets,
      maidens: num(b.maidens),
      // CricClubs' own figures; their bowling average is "0" when wkts=0, so show "—".
      average: wickets > 0 ? ccStat(b.average) : "—",
      economy: ccStat(b.economy),
      fourWickets: num(b.fourWickets),
      fiveWickets: num(b.fiveWickets),
    };
  });

  return {
    playerId,
    bio,
    name:
      [bio?.firstName, bio?.lastName].filter(Boolean).join(" ") ||
      [dbPlayer?.firstName, dbPlayer?.lastName].filter(Boolean).join(" ") ||
      "Player",
    photo: bio?.photo || img(dbPlayer?.profilePic) || "",
    role: bio?.playingRole || dbPlayer?.playingRole || "",
    season,
    careerBatting,
    careerBowling,
  };
}

export const getPlayerProfile = unstable_cache(
  buildPlayerProfile,
  ["player-profile"],
  { revalidate: 600, tags: ["cricclubs"] }
);
