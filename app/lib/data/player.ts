// Server-side: a full player profile for Club Cricket of Chicago — bio + career stats
// pulled live from CricClubs, plus this season's stats from the DB.

import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { TRACKED_SERIES } from "../cricclubs/config";
import { getCareerStats } from "../cricclubs/endpoints";
import { isCCCSide } from "./ccc";
import { formatDismissal } from "./scorecardText";

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

export interface RecentFormEntry {
  matchId: number;
  date: string;
  opponent: string;
  result: string;
  won: boolean | null;
  batting: { runs: number; balls: number; dismissal: string; notOut: boolean } | null;
  bowling: { overs: string; runs: number; wickets: number } | null;
}

// Stored match dates are CricClubs "MM/DD/YYYY" strings; parse for ordering only.
const dateKey = (s?: string | null) => {
  const m = (s ?? "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? Date.UTC(+m[3], +m[1] - 1, +m[2]) : 0;
};

const INNINGS_KEYS = ["innings1", "innings2", "innings3", "innings4"] as const;

/** The player's last few appearances, read entirely from stored scorecards. */
async function buildRecentForm(playerId: number): Promise<RecentFormEntry[]> {
  const rows = await prisma.$queryRaw<{ match_id: number }[]>`
    SELECT match_id FROM match_scorecards
    WHERE jsonb_path_exists(data, '$.*.batting[*].playerID ? (@ == $pid)', jsonb_build_object('pid', ${playerId}::int))
       OR jsonb_path_exists(data, '$.*.bowling[*].playerID ? (@ == $pid)', jsonb_build_object('pid', ${playerId}::int))
  `;
  if (rows.length === 0) return [];

  const matches = await prisma.match.findMany({
    where: { id: { in: rows.map((r) => r.match_id) } },
  });
  const latest = matches
    .sort((a, b) => dateKey(b.matchDate) - dateKey(a.matchDate) || b.id - a.id)
    .slice(0, 5);
  if (latest.length === 0) return [];

  const cards = await prisma.matchScorecard.findMany({
    where: { matchId: { in: latest.map((m) => m.id) } },
  });
  const cardById = new Map(cards.map((c) => [c.matchId, c.data as unknown as Row]));

  return latest.map((m) => {
    const sc = cardById.get(m.id);
    let batting: RecentFormEntry["batting"] = null;
    let bowling: RecentFormEntry["bowling"] = null;
    for (const key of INNINGS_KEYS) {
      const inn = sc?.[key] as Row | undefined;
      if (!inn) continue;
      if (!batting) {
        const b = (Array.isArray(inn.batting) ? (inn.batting as Row[]) : []).find(
          (r) =>
            num(r.playerID) === playerId &&
            str(r.outStringNoLink).toUpperCase() !== "DNB"
        );
        if (b) {
          batting = {
            runs: num(b.runsScored),
            balls: num(b.ballsFaced),
            dismissal:
              formatDismissal(b.outStringNoLink) ||
              (str(b.isOut) === "1" ? "out" : "not out"),
            notOut: str(b.isOut) === "0",
          };
        }
      }
      if (!bowling) {
        const bw = (Array.isArray(inn.bowling) ? (inn.bowling as Row[]) : []).find(
          (r) => num(r.playerID) === playerId
        );
        if (bw) {
          const balls = num(bw.balls);
          bowling = {
            overs: str(bw.overs) || oversFromBalls(balls),
            runs: num(bw.runs),
            wickets: num(bw.wickets),
          };
        }
      }
    }

    const cccIsTeamOne = isCCCSide(m.teamOneName, m.teamOneId);
    const cccTeamId = cccIsTeamOne ? m.teamOneId : m.teamTwoId;
    return {
      matchId: m.id,
      date: m.matchDate ?? "",
      opponent: (cccIsTeamOne ? m.teamTwoName : m.teamOneName) ?? "",
      result: m.result ?? "",
      won: m.winner != null && cccTeamId != null ? m.winner === cccTeamId : null,
      batting,
      bowling,
    };
  });
}

async function buildPlayerProfile(playerId: number) {
  const [careerRow, dbPlayer, batting, bowling, recentForm] = await Promise.all([
    prisma.playerCareer.findUnique({ where: { playerId } }),
    prisma.player.findUnique({ where: { id: playerId } }),
    prisma.playerBattingStat.findMany({
      where: { playerId, seriesId: { in: SEASON_IDS } },
    }),
    prisma.playerBowlingStat.findMany({
      where: { playerId, seriesId: { in: SEASON_IDS } },
    }),
    buildRecentForm(playerId).catch(() => [] as RecentFormEntry[]),
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
    // Nothing in the DB and nothing from CricClubs = this player doesn't
    // exist. Without the flag, an unknown id renders a ghost profile named
    // "Player" with all-zero stats.
    found: Boolean(bio || dbPlayer),
    name:
      [bio?.firstName, bio?.lastName].filter(Boolean).join(" ") ||
      [dbPlayer?.firstName, dbPlayer?.lastName].filter(Boolean).join(" ") ||
      "Player",
    photo: bio?.photo || img(dbPlayer?.profilePic) || "",
    role: bio?.playingRole || dbPlayer?.playingRole || "",
    season,
    recentForm,
    careerBatting,
    careerBowling,
  };
}

export const getPlayerProfile = unstable_cache(
  buildPlayerProfile,
  ["player-profile"],
  { revalidate: 600, tags: ["cricclubs"] }
);
