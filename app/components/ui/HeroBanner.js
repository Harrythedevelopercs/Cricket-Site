'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ChicagoSkyline from './ChicagoSkyline'
import ChicagoStar from './ChicagoStar'

// Revamp 2026 hero — "Blue Hour / Chicago Dusk".
// Headline + a rotating cast of the club's own players (CMS studio cutouts,
// transparent PNGs — no photo edges) + a live "Next Match" scoreboard from
// /api/schedule, over the Chicago skyline.

const CCC_FALLBACK_LOGO = '/images/logo.png'
const CMS_BASE = (process.env.NEXT_PUBLIC_CMS_URL || 'https://cms.ccc.clubcricketofchicago.com/').replace(/\/$/, '')

// The CMS hero block carries up to three player cutouts (heroImageOne..Three).
// Benched: IMG_4665 (old dark flame jersey) — its subject sits low in frame, so in
// this lower-third layout only a head shows above the scoreboard, and the dark kit
// melts into the night sky. Swap it in the CMS for a white-kit cutout framed like
// the other two (head in the upper third) and remove it from this list.
const BENCHED_CUTOUTS = ['IMG_4665']
function castFromCms(data) {
  return [data?.heroImageOne?.[0], data?.heroImageTwo?.[0], data?.heroImageThree?.[0]]
    .filter((img) => img && img.url)
    .filter((img) => !BENCHED_CUTOUTS.some((b) => (img.filename || img.url).includes(b)))
    .map((img) => ({
      src: img.url.startsWith('http') ? img.url : `${CMS_BASE}${img.url.startsWith('/') ? '' : '/'}${img.url}`,
      alt: img.alt || img.title || '',
    }))
}

// Rotating hero cast: one player visible at a time, slow crossfade. Auto-advance
// pauses for users who prefer reduced motion.
function HeroCast({ images }) {
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState([])
  const usable = images.filter((im) => !failed.includes(im.src))

  useEffect(() => {
    if (usable.length < 2) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Unhurried: each player holds the stage for a while, then a long dissolve.
    const t = setInterval(() => setIdx((i) => i + 1), 14000)
    return () => clearInterval(t)
  }, [usable.length])

  if (usable.length === 0) return null
  const active = ((idx % usable.length) + usable.length) % usable.length

  return (
    <div className="ccc-hero-cast" aria-hidden="true">
      {usable.map((im, i) => (
        <div key={im.src} className={`ccc-hero-cast-slide ${i === active ? 'is-active' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={im.src}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            onError={() => setFailed((prev) => (prev.includes(im.src) ? prev : [...prev, im.src]))}
          />
        </div>
      ))}
    </div>
  )
}

function pickNextMatch(fixtures) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) return null
  // /api/schedule already returns CCC upcoming fixtures ordered by date asc.
  const now = Date.now()
  const upcoming = fixtures
    .filter((f) => f && f.date)
    .filter((f) => {
      const t = new Date(f.date).getTime()
      return !isNaN(t) && t >= now - 1000 * 60 * 60 * 6 // keep a match in-progress today
    })
  // Only a genuine upcoming fixture — never fall back to fixtures[0], or a stale past
  // fixture would masquerade as "Next match". The card shows its own "fixtures are
  // coming" empty state when this is null.
  return upcoming[0] ?? null
}

// Match times are real instants; show them in Central Time (Chicago — CST/CDT). A
// date-only fixture (midnight UTC) carries no real time, so render just its date with no
// timezone shift (avoids the off-by-one).
const CHICAGO_TZ = 'America/Chicago'
function formatMatch(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const dateOnly = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
  const TZ = dateOnly ? 'UTC' : CHICAGO_TZ
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ })
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: TZ })
  const time = dateOnly
    ? null
    : d.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
        timeZone: CHICAGO_TZ, timeZoneName: 'short',
      })
  return { weekday, date, time }
}

// True when the fixture is being played today (Chicago time). Date-only fixtures
// (midnight UTC) compare their UTC date to Chicago's current date.
function isMatchToday(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (isNaN(d.getTime())) return false
  const dateOnly = d.getUTCHours() === 0 && d.getUTCMinutes() === 0
  const ymd = (date, tz) => date.toLocaleDateString('en-CA', { timeZone: tz })
  const todayChicago = ymd(new Date(), CHICAGO_TZ)
  return dateOnly ? ymd(d, 'UTC') === todayChicago : ymd(d, CHICAGO_TZ) === todayChicago
}

function CricketBall({ className = '' }) {
  // Stitched cricket-ball seam — the sport's signature mark, drawn as an SVG so it
  // re-skins with the accent color and stays crisp at any size.
  const stitches = [20, 33, 46, 60, 74, 87, 100]
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="54" stroke="currentColor" strokeWidth="2" opacity="0.55" />
      <path d="M60 7 C 45 38, 45 82, 60 113" stroke="currentColor" strokeWidth="2.2" />
      <path d="M60 7 C 75 38, 75 82, 60 113" stroke="currentColor" strokeWidth="2.2" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {stitches.map((y) => {
          const k = Math.sin((y / 120) * Math.PI)
          const half = 3.5 + 11 * k
          return <line key={y} x1={60 - half} y1={y} x2={60 + half} y2={y} />
        })}
      </g>
    </svg>
  )
}

function Crest({ src, alt }) {
  return (
    <span className="ccc-crest">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || CCC_FALLBACK_LOGO}
        alt={alt || 'Team crest'}
        loading="eager"
        onError={(e) => { e.currentTarget.src = CCC_FALLBACK_LOGO }}
      />
    </span>
  )
}

// Desktop-with-cast variant: a slim glass strip under the hero CTAs, so the
// player cutout on the right stays completely unobstructed.
function NextMatchStrip({ match }) {
  if (!match) return null
  const fmt = formatMatch(match.date)
  const today = isMatchToday(match.date)
  const cccIsT2 = !!match.t1t2NativeFlag
  const cccLogo = cccIsT2 ? match.t2Logo?.[0]?.url : match.t1Logo?.[0]?.url
  const oppLogo = cccIsT2 ? match.t1Logo?.[0]?.url : match.t2Logo?.[0]?.url
  const oppName = cccIsT2 ? match.t1Name : match.t2Name
  const ground = match.groundsName

  return (
    <div
      className="hidden lg:flex items-center gap-[1.2vw] ccc-scorecard mt-[2.2vw] px-[1.4vw] py-[1vw] w-fit max-w-full"
      style={today ? { borderColor: 'color-mix(in srgb, var(--orange) 55%, transparent)' } : undefined}
    >
      <p className="ds-eyebrow ds-eyebrow--orange flex items-center gap-[0.4vw] whitespace-nowrap shrink-0">
        <ChicagoStar size="0.8em" /> {today ? 'Match day' : 'Next match'}
      </p>
      <div className="flex items-center gap-[0.6vw] shrink-0">
        <div className="w-[2.7vw] h-[2.7vw]"><Crest src={cccLogo} alt="Club Cricket of Chicago" /></div>
        <span className="ds-display accent text-[0.95vw] leading-none">VS</span>
        <div className="w-[2.7vw] h-[2.7vw]"><Crest src={oppLogo} alt={oppName} /></div>
      </div>
      <div className="min-w-0">
        {fmt && (
          <p className="ds-num text-[1.05vw] leading-tight whitespace-nowrap">
            {today ? (
              <span className="accent">Today</span>
            ) : (
              <>{fmt.weekday}, {fmt.date}</>
            )}
            {fmt.time ? ` · ${fmt.time}` : ''}
          </p>
        )}
        <p className="text-muted p6 truncate max-w-[21vw] mt-[0.15vw]">
          {oppName || 'Opponent'}{ground ? ` · ${ground}` : ''}
        </p>
      </div>
      <Link href="/schedule" className="ccc-btn ccc-btn-ghost !px-[1vw] !py-[0.55vw] shrink-0">
        Schedule <span className="ccc-btn-arrow">→</span>
      </Link>
    </div>
  )
}

function NextMatchCard({ match }) {
  const fmt = match ? formatMatch(match.date) : null
  const today = match ? isMatchToday(match.date) : false
  const cccIsT2 = !!match?.t1t2NativeFlag
  const cccLogo = match ? (cccIsT2 ? match.t2Logo?.[0]?.url : match.t1Logo?.[0]?.url) : null
  const oppLogo = match ? (cccIsT2 ? match.t1Logo?.[0]?.url : match.t2Logo?.[0]?.url) : null
  const oppName = match ? (cccIsT2 ? match.t1Name : match.t2Name) : null
  const ground = match?.groundsName

  if (!match) {
    // No upcoming fixture yet — keep the slot useful, not empty.
    return (
      <div className="ccc-scorecard p-[6vw] lg:p-[1.9vw]">
        <p className="ds-eyebrow ds-eyebrow--orange">This season</p>
        <p className="ds-display text-[8vw] lg:text-[2.1vw] mt-[3vw] lg:mt-[0.8vw] leading-none">
          The fixtures are coming
        </p>
        <p className="text-muted p5 mt-[3vw] lg:mt-[0.7vw]">
          Schedule, results and standings update here through the season.
        </p>
        <Link href="/schedule" className="ccc-btn ccc-btn-ghost mt-[5vw] lg:mt-[1.4vw]">
          View schedule <span className="ccc-btn-arrow">→</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="ccc-scorecard p-[6vw] lg:p-[1.9vw]">
      <div className="flex items-center justify-between">
        <p className="ds-eyebrow ds-eyebrow--orange flex items-center gap-[1.5vw] lg:gap-[0.4vw]">
          <ChicagoStar size="0.8em" /> {today ? 'Match day' : 'Next match'}
        </p>
        {fmt?.time && (
          <p className="ds-eyebrow text-dim">{fmt.time}</p>
        )}
      </div>

      {match.division && (
        <span className="ccc-chip mt-[3.5vw] lg:mt-[0.9vw]">{match.division}</span>
      )}

      <div className="flex items-center justify-between gap-[3vw] lg:gap-[1vw] mt-[5vw] lg:mt-[1.4vw]">
        <div className="flex flex-col items-center gap-[2vw] lg:gap-[0.55vw] w-[34%]">
          <div className="w-[17vw] h-[17vw] lg:w-[4.8vw] lg:h-[4.8vw]"><Crest src={cccLogo} alt="Club Cricket of Chicago" /></div>
          <p className="roboto-condensed-bold p6 text-center leading-tight">CCC</p>
        </div>

        <div className="flex flex-col items-center">
          <span className="ds-display accent text-[6vw] lg:text-[1.7vw] leading-none">VS</span>
        </div>

        <div className="flex flex-col items-center gap-[2vw] lg:gap-[0.55vw] w-[34%]">
          <div className="w-[17vw] h-[17vw] lg:w-[4.8vw] lg:h-[4.8vw]"><Crest src={oppLogo} alt={oppName} /></div>
          <p className="roboto-condensed-bold p6 text-center leading-tight line-clamp-2">{oppName || 'Opponent'}</p>
        </div>
      </div>

      <hr className="ccc-rule my-[4vw] lg:my-[1.2vw]" />

      <div className="flex items-center justify-between gap-2">
        <div>
          {fmt && (
            <p className="ds-num text-[5vw] lg:text-[1.45vw] leading-none">
              {today ? <span className="accent">Today</span> : <>{fmt.weekday}, {fmt.date}</>}
            </p>
          )}
          {ground && (
            <p className="text-muted p6 mt-[1.5vw] lg:mt-[0.4vw] truncate max-w-[42vw] lg:max-w-[14vw]">{ground}</p>
          )}
        </div>
        <Link href="/schedule" className="ccc-btn ccc-btn-ghost !px-[4vw] lg:!px-[1.1vw] !py-[2.4vw] lg:!py-[0.6vw] shrink-0">
          Schedule <span className="ccc-btn-arrow">→</span>
        </Link>
      </div>
    </div>
  )
}

export default function HeroBanner({ fixtures, data }) {
  const nextMatch = pickNextMatch(fixtures)
  const cast = castFromCms(data)
  const hasCast = cast.length > 0

  return (
    <section className="ccc-hero">
      <div className="ccc-hero-glow" />
      <CricketBall className="ccc-hero-ball" />
      {hasCast && <HeroCast images={cast} />}

      <div className="ccc-hero-inner base_paddings max_content center_aligned w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-[10vw] lg:gap-[3.4vw] items-center min-h-[84vh] lg:min-h-[92vh] pt-[120px] pb-[46vw] lg:pt-[150px] lg:pb-[28vw]">
          {/* LEFT — the thesis */}
          <div>
            <p className="ds-eyebrow flex items-center gap-[2vw] lg:gap-[0.5vw]">
              <ChicagoStar size="0.85em" /> Midwest Cricket Conference · Chicago
            </p>

            <h1 className="ds-display mt-[4vw] lg:mt-[1.1vw] text-[15vw] lg:text-[5.6vw]">
              Cricket runs<br />through <span className="accent">Chicago</span>
            </h1>

            <p className="text-muted p3 mt-[4vw] lg:mt-[1.3vw] max-w-[50ch]">
              Club Cricket of Chicago competes across the Midwest Cricket Conference.
              Every match, every season — followed here.
            </p>

            <div className="flex flex-wrap gap-[3vw] lg:gap-[1vw] mt-[6vw] lg:mt-[1.8vw]">
              <Link href="/schedule" className="ccc-btn ccc-btn-primary">
                View fixtures <span className="ccc-btn-arrow">→</span>
              </Link>
              <Link href="/join-us" className="ccc-btn ccc-btn-ghost">
                Join the club
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-[3vw] lg:gap-[1vw] mt-[7vw] lg:mt-[2.2vw] ds-eyebrow text-dim">
              <span>Fixtures</span> <ChicagoStar size="0.6em" className="opacity-70" />
              <span>Results</span> <ChicagoStar size="0.6em" className="opacity-70" />
              <span>Standings</span> <ChicagoStar size="0.6em" className="opacity-70" />
              <span>Stats</span>
            </div>

            {/* With a hero cast the next-match info lives here, in a slim strip —
                the player on the right stays completely clear. */}
            {hasCast && <NextMatchStrip match={nextMatch} />}
          </div>

          {/* RIGHT — the live moment as a full card (mobile always; desktop only
              when there is no hero cast to make way for). */}
          <div className={`w-full ${hasCast ? 'lg:hidden' : ''}`}>
            <NextMatchCard match={nextMatch} />
          </div>
        </div>
      </div>

      <ChicagoSkyline />
    </section>
  )
}
