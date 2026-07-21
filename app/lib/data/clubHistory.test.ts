import assert from "node:assert/strict";
import test from "node:test";

async function loadCalculator() {
  try {
    return (await import("./clubHistory")).calculateClubHistoryTotals;
  } catch {
    return undefined;
  }
}

test("calculates CCC history across canonical and alternate team identities", async () => {
  const calculateClubHistoryTotals = await loadCalculator();
  if (!calculateClubHistoryTotals) {
    assert.fail("calculateClubHistoryTotals is not implemented");
  }

  const totals = calculateClubHistoryTotals({
    matches: 47,
    batting: [
      { teamId: 100, teamName: "Club Cricket of Chicago", runs: 1200 },
      { teamId: 2186, teamName: "A historical alias", runs: 275 },
      { teamId: 999, teamName: "Non-CCC Test Team", runs: 6400 },
    ],
    bowling: [
      { teamId: 100, teamName: "Club Cricket Of Chicago", wickets: 81 },
      { teamId: 2240, teamName: "CCC Stars", wickets: 19 },
      { teamId: 999, teamName: "Non-CCC Test Team", wickets: 310 },
    ],
  });

  assert.deepEqual(totals, {
    since: 2022,
    matches: 47,
    runs: 1475,
    wickets: 100,
  });
});

test("returns zero totals when the club has no historical stat rows", async () => {
  const calculateClubHistoryTotals = await loadCalculator();
  if (!calculateClubHistoryTotals) {
    assert.fail("calculateClubHistoryTotals is not implemented");
  }

  assert.deepEqual(
    calculateClubHistoryTotals({ matches: 0, batting: [], bowling: [] }),
    { since: 2022, matches: 0, runs: 0, wickets: 0 }
  );
});
