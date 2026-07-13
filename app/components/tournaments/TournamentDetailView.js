"use client"

import Image from 'next/image'
import Link from 'next/link'

import FixturesAndResults from './FixturesAndResults'
import LeagueHighlights from './LeagueHighlights'
import NumberZone from './NumberZone'
import PlayerOfTheWeek from './PlayerOfTheWeek'

const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || ''
const imageUrl = (url) => {
  if (!url) return '/images/logo.png'
  if (url.startsWith('http')) return url
  return `${cmsBaseUrl}${url.startsWith('/') ? url : `/${url}`}`
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[var(--panel-line)] bg-[var(--panel)] px-4 py-4 lg:px-5 lg:py-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-dim)]">{label}</p>
      <p className="ds-num mt-2 text-2xl text-[color:var(--text)] lg:text-3xl">{value ?? 0}</p>
    </div>
  )
}

function Standings({ teams = [] }) {
  return (
    <div className="ccc-card overflow-hidden">
      <div className="flex items-end justify-between border-b border-[var(--panel-line)] px-4 py-4 lg:px-6 lg:py-5">
        <div>
          <p className="ds-eyebrow ds-eyebrow--orange">League table</p>
          <h2 className="ds-display mt-1 text-3xl lg:text-4xl">Standings</h2>
        </div>
        <span className="text-xs text-[color:var(--text-dim)]">Top 10</span>
      </div>
      {teams.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[var(--panel-2)] text-[0.65rem] uppercase tracking-wider text-[color:var(--text-muted)]">
              <tr><th className="px-4 py-3 lg:px-6">Team</th><th className="px-3 py-3 text-right">W</th><th className="px-3 py-3 text-right">L</th><th className="px-3 py-3 text-right">NR</th><th className="px-4 py-3 text-right lg:px-6">Pts</th></tr>
            </thead>
            <tbody>
              {teams.slice(0, 10).map((team, index) => (
                <tr key={team.id || team.slug || `${team.title}-${index}`} className="border-t border-[var(--panel-line)]">
                  <td className="px-4 py-3 lg:px-6">
                    <div className="flex min-w-[190px] items-center gap-3">
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[var(--panel-2)]">
                        <Image src={imageUrl(team.teamLogo?.[0]?.url)} alt="" fill sizes="32px" className="object-contain" unoptimized />
                      </div>
                      <span className="text-sm font-semibold uppercase text-[color:var(--text)]">{team.title || 'Team'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-sm text-[color:var(--text-muted)]">{team.wins || 0}</td>
                  <td className="px-3 py-3 text-right text-sm text-[color:var(--text-muted)]">{team.loses || 0}</td>
                  <td className="px-3 py-3 text-right text-sm text-[color:var(--text-muted)]">{team.noResults || 0}</td>
                  <td className="px-4 py-3 text-right font-bold text-[color:var(--orange)] lg:px-6">{team.points ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="px-6 py-12 text-center text-[color:var(--text-muted)]">Standings will appear after the first completed matches.</p>}
    </div>
  )
}

export default function TournamentDetailView({ tournament, fixtures, year, onPrevious, onNext, canCycle }) {
  const summaryMetrics = (tournament.leagueStats || []).slice(0, 4)
  const logo = imageUrl(tournament.flagImage?.[0]?.url)

  return (
    <section className="base_paddings pb-20 pt-28 lg:pb-24 lg:pt-36">
      <div className="max_content center_aligned mx-auto">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-[color:var(--text-muted)]">
          <Link href="/tournaments" className="hover:text-[color:var(--orange)]">Tournaments</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <Link href={`/tournaments/${year}`} className="hover:text-[color:var(--orange)]">{year}</Link>
        </nav>

        <header className="relative overflow-hidden rounded-[calc(var(--radius)*1.4)] border border-[var(--panel-line-strong)] bg-[var(--panel)] p-6 lg:p-10">
          <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--glow)] blur-3xl" />
          <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_180px]">
            <div>
              <p className="ds-eyebrow ds-eyebrow--orange">{year} competition</p>
              <h1 className="ds-display mt-3 max-w-5xl text-[clamp(3rem,11vw,6rem)] lg:text-[clamp(4rem,6vw,7rem)]">{tournament.title}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--text-muted)] lg:text-base">
                Results, table, leaders and full player statistics—organized in one match-day hub.
              </p>
              {canCycle ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={onPrevious} className="ccc-btn ccc-btn-ghost" aria-label="View previous tournament">← Previous</button>
                  <button type="button" onClick={onNext} className="ccc-btn ccc-btn-ghost" aria-label="View next tournament">Next →</button>
                </div>
              ) : null}
            </div>
            <div className="relative mx-auto aspect-square w-32 lg:w-44">
              <Image src={logo} alt="" fill sizes="176px" className="object-contain drop-shadow-2xl" unoptimized />
            </div>
          </div>
        </header>

        <nav aria-label="Tournament sections" className="sticky top-[75px] z-20 mt-4 flex gap-2 overflow-x-auto rounded-full border border-[var(--panel-line)] bg-[color-mix(in_srgb,var(--ink)_90%,transparent)] p-1.5 backdrop-blur-xl lg:top-[88px] lg:mx-auto lg:w-fit">
          {[['overview', 'Overview'], ['fixtures', 'Fixtures & results'], ['standings', 'Standings'], ['player-stats', 'Player stats']].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)] hover:bg-[var(--panel)] hover:text-[color:var(--orange)] lg:text-sm">{label}</a>
          ))}
        </nav>

        <div id="overview" className="scroll-mt-36 pt-10 lg:pt-14">
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {summaryMetrics.length
              ? summaryMetrics.map((metric, index) => <Metric key={`${metric.title}-${index}`} label={metric.title} value={metric.number} />)
              : [<Metric key="teams" label="Teams" value={tournament.teamStandings?.length || 0} />, <Metric key="fixtures" label="Upcoming" value={fixtures.length} />, <Metric key="results" label="Results" value={tournament.resultCards?.length || 0} />, <Metric key="players" label="Player leaders" value={tournament.topPlayers?.length || 0} />]}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="ccc-card overflow-hidden p-4 lg:p-6">
              <PlayerOfTheWeek
                batsmanName={tournament.batsmanName}
                batsmanImage={imageUrl(tournament.batsmanImage?.[0]?.url)}
                batsmanLabel={tournament.batsmanLabel}
                batsmanValue={tournament.batsmanValue}
                bowlerName={tournament.bowlerName}
                bowlerImage={imageUrl(tournament.bowlerImage?.[0]?.url)}
                bowlerCardLabel={tournament.bowlerCardLabel}
                bowlerValue={tournament.bowlerValue}
              />
            </div>
            <div className="ccc-card overflow-hidden p-4 lg:p-6">
              <LeagueHighlights leagueStats={tournament.leagueStats} topPlayers={tournament.topPlayers} teamBatting={tournament.teamBatting} teamBowling={tournament.teamBowling} />
            </div>
          </div>
        </div>

        <div id="fixtures" className="scroll-mt-36 pt-12 lg:pt-16">
          <div className="mb-5"><p className="ds-eyebrow ds-eyebrow--orange">Match day</p><h2 className="ds-display mt-2 text-4xl lg:text-6xl">Fixtures & results</h2></div>
          {(fixtures.length || tournament.resultCards?.length) ? (
            <div className="ccc-card overflow-hidden p-4 lg:p-6"><FixturesAndResults fixtureCount={8} resultsCount={8} fixtures={fixtures} results={tournament.resultCards || []} /></div>
          ) : <div className="ccc-card p-10 text-center text-[color:var(--text-muted)]">Fixtures and results will appear here when published.</div>}
        </div>

        <div id="standings" className="scroll-mt-36 pt-12 lg:pt-16"><Standings teams={tournament.teamStandings || []} /></div>

        <div id="player-stats" className="scroll-mt-36 pt-12 lg:pt-16">
          <div className="mb-5"><p className="ds-eyebrow ds-eyebrow--orange">Number zone</p><h2 className="ds-display mt-2 text-4xl lg:text-6xl">Player stats</h2></div>
          <div className="ccc-card overflow-hidden p-3 lg:p-6">
            <NumberZone battingNumberZone={tournament.battingNumberZone} bowlingNumberZone={tournament.bowlingNumberZone} fieldingNumberZone={tournament.fieldingNumberZone} rankingZone={tournament.rankingZone} />
          </div>
        </div>
      </div>
    </section>
  )
}
