"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, Fragment } from "react";
import HeroBanner from "./components/ui/HeroBanner";
import RecentResults from "./components/ui/RecentResults";
import MatchReports from "./components/ui/MatchReports";
import ClubGallery from "./components/ui/ClubGallery";
import ClubTV from "./components/ui/ClubTV";
import MeetSquad from "./components/ui/MeetSquad";
import BGParralaxBanner from "./components/ui/BGParralaxBanner";
import SponsorsBanner from "./components/ui/SponsorsBanner";
import FixturesGrid from "./components/ui/FixturesGrid";
import HomeSeasonHub from "./components/ui/HomeSeasonHub";
import TournamentSection from "./components/ui/TournamentSection";
import { fetchGraphQL } from "./lib/graphqlClient";
import { getHomePageQuery } from "./lib/queries/homePageQuery";
import PageTransition from "./components/ui/PageTransition";
import HeroBannerSkeleton from "./components/skeletons/HeroBannerSkeleton";

const HomePageContent = () => {
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState(null);
  // Upcoming fixtures + recent results come from the local DB (Neon); editorial stays on the CMS.
  const [dbFixtures, setDbFixtures] = useState(null);
  const [recentResults, setRecentResults] = useState(null);
  const [matchReports, setMatchReports] = useState(null);

  useEffect(() => {
    const query = getHomePageQuery();
    fetchGraphQL(query)
      .then((data) => {
        setPageData(data);
      })
      .catch((err) => {
        console.error("Error fetching data from Craft CMS:", err);
        setError(err.message);
      });

    fetch("/api/schedule")
      .then((r) => r.json())
      .then((d) => setDbFixtures(d.entries || []))
      .catch(() => setDbFixtures([]));

    fetch("/api/recent-results")
      .then((r) => r.json())
      .then((d) => setRecentResults(d.results || []))
      .catch(() => setRecentResults([]));

    fetch("/api/match-reports?limit=3")
      .then((r) => r.json())
      .then((d) => setMatchReports(d.reports || []))
      .catch(() => setMatchReports([]));
  }, []);

  if (error) {
    return <div className="error-message">Error loading content: {error}</div>;
  }

  // Render the blocks or skeletons
  const renderComponents = () => {
    if (
      !pageData ||
      !pageData.entries ||
      !pageData.entries[0] ||
      !pageData.entries[0].homePageBlocks
    ) {
      return (
        <>
          <HeroBannerSkeleton />
          {/* ...other skeletons if needed */}
        </>
      );
    }

    return pageData.entries[0].homePageBlocks.map((block) => {
      switch (block.typeHandle) {
        case "homeHeroBanner":
          return <HeroBanner key={block.id} fixtures={dbFixtures} data={block} />;
        case "fixturesGrid":
          return (
            <Fragment key={block.id}>
              <FixturesGrid
                data={{
                  ...block,
                  fixturesEntries: dbFixtures ?? block.fixturesEntries,
                }}
              />
              <HomeSeasonHub />
              <RecentResults results={recentResults ?? []} />
              <MatchReports reports={matchReports ?? []} />
              <ClubGallery />
              <ClubTV />
            </Fragment>
          );
        case "tournamentSection":
          return <TournamentSection key={block.id} data={block} />;
        case "timerBanner":
          // Retired: the hero already carries the next-match card, so a second
          // full-width countdown on the same page was pure repetition.
          return <Fragment key={block.id} />;
        case "meetTheManagement":
          return <MeetSquad key={block.id} data={block} />;
        case "banner":
          return <BGParralaxBanner key={block.id} data={block} />;
        case "sponsorsBanner":
          return <SponsorsBanner key={block.id} data={block} />;
        default:
          return <></>;
      }
    });
  };

  return renderComponents();
};

export default function Home() {
  return (
    <PageTransition>
      <section className="w-full h-full bg-repeat-y bg-[100%]">
        <HomePageContent />
      </section>
    </PageTransition>
  );
}
