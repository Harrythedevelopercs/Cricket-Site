"use client";

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

const HomePageContent = ({ initialPageData, initialFixtures, initialResults, initialReports, initialHome, initialRosterPhotos }) => {
  const [pageData, setPageData] = useState(initialPageData);
  const [error, setError] = useState(null);
  // Upcoming fixtures + recent results come from the local DB (Neon); editorial stays on the CMS.
  const [dbFixtures, setDbFixtures] = useState(initialFixtures);
  const [recentResults, setRecentResults] = useState(initialResults);
  const [matchReports, setMatchReports] = useState(initialReports);

  // The server page passes each dataset when its source answered; anything it
  // could not load (null) is retried here so a transient hiccup self-heals.
  useEffect(() => {
    if (initialPageData === null) {
      fetchGraphQL(getHomePageQuery())
        .then((data) => {
          setPageData(data);
        })
        .catch((err) => {
          console.error("Error fetching data from Craft CMS:", err);
          setError(err.message);
        });
    }

    // The DB-backed strips degrade softly: on failure the section stands down
    // (each returns null on empty) rather than framing missing data. The ok /
    // error checks keep a 500 out of the "legitimately empty" path so at least
    // the console tells the truth.
    const readJson = async (r) => {
      const d = await r.json();
      if (!r.ok || d?.error) throw new Error(d?.error || `Request failed: ${r.status}`);
      return d;
    };

    if (initialFixtures === null) {
      fetch("/api/schedule")
        .then(readJson)
        .then((d) => setDbFixtures(d.entries || []))
        .catch((e) => { console.error("Home fixtures failed:", e); setDbFixtures([]); });
    }

    if (initialResults === null) {
      fetch("/api/recent-results")
        .then(readJson)
        .then((d) => setRecentResults(d.results || []))
        .catch((e) => { console.error("Home results failed:", e); setRecentResults([]); });
    }

    if (initialReports === null) {
      fetch("/api/match-reports?limit=3")
        .then(readJson)
        .then((d) => setMatchReports(d.reports || []))
        .catch((e) => { console.error("Home reports failed:", e); setMatchReports([]); });
    }
  }, [initialPageData, initialFixtures, initialResults, initialReports]);

  // The CMS answered but without usable blocks — that's a failure, not a
  // loading state; without this the page rests as a permanent hero skeleton.
  const cmsAnswered = pageData != null;
  const blocks = pageData?.entries?.[0]?.homePageBlocks;

  if (error || (cmsAnswered && !blocks)) {
    return (
      <div className="base_paddings py-20 pt-32 lg:pt-40 text-[color:var(--text)]">
        <div className="max_content center_aligned">
          <div className="ccc-card mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="ds-eyebrow ds-eyebrow--orange">Club Cricket of Chicago</p>
            <p className="ds-display mt-3 text-4xl">The pavilion is warming up</p>
            <p className="mt-3 text-[color:var(--text-muted)]">
              The home page couldn&rsquo;t load its content — give it a moment and try again.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary mt-6">
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the blocks or skeletons
  const renderComponents = () => {
    if (!blocks) {
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
              <HomeSeasonHub initialData={initialHome} />
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
          return <MeetSquad key={block.id} data={block} initialRosterPhotos={initialRosterPhotos} />;
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

export default function HomeClient({
  initialPageData = null,
  initialFixtures = null,
  initialResults = null,
  initialReports = null,
  initialHome = null,
  initialRosterPhotos = null,
}) {
  return (
    <PageTransition>
      <section className="w-full h-full bg-repeat-y bg-[100%]">
        <HomePageContent
          initialPageData={initialPageData}
          initialFixtures={initialFixtures}
          initialResults={initialResults}
          initialReports={initialReports}
          initialHome={initialHome}
          initialRosterPhotos={initialRosterPhotos}
        />
      </section>
    </PageTransition>
  );
}
