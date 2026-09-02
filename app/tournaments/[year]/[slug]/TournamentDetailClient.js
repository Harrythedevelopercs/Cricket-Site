"use client";

// Tournament page body. The server page (./page.tsx) renders it with the
// tournament, its season's tab strip and its fixtures already loaded; the API
// routes are fetched only when that server pass failed (`initial === null`), so
// the warm path makes no client API calls. Switching tournaments is a real
// navigation — the arrows and the tabs in the stats section are links — so each
// tournament has its own URL and the server carries its data.

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import LeagueLogoSlider from "../../../components/tournaments/LeagueLogoSlider";
import PlayerOfTheWeek from "../../../components/tournaments/PlayerOfTheWeek";
import LeagueHighlights from "../../../components/tournaments/LeagueHighlights";
import FixturesAndResults from "../../../components/tournaments/FixturesAndResults";
import TournamentStats from "../../../components/tournaments/TournamentStats";
import { TournamentDetailSkeleton } from "../../../components/skeletons/PageSkeletons";

const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || "";

function getFullImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${cmsBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

const isTournamentOf = (year) => (e) =>
  e.typeHandle === "tournamentPage" && e.parent && e.parent.slug === year;
const withSeries = (e) => Array.isArray(e.mappedSeries) && e.mappedSeries.length > 0;

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

  // No rows: keep the panel title but stand the column header down — a
  // W/L/D/NR/PTS header over nothing reads as broken.
  if (!hasTeams) {
    return (
      <div className="LT_gridEle LT_league_standings">
        <div className="standings_listing">
          <div className="standings_title">
            <p className="p4 grey_text roboto-condensed-bold">Standings</p>
          </div>
          <p className="roboto-condensed-regular w-full py-[6vw] lg:py-[2vw] text-center text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw]">
            No standings recorded for this competition yet.
          </p>
        </div>
      </div>
    );
  }

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
          {teamStandings.slice(0, 10).map((team) => (
            <StandingListEle key={team.id || Math.random().toString()} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}

// The neighbouring tournament, as a link that keeps the legacy arrow look. The
// `div.NewLeague_pag_icon` rules (size, the 180° flip on prev) key off the div.
function ArrowLink({ href, label, prev = false }) {
  return (
    <div className={`NewLeague_pag_icon ${prev ? "prev_icon" : "next_icon"} cursor-pointer`}>
      <Link href={href} scroll={false} aria-label={label} className="block">
        <Image src="/images/slide_pag_ico.png" alt="" width={30} height={30} unoptimized />
      </Link>
    </div>
  );
}

export default function TournamentDetailClient({ year, slug, initial }) {
  // { tournament, siblings } — from the server, or from the fallback fetch.
  const [data, setData] = useState(initial ? { tournament: initial.tournament, siblings: initial.siblings } : null);
  // Null until known; the server passes null when its fixtures read failed.
  const [fixtures, setFixtures] = useState(initial?.fixtures ?? null);
  // 'ready' | 'loading' | 'failed' (server couldn't answer) | 'missing' (a real 404)
  const [status, setStatus] = useState(initial ? "ready" : "loading");

  useEffect(() => {
    if (initial !== null) return;
    let cancelled = false;
    fetch(`/api/tournaments?year=${encodeURIComponent(year)}`)
      .then(async (r) => {
        const body = await r.json();
        // A failed read is { entries: [], error } with a 500. Without this check
        // the empty array reads as "not in this year" and a transient server
        // error becomes a hard 404 — wrong for the visitor, worse for crawlers.
        if (!r.ok || body?.error || !Array.isArray(body?.entries)) {
          throw new Error(body?.error || `Tournament request failed: ${r.status}`);
        }
        if (cancelled) return;
        const season = body.entries.filter(isTournamentOf(year));
        const tournament = season.find((e) => e.slug === slug);
        if (!tournament) {
          setStatus("missing");
          return;
        }
        setData({
          tournament,
          siblings: season.map((e) => ({ slug: String(e.slug), title: e.title ?? "" })),
        });
        setStatus("ready");
      })
      .catch((e) => {
        console.error("Tournament page fetch error:", e);
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, [initial, year, slug]);

  useEffect(() => {
    if (fixtures !== null) return;
    let cancelled = false;
    fetch(`/api/tournaments/fixtures?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const body = await r.json();
        // Failure shape is { entries: [], error } with a 500 — treat it as the
        // catch path rather than a legitimately empty list.
        if (!r.ok || body?.error) throw new Error(body?.error || `Fixtures request failed: ${r.status}`);
        if (!cancelled) setFixtures((body.entries ?? []).filter(withSeries));
      })
      .catch((e) => {
        // No fixtures tab rather than a broken one — the results still render.
        console.error("Failed to fetch fixtures:", e);
        if (!cancelled) setFixtures([]);
      });
    return () => {
      cancelled = true;
    };
  }, [fixtures, slug]);

  if (status === "loading") {
    return <TournamentDetailSkeleton />;
  }
  if (status === "failed") {
    return (
      <div className="base_paddings py-20 pt-32 lg:pt-40 text-[color:var(--text)]">
        <div className="max_content center_aligned">
          <div className="ccc-card mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="ds-eyebrow ds-eyebrow--orange">Tournament</p>
            <p className="ds-display mt-3 text-4xl">This one didn&rsquo;t load</p>
            <p className="mt-3 text-[color:var(--text-muted)]">
              Usually a slow wake-up, not an outage — give it a moment and try again.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary mt-6">
              Reload this tournament
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (status === "missing" || !data) {
    return notFound();
  }

  const { tournament, siblings } = data;
  const index = siblings.findIndex((t) => t.slug === slug);
  const count = siblings.length;
  const hrefOf = (t) => `/tournaments/${year}/${t.slug}`;
  const prev = count > 1 ? siblings[(index - 1 + count) % count] : null;
  const next = count > 1 ? siblings[(index + 1) % count] : null;

  return (
    <>
      <section className="LSC_container base_paddings">
        <div className="LSC_parent center_aligned flex_grid">
          <div className="LSC_smallCol_grid">
            {/* A lone tournament has nowhere to page to — no arrows. */}
            {prev && next ? (
              <div className="NewLeague_pag_icon_container">
                <div className="flex">
                  <ArrowLink href={hrefOf(prev)} label={`Previous tournament: ${prev.title}`} prev />
                  <ArrowLink href={hrefOf(next)} label={`Next tournament: ${next.title}`} />
                </div>
              </div>
            ) : null}

            <LeagueLogoSlider
              flagImage={getFullImageUrl(tournament.flagImage?.[0]?.url)}
            />

            <LeagueStandings teamStandings={tournament.teamStandings || []} />
          </div>

          <div className="LSC_BigCol_grid">
            <PlayerOfTheWeek
              batsmanName={tournament.batsmanName}
              batsmanImage={getFullImageUrl(tournament.batsmanImage?.[0]?.url)}
              batsmanLabel={tournament.batsmanLabel}
              batsmanValue={tournament.batsmanValue}
              bowlerName={tournament.bowlerName}
              bowlerImage={getFullImageUrl(tournament.bowlerImage?.[0]?.url)}
              bowlerCardLabel={tournament.bowlerCardLabel}
              bowlerValue={tournament.bowlerValue}
            />
            <LeagueHighlights
              leagueStats={tournament.leagueStats}
              topPlayers={tournament.topPlayers}
              teamBatting={tournament.teamBatting}
              teamBowling={tournament.teamBowling}
            />
          </div>

          <div className="LSC_smallCol_grid">
            <FixturesAndResults
              fixtureCount={7}
              resultsCount={7}
              fixtures={fixtures ?? []}
              results={tournament.resultCards || []}
            />
          </div>
        </div>

        <TournamentStats tournament={tournament} siblings={siblings} year={year} />
      </section>
    </>
  );
}
