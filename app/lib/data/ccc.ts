// Shared "is this Club Cricket of Chicago?" identity logic. CCC competes under a few
// team names — "Club Cricket of Chicago", "Club Cricket Of Chicago Seekers" and
// "CCC Stars" — and for the variant teams is most reliably matched by team id. Every
// DB reader that filters to CCC should use these helpers so the rules stay consistent.

import { Prisma } from "@prisma/client";
import { CCC_ALT_TEAM_IDS } from "../cricclubs/config";

export const CCC_NAME = "Club Cricket of Chicago";

/** True if a team name is any of CCC's known names. */
export const isCCCName = (n?: string | null) => {
  const s = (n ?? "").trim().toLowerCase();
  return s.startsWith("club cricket of chicago") || s === "ccc stars";
};

/** True if a (name, id) pair identifies a CCC side, including variant teams by id. */
export const isCCCSide = (name?: string | null, id?: number | null) =>
  isCCCName(name) || (id != null && CCC_ALT_TEAM_IDS.includes(id));

/** Prisma OR fragment selecting matches CCC played in (any name or variant id). */
export const cccMatchOr: Prisma.MatchWhereInput[] = [
  { teamOneName: CCC_NAME },
  { teamTwoName: CCC_NAME },
  { teamOneName: "Club Cricket Of Chicago Seekers" },
  { teamTwoName: "Club Cricket Of Chicago Seekers" },
  { teamOneName: "CCC Stars" },
  { teamTwoName: "CCC Stars" },
  { teamOneId: { in: CCC_ALT_TEAM_IDS } },
  { teamTwoId: { in: CCC_ALT_TEAM_IDS } },
];

/** Same selector against the fixtures table (identical team columns). */
export const cccFixtureOr: Prisma.FixtureWhereInput[] = [
  { teamOneName: CCC_NAME },
  { teamTwoName: CCC_NAME },
  { teamOneName: "Club Cricket Of Chicago Seekers" },
  { teamTwoName: "Club Cricket Of Chicago Seekers" },
  { teamOneName: "CCC Stars" },
  { teamTwoName: "CCC Stars" },
  { teamOneId: { in: CCC_ALT_TEAM_IDS } },
  { teamTwoId: { in: CCC_ALT_TEAM_IDS } },
];
