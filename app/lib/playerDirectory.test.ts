import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAndSortPlayers,
  sanitizePlayerDisplayName,
  type DirectoryPlayer,
} from "./playerDirectory";

const players: DirectoryPlayer[] = [
  { id: "1", title: "Zahir Khan", matches: 14, totalruns: 210, wickets: 4 },
  { id: "2", title: "Amar Singh", matches: 9, totalruns: 120, wickets: 18, isCaptain: true },
  { id: "3", title: "Dev Patel", matches: 18, totalruns: 340, wickets: 2, isViceCaptain: true },
];

test("sanitizePlayerDisplayName strips phone-like data while preserving names", () => {
  assert.equal(sanitizePlayerDisplayName("Sam Carter (312) 555-0198"), "Sam Carter");
  assert.equal(sanitizePlayerDisplayName("Sam Carter 312-555-0198"), "Sam Carter");
  assert.equal(sanitizePlayerDisplayName("Sam Carter +1 312 555 0198"), "Sam Carter");
  assert.equal(sanitizePlayerDisplayName("Dev Patel"), "Dev Patel");
  assert.equal(sanitizePlayerDisplayName("  Dev   Patel  "), "Dev Patel");
  assert.equal(sanitizePlayerDisplayName("312-555-0198"), "Player");
});

test("filterAndSortPlayers filters by query and leadership", () => {
  assert.deepEqual(
    filterAndSortPlayers(players, { query: "amar", leadershipOnly: false, sort: "runs" }).map((p) => p.id),
    ["2"],
  );
  assert.deepEqual(
    filterAndSortPlayers(players, { query: "", leadershipOnly: true, sort: "runs" }).map((p) => p.id),
    ["3", "2"],
  );
});

test("filterAndSortPlayers supports every sort and never mutates its input", () => {
  const original = players.map((player) => ({ ...player }));

  assert.deepEqual(filterAndSortPlayers(players, { query: "", leadershipOnly: false, sort: "runs" }).map((p) => p.id), ["3", "1", "2"]);
  assert.deepEqual(filterAndSortPlayers(players, { query: "", leadershipOnly: false, sort: "matches" }).map((p) => p.id), ["3", "1", "2"]);
  assert.deepEqual(filterAndSortPlayers(players, { query: "", leadershipOnly: false, sort: "wickets" }).map((p) => p.id), ["2", "1", "3"]);
  assert.deepEqual(filterAndSortPlayers(players, { query: "", leadershipOnly: false, sort: "name" }).map((p) => p.id), ["2", "3", "1"]);
  assert.deepEqual(players, original);
});
