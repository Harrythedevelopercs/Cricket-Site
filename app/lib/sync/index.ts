// CricClubs -> Postgres sync. Each function maps a CricClubs endpoint into idempotent
// Prisma upserts keyed by the source's natural IDs. `syncAll` orchestrates them and
// records per-entity status in `sync_state` (one failing step never aborts the rest).

import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { CCC_TEAM_IDS, TRACKED_SERIES, ACTIVE_SEASON_YEAR } from "../cricclubs/config";
import {
  getBattingStats,
  getBowlingStats,
  getCareerStats,
  getFieldingStats,
  getMatches,
  getPointsTable,
  getScoreCard,
  getSchedule,
  getSeriesList,
  getTeamPlayers,
  getTeamsList,
  getUserDetails,
} from "../cricclubs/endpoints";

// ---- coercion helpers (API mixes number | string) -------------------------

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
}
function numOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}
function dateFromUnix(v: unknown): Date | null {
  const n = numOrNull(v);
  if (n === null || n === 0) return null;
  return new Date(n * 1000);
}
function dateFromIso(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---- per-entity syncs ------------------------------------------------------

/** All series/tournaments for the club. */
export async function syncSeries(): Promise<number> {
  const data = await getSeriesList();
  const list = data?.seriesList ?? [];
  for (const s of list) {
    const payload = {
      name: s.seriesName,
      type: s.seriesType ?? null,
      year: s.year ?? null,
      level: s.level ?? null,
      parentSeriesId: numOrNull(s.parentSeriesId),
      startDate: dateFromUnix(s.startDate),
    };
    await prisma.series.upsert({
      where: { id: s.seriesID },
      create: { id: s.seriesID, ...payload },
      update: payload,
    });
  }
  return list.length;
}

/** All upcoming fixtures for the club (across series). */
export async function syncFixtures(): Promise<number> {
  const data = await getSchedule();
  const list = data?.fixtureList ?? [];
  const seenIds: number[] = [];
  for (const f of list) {
    const payload = {
      seriesId: num(f.seriesId),
      seriesName: f.seriesName ?? null,
      teamOneId: numOrNull(f.teamOne),
      teamTwoId: numOrNull(f.teamTwo),
      teamOneName: f.teamOneName ?? null,
      teamTwoName: f.teamTwoName ?? null,
      teamOneLogo: f.t1_logo_file_path ?? null,
      teamTwoLogo: f.t2_logo_file_path ?? null,
      matchId: num(f.matchId),
      matchType: f.matchType ?? null,
      date: f.fixedFormatDate ?? null,
      time: f.time ?? null,
      day: f.day ?? null,
      groundId: numOrNull(f.groundId),
      location: f.location ?? f.ground ?? null,
      googleMapsLink: f.googleMapsLink ?? null,
      statusDesc: f.statusDesc ?? null,
      matchDateTime: dateFromUnix(f.matchDateTime),
    };
    await prisma.fixture.upsert({
      where: { id: f.fixtureId },
      create: { id: f.fixtureId, ...payload },
      update: payload,
    });
    seenIds.push(f.fixtureId);
  }

  // Reconcile against the feed. getSchedule() returns CCC's COMPLETE set of currently
  // scheduled (unplayed) fixtures, so a NON-EMPTY feed is authoritative: drop any stored
  // fixture it no longer lists (played -> moved to the match table, cancelled, or
  // postponed out). An EMPTY feed is ambiguous — a genuine off-season looks identical to
  // a fluke upstream blip — so there we only prune fixtures whose date has already passed
  // (clearly stale) and never future ones, so a fluke empty response can't blank out the
  // upcoming-fixtures section. A real empty schedule still drains naturally as dates pass.
  if (seenIds.length > 0) {
    await prisma.fixture.deleteMany({ where: { id: { notIn: seenIds } } });
  } else {
    await prisma.fixture.deleteMany({ where: { matchDateTime: { lt: new Date() } } });
  }
  return list.length;
}

/** Teams participating in a series. */
export async function syncTeams(seriesId: number): Promise<number> {
  const data = await getTeamsList(seriesId);
  const groups = data?.teamsList ?? [];
  let count = 0;
  for (const g of groups) {
    for (const t of g.teams ?? []) {
      if (!t.teamID) continue;
      const payload = {
        name: t.teamName,
        code: t.teamCode ?? null,
        logoPath: t.logo_file_path ?? null,
        captainId: numOrNull(t.captain),
        captainName: t.captainName ?? null,
        viceCaptainId: numOrNull(t.viceCaptain),
        viceCaptainName: t.viceCaptainName ?? null,
        groupNo: numOrNull(t.group),
      };
      await prisma.team.upsert({
        where: { id: t.teamID },
        create: { id: t.teamID, ...payload },
        update: payload,
      });
      count++;
    }
  }
  return count;
}

/** Completed/in-progress results for a series. */
export async function syncMatches(seriesId: number): Promise<number> {
  const list = (await getMatches(seriesId)) ?? [];
  const rows = list.flatMap((m) => {
    if (!m.matchId) return []; // skip unscored placeholders
    return [{
      id: m.matchId,
      seriesId,
      seriesName: m.seriesName ?? null,
      clubId: numOrNull(m.clubId),
      teamOneId: numOrNull(m.teamOne),
      teamTwoId: numOrNull(m.teamTwo),
      teamOneName: m.teamOneName ?? null,
      teamTwoName: m.teamTwoName ?? null,
      teamOneCode: m.teamOneCode ?? null,
      teamTwoCode: m.teamTwoCode ?? null,
      teamOneLogo: m.t1_logo_file_path ?? null,
      teamTwoLogo: m.t2_logo_file_path ?? null,
      overs: numOrNull(m.overs),
      t1Total: numOrNull(m.t1total),
      t1Wickets: numOrNull(m.t1wickets),
      t1Balls: numOrNull(m.t1balls),
      t2Total: numOrNull(m.t2total),
      t2Wickets: numOrNull(m.t2wickets),
      t2Balls: numOrNull(m.t2balls),
      isComplete: num(m.isComplete) === 1,
      status: m.status ?? null,
      result: m.result ?? null,
      winner: numOrNull(m.winner),
      matchDate: m.matchDate ?? null,
      location: m.location ?? null,
      liveStreamLink: m.live_streaming_link ?? null,
      lastUpdated: dateFromIso(m.lastUpdatedDate),
    }];
  });
  // Snapshot replace: getMatches returns the series' complete result set, so clear and
  // bulk-insert in one atomic transaction — far faster than row-by-row upsert, and it
  // drops any match the source removed. (getMatches throws on error, so an empty list
  // here is a genuinely empty series, not a failure.)
  await prisma.$transaction([
    prisma.match.deleteMany({ where: { seriesId } }),
    prisma.match.createMany({ data: rows, skipDuplicates: true }),
  ]);
  return rows.length;
}

/** Points table / standings for a series. */
export async function syncStandings(seriesId: number): Promise<number> {
  const groups = (await getPointsTable(seriesId)) ?? [];
  const rows = groups.flatMap((g) =>
    (g.teams ?? []).flatMap((row) => {
      const t = row.team;
      if (!t?.teamID) return [];
      return [{
        seriesId,
        teamId: t.teamID,
        groupName: g.groupName ?? null,
        teamName: t.teamName ?? null,
        teamCode: t.teamCode ?? null,
        teamLogo: t.logo_file_path ?? null,
        matches: num(t.matches),
        won: num(t.won),
        lost: num(t.lost),
        tied: num(t.tied),
        noResult: num(t.noResult),
        points: num(t.points),
        netRunRate: numOrNull(t.netRunRate),
        runsScored: numOrNull(t.runsScored),
        runsGiven: numOrNull(t.runsGiven),
      }];
    })
  );
  await prisma.$transaction([
    prisma.standing.deleteMany({ where: { seriesId } }),
    prisma.standing.createMany({ data: rows, skipDuplicates: true }),
  ]);
  return rows.length;
}

/** Batting leaderboard ("Number Zone") for a series. */
export async function syncBattingStats(seriesId: number): Promise<number> {
  const list = (await getBattingStats(seriesId)) ?? [];
  const rows = list.flatMap((b) => {
    if (!b.playerID) return [];
    return [{
      seriesId,
      playerId: b.playerID,
      // Part of the PK: the feed has one row per (player, team) — see schema.
      teamId: num(b.teamId),
      firstName: b.firstName ?? null,
      lastName: b.lastName ?? null,
      teamName: b.teamName ?? null,
      profilePic: b.profilepic_file_path ?? null,
      matches: num(b.matches),
      innings: num(b.innings),
      notOuts: num(b.notOuts),
      runs: num(b.runsScored),
      balls: num(b.ballsFaced),
      fours: num(b.fours),
      sixes: num(b.sixers),
      fifties: num(b.fifties),
      hundreds: num(b.hundreds),
      highestScore: numOrNull(b.highestScore),
      points: numOrNull(b.points),
    }];
  });
  await prisma.$transaction([
    prisma.playerBattingStat.deleteMany({ where: { seriesId } }),
    prisma.playerBattingStat.createMany({ data: rows, skipDuplicates: true }),
  ]);
  return rows.length;
}

/** Bowling leaderboard for a series. */
export async function syncBowlingStats(seriesId: number): Promise<number> {
  const list = (await getBowlingStats(seriesId)) ?? [];
  const rows = list.flatMap((b) => {
    if (!b.playerID) return [];
    return [{
      seriesId,
      playerId: b.playerID,
      teamId: num(b.teamId),
      firstName: b.firstName ?? null,
      lastName: b.lastName ?? null,
      teamName: b.teamName ?? null,
      profilePic: b.profilepic_file_path ?? null,
      matches: num(b.matches),
      innings: num(b.innings),
      balls: num(b.balls),
      runs: num(b.runs),
      wickets: num(b.wickets),
      catches: num(b.catches),
      fourWickets: num(b.fourWickets),
      fiveWickets: num(b.fiveWickets),
      maidens: num(b.maidens),
      dotBalls: num(b.dotBalls),
      wides: num(b.wides),
      noBalls: num(b.noBalls),
      hattricks: num(b.hattricks),
      economy: numOrNull(b.economy),
      points: numOrNull(b.points),
    }];
  });
  await prisma.$transaction([
    prisma.playerBowlingStat.deleteMany({ where: { seriesId } }),
    prisma.playerBowlingStat.createMany({ data: rows, skipDuplicates: true }),
  ]);
  return rows.length;
}

/** Fielding leaderboard for a series. */
export async function syncFieldingStats(seriesId: number): Promise<number> {
  const list = (await getFieldingStats(seriesId)) ?? [];
  const rows = list.flatMap((f) => {
    if (!f.playerID) return [];
    return [{
      seriesId,
      playerId: f.playerID,
      teamId: num(f.teamId),
      firstName: f.firstName ?? null,
      lastName: f.lastName ?? null,
      teamName: f.teamName ?? null,
      profilePic: f.profilepic_file_path ?? null,
      matches: num(f.totalMatches),
      catches: num(f.catches),
      wkCatches: num(f.wkcatches),
      directRunOuts: num(f.direct),
      indirectRunOuts: num(f.indirect),
      stumpings: num(f.stumpings),
      total: num(f.total),
      points: numOrNull(f.points),
    }];
  });
  await prisma.$transaction([
    prisma.playerFieldingStat.deleteMany({ where: { seriesId } }),
    prisma.playerFieldingStat.createMany({ data: rows, skipDuplicates: true }),
  ]);
  return rows.length;
}

/** Club Cricket of Chicago's squads (one team entry per division). */
export async function syncRosters(): Promise<{ players: number; roster: number }> {
  let players = 0;
  let roster = 0;
  for (const teamId of CCC_TEAM_IDS) {
    const data = await getTeamPlayers(teamId);
    const list = data?.teamPlayers ?? [];
    for (const p of list) {
      if (!p.playerID) continue;
      const playerPayload = {
        firstName: p.firstName ?? null,
        lastName: p.lastName ?? null,
        profilePic: p.profilepic_file_path ?? null,
        playingRole: p.playingRole ?? null,
      };
      await prisma.player.upsert({
        where: { id: p.playerID },
        create: { id: p.playerID, ...playerPayload },
        update: playerPayload,
      });
      players++;
      const rosterPayload = {
        jerseyNumber: p.jerseyNumber ?? null,
        role: p.playingRole ?? null,
      };
      await prisma.teamRoster.upsert({
        where: { teamId_playerId: { teamId, playerId: p.playerID } },
        create: { teamId, playerId: p.playerID, ...rosterPayload },
        update: rosterPayload,
      });
      roster++;
    }
  }
  return { players, roster };
}

/** Store full scorecards for completed matches in `seriesIds` (capped per run).
 *  Scorecards are NOT immutable: scorers correct them after the fact (e.g. re-attributing
 *  an innings to the right player), and CricClubs bumps the match's `lastUpdatedDate`
 *  when they do. So fetch cards that are missing OR whose match row was updated upstream
 *  after we stored the card. Returns the number fetched (>0 signals a match finished or
 *  was corrected). */
export async function syncScorecards(seriesIds: number[], cap = 20): Promise<number> {
  const completed = await prisma.match.findMany({
    where: { seriesId: { in: seriesIds }, isComplete: true },
    select: { id: true, lastUpdated: true },
  });
  const stored = await prisma.matchScorecard.findMany({
    where: { matchId: { in: completed.map((m) => m.id) } },
    select: { matchId: true, syncedAt: true },
  });
  const storedAt = new Map(stored.map((s) => [s.matchId, s.syncedAt]));
  const missing = completed
    .filter((m) => {
      const at = storedAt.get(m.id);
      if (!at) return true; // never stored
      return m.lastUpdated != null && m.lastUpdated > at; // corrected upstream
    })
    .map((m) => m.id)
    .slice(0, cap);
  let count = 0;
  for (const matchId of missing) {
    const data = await getScoreCard(matchId).catch(() => null);
    if (!data) continue;
    await prisma.matchScorecard.upsert({
      where: { matchId },
      create: { matchId, data: data as Prisma.InputJsonValue },
      update: { data: data as Prisma.InputJsonValue },
    });
    count++;
  }
  return count;
}

/** Refresh CCC players' career stats (PlayerCareer) and one-time bios (Player.*Style/age).
 *  Career stats change only when a player features in a match, so call this post-match. */
export async function syncPlayerCareers(bioCap = 10): Promise<number> {
  const roster = await prisma.teamRoster.findMany({
    where: { teamId: { in: CCC_TEAM_IDS } },
    select: { playerId: true },
  });
  const playerIds = [...new Set(roster.map((r) => r.playerId))];
  // Bios are static — fetch only for players that don't have one yet (capped, to spread
  // the one-time backfill across runs).
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, battingStyle: true },
  });
  const needBio = new Set(
    players.filter((p) => !p.battingStyle).map((p) => p.id).slice(0, bioCap)
  );
  let count = 0;
  for (const playerId of playerIds) {
    const [career, bio] = await Promise.all([
      getCareerStats(playerId).catch(() => null),
      needBio.has(playerId) ? getUserDetails(playerId).catch(() => null) : null,
    ]);
    if (career) {
      await prisma.playerCareer.upsert({
        where: { playerId },
        create: { playerId, careerStats: career as Prisma.InputJsonValue },
        update: { careerStats: career as Prisma.InputJsonValue },
      });
      count++;
    }
    if (bio) {
      await prisma.player
        .update({
          where: { id: playerId },
          data: {
            battingStyle: str(bio.battingStyle),
            bowlingStyle: str(bio.bowlingStyle),
            dateOfBirth: str(bio.dateOfBirth),
            age: numOrNull(bio.age),
          },
        })
        .catch(() => {});
    }
  }
  return count;
}

// ---- orchestration ---------------------------------------------------------

type StepResult =
  | { status: "ok"; result: unknown }
  | { status: "error"; error: string };

async function runStep(
  entity: string,
  fn: () => Promise<unknown>
): Promise<StepResult> {
  const t0 = Date.now();
  try {
    const result = await fn();
    const itemCount = typeof result === "number" ? result : null;
    await prisma.syncState.upsert({
      where: { entity },
      create: {
        entity,
        lastSyncedAt: new Date(),
        lastStatus: "ok",
        lastError: null,
        itemCount,
        durationMs: Date.now() - t0,
      },
      update: {
        lastSyncedAt: new Date(),
        lastStatus: "ok",
        lastError: null,
        itemCount,
        durationMs: Date.now() - t0,
      },
    });
    return { status: "ok", result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncState.upsert({
      where: { entity },
      create: {
        entity,
        lastSyncedAt: new Date(),
        lastStatus: "error",
        lastError: message,
        durationMs: Date.now() - t0,
      },
      update: {
        lastSyncedAt: new Date(),
        lastStatus: "error",
        lastError: message,
        durationMs: Date.now() - t0,
      },
    });
    return { status: "error", error: message };
  }
}

/** Full sync of all tracked CricClubs data into the DB. Safe to re-run anytime. */
export async function syncAll(): Promise<{
  durationMs: number;
  steps: Record<string, StepResult>;
}> {
  const started = Date.now();
  const steps: Record<string, StepResult> = {};

  steps.series = await runStep("series", syncSeries);
  steps.fixtures = await runStep("fixtures", syncFixtures);

  // Routine syncs only touch the ACTIVE season; finished seasons are immutable and already
  // mirrored, so skip them to stay well under the CricClubs rate limit. SYNC_ALL=1 forces a
  // full backfill of every tracked series. Per series, fetch the six endpoints concurrently
  // (bounded burst of 6); keep series sequential so we never fan out to 13×6 calls at once.
  const seriesToSync =
    process.env.SYNC_ALL === "1"
      ? TRACKED_SERIES
      : TRACKED_SERIES.filter((s) => s.year === ACTIVE_SEASON_YEAR);
  for (const { id } of seriesToSync) {
    const [teams, matches, standings, batting, bowling, fielding] = await Promise.all([
      runStep(`teams:${id}`, () => syncTeams(id)),
      runStep(`matches:${id}`, () => syncMatches(id)),
      runStep(`standings:${id}`, () => syncStandings(id)),
      runStep(`batting:${id}`, () => syncBattingStats(id)),
      runStep(`bowling:${id}`, () => syncBowlingStats(id)),
      runStep(`fielding:${id}`, () => syncFieldingStats(id)),
    ]);
    steps[`teams:${id}`] = teams;
    steps[`matches:${id}`] = matches;
    steps[`standings:${id}`] = standings;
    steps[`batting:${id}`] = batting;
    steps[`bowling:${id}`] = bowling;
    steps[`fielding:${id}`] = fielding;
  }

  steps.rosters = await runStep("rosters", syncRosters);

  // Scorecards for finished matches in the synced series (capped/run; re-fetched when
  // the match row is updated upstream after we stored the card). A fetched scorecard
  // means a match just finished or was corrected -> refresh CCC career stats, throttled
  // to ~once/day.
  const syncedSeriesIds = seriesToSync.map((s) => s.id);
  const scStep = await runStep("scorecards", () => syncScorecards(syncedSeriesIds, 20));
  steps.scorecards = scStep;
  const newScorecards =
    scStep.status === "ok" && typeof scStep.result === "number" ? scStep.result : 0;
  if (newScorecards > 0) {
    const careersState = await prisma.syncState.findUnique({ where: { entity: "careers" } });
    const careersStale =
      !careersState?.lastSyncedAt ||
      Date.now() - careersState.lastSyncedAt.getTime() > 20 * 3600 * 1000;
    if (careersStale) {
      steps.careers = await runStep("careers", syncPlayerCareers);
    }
  }

  return { durationMs: Date.now() - started, steps };
}
