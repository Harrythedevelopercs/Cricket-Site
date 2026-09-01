'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import SectionTitleEle from './SectionTitleEle'

function TopPlayers({ tournament }) {
  if (!tournament || !tournament.topPlayers || tournament.topPlayers.length === 0) {
    return (
      <div className="LT_gridEle LT_fixtures_results_tabs_parent">
        <p className="roboto-condensed-regular w-full py-[6vw] lg:py-[2vw] text-center text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw]">
          No player stats recorded for this competition yet.
        </p>
      </div>
    )
  }

  // const playerNumbers = {
  //   'Top Runs': 126,
  //   'Top Wickets': 14,
  //   'Top Player': 96,
  // }

  return (
    <div className="LT_gridEle LT_fixtures_results_tabs_parent">
      <div className="top_players_list flex flex-col space-y-2">
        {tournament.topPlayers.slice(0, 3).map((player) => {
          //const number = player.title ? playerNumbers[player.title] || 0 : 0
          return <PlayerCard key={player.id || Math.random()} player={player} number={player.cardValue} />
        })}
      </div>
    </div>
  )
}

function PlayerCard({ player, number }) {
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || ''
  const getFullImageUrl = (url) => {
    if (!url) return '/images/default-player.png'
    if (url.startsWith('http')) return url
    return `${cmsBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
  }

  const playerImageUrl = player?.image?.[0]?.url
    ? getFullImageUrl(player.image[0].url)
    : '/images/default-player.png'

  const cardContent = (
    <div className="player_card flex items-center bg-[var(--panel)] overflow-hidden mb-2 border-[var(--orange)] border-[2px] rounded-xl">
      <div className="player_image w-[50%] h-auto relative bg-[var(--panel-2)] pt-[4.2%] pb-[1%] px-[2%]">
        <Image
          src={playerImageUrl}
          alt={player.playerName || 'Player'}
          className="w-full h-full object-cover"
          width={200}
          height={200}
          unoptimized
        />
      </div>
      <div className="player_info p-4 flex-1">
        <div className="stat_title text-[color:var(--text-muted)] roboto-condensed-regular p2 mb-1 text-center">
          {player?.title || ''}
        </div>
        <div className="stat_value text-[color:var(--orange)] oswald-regular h3 font-bold text-center">
          {number}
        </div>
        <div className="player_name text-[color:var(--text)] roboto-condensed-bold p4 text-center">
          {player.playerName || ''}
        </div>
        <div className="player_position text-[color:var(--text-muted)] roboto-condensed-regular p5 text-center">
          {player.playerPosition || ''}
        </div>
      </div>
    </div>
  )

  if (player?.playerHyperlink?.url) {
    return (
      <Link href={player.playerHyperlink.url} target="_blank">
        {cardContent}
      </Link>
    )
  }
  return cardContent
}

function StandingListEle({ team }) {
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || ''
  const getFullImageUrl = (url) => {
    if (!url) return '/images/default-team-logo.png'
    if (url.startsWith('http')) return url
    return `${cmsBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
  }

  const teamLogoUrl = team.teamLogo?.[0]?.url
    ? getFullImageUrl(team.teamLogo[0].url)
    : '/images/default-team-logo.png'

  return (
    <div className="SListing_team_ele flex_grid">
      <div className="SListing_name flex_grid">
        <div className="team_ico">
          <Image
            src={teamLogoUrl}
            alt={team.title || 'Team Logo'}
            width={50}
            height={50}
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="team_name">
          <p className="roboto-condensed-regular light_grey p5 uppercase">
            {team.title || 'Team'}
          </p>
        </div>
      </div>
      <div className="SListing_win">
        <p className="roboto-condensed-bold light_grey p5">{team.wins || 0}</p>
      </div>
      <div className="SListing_lose">
        <p className="roboto-condensed-bold light_grey p5">{team.loses || 0}</p>
      </div>
    </div>
  )
}

function LeagueStandings({ teamStandings }) {
  const hasTeams = teamStandings && teamStandings.length > 0

  // No rows: keep the panel title but stand the column header down — a
  // Teams/W/L header over nothing reads as broken.
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
    )
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
        </div>
        <div className="SListing_listing">
          {teamStandings.slice(0, 10).map((team) => (
            <StandingListEle key={team.id || Math.random().toString()} team={team} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LeagueLogo({ tournament }) {
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || ''
  const getFullImageUrl = (url) => {
    if (!url) return ''
    if (url.startsWith('http')) return url
    return `${cmsBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
  }

  const flagImageUrl = tournament?.flagImage?.[0]?.url
    ? getFullImageUrl(tournament.flagImage[0].url)
    : '/images/flags/redball_flag.png'

  return (
    <div
      className="LT_gridEle LT_league_logo flex_grid"
      style={{ backgroundImage: `url(${flagImageUrl})` }}
    >
      <div className="league_btn desk_only">
        <Link href={`/tournaments/2025/${tournament?.slug || ''}`} className="flex mx-auto">
          <button className="roboto-condensed-bold p2 !border-0 bg-[var(--orange)] hover:bg-[var(--orange-bright)] text-[color:#1a0d05]">
            League
          </button>
        </Link>
      </div>
    </div>
  )
}

function LeagueInfo({ leagueStats }) {
  const safeStats = Array.isArray(leagueStats) ? leagueStats : []

  // Only take the first 3 elements
  const statsToDisplay = safeStats.slice(0, 3)

  // Nothing to show — stand down instead of rendering an empty grid cell.
  if (statsToDisplay.length === 0) return null

  return (
    <div className="LT_gridEle LT_league_info flex_grid">
      {statsToDisplay.map((stat, index) => (
        <div key={index} className="match_info_ele">
          <p className="oswald-regular brand_orange h2">{stat?.number || 0}</p>
          <p className="oswald-regular white_color p1">{stat?.title || 'N/A'}</p>
        </div>
      ))}
    </div>
  )
}

export default function TournamentSection({ data }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const tournaments = (data && data.tournamentsEntries) || []
  
  const currentTournament = useMemo(() => {
    return tournaments[currentIndex] || {}
  }, [tournaments, currentIndex])
  if (!data || !data.tournamentsEntries || data.tournamentsEntries.length === 0) {
    return null
  }

  const handlePrevClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? tournaments.length - 1 : prevIndex - 1
    )
  }

  const handleNextClick = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === tournaments.length - 1 ? 0 : prevIndex + 1
    )
  }

  return (
    <section className="mt-[8%]">
      <div className="LT_parent center_aligned">
        <div>
          <SectionTitleEle className="base_paddings">
            {(data && data.title) || 'Tournaments'}
          </SectionTitleEle>
        </div>
        <div className="px-[5%] bg-[var(--ink)]">
          <div className="LT_container flex_grid">
            <div className="pagination_home_controls">
              <Image
                className="phm_left cursor-pointer"
                onClick={handlePrevClick}
                src="/images/slide_pag_ico.png"
                alt="Previous"
                width={36}
                height={36}
                unoptimized
              />
              <Image
                className="phm_right cursor-pointer"
                onClick={handleNextClick}
                src="/images/slide_pag_ico.png"
                alt="Next"
                width={36}
                height={36}
                unoptimized
              />
            </div>
            <LeagueLogo
              key={`logo-${currentTournament.id || 'unknown'}`}
              tournament={currentTournament}
            />
            <LeagueInfo
              key={`info-${currentTournament.id || 'unknown'}`}
              leagueStats={currentTournament.leagueStats || []}
            />
            <LeagueStandings
              key={`standings-${currentTournament.id || 'unknown'}`}
              teamStandings={currentTournament.teamStandings || []}
            />
            <TopPlayers
              key={`fixtures-${currentTournament.id || 'unknown'}`}
              tournament={currentTournament}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
