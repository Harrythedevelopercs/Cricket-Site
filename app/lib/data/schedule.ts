// Server-side: Club Cricket of Chicago's upcoming fixtures from the DB, shaped like the
// CMS `fixtureCard_Entry` array the schedule page (UpcomingMatchPanel + DateCalendar) expects.

import { unstable_cache } from "next/cache";
import { prisma } from "../db/prisma";
import { CCC_TEAM_IDS } from "../cricclubs/config";

const IMG = "https://media.cricclubs.com";
const img = (p?: string | null) =>
  p ? `${IMG}${p.startsWith("/") ? p : `/${p}`}` : "";

type Entry = Record<string, unknown>;

/** Upcoming fixtures involving CCC, ordered by date, in CMS calendar shape. */
async function buildCalendarEntries(): Promise<{ entries: Entry[] }> {
  const fixtures = await prisma.fixture.findMany({
    where: {
      matchId: 0, // not yet played
      OR: [
        { teamOneId: { in: CCC_TEAM_IDS } },
        { teamTwoId: { in: CCC_TEAM_IDS } },
      ],
    },
    orderBy: [{ matchDateTime: "asc" }, { id: "asc" }],
  });

  const entries = fixtures.map((f) => {
    // DateCalendar shows the OPPONENT. nativeFlag=true => team2 is "ours" (native),
    // so team1 is shown; false => team2 is shown. CCC is the native side.
    const cccIsTeamTwo =
      f.teamTwoId != null && CCC_TEAM_IDS.includes(f.teamTwoId);
    const dateIso = f.matchDateTime
      ? f.matchDateTime.toISOString()
      : f.date
      ? new Date(f.date).toISOString()
      : "";

    return {
      id: String(f.id),
      title: `${f.teamOneName ?? ""} vs ${f.teamTwoName ?? ""}`.trim(),
      t1Name: f.teamOneName ?? "",
      t2Name: f.teamTwoName ?? "",
      t1t2NativeFlag: cccIsTeamTwo,
      groundsName: f.location ?? "",
      division: f.seriesName ?? "",
      date: dateIso,
      t1Logo: [{ url: img(f.teamOneLogo), alt: f.teamOneName ?? "" }],
      t2Logo: [{ url: img(f.teamTwoLogo), alt: f.teamTwoName ?? "" }],
    } satisfies Entry;
  });

  return { entries };
}

export const getCalendarEntries = unstable_cache(
  buildCalendarEntries,
  ["calendar-entries"],
  { revalidate: 120, tags: ["cricclubs"] }
);
