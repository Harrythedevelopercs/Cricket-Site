// "/" — server page: first paint carries the CMS blocks and the DB season data,
// so the landing view no longer flashes skeletons. Each source degrades to null
// independently and HomeClient retries it client-side.

import HomeClient from "./HomeClient";
import { getCalendarEntries } from "./lib/data/schedule";
import { getMatchReports } from "./lib/data/matchReports";
import { getRecentResults } from "./lib/data/recentResults";
import { getHomeData } from "./lib/data/home";
import { getPlayerEntries } from "./lib/data/players";
import { fetchGraphQL } from "./lib/graphqlClient";
import { getHomePageQuery } from "./lib/queries/homePageQuery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pageData, fixtures, results, reports, home, rosterPhotos] = await Promise.all([
    fetchGraphQL(getHomePageQuery()).catch(() => null),
    getCalendarEntries()
      .then((d) => d.entries || [])
      .catch(() => null),
    getRecentResults(6).catch(() => null),
    getMatchReports(3).catch(() => null),
    // Season hub payload, so HomeSeasonHub doesn't refetch /api/home client-side.
    getHomeData().catch(() => null),
    // Lean name → headshot map for MeetSquad, which otherwise pulled the whole
    // roster from /api/players just to find five management photos.
    getPlayerEntries()
      .then((d) => {
        const map = {};
        for (const e of d.entries || []) {
          const url = e?.playerImage?.[0]?.url;
          if (e?.title && url) map[String(e.title).trim().toLowerCase()] = url;
        }
        return map;
      })
      .catch(() => null),
  ]);

  return (
    <HomeClient
      initialPageData={pageData}
      initialFixtures={fixtures}
      initialResults={results}
      initialReports={reports}
      initialHome={home}
      initialRosterPhotos={rosterPhotos}
    />
  );
}
