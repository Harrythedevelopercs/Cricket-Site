"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, notFound } from "next/navigation";

// Tournament data now comes from the local DB (Neon) via internal API routes
// (/api/tournaments and /api/tournaments/fixtures), shaped like the old CMS payload.

import LeagueLogoSlider from "../../../components/tournaments/LeagueLogoSlider";
import PlayerOfTheWeek from "../../../components/tournaments/PlayerOfTheWeek";
import LeagueHighlights from "../../../components/tournaments/LeagueHighlights";
import FixturesAndResults from "../../../components/tournaments/FixturesAndResults";
import NumberZone from "../../../components/tournaments/NumberZone";
import { TournamentDetailSkeleton } from "../../../components/skeletons/PageSkeletons";
import Image from "next/image";

const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || "";

function getFullImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${cmsBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

function StandingListEle({ team }) {
  return (
    <div className="SListing_team_ele flex_grid">
      <div className="SListing_name flex_grid">
        <div className="team_ico">
          <Image
            src={getFullImageUrl(team.teamLogo?.[0]?.url)}
            alt={team.title || "Team Logo"}
            width={40}
            height={40}
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="team_name">
          <p className="roboto-condensed-regular light_grey p5 uppercase">
            {team.title || "Team"}
          </p>
        </div>
      </div>
      <div className="SListing_win">
        <p className="roboto-condensed-bold light_grey p5">{team.wins || 0}</p>
      </div>
      <div className="SListing_lose">
        <p className="roboto-condensed-bold light_grey p5">{team.loses || 0}</p>
      </div>
      <div className="SListing_draw">
        <p className="roboto-condensed-bold light_grey p5">{team.draws || 0}</p>
      </div>
      <div className="SListing_nr">
        <p className="roboto-condensed-bold light_grey p5">{team.noResults || 0}</p>
      </div>
      <div className="SListing_pts">
        <p className="roboto-condensed-bold p5" style={{ color: "var(--orange)" }}>
          {team.points ?? 0}
        </p>
      </div>
    </div>
  );
}

function LeagueStandings({ teamStandings }) {
  const hasTeams = teamStandings && teamStandings.length > 0;

  return (
    <div className="LT_gridEle LT_league_standings">
      <div className="standings_listing">
        <div className="standings_title">
          <p className="p4 grey_text roboto-condensed-bold">Standings</p>
        </div>

        <div className="SListing_header flex_grid">
          <div className="SListing_name">
            <p className="roboto-condensed-bold light_grey p5">Teams</p>
          </div>
          <div className="SListing_win">
            <p className="roboto-condensed-bold light_grey p5">W</p>
          </div>
          <div className="SListing_lose">
            <p className="roboto-condensed-bold light_grey p5">L</p>
          </div>
          <div className="SListing_draw">
            <p className="roboto-condensed-bold light_grey p5">D</p>
          </div>
          <div className="SListing_nr">
            <p className="roboto-condensed-bold light_grey p5">NR</p>
          </div>
          <div className="SListing_pts">
            <p className="roboto-condensed-bold p5" style={{ color: "var(--orange)" }}>PTS</p>
          </div>
        </div>

        <div className="SListing_listing">
          {hasTeams ? (
            teamStandings.slice(0, 10).map((team) => (
              <StandingListEle key={team.id || Math.random().toString()} team={team} />
            ))
          ) : (
            <div className="p-4 text-center text-[color:var(--text-muted)]">
              <p>No standings available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeagueStatsContainer() {
  const params = useParams();
  const router = useRouter();

  const [allTournaments, setAllTournaments] = useState([]);
  const [currentTournamentIndex, setCurrentTournamentIndex] = useState(0);
  const [tournamentData, setTournamentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fixtures, setFixtures] = useState([]);
  const [allFixtures, setAllFixtures] = useState({});

  const fetchFixturesForTournament = useCallback(
    async (tournament) => {
      try {
        if (tournament.slug && allFixtures[tournament.slug]) {
          return allFixtures[tournament.slug];
        }
        const res = await fetch(
          `/api/tournaments/fixtures?slug=${encodeURIComponent(tournament.slug)}`
        );
        const fixtureData = await res.json();
        const tournamentFixtures = (fixtureData && fixtureData.entries.filter(entry => entry.mappedSeries && entry.mappedSeries.length > 0)) || [];
        if (tournament.slug) {
          setAllFixtures((prev) => ({
            ...prev,
            [tournament.slug]: tournamentFixtures,
          }));
        }
        return tournamentFixtures;
      } catch (e) {
        console.error("Failed to fetch fixtures:", e);
        return [];
      }
    },
    [allFixtures]
  );

  useEffect(() => {
    const { year, slug } = params || {};
    if (!year || !slug) {
      setError(true);
      setLoading(false);
      return;
    }

    fetch(`/api/tournaments?year=${encodeURIComponent(year)}`)
      .then((r) => r.json())
      .then(async (data) => {
        const allEntries = (data && data.entries) || [];
        const yearTournaments = allEntries.filter(
          (entry) =>
            entry.typeHandle === "tournamentPage" && entry.parent && entry.parent.slug === year
        );
        if (yearTournaments.length === 0) {
          setError(true);
          setLoading(false);
          return;
        }
        setAllTournaments(yearTournaments);
        const currentIndex = yearTournaments.findIndex((entry) => entry.slug === slug);
        if (currentIndex === -1) {
          setError(true);
          setLoading(false);
          return;
        }
        setCurrentTournamentIndex(currentIndex);
        const currentTournament = yearTournaments[currentIndex];
        setTournamentData(currentTournament);
        const fetchedFixtures = await fetchFixturesForTournament(currentTournament);
        setFixtures(fetchedFixtures);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Tournament page fetch error:", e);
        setError(true);
        setLoading(false);
      });
  }, [params, fetchFixturesForTournament]);

  const goToPrevTournament = useCallback(async () => {
    if (allTournaments.length <= 1) {
      return;
    }
    const newIndex = (currentTournamentIndex - 1 + allTournaments.length) % allTournaments.length;
    const prevTournament = allTournaments[newIndex];
    setCurrentTournamentIndex(newIndex);
    setTournamentData(prevTournament);
    const { year } = params;
    if (year && prevTournament.slug) {
      router.push(`/tournaments/${year}/${prevTournament.slug}`, { scroll: false });
    }
    const fetchedFixtures = await fetchFixturesForTournament(prevTournament);
    setFixtures(fetchedFixtures);
  }, [allTournaments, currentTournamentIndex, params, router, fetchFixturesForTournament]);

  const goToNextTournament = useCallback(async () => {
    if (allTournaments.length <= 1) {
      return;
    }
    const newIndex = (currentTournamentIndex + 1) % allTournaments.length;
    const nextTournament = allTournaments[newIndex];
    setCurrentTournamentIndex(newIndex);
    setTournamentData(nextTournament);
    const { year } = params;
    if (year && nextTournament.slug) {
      router.push(`/tournaments/${year}/${nextTournament.slug}`, { scroll: false });
    }
    const fetchedFixtures = await fetchFixturesForTournament(nextTournament);
    setFixtures(fetchedFixtures);
  }, [allTournaments, currentTournamentIndex, params, router, fetchFixturesForTournament]);

  if (loading) {
    return <TournamentDetailSkeleton />;
  }
  if (error || !tournamentData) {
    return notFound();
  }

  return (
    <>
      <section className="LSC_container base_paddings">
        <div className="LSC_parent center_aligned flex_grid">
          <div className="LSC_smallCol_grid">
            <div className="NewLeague_pag_icon_container">
              <div className="flex">
                <div className="NewLeague_pag_icon prev_icon cursor-pointer" onClick={goToPrevTournament}>
                  <Image
                    src="/images/slide_pag_ico.png"
                    alt="Previous Tournament"
                    width={30}
                    height={30}
                    unoptimized
                  />
                </div>
                <div className="NewLeague_pag_icon next_icon cursor-pointer" onClick={goToNextTournament}>
                  <Image
                    src="/images/slide_pag_ico.png"
                    alt="Next Tournament"
                    width={30}
                    height={30}
                    unoptimized
                  />
                </div>
              </div>
            </div>

            <LeagueLogoSlider
              flagImage={getFullImageUrl(tournamentData.flagImage?.[0]?.url)}
            />

            <LeagueStandings teamStandings={tournamentData.teamStandings || []} />
          </div>

          <div className="LSC_BigCol_grid">
            <PlayerOfTheWeek
              batsmanName={tournamentData.batsmanName}
              batsmanImage={getFullImageUrl(tournamentData.batsmanImage?.[0]?.url)}
              batsmanLabel={tournamentData.batsmanLabel}
              batsmanValue={tournamentData.batsmanValue}
              bowlerName={tournamentData.bowlerName}
              bowlerImage={getFullImageUrl(tournamentData.bowlerImage?.[0]?.url)}
              bowlerCardLabel={tournamentData.bowlerCardLabel}
              bowlerValue={tournamentData.bowlerValue}
            />
            <LeagueHighlights
              leagueStats={tournamentData.leagueStats}
              topPlayers={tournamentData.topPlayers}
              teamBatting={tournamentData.teamBatting}
              teamBowling={tournamentData.teamBowling}
            />
          </div>

          <div className="LSC_smallCol_grid">
            <FixturesAndResults
              fixtureCount={7}
              resultsCount={7}
              fixtures={fixtures}
              results={tournamentData.resultCards || []}
            />
          </div>
        </div>

        <NumberZone
          battingNumberZone={tournamentData.battingNumberZone}
          bowlingNumberZone={tournamentData.bowlingNumberZone}
          fieldingNumberZone={tournamentData.fieldingNumberZone}
          rankingZone={tournamentData.rankingZone}
        />
      </section>
    </>
  );
}
