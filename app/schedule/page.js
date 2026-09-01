import { getCalendarEntries } from "../lib/data/schedule";
import { getRecentResults } from "../lib/data/recentResults";
import { getHomeData } from "../lib/data/home";
import ScheduleClient from "./ScheduleClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Schedule",
  description:
    "Club Cricket of Chicago's fixtures, countdown to the next match, results and where the season stands.",
};

export default async function SchedulePage() {
  // First paint carries the calendar plus the season's-end backfill data
  // (recent results + division standings); each source degrades to null
  // independently and the client falls back to its /api route.
  const [matches, results, divisions] = await Promise.all([
    getCalendarEntries().catch(() => null),
    getRecentResults(20).catch(() => null),
    getHomeData()
      .then((d) => d.divisions ?? [])
      .catch(() => null),
  ]);

  return (
    <ScheduleClient
      initialMatches={matches}
      initialResults={results}
      initialDivisions={divisions}
    />
  );
}
