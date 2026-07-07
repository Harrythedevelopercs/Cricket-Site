'use client'

import { useEffect, useMemo, useState } from 'react'

// Upcoming-fixtures list, grouped by month — the primary view of the schedule page.
// Each row: date block, opponent crest + "vs <opponent>", division chip, ground, start
// time, and an "Add to calendar" menu (Google Calendar link + client-generated .ics).

const CHICAGO_TZ = 'America/Chicago'
const FALLBACK_LOGO = '/images/placeholder_logo.png'

/* ---------------------------------------------------------------------------
 * Date handling — same pattern as formatMatch in app/components/ui/HeroBanner.js.
 * Match times are real instants shown in Central Time (Chicago). A date-only
 * fixture (midnight UTC) carries no real time, so it is formatted in UTC with no
 * timezone shift — otherwise the local-timezone conversion moves it to the
 * previous evening and the calendar day is off by one.
 * ------------------------------------------------------------------------- */

function parseFixtureDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function isDateOnly(d) {
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0
}

function formatMatch(iso) {
  const d = parseFixtureDate(iso)
  if (!d) return null
  const dateOnly = isDateOnly(d)
  const TZ = dateOnly ? 'UTC' : CHICAGO_TZ
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ }),
    day: d.toLocaleDateString('en-US', { day: 'numeric', timeZone: TZ }),
    monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: TZ }),
    time: dateOnly
      ? null
      : d.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit',
          timeZone: CHICAGO_TZ, timeZoneName: 'short',
        }),
  }
}

/**
 * Is this fixture still upcoming? Timed fixtures count until their start instant.
 * Date-only fixtures (midnight UTC = the previous evening in Chicago) stay listed
 * through their whole match day, so today's game doesn't vanish on match morning.
 */
export function isUpcomingEntry(entry, now = new Date()) {
  const d = parseFixtureDate(entry?.date)
  if (!d) return false
  if (isDateOnly(d)) {
    const matchDay = d.toISOString().slice(0, 10) // the UTC calendar day IS the match day
    const todayChicago = now.toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ }) // yyyy-mm-dd
    return matchDay >= todayChicago
  }
  return d.getTime() >= now.getTime()
}

/* ---------------------------------------------------------------------------
 * Opponent — t1t2NativeFlag: true means CCC is team two, so team one is the opponent.
 * ------------------------------------------------------------------------- */

function opponentOf(entry) {
  const cccIsTeamTwo = !!entry.t1t2NativeFlag
  const name = (cccIsTeamTwo ? entry.t1Name : entry.t2Name) || 'Opponent'
  const logoField = cccIsTeamTwo ? entry.t1Logo : entry.t2Logo
  return { name, logo: logoField?.[0]?.url || '' }
}

/* ---------------------------------------------------------------------------
 * Add-to-calendar payloads. All calendar timestamps are written in UTC basic
 * format (YYYYMMDDTHHMMSSZ); date-only fixtures become all-day events so the
 * calendar app never shifts them onto the wrong day. Timed events get the
 * 3-hour default duration of a league fixture.
 * ------------------------------------------------------------------------- */

const MATCH_DURATION_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const pad2 = (n) => String(n).padStart(2, '0')

function toUtcBasic(d) {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  )
}

function toUtcDateBasic(d) {
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`
}

function calendarWindow(d) {
  if (isDateOnly(d)) {
    // all-day event: end date is exclusive per RFC 5545 / Google
    return { allDay: true, start: toUtcDateBasic(d), end: toUtcDateBasic(new Date(d.getTime() + DAY_MS)) }
  }
  return { allDay: false, start: toUtcBasic(d), end: toUtcBasic(new Date(d.getTime() + MATCH_DURATION_MS)) }
}

function googleCalendarUrl(entry) {
  const d = parseFixtureDate(entry.date)
  if (!d) return null
  const { start, end } = calendarWindow(d)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `CCC vs ${opponentOf(entry).name}`,
    dates: `${start}/${end}`,
  })
  if (entry.groundsName) params.set('location', entry.groundsName)
  if (entry.division) params.set('details', `${entry.division} — Club Cricket of Chicago fixture.`)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Escape ICS text per RFC 5545 (backslash first, then structural characters).
function escapeIcs(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function buildIcs(entry) {
  const d = parseFixtureDate(entry.date)
  if (!d) return null
  const { allDay, start, end } = calendarWindow(d)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Club Cricket of Chicago//Schedule//EN',
    'BEGIN:VEVENT',
    `UID:ccc-fixture-${entry.id}@clubcricketofchicago.com`,
    `DTSTAMP:${toUtcBasic(new Date())}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeIcs(`CCC vs ${opponentOf(entry).name}`)}`,
  ]
  if (entry.groundsName) lines.push(`LOCATION:${escapeIcs(entry.groundsName)}`)
  if (entry.division) lines.push(`DESCRIPTION:${escapeIcs(entry.division)}`)
  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

function downloadIcs(entry) {
  const ics = buildIcs(entry)
  const d = parseFixtureDate(entry.date)
  if (!ics || !d) return
  const oppSlug =
    opponentOf(entry).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'match'
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ccc-vs-${oppSlug}-${toUtcDateBasic(d)}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ---------------------------------------------------------------------------
 * UI pieces
 * ------------------------------------------------------------------------- */

function Crest({ src, alt }) {
  return (
    <span className="ccc-crest">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || FALLBACK_LOGO}
        alt={alt || 'Team crest'}
        loading="lazy"
        onError={(e) => { e.currentTarget.src = FALLBACK_LOGO }}
      />
    </span>
  )
}

const MENU_ITEM_CLASS =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium ' +
  'text-[color:var(--text)] hover:bg-[color:var(--panel-2)] hover:text-[color:var(--orange)] transition-colors'

function AddToCalendar({ entry, isOpen, onToggle, onClose }) {
  const googleUrl = googleCalendarUrl(entry)
  if (!googleUrl) return null

  return (
    <div className="relative" data-cal-menu>
      <button
        type="button"
        className="ccc-btn ccc-btn-ghost !px-[3.4vw] !py-[1.9vw] !text-[3vw] lg:!px-[0.9vw] lg:!py-[0.45vw] lg:!text-[0.72rem]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span aria-hidden="true">+</span> Add to calendar
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Add fixture to calendar"
          className="absolute right-0 top-full z-20 mt-2 min-w-[13.5rem] rounded-xl border border-[color:var(--panel-line-strong)] bg-[color:var(--panel)] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.35)]"
        >
          <a
            role="menuitem"
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={MENU_ITEM_CLASS}
            onClick={onClose}
          >
            Google Calendar
          </a>
          <button
            role="menuitem"
            type="button"
            className={MENU_ITEM_CLASS}
            onClick={() => { downloadIcs(entry); onClose() }}
          >
            Download .ics
            <span className="text-dim text-xs font-normal">Apple / Outlook</span>
          </button>
        </div>
      )}
    </div>
  )
}

function FixtureRow({ entry, fmt, isMenuOpen, onMenuToggle, onMenuClose }) {
  const opponent = opponentOf(entry)

  return (
    <li className="flex flex-wrap items-center gap-x-[4vw] gap-y-[2.5vw] px-[4vw] py-[4.5vw] lg:gap-x-[1.4vw] lg:gap-y-3 lg:px-[1.6vw] lg:py-[1.15vw]">
      {/* Date block */}
      <div className="flex w-[13vw] shrink-0 flex-col items-center lg:w-[3.8vw]">
        <p className="ds-eyebrow text-dim">{fmt.weekday}</p>
        <p className="ds-num text-[7.5vw] leading-none lg:text-[2vw]">{fmt.day}</p>
      </div>

      {/* Opponent crest + names + meta. The mobile min-width stops this block
          collapsing to nothing — the calendar button wraps to its own line
          instead of eating the opponent's name. */}
      <div className="flex min-w-[56vw] flex-1 items-center gap-[3vw] lg:min-w-0 lg:gap-[0.9vw]">
        <div className="h-[11vw] w-[11vw] shrink-0 lg:h-[3.1vw] lg:w-[3.1vw]">
          <Crest src={opponent.logo} alt={opponent.name} />
        </div>
        <div className="min-w-0">
          <p className="roboto-condensed-bold p4 truncate leading-tight">
            <span className="text-dim font-normal">vs&nbsp;</span>
            {opponent.name}
          </p>
          <p className="text-muted p6 mt-1 truncate">
            {entry.groundsName || 'Ground TBC'}
            <span className="text-dim"> · </span>
            {fmt.time || 'Start time TBC'}
          </p>
        </div>
      </div>

      {/* Division chip. Wrapped: .ccc-chip sets its own display (and globals.css
          primitives win the cascade), so `hidden` must live on a separate element. */}
      {entry.division ? (
        <span className="hidden shrink-0 md:inline-block">
          <span className="ccc-chip">{entry.division}</span>
        </span>
      ) : null}

      {/* Add to calendar */}
      <div className="ml-auto shrink-0">
        <AddToCalendar
          entry={entry}
          isOpen={isMenuOpen}
          onToggle={onMenuToggle}
          onClose={onMenuClose}
        />
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="ccc-card px-[6vw] py-[10vw] text-center lg:px-[3vw] lg:py-[4vw]">
      <p className="ds-eyebrow ds-eyebrow--orange">Schedule</p>
      <p className="ds-display mt-[3vw] text-[8vw] leading-none lg:mt-[0.8vw] lg:text-[2.1vw]">
        No upcoming fixtures
      </p>
      <p className="text-muted p5 mx-auto mt-[3vw] max-w-[46ch] lg:mt-[0.8vw]">
        Nothing is on the calendar right now. New fixtures appear here as soon as the
        league publishes them.
      </p>
    </div>
  )
}

export default function FixturesList({ entries }) {
  const [openMenuId, setOpenMenuId] = useState(null)

  // Group the upcoming fixtures by month, preserving date order.
  const monthGroups = useMemo(() => {
    const upcoming = (entries ?? [])
      .filter((entry) => isUpcomingEntry(entry))
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    const groups = []
    for (const entry of upcoming) {
      const fmt = formatMatch(entry.date)
      if (!fmt) continue
      const last = groups[groups.length - 1]
      if (last && last.label === fmt.monthLabel) last.items.push({ entry, fmt })
      else groups.push({ label: fmt.monthLabel, items: [{ entry, fmt }] })
    }
    return groups
  }, [entries])

  // Close the add-to-calendar menu on outside click / Escape.
  useEffect(() => {
    if (openMenuId == null) return
    const onPointerDown = (e) => {
      if (!e.target.closest?.('[data-cal-menu]')) setOpenMenuId(null)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenuId(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openMenuId])

  return (
    <section className="fixtures_list_container base_paddings">
      <div className="max_content center_aligned">
        {monthGroups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-[8vw] lg:gap-[2.4vw]">
            {monthGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-[3vw] flex items-center gap-[3vw] lg:mb-[0.9vw] lg:gap-[1vw]">
                  <h3 className="ds-eyebrow ds-eyebrow--orange">{group.label}</h3>
                  <hr className="ccc-rule flex-1" />
                  <p className="ds-eyebrow text-dim">
                    {group.items.length} {group.items.length === 1 ? 'match' : 'matches'}
                  </p>
                </div>
                <ul className="ccc-card list-none divide-y divide-[color:var(--panel-line)] overflow-visible">
                  {group.items.map(({ entry, fmt }) => (
                    <FixtureRow
                      key={entry.id}
                      entry={entry}
                      fmt={fmt}
                      isMenuOpen={openMenuId === entry.id}
                      onMenuToggle={() =>
                        setOpenMenuId((prev) => (prev === entry.id ? null : entry.id))
                      }
                      onMenuClose={() => setOpenMenuId(null)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
