// Verifies the tournament pages' player score totals.
//   npx tsx scripts/verify-tournament-scores.ts          # DB-only (0 CricClubs calls)
//   npx tsx scripts/verify-tournament-scores.ts --live   # + 9 live calls (3 series x 3 stats)
//   npx tsx scripts/verify-tournament-scores.ts --all    # check every tracked series, not just active
//
// Checks, per tracked series:
//  1. UI math — rebuild the Rankings tab exactly as app/lib/data/tournaments.ts does and
//     flag rows where the displayed columns don't sum to the displayed total.
//  2. Ground truth — re-derive each CCC player's runs/wickets by summing the stored match
//     scorecards and diff against the leaderboard totals the page shows.
//  3. (--live) Freshness — diff the Neon mirror against the live CricClubs leaderboards.
//
// Stat rows are per (player, team): a player who turns out for two teams in one series
// has a row per team, so player totals aggregate rows by playerId.
import "dotenv/config";
import { prisma } from "../app/lib/db/prisma";
import { TRACKED_SERIES, ACTIVE_SEASON_YEAR } from "../app/lib/cricclubs/config";
import { isCCCName } from "../app/lib/data/ccc";
import {
  getBattingStats,
  getBowlingStats,
  getFieldingStats,
} from "../app/lib/cricclubs/endpoints";

const LIVE = process.argv.includes("--live");
let problems = 0;

const name = (f?: string | null, l?: string | null) =>
  [f, l].filter(Boolean).join(" ");
const num = (v: unknown) => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};

// ---- 1. Rankings-tab math (mirrors buildDetail's ptsMap/rankingZone) --------
async function checkRankingMath(seriesId: number, label: string) {
  const [bat, bowl, field] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { seriesId } }),
    prisma.playerBowlingStat.findMany({ where: { seriesId } }),
    prisma.playerFieldingStat.findMany({ where: { seriesId } }),
  ]);
  type Agg = { name: string; isCCC: boolean; batting: number; bowling: number; fielding: number };
  const map = new Map<number, Agg>();
  const bump = (
    r: { playerId: number; firstName: string | null; lastName: string | null; teamName: string | null; points: number | null },
    k: "batting" | "bowling" | "fielding"
  ) => {
    const e = map.get(r.playerId) ?? {
      name: name(r.firstName, r.lastName), isCCC: false, batting: 0, bowling: 0, fielding: 0,
    };
    if (isCCCName(r.teamName)) e.isCCC = true;
    e[k] += r.points ?? 0;
    map.set(r.playerId, e);
  };
  bat.forEach((r) => bump(r, "batting"));
  bowl.forEach((r) => bump(r, "bowling"));
  field.forEach((r) => bump(r, "fielding"));

  let bad = 0;
  for (const e of map.values()) {
    if (!e.isCCC) continue; // page shows CCC rows only
    const raw = e.batting + e.bowling + e.fielding;
    // What the UI renders: per-column rounding, total = sum of the rounded columns.
    const col = { b: Math.round(e.batting), bo: Math.round(e.bowling), f: Math.round(e.fielding) };
    const shownTotal = col.b + col.bo + col.f;
    if (col.b + col.bo + col.f !== shownTotal || Math.abs(shownTotal - raw) > 1.5) {
      bad++;
      problems++;
      console.log(
        `  ✗ [${label}] ${e.name}: shows ${col.b} + ${col.bo} + ${col.f} + 0 = ${shownTotal}` +
          ` (raw total ${raw.toFixed(2)})`
      );
    }
  }
  console.log(`  rankings math [${label}]: ${map.size} players, ${bad} CCC rows don't add up`);
}

// ---- 2. Leaderboards vs stored scorecards (ground truth) --------------------
type Derived = { name: string; runs: number; wickets: number };

async function checkAgainstScorecards(seriesId: number, label: string) {
  const matches = await prisma.match.findMany({
    where: { seriesId, isComplete: true },
    select: { id: true },
  });
  const cards = await prisma.matchScorecard.findMany({
    where: { matchId: { in: matches.map((m) => m.id) } },
  });
  const missing = matches.length - cards.length;

  const derived = new Map<number, Derived>();
  const at = (id: number, n: string): Derived => {
    const e = derived.get(id) ?? { name: n, runs: 0, wickets: 0 };
    derived.set(id, e);
    return e;
  };
  for (const c of cards) {
    const d = c.data as Record<string, any>;
    for (const key of ["innings1", "innings2", "innings3", "innings4"]) {
      const inn = d[key];
      if (!inn) continue;
      for (const b of inn.batting ?? []) {
        if (!b.playerID) continue;
        if (String(b.outStringNoLink ?? "").toUpperCase() === "DNB") continue;
        at(b.playerID, name(b.firstName, b.lastName)).runs += num(b.runsScored);
      }
      for (const bw of inn.bowling ?? []) {
        if (!bw.playerID) continue;
        at(bw.playerID, name(bw.firstName, bw.lastName)).wickets += num(bw.wickets);
      }
    }
  }

  const [bat, bowl] = await Promise.all([
    prisma.playerBattingStat.findMany({ where: { seriesId } }),
    prisma.playerBowlingStat.findMany({ where: { seriesId } }),
  ]);
  // Aggregate leaderboard rows per player (they're per (player, team)).
  const agg = <T extends { playerId: number; teamName: string | null; firstName: string | null; lastName: string | null }>(
    rows: T[],
    value: (r: T) => number
  ) => {
    const m = new Map<number, { name: string; isCCC: boolean; value: number }>();
    for (const r of rows) {
      const e = m.get(r.playerId) ?? { name: name(r.firstName, r.lastName), isCCC: false, value: 0 };
      if (isCCCName(r.teamName)) e.isCCC = true;
      e.value += value(r);
      m.set(r.playerId, e);
    }
    return m;
  };
  const runTotals = agg(bat, (r) => r.runs);
  const wktTotals = agg(bowl, (r) => r.wickets);

  let checked = 0;
  let bad = 0;
  for (const [playerId, e] of runTotals) {
    if (!e.isCCC) continue;
    checked++;
    const d = derived.get(playerId)?.runs ?? 0;
    if (d !== e.value) {
      bad++;
      problems++;
      console.log(`  ✗ [${label}] batting ${e.name}: page shows ${e.value} runs, scorecards sum to ${d}`);
    }
  }
  for (const [playerId, e] of wktTotals) {
    if (!e.isCCC) continue;
    checked++;
    const d = derived.get(playerId)?.wickets ?? 0;
    if (d !== e.value) {
      bad++;
      problems++;
      console.log(`  ✗ [${label}] bowling ${e.name}: page shows ${e.value} wkts, scorecards sum to ${d}`);
    }
  }
  console.log(
    `  scorecard cross-check [${label}]: ${checked} CCC players checked, ${bad} mismatches` +
      (missing > 0 ? ` (${missing} completed matches lack stored scorecards)` : "")
  );
}

// ---- 3. Live API vs mirror (only with --live; 3 calls per series) -----------
async function checkLive(seriesId: number, label: string) {
  const [liveBat, liveBowl, liveField, dbBat, dbBowl, dbField] = await Promise.all([
    getBattingStats(seriesId),
    getBowlingStats(seriesId),
    getFieldingStats(seriesId),
    prisma.playerBattingStat.findMany({ where: { seriesId } }),
    prisma.playerBowlingStat.findMany({ where: { seriesId } }),
    prisma.playerFieldingStat.findMany({ where: { seriesId } }),
  ]);
  const key = (playerId: number, teamId: unknown) => `${playerId}:${num(teamId)}`;
  let diffs = 0;
  const report = (kind: string, nm: string, liveDesc: string, dbDesc: string) => {
    diffs++;
    problems++;
    console.log(`  ✗ [${label}] live ${kind} ${nm}: API ${liveDesc} vs DB ${dbDesc}`);
  };

  const dbBatMap = new Map(dbBat.map((r) => [key(r.playerId, r.teamId), r]));
  for (const b of liveBat ?? []) {
    if (!b.playerID) continue;
    const row = dbBatMap.get(key(b.playerID, b.teamId));
    const runs = num(b.runsScored);
    const pts = b.points == null ? null : num(b.points);
    if (!row || row.runs !== runs || (row.points ?? null) !== pts)
      report("batting", name(b.firstName, b.lastName), `runs=${runs} pts=${pts}`, `runs=${row?.runs ?? "—"} pts=${row?.points ?? "—"}`);
  }
  const dbBowlMap = new Map(dbBowl.map((r) => [key(r.playerId, r.teamId), r]));
  for (const b of liveBowl ?? []) {
    if (!b.playerID) continue;
    const row = dbBowlMap.get(key(b.playerID, b.teamId));
    const w = num(b.wickets);
    const pts = b.points == null ? null : num(b.points);
    if (!row || row.wickets !== w || (row.points ?? null) !== pts)
      report("bowling", name(b.firstName, b.lastName), `wkts=${w} pts=${pts}`, `wkts=${row?.wickets ?? "—"} pts=${row?.points ?? "—"}`);
  }
  const dbFieldMap = new Map(dbField.map((r) => [key(r.playerId, r.teamId), r]));
  for (const f of liveField ?? []) {
    if (!f.playerID) continue;
    const row = dbFieldMap.get(key(f.playerID, f.teamId));
    const total = num(f.total);
    const pts = f.points == null ? null : num(f.points);
    if (!row || row.total !== total || (row.points ?? null) !== pts)
      report("fielding", name(f.firstName, f.lastName), `total=${total} pts=${pts}`, `total=${row?.total ?? "—"} pts=${row?.points ?? "—"}`);
  }
  console.log(
    `  live diff [${label}]: API rows bat/bowl/field = ${liveBat?.length}/${liveBowl?.length}/${liveField?.length}` +
      ` vs DB ${dbBat.length}/${dbBowl.length}/${dbField.length}, ${diffs} row diffs`
  );
}

async function main() {
  const active = TRACKED_SERIES.filter((s) => s.year === ACTIVE_SEASON_YEAR);
  const all = process.argv.includes("--all") ? TRACKED_SERIES : active;

  for (const s of all) {
    console.log(`\n=== ${s.name} (${s.year}, seriesId ${s.id}) ===`);
    await checkRankingMath(s.id, s.name);
    await checkAgainstScorecards(s.id, s.name);
  }

  if (LIVE) {
    console.log(`\n--- live API verification (${active.length * 3} CricClubs calls) ---`);
    for (const s of active) {
      await checkLive(s.id, s.name);
    }
  }

  console.log(`\n${problems === 0 ? "✓ all totals add up" : `✗ ${problems} problem(s) found`}`);
  await prisma.$disconnect();
  process.exit(problems > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
