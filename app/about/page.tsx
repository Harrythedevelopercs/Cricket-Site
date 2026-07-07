'use client'

export const dynamic = 'force-dynamic'

// "Our Story" — Club Cricket of Chicago.
//
// REAL FACTS ONLY. Everything stated on this page traces to a verifiable source:
//   - Seasons/divisions:  TRACKED_SERIES in app/lib/cricclubs/config.ts (imported below)
//   - Live season stats:  GET /api/home (app/lib/data/home.ts)
//   - People:             Craft CMS "Meet the Management" entries (bios verbatim)
//   - Grounds:            app/data/grounds.json (read defensively) + /grounds page
//   - Identity:           the bald-eagle club crest (/images/logo.png), the Chicago
//                         skyline signature and the city-flag six-pointed star
// Where a fact is unknown (founding date, founders, origin anecdotes) the page
// deliberately says nothing — see the CLUB-TO-FILL-IN comments inline.

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ChicagoSkyline from '../components/ui/ChicagoSkyline'
import ChicagoStar from '../components/ui/ChicagoStar'
import { fetchGraphQL } from '../lib/graphqlClient'
import { meetTheManagementFragment } from '../lib/queries/fragments'
import { usePageTitle } from '../lib/usePageTitle'
// TRACKED_SERIES is a plain client-safe constant: app/lib/cricclubs/config.ts has no
// server-only imports, and its env-driven fields resolve to public defaults (or "")
// in a client bundle — no secrets are inlined.
import { TRACKED_SERIES } from '../lib/cricclubs/config'
// Static ground list — read defensively (another process maintains this file).
import groundsJson from '../data/grounds.json'

const CONTACT_EMAIL = 'connect@clubcricketofchicago.com'

// ---------------------------------------------------------------------------
// Derived facts (computed once at module load — all sources are static)
// ---------------------------------------------------------------------------

/** Seasons timeline: TRACKED_SERIES grouped by year, oldest first. */
const SEASON_ROWS: { year: string; divisions: string[] }[] = (() => {
  const byYear = new Map<string, string[]>()
  for (const s of TRACKED_SERIES) {
    const list = byYear.get(s.year) ?? []
    if (!list.includes(s.name)) list.push(s.name)
    byYear.set(s.year, list)
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, divisions]) => ({ year, divisions }))
})()

const FIRST_TRACKED_YEAR = SEASON_ROWS[0]?.year ?? '2022'
const LATEST_TRACKED_YEAR = SEASON_ROWS[SEASON_ROWS.length - 1]?.year ?? '2026'

/** Ground count from app/data/grounds.json — shape-checked, never assumed. */
const GROUND_COUNT: number = Array.isArray(groundsJson)
  ? groundsJson.filter(
      (g) => g && typeof g === 'object' && typeof g.groundName === 'string' && g.groundName.trim() !== ''
    ).length
  : 0

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HomeDivision {
  name: string
  slug: string
  year: string
  teams: number
  position: number | null
  played: number
  won: number
  lost: number
  points: number
}
interface HomeData {
  season: string
  stats: { matches: number; runs: number; wickets: number; sixes: number }
  divisions: HomeDivision[]
}

interface CmsImage {
  url?: string | null
  alt?: string | null
  title?: string | null
}
interface ManagementEntry {
  id: string
  title?: string | null
  designation?: string | null
  biography?: string | null
  playerEmail?: string | null
  playerImage?: CmsImage[] | null
}

type FetchState = 'loading' | 'ready' | 'error'

// ---------------------------------------------------------------------------
// CMS access — same GraphQL pattern as the home page (app/lib/queries/homePageQuery.ts)
// ---------------------------------------------------------------------------

const MANAGEMENT_QUERY = `
  query AboutManagementQuery {
    entries(section: "homePage") {
      id
      ... on homePage_Entry {
        homePageBlocks {
          ${meetTheManagementFragment}
        }
      }
    }
  }
`

// Members who have left the club — kept in sync with HIDDEN_MANAGEMENT in
// app/components/ui/MeetSquad.js so both pages list the same current management.
const HIDDEN_MANAGEMENT = ['asfand', 'anish']

const CMS_BASE = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.ccc.clubcricketofchicago.com/'

function cmsUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${CMS_BASE.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

function extractManagement(data: unknown): ManagementEntry[] {
  const entries = (data as { entries?: { homePageBlocks?: Record<string, unknown>[] }[] } | null)?.entries
  if (!Array.isArray(entries)) return []
  const blocks = entries.flatMap((e) => (Array.isArray(e?.homePageBlocks) ? e.homePageBlocks : []))
  const mgmt = blocks.find((b) => b && b.typeHandle === 'meetTheManagement') as
    | { managementPlayerBlocks?: ManagementEntry[] }
    | undefined
  const people = Array.isArray(mgmt?.managementPlayerBlocks) ? mgmt.managementPlayerBlocks : []
  return people.filter((p) => {
    const name = (p?.title ?? '').toLowerCase()
    return name !== '' && !HIDDEN_MANAGEMENT.some((h) => name.includes(h))
  })
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mb-[6vw] lg:mb-[2vw]">
      <p className="ds-eyebrow flex items-center gap-[2vw] lg:gap-[0.5vw]">
        <ChicagoStar size="0.85em" /> {eyebrow}
      </p>
      <h2 className="ds-display text-[9.5vw] lg:text-[2.7vw] mt-[2.5vw] lg:mt-[0.7vw]">{title}</h2>
      {sub && (
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw] mt-[2vw] lg:mt-[0.6vw] max-w-[62ch]">
          {sub}
        </p>
      )}
    </div>
  )
}

/**
 * Club photo slot. The files under /images/club/ are being added separately;
 * until a file exists the whole <figure> hides itself (onError), so the page
 * never shows a broken frame.
 */
function StoryFigure({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <figure className={`m-0 ${className}`}>
      <div className="ccc-card overflow-hidden rounded-[3vw] lg:rounded-[0.7vw]">
        <Image
          src={src}
          alt={alt}
          width={1600}
          height={900}
          unoptimized
          className="w-full h-auto object-cover block"
          onError={() => setFailed(true)}
        />
      </div>
      {/* CLUB TO FILL IN: real caption for this photo (who/where/when). Left empty on purpose. */}
    </figure>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="ccc-card rounded-[3vw] lg:rounded-[0.7vw] p-[5vw] lg:p-[1.5vw] relative overflow-hidden">
      <span className="absolute top-0 left-0 w-full h-[3px] bg-[var(--orange)]" />
      <p className="ds-num text-[color:var(--text)] text-[9.5vw] lg:text-[2.8vw] leading-none">
        {Number(value || 0).toLocaleString()}
      </p>
      <p className="ds-eyebrow text-dim mt-[2.5vw] lg:mt-[0.6vw]">{label}</p>
    </div>
  )
}

function SkeletonTiles({ count, tall = false }: { count: number; tall?: boolean }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`ccc-skel rounded-[3vw] lg:rounded-[0.7vw] ${tall ? 'h-[70vw] lg:h-[24vw]' : 'h-[26vw] lg:h-[7.5vw]'}`} />
      ))}
    </>
  )
}

function DivisionRow({ d }: { d: HomeDivision }) {
  return (
    <Link
      href={`/tournaments/${d.year}/${d.slug}`}
      className="no_underline block group"
    >
      <div className="ccc-card ccc-card-hover rounded-[3vw] lg:rounded-[0.7vw] p-[4.5vw] lg:p-[1.3vw] h-full flex flex-col">
        <p className="roboto-condensed-bold text-[color:var(--text)] uppercase text-[3.9vw] lg:text-[1vw] leading-tight">
          {d.name}
        </p>
        <div className="flex items-end gap-[2vw] lg:gap-[0.5vw] mt-[3vw] lg:mt-[0.9vw]">
          {/* Raw standings, always — even a 10th of 10 is shown as-is. */}
          <span className="ds-num text-[color:var(--orange)] text-[10vw] lg:text-[2.6vw] leading-none">
            {d.position ? ordinal(d.position) : '—'}
          </span>
          {d.position ? (
            <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw] mb-[1vw] lg:mb-[0.25vw]">
              of {d.teams}
            </span>
          ) : (
            <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw] mb-[1vw] lg:mb-[0.25vw]">
              table pending
            </span>
          )}
        </div>
        <div className="flex gap-[4.5vw] lg:gap-[1.2vw] mt-auto pt-[3vw] lg:pt-[0.9vw] roboto-condensed-regular text-[color:var(--text-muted)] text-[3.1vw] lg:text-[0.85vw]">
          <span>P {d.played}</span>
          <span>
            <span className="text-[color:var(--win)] roboto-condensed-bold">{d.won}</span> W
          </span>
          <span>
            <span className="text-[color:var(--loss)] roboto-condensed-bold">{d.lost}</span> L
          </span>
          <span>
            <span className="text-[color:var(--text)] roboto-condensed-bold">{d.points}</span> Pts
          </span>
        </div>
      </div>
    </Link>
  )
}

function PersonCard({ person }: { person: ManagementEntry }) {
  const [imgFailed, setImgFailed] = useState(false)
  const imgSrc = cmsUrl(person.playerImage?.[0]?.url)
  const initials = (person.title ?? '')
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="ccc-card ccc-card-hover rounded-[3vw] lg:rounded-[0.7vw] overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-[var(--panel-2)]">
        {imgSrc && !imgFailed ? (
          <Image
            src={imgSrc}
            alt={person.title ?? 'Club Cricket of Chicago management'}
            fill
            sizes="(max-width: 1023px) 92vw, 22vw"
            className="object-contain object-bottom p-[3%]"
            unoptimized
            onError={() => setImgFailed(true)}
          />
        ) : (
          // No photo in the CMS (or it failed to load): a plain monogram —
          // never the club logo standing in for a person's face.
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="ds-display text-[16vw] lg:text-[4vw] text-[color:var(--text-dim)]">
              {initials || '·'}
            </span>
          </div>
        )}
      </div>
      <div className="p-[5vw] lg:p-[1.4vw] border-t border-[var(--panel-line)] flex flex-col grow">
        <h3 className="oswald-bold uppercase text-[color:var(--text)] text-[5vw] lg:text-[1.25vw] leading-tight">
          {person.title}
        </h3>
        {/* Titles come straight from the CMS, verbatim. */}
        {person.designation && (
          <p className="ds-eyebrow ds-eyebrow--orange mt-[1.5vw] lg:mt-[0.35vw]">{person.designation}</p>
        )}
        {/* Bios are the members' own words from the CMS — shown verbatim. */}
        {person.biography && (
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.6vw] lg:text-[0.92vw] leading-relaxed mt-[3vw] lg:mt-[0.8vw]">
            {person.biography}
          </p>
        )}
        {person.playerEmail && (
          <a
            href={`mailto:${person.playerEmail}`}
            className="roboto-condensed-med text-[color:var(--lake)] hover:text-[color:var(--orange)] transition-colors text-[3.3vw] lg:text-[0.85vw] mt-auto pt-[3vw] lg:pt-[0.9vw] break-all"
          >
            {person.playerEmail}
          </a>
        )}
      </div>
    </div>
  )
}

function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-[4vw] lg:gap-[1vw] py-[2.8vw] lg:py-[0.8vw] border-b border-[var(--panel-line)] last:border-b-0">
      <span className="ds-eyebrow text-dim shrink-0">{label}</span>
      <span className="roboto-condensed-bold text-[color:var(--text)] text-[3.8vw] lg:text-[1vw] text-right">
        {children}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AboutPage() {
  usePageTitle('Our Story')
  const [home, setHome] = useState<HomeData | null>(null)
  const [homeState, setHomeState] = useState<FetchState>('loading')

  const [people, setPeople] = useState<ManagementEntry[]>([])
  const [peopleState, setPeopleState] = useState<FetchState>('loading')

  useEffect(() => {
    // Live "this season" band — client-fetched like the home season hub.
    fetch('/api/home')
      .then((r) => r.json())
      .then((d: HomeData & { error?: string }) => {
        if (d && !d.error && d.stats) {
          setHome(d)
          setHomeState('ready')
        } else {
          setHomeState('error')
        }
      })
      .catch(() => setHomeState('error'))

    // Management — real names/titles/bios from the Craft CMS.
    fetchGraphQL(MANAGEMENT_QUERY)
      .then((data: unknown) => {
        const entries = extractManagement(data)
        setPeople(entries)
        setPeopleState(entries.length > 0 ? 'ready' : 'error')
      })
      .catch(() => setPeopleState('error'))
  }, [])

  return (
    <main>
      {/* ---------- Header — dusk band with the skyline signature ---------- */}
      <section className="ccc-hero">
        <div className="ccc-hero-glow" />
        <div className="ccc-hero-inner base_paddings max_content center_aligned w-full">
          <div className="pt-[38vw] lg:pt-[170px] pb-[52vw] lg:pb-[26vw] max-w-[70ch]">
            <p className="ds-eyebrow flex items-center gap-[2vw] lg:gap-[0.5vw]">
              <ChicagoStar size="0.85em" /> Club Cricket of Chicago · Midwest Cricket Conference
            </p>
            <h1 className="ds-display text-[16vw] lg:text-[5.6vw] mt-[3.5vw] lg:mt-[1vw]">
              Our <span className="accent">Story</span>
            </h1>
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[4vw] lg:text-[1.15vw] mt-[4vw] lg:mt-[1.2vw]">
              A Chicago cricket club, run by the people who play in it — at home at Washington
              Park on the South Side, and on the Midwest Cricket Conference record every season
              since {FIRST_TRACKED_YEAR}.
            </p>
          </div>
        </div>
        <ChicagoSkyline />
      </section>

      {/* ---------- Intro — the club, in plain words ---------- */}
      <section className="base_paddings py-[10vw] lg:py-[4vw]">
        <div className="max_content center_aligned">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[8vw] lg:gap-[3vw] items-start">
            <div>
              <SectionHead eyebrow="The club" title="What we are" />
              <div className="roboto-condensed-regular text-[color:var(--text-muted)] text-[4vw] lg:text-[1.08vw] leading-relaxed space-y-[4vw] lg:space-y-[1.1vw] max-w-[62ch]">
                <p>
                  Club Cricket of Chicago plays league cricket in the Midwest Cricket Conference.
                  Our record in the league runs from the {FIRST_TRACKED_YEAR} RedBall T30 season
                  through today — red-ball and T20 cricket, season after season, sometimes with
                  more than one side in the field at once.
                </p>
                <p>
                  Home is Washington Park at 5500 S King Dr, on Chicago&apos;s South Side. Match
                  days also take us well beyond it
                  {GROUND_COUNT > 0 ? (
                    <>
                      {' '}
                      — the conference plays across{' '}
                      <Link href="/grounds" className="text-[color:var(--lake)] hover:text-[color:var(--orange)] transition-colors">
                        {GROUND_COUNT} grounds
                      </Link>{' '}
                      in the city, the suburbs and across the region.
                    </>
                  ) : (
                    <>
                      {' '}
                      —{' '}
                      <Link href="/grounds" className="text-[color:var(--lake)] hover:text-[color:var(--orange)] transition-colors">
                        grounds
                      </Link>{' '}
                      in the city, the suburbs and across the region.
                    </>
                  )}
                </p>
                <p>
                  The club is run by its members — the president, secretary and coordinators you
                  will meet further down this page are the same people padding up on weekends.
                </p>
                {/*
                  CLUB TO FILL IN (deliberately not invented):
                  - founding year and how the club actually started
                  - founders' names
                  - any origin story worth telling
                  Add a paragraph here once those facts are confirmed by the club.
                */}
              </div>
            </div>

            {/* Quick facts — every line derived from a source named at the top of this file. */}
            <aside className="ccc-card rounded-[3vw] lg:rounded-[0.7vw] p-[5.5vw] lg:p-[1.7vw]">
              <p className="ds-eyebrow ds-eyebrow--orange mb-[3vw] lg:mb-[0.9vw]">Quick facts</p>
              <FactRow label="League">Midwest Cricket Conference</FactRow>
              <FactRow label="Home ground">Washington Park, Chicago</FactRow>
              <FactRow label="On record since">{FIRST_TRACKED_YEAR}</FactRow>
              <FactRow label={`${LATEST_TRACKED_YEAR} divisions`}>
                {SEASON_ROWS[SEASON_ROWS.length - 1]?.divisions.length ?? 0}
              </FactRow>
              {GROUND_COUNT > 0 && <FactRow label="Grounds">{GROUND_COUNT} across the region</FactRow>}
              <FactRow label="Contact">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[color:var(--lake)] hover:text-[color:var(--orange)] transition-colors break-all"
                >
                  {CONTACT_EMAIL}
                </a>
              </FactRow>
            </aside>
          </div>

          {/* Photo slot 1 — hides itself until /images/club/story-1.jpg exists */}
          <StoryFigure
            src="/images/club/story-1.jpg"
            alt="Club Cricket of Chicago"
            className="mt-[8vw] lg:mt-[3vw]"
          />
        </div>
      </section>

      {/* ---------- Seasons — straight from the tracked-series config ---------- */}
      <section className="base_paddings py-[10vw] lg:py-[4vw]">
        <div className="max_content center_aligned">
          <SectionHead
            eyebrow="Seasons"
            title={`${FIRST_TRACKED_YEAR} to ${LATEST_TRACKED_YEAR}`}
            sub="Every Midwest Cricket Conference competition the club has entered, straight from the league record."
          />
          <div className="flex flex-col">
            {SEASON_ROWS.map(({ year, divisions }) => (
              <div
                key={year}
                className="grid grid-cols-[22vw_1fr] lg:grid-cols-[9vw_1fr] gap-[4vw] lg:gap-[2vw] items-start py-[5vw] lg:py-[1.5vw] border-b border-[var(--panel-line)] first:border-t"
              >
                <p className="ds-num text-[color:var(--orange)] text-[9vw] lg:text-[2.6vw] leading-none">
                  {year}
                </p>
                <div className="flex flex-wrap gap-[2vw] lg:gap-[0.6vw] pt-[1vw] lg:pt-[0.35vw]">
                  {/* Neutral chips (not .ccc-chip): orange stays a sparing accent on this page. */}
                  {divisions.map((name) => (
                    <span
                      key={name}
                      className="inline-block px-[2.8vw] lg:px-[0.8vw] py-[1.4vw] lg:py-[0.38vw] rounded-full border border-[var(--panel-line-strong)] text-[color:var(--text-muted)] roboto-condensed-med uppercase tracking-[0.08em] text-[3vw] lg:text-[0.78vw] leading-none"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="roboto-condensed-regular text-[color:var(--text-dim)] text-[3.2vw] lg:text-[0.85vw] mt-[4vw] lg:mt-[1.2vw] max-w-[75ch]">
            In 2024 the club also took the field under two other names — Club Cricket Of Chicago
            Seekers in Elite 3030 and CCC Stars in the Midwest Premier League. Different shirts,
            same club.
          </p>
        </div>
      </section>

      {/* ---------- This season — live numbers from /api/home ---------- */}
      <section className="base_paddings py-[10vw] lg:py-[4vw]">
        <div className="max_content center_aligned">
          <SectionHead
            eyebrow="Today"
            title={home ? `${home.season}, so far` : 'This season, so far'}
            sub="Live from the league record. The table says what it says — we publish it either way."
          />

          {homeState === 'loading' && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[3vw] lg:gap-[1.2vw]">
              <SkeletonTiles count={3} />
            </div>
          )}

          {homeState === 'error' && (
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.8vw] lg:text-[1vw]">
              Live season numbers are unavailable right now — the{' '}
              <Link href="/tournaments" className="text-[color:var(--lake)] hover:text-[color:var(--orange)] transition-colors">
                tournaments page
              </Link>{' '}
              has the full record.
            </p>
          )}

          {homeState === 'ready' && home && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-[3vw] lg:gap-[1.2vw]">
                <StatTile label="Matches" value={home.stats.matches} />
                <StatTile label="Runs" value={home.stats.runs} />
                <StatTile label="Wickets" value={home.stats.wickets} />
              </div>
              {home.divisions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[3vw] lg:gap-[1.2vw] mt-[3vw] lg:mt-[1.2vw]">
                  {home.divisions.map((d) => (
                    <DivisionRow key={d.slug} d={d} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Photo slots 2 + 3 — each hides itself until its file exists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[4vw] lg:gap-[1.4vw] mt-[8vw] lg:mt-[3vw]">
            <StoryFigure src="/images/club/story-2.jpg" alt="Club Cricket of Chicago" />
            <StoryFigure src="/images/club/story-3.jpg" alt="Club Cricket of Chicago" />
          </div>
        </div>
      </section>

      {/* ---------- The people — real names, titles and bios from the CMS ---------- */}
      <section className="base_paddings py-[10vw] lg:py-[4vw]">
        <div className="max_content center_aligned">
          <SectionHead
            eyebrow="The people"
            title="Who runs it"
            sub="The club's management, in their own words."
          />

          {peopleState === 'loading' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[4vw] lg:gap-[1.4vw]">
              <SkeletonTiles count={4} tall />
            </div>
          )}

          {peopleState === 'error' && (
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.8vw] lg:text-[1vw]">
              Management profiles are unavailable right now. You can always reach the club at{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[color:var(--lake)] hover:text-[color:var(--orange)] transition-colors"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}

          {peopleState === 'ready' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[4vw] lg:gap-[1.4vw]">
              {people.map((p) => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- The badge and the city ---------- */}
      <section className="relative overflow-hidden bg-[var(--ink-2)]">
        <div className="base_paddings max_content center_aligned relative z-[2] py-[12vw] lg:py-[5vw] pb-[40vw] lg:pb-[16vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-[7vw] lg:gap-[3vw] items-center">
            <div className="w-[42vw] lg:w-[13vw] mx-auto lg:mx-0">
              <Image
                src="/images/logo.png"
                alt="Club Cricket of Chicago crest — a bald eagle over a shield of bat and stumps"
                width={300}
                height={232}
                unoptimized
                className="w-full h-auto"
              />
            </div>
            <div className="text-center lg:text-left">
              <p className="ds-eyebrow flex items-center justify-center lg:justify-start gap-[2vw] lg:gap-[0.5vw]">
                <ChicagoStar size="0.85em" /> The badge &amp; the city
              </p>
              <h2 className="ds-display text-[9.5vw] lg:text-[2.7vw] mt-[2.5vw] lg:mt-[0.7vw]">
                An eagle over the stumps
              </h2>
              <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[4vw] lg:text-[1.05vw] leading-relaxed mt-[3.5vw] lg:mt-[1vw] max-w-[60ch] mx-auto lg:mx-0">
                The club crest is a bald eagle, wings spread over a shield of bat and stumps. The
                rest of our look is borrowed from the city itself: the skyline traced along the
                bottom of these pages, and the six-pointed star lifted from the Chicago flag.
              </p>
              {/* Decorative: the four six-pointed stars of the Chicago flag. */}
              <p
                className="flex items-center justify-center lg:justify-start gap-[3vw] lg:gap-[0.8vw] mt-[5vw] lg:mt-[1.5vw] text-[color:var(--orange)]"
                aria-hidden="true"
              >
                <ChicagoStar size="1.3em" />
                <ChicagoStar size="1.3em" />
                <ChicagoStar size="1.3em" />
                <ChicagoStar size="1.3em" />
              </p>
            </div>
          </div>
        </div>
        <ChicagoSkyline className="ccc-skyline--ghost" />
      </section>

      {/* ---------- CTA — play with us ---------- */}
      <section className="base_paddings py-[12vw] lg:py-[5vw]">
        <div className="max_content center_aligned">
          <div className="ccc-card rounded-[3vw] lg:rounded-[0.9vw] p-[9vw] lg:p-[3.5vw] text-center relative overflow-hidden">
            <span className="absolute top-0 left-0 w-full h-[3px] bg-[var(--orange)]" />
            <p className="ds-eyebrow ds-eyebrow--orange flex items-center justify-center gap-[2vw] lg:gap-[0.5vw]">
              <ChicagoStar size="0.85em" /> New players
            </p>
            <h2 className="ds-display text-[11vw] lg:text-[3.2vw] mt-[2.5vw] lg:mt-[0.8vw]">
              Play with us
            </h2>
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.9vw] lg:text-[1.05vw] mt-[3vw] lg:mt-[1vw] max-w-[52ch] mx-auto">
              Want to play in Chicago? Start with the join form, or write to the club directly.
            </p>
            <div className="flex flex-wrap justify-center gap-[3vw] lg:gap-[1vw] mt-[6vw] lg:mt-[1.8vw]">
              <Link href="/join-us" className="ccc-btn ccc-btn-primary">
                Join us <span className="ccc-btn-arrow">→</span>
              </Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="ccc-btn ccc-btn-ghost">
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
