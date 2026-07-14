// "/" — server page: first paint carries the CMS blocks and the DB season data,
// so the landing view no longer flashes skeletons. Each source degrades to null
// independently and HomeClient retries it client-side.

import HomeClient from "./HomeClient";
import { getCalendarEntries } from "./lib/data/schedule";
import { getMatchReports } from "./lib/data/matchReports";
import { getRecentResults } from "./lib/data/recentResults";
import { fetchGraphQL } from "./lib/graphqlClient";
import { getHomePageQuery } from "./lib/queries/homePageQuery";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [pageData, fixtures, results, reports] = await Promise.all([
    fetchGraphQL(getHomePageQuery()).catch(() => null),
    getCalendarEntries()
      .then((d) => d.entries || [])
      .catch(() => null),
    getRecentResults(6).catch(() => null),
    getMatchReports(3).catch(() => null),
  ]);

  return (
    <HomeClient
      initialPageData={pageData}
      initialFixtures={fixtures}
      initialResults={results}
      initialReports={reports}
    />
  );
}
