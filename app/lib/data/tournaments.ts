// Server-side: read tournament data from the DB (Neon) and shape it EXACTLY like the
// CMS `tournamentPage_Entry` objects the existing tournament components consume, so the
// page renders identically while sourced from CricClubs. See REBUILD_PLAN §12.

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { TRACKED_SERIES } from "../cricclubs/config";
import { CCC_NAME, isCCCName, isCCCSide, cccMatchOr } from "./ccc";

const IMG = "https://media.cricclubs.com";

const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";
const fullName = (f?: string | null, l?: string | null) =>
  [f, l].filter(Boolean).join(" ");
const oversFromBalls = (b?: number | null) => {
  const n = b ?? 0;
  return `${Math.floor(n / 6)}.${n % 6}`;
};

type Entry = Record<string, unknown>;

async function buildDetail(series: { id: number; name: string; year: string }) {
  const seriesId = series.id;

  // Fetch ALL division stats (ordered) so we can compute each player's league rank,
  // then show only Club Cricket of Chicago players.
  const [standings, allBatting, allBowling, allFielding, matches] =
    await Promise.all([
      prisma.standing.findMany({
        where: { seriesId },
        orderBy: [{ points: "desc" }, { netRunRate: "desc" }],
      }),
      prisma.playerBattingStat.findMany({
        where: { seriesId },
        orderBy: { runs: "desc" },
      }),
      prisma.playerBowlingStat.findMany({
        where: { seriesId },
        orderBy: { wickets: "desc" },
      }),
      prisma.playerFieldingStat.findMany({
        where: { seriesId },
        orderBy: { total: "desc" },
      }),
      prisma.match.findMany({
        // Results panel is CCC-focused: only completed matches CCC played in.
        where: {
          seriesId,
          isComplete: true,
          OR: cccMatchOr,
        },
        orderBy: [{ lastUpdated: "desc" }, { id: "desc" }],
        take: 20,
      }),
    ]);

  // League rank = 1-based position in the full division for that metric. Rows are
  // per (player, team) — a player who turned out for two teams has a row for each —
  // so rank rows by their (player, team) identity, exactly as CricClubs lists them.
  const rowKey = (r: { playerId: number; teamId: number }) =>
    `${r.playerId}:${r.teamId}`;
  const battingRank = new Map<string, number>();
  allBatting.forEach((b, i) => battingRank.set(rowKey(b), i + 1));
  const bowlingRank = new Map<string, number>();
  allBowling.forEach((b, i) => bowlingRank.set(rowKey(b), i + 1));
  const fieldingRank = new Map<string, number>();
  allFielding.forEach((f, i) => fieldingRank.set(rowKey(f), i + 1));

  // Restrict player tables / Player of the Week to Club Cricket of Chicago.
  const isCCC = <T extends { teamName: string | null }>(r: T) =>
    isCCCName(r.teamName);
  const batting = allBatting.filter(isCCC);
  const bowling = allBowling.filter(isCCC);
  const fielding = allFielding.filter(isCCC);

  // teamStandings -> [{ id, title, teamLogo:[{url}], wins, loses }] (full division)
  const teamStandings = standings.map((s) => ({
    id: s.teamId,
    title: s.teamName ?? "Team",
    teamLogo: [{ url: img(s.teamLogo) }],
    wins: s.won,
    loses: s.lost,
    draws: s.tied,
    noResults: s.noResult,
    points: s.points,
  }));

  // Player of the Week: top run-scorer + top wicket-taker
  const topBat = batting[0];
  const topBowl = [...bowling].sort((a, b) => b.wickets - a.wickets)[0];

  // leagueStats highlight cards (CCC-focused) -> [{ id, title, number }]
  const cccMatchesPlayed = standings.find(isCCC)?.matches ?? 0;
  const leagueStats = [
    { id: `${seriesId}-matches`, title: "Matches", number: cccMatchesPlayed },
    { id: `${seriesId}-runs`, title: "Runs", number: batting.reduce((s, b) => s + b.runs, 0) },
    { id: `${seriesId}-wkts`, title: "Wickets", number: bowling.reduce((s, b) => s + b.wickets, 0) },
    { id: `${seriesId}-sixes`, title: "Sixes", number: batting.reduce((s, b) => s + b.sixes, 0) },
  ];

  // Team Batting / Team Bowling highlight cards — CCC aggregates, same {title, number}
  // shape as leagueStats so they render through the same CredsEle cards.
  const teamBatting = [
    { id: `${seriesId}-tb-runs`, title: "Runs", number: batting.reduce((s, b) => s + b.runs, 0) },
    { id: `${seriesId}-tb-fours`, title: "Fours", number: batting.reduce((s, b) => s + b.fours, 0) },
    { id: `${seriesId}-tb-sixes`, title: "Sixes", number: batting.reduce((s, b) => s + b.sixes, 0) },
    { id: `${seriesId}-tb-fifties`, title: "Fifties", number: batting.reduce((s, b) => s + b.fifties, 0) },
  ];
  const ballsBowled = bowling.reduce((s, b) => s + (b.balls ?? 0), 0);
  const runsConceded = bowling.reduce((s, b) => s + b.runs, 0);
  const teamBowling = [
    { id: `${seriesId}-bw-wkts`, title: "Wickets", number: bowling.reduce((s, b) => s + b.wickets, 0) },
    { id: `${seriesId}-bw-conceded`, title: "Runs Conceded", number: runsConceded },
    { id: `${seriesId}-bw-dots`, title: "Dot Balls", number: bowling.reduce((s, b) => s + b.dotBalls, 0) },
    {
      id: `${seriesId}-bw-econ`,
      title: "Economy",
      number: ballsBowled > 0 ? Number((runsConceded / (ballsBowled / 6)).toFixed(2)) : 0,
    },
  ];

  // Win/loss colour from Club Cricket of Chicago's perspective (CCC's teamId differs
  // per series, so match by name). Non-CCC matches fall back to team-one.
  const cccWon = (m: (typeof matches)[number]) => {
    if (m.winner == null) return false;
    if (isCCCSide(m.teamOneName, m.teamOneId)) return m.winner === m.teamOneId;
    if (isCCCSide(m.teamTwoName, m.teamTwoId)) return m.winner === m.teamTwoId;
    return m.winner === m.teamOneId;
  };

  // resultCards -> ResultItem[]
  const resultCards = matches.map((m) => {
    const cccIsT1 = isCCCSide(m.teamOneName, m.teamOneId);
    const t1 = `${m.t1Total ?? 0}/${m.t1Wickets ?? 0}`;
    const t2 = `${m.t2Total ?? 0}/${m.t2Wickets ?? 0}`;
    return {
      id: m.id,
      title: m.result ?? "",
      lightswitch: cccWon(m),
      date: m.matchDate ?? "",
      t1Score: t1,
      t1Overs: oversFromBalls(m.t1Balls),
      teamOneLogo: [{ url: img(m.teamOneLogo) }],
      t2Score: t2,
      t2Overs: oversFromBalls(m.t2Balls),
      teamTwoLogo: [{ url: img(m.teamTwoLogo) }],
      // opponent-centric fields so results can render like the fixtures cards
      opponentName: (cccIsT1 ? m.teamTwoName : m.teamOneName) ?? "Opponent",
      opponentLogo: [{ url: img(cccIsT1 ? m.teamTwoLogo : m.teamOneLogo) }],
      cccScore: cccIsT1 ? t1 : t2,
      oppScore: cccIsT1 ? t2 : t1,
    };
  });

  // Stat tables — RAW row shape (TournamentStats splits `player` and renames short codes)
  const battingNumberZone = batting.map((b) => ({
    player: fullName(b.firstName, b.lastName),
    mat: b.matches,
    ins: b.innings,
    bf: b.balls,
    runs: b.runs,
    fours: b.fours,
    sixes: b.sixes,
    fifties: b.fifties,
    hundreds: b.hundreds,
    no: b.notOuts,
    hs: b.highestScore ?? 0,
    rank: battingRank.get(rowKey(b)) ?? null,
  }));
  const bowlingNumberZone = bowling.map((b) => ({
    player: fullName(b.firstName, b.lastName),
    mat: b.matches,
    ins: b.innings,
    balls: b.balls,
    runs: b.runs,
    wkts: b.wickets,
    pts: b.points ?? 0,
    cths: b.catches,
    fourW: b.fourWickets,
    fiveW: b.fiveWickets,
    db: b.dotBalls,
    rank: bowlingRank.get(rowKey(b)) ?? null,
  }));
  const fieldingNumberZone = fielding.map((f) => ({
    player: fullName(f.firstName, f.lastName),
    mat: f.matches,
    cths: f.catches,
    wc: f.wkCatches,
    dr: f.directRunOuts,
    idr: f.indirectRunOuts,
    stm: f.stumpings,
    to: f.total,
    rank: fieldingRank.get(rowKey(f)) ?? null,
  }));

  // Overall points per player across the three stat tables over the FULL division,
  // ranked by total (= league rank), carrying photo/id so we can reuse it for both the
  // ranking table and the "top performers" cards.
  const ptsMap = new Map<
    number,
    {
      playerId: number;
      name: string;
      teamName: string | null;
      pic: string | null;
      isCCC: boolean;
      batting: number;
      bowling: number;
      fielding: number;
    }
  >();
  const bump = (
    r: {
      playerId: number;
      firstName: string | null;
      lastName: string | null;
      teamName: string | null;
      profilePic: string | null;
      points: number | null;
    },
    key: "batting" | "bowling" | "fielding"
  ) => {
    const e =
      ptsMap.get(r.playerId) ??
      {
        playerId: r.playerId,
        name: fullName(r.firstName, r.lastName),
        teamName: r.teamName,
        pic: r.profilePic,
        isCCC: false,
        batting: 0,
        bowling: 0,
        fielding: 0,
      };
    if (!e.name) e.name = fullName(r.firstName, r.lastName);
    if (!e.teamName) e.teamName = r.teamName;
    if (!e.pic) e.pic = r.profilePic;
    // A player can have rows for more than one team; count them as CCC if ANY row is.
    if (isCCCName(r.teamName)) e.isCCC = true;
    e[key] += r.points ?? 0;
    ptsMap.set(r.playerId, e);
  };
  allBatting.forEach((r) => bump(r, "batting"));
  allBowling.forEach((r) => bump(r, "bowling"));
  allFielding.forEach((r) => bump(r, "fielding"));
  const cccOverall = [...ptsMap.values()]
    .map((e) => ({ ...e, total: e.batting + e.bowling + e.fielding }))
    .sort((a, b) => b.total - a.total)
    .map((e, i) => ({ ...e, leagueRank: i + 1 }))
    .filter((e) => e.isCCC);

  // topPlayers -> CCC's best OVERALL performers, ranked by total points
  // (batting + bowling + fielding).
  const topPlayers = cccOverall.slice(0, 4).map((e) => ({
    id: e.playerId,
    playerName: e.name || "Unknown Player",
    image: [{ url: img(e.pic) }],
    title: "Top Performer",
    cardValue: Math.round(e.total),
    playerPosition: "Overall Points",
  }));

  // Round each displayed column, then derive the displayed total from those SAME
  // rounded values — rounding the raw total separately can disagree with the sum of
  // the rounded columns, and the table must visibly add up.
  const rankingZone = cccOverall.map((e) => {
    const battingPoints = Math.round(e.batting);
    const bowlingPoints = Math.round(e.bowling);
    const fieldingPoints = Math.round(e.fielding);
    return {
      player: e.name,
      battingPoints,
      bowlingPoints,
      fieldingPoints,
      otherPoints: 0,
      total: battingPoints + bowlingPoints + fieldingPoints,
      rank: e.leagueRank,
    };
  });

  return {
    id: String(seriesId),
    typeHandle: "tournamentPage",
    title: series.name,
    slug: String(seriesId),
    parent: { id: series.year, title: series.year, slug: series.year, typeHandle: "tournamentYearPage" },
    flagImage: [],
    teamStandings,
    batsmanName: topBat ? fullName(topBat.firstName, topBat.lastName) : "-",
    batsmanImage: [{ url: img(topBat?.profilePic) }],
    batsmanLabel: "Runs",
    batsmanValue: topBat?.runs ?? 0,
    bowlerName: topBowl ? fullName(topBowl.firstName, topBowl.lastName) : "-",
    bowlerImage: [{ url: img(topBowl?.profilePic) }],
    bowlerCardLabel: "Wickets",
    bowlerValue: topBowl?.wickets ?? 0,
    leagueStats,
    topPlayers,
    teamBatting,
    teamBowling,
    resultCards,
    battingNumberZone,
    bowlingNumberZone,
    fieldingNumberZone,
    rankingZone,
  } satisfies Entry;
}

const yearPageEntries = (): Entry[] =>
  [...new Set(TRACKED_SERIES.map((s) => s.year))]
    .sort()
    .reverse()
    .map((y) => ({ id: y, typeHandle: "tournamentYearPage", title: y, slug: y }));

/**
 * Lightweight list: year pages + tournament stubs, each stub carrying CCC's OUTCOME in
 * that competition — division position, team count, P/W/L/T and points — from a single
 * standings read. This is what lets /tournaments render as a trophy cabinet instead of
 * a bare title list, still without triggering the full per-series build.
 */
async function buildTournamentList(): Promise<{ entries: Entry[] }> {
  const standings = await prisma.standing.findMany({
    where: { seriesId: { in: TRACKED_SERIES.map((s) => s.id) } },
    // teamId last so full ties order deterministically instead of by row order.
    orderBy: [{ points: "desc" }, { netRunRate: "desc" }, { teamId: "asc" }],
  });

  const stubs: Entry[] = TRACKED_SERIES.map((s) => {
    const table = standings.filter((r) => r.seriesId === s.id); // points-desc order preserved
    // A table where every side is scoreless (playoff brackets: 0 points, 0
    // matches all round) carries no ranking signal — a "position" in it is
    // just row order wearing a number. Assert nothing.
    const unranked =
      table.length > 0 && table.every((r) => r.points === 0 && r.matches === 0);
    const idx = unranked ? -1 : table.findIndex((r) => isCCCSide(r.teamName, r.teamId));
    const row = idx >= 0 ? table[idx] : null;
    return {
      id: String(s.id),
      typeHandle: "tournamentPage",
      title: s.name,
      slug: String(s.id),
      flagImage: [],
      parent: { id: s.year, title: s.year, slug: s.year, typeHandle: "tournamentYearPage" },
      // Raw standings, always — a 9th of 10 is shown as-is. Null when the series has
      // no standings rows (nothing synced yet).
      outcome: row
        ? {
            position: idx + 1,
            teams: table.length,
            played: row.matches,
            won: row.won,
            lost: row.lost,
            tied: row.tied,
            noResult: row.noResult,
            points: row.points,
          }
        : null,
    };
  });
  return { entries: [...yearPageEntries(), ...stubs] };
}

export const getTournamentList = unstable_cache(
  buildTournamentList,
  ["tournament-list"],
  { revalidate: 300, tags: ["cricclubs"] }
);

/**
 * Full tournament details. Pass `year` to build only that season's divisions (all a
 * detail page needs for its prev/next nav) instead of every tracked series.
 */
async function buildTournamentEntries(year?: string): Promise<{ entries: Entry[] }> {
  const wanted = year ? TRACKED_SERIES.filter((s) => s.year === year) : TRACKED_SERIES;
  const details = await Promise.all(wanted.map(buildDetail));
  return { entries: [...yearPageEntries(), ...details] };
}

// Heavy (builds a season's series, or all). Cached per `year` arg; refreshed by sync tag.
export const getTournamentEntries = unstable_cache(
  buildTournamentEntries,
  ["tournament-entries"],
  { revalidate: 120, tags: ["cricclubs"] }
);

/** Upcoming fixtures for a series, shaped like the CMS fixture entries. */
async function buildFixtureEntries(slug: string): Promise<{ entries: Entry[] }> {
  const seriesId = Number(slug);
  if (!Number.isFinite(seriesId)) return { entries: [] };

  const fixtures = await prisma.fixture.findMany({
    // CCC-focused: only upcoming fixtures CCC is scheduled to play in.
    where: {
      seriesId,
      matchId: 0,
      // upcoming fixtures are current-season only, where CCC uses its exact name
      OR: [{ teamOneName: CCC_NAME }, { teamTwoName: CCC_NAME }],
    },
    orderBy: [{ matchDateTime: "asc" }, { id: "asc" }],
    take: 40,
  });

  const entries = fixtures.map((f) => ({
    id: String(f.id),
    title: `${f.teamOneName ?? ""} vs ${f.teamTwoName ?? ""}`.trim(),
    t1t2NativeFlag: null,
    groundsName: f.location ?? "",
    date: f.date ?? "",
    t1Name: f.teamOneName ?? "",
    t1Logo: [{ url: img(f.teamOneLogo), alt: f.teamOneName ?? "" }],
    t2Name: f.teamTwoName ?? "",
    t2Logo: [{ url: img(f.teamTwoLogo), alt: f.teamTwoName ?? "" }],
    mappedSeries: [{ id: String(seriesId), title: f.seriesName ?? "", slug }],
  }));

  return { entries };
}

export const getFixtureEntries = unstable_cache(
  buildFixtureEntries,
  ["fixture-entries"],
  { revalidate: 120, tags: ["cricclubs"] }
);
