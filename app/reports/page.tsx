'use client'

export const dynamic = 'force-dynamic'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Skel } from '../components/skeletons/PageSkeletons'
import { usePageTitle } from '../lib/usePageTitle'

// Auto-generated match reports — deterministic recaps built server-side from the DB
// (Match rows + stored CricClubs scorecards) via /api/match-reports.

interface TopBat {
  name: string
  runs: number
  balls: number
}

interface TopBowl {
  name: string
  wickets: number
  runs: number
}

interface MatchReport {
  matchId: number
  date: string
  seriesName: string
  headline: string
  recap: string
  cccScore: string
  oppScore: string
  opponentName: string
  opponentLogo: string
  cccWon: boolean
  result: string
  topBat: TopBat | null
  topBowl: TopBowl | null
  location: string
}

interface MatchReportsResponse {
  reports?: MatchReport[]
  error?: string
}

// Stored match dates are strings like "06/28/2026" (or ISO). Parse to a UTC instant and
// format with timeZone "UTC" — same rule as HeroBanner's formatMatch — so the shown day
// never shifts by one in any browser timezone.
function formatReportDate(s: string): string {
  if (!s) return ''
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const d = m
    ? new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])))
    : new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function ResultBadge({ report }: { report: MatchReport }) {
  const tied = /\btie(d)?\b/i.test(report.result || '')
  return (
    <span
      className={`roboto-condensed-bold text-white rounded-full px-[3vw] lg:px-[0.8vw] py-[0.4vw] text-[2.6vw] lg:text-[0.75vw] ${
        tied
          ? 'bg-[var(--text-dim)]'
          : report.cccWon
          ? 'bg-[var(--win)]'
          : 'bg-[var(--loss)]'
      }`}
    >
      {tied ? 'TIE' : report.cccWon ? 'WON' : 'LOST'}
    </span>
  )
}

function ReportCard({ report }: { report: MatchReport }) {
  const when = formatReportDate(report.date)
  const meta = [report.seriesName, report.location, when].filter(Boolean)

  return (
    <article className="ccc-card ccc-card-hover rounded-[3vw] lg:rounded-[0.8vw] p-[5vw] lg:p-[1.6vw] flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-[3.5vw] lg:mb-[1vw]">
        <span className="ccc-chip truncate">{report.seriesName || 'Match'}</span>
        <ResultBadge report={report} />
      </div>

      <div className="flex items-start gap-[3vw] lg:gap-[0.8vw]">
        <Image
          src={report.opponentLogo || '/images/placeholder_logo.png'}
          alt={report.opponentName}
          width={44}
          height={44}
          className="rounded-full object-contain shrink-0 w-[10vw] h-[10vw] lg:w-[2.6vw] lg:h-[2.6vw] border border-[var(--panel-line)]"
          unoptimized
        />
        <h2 className="roboto-condensed-bold uppercase leading-tight text-[color:var(--text)] text-[4.6vw] lg:text-[1.25vw]">
          {report.headline}
        </h2>
      </div>

      <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw] leading-relaxed mt-[3vw] lg:mt-[0.9vw]">
        {report.recap}
      </p>

      {/* Score line */}
      <div className="mt-[3.5vw] lg:mt-[1vw] mb-[3.5vw] lg:mb-[1vw] flex items-center gap-[2.5vw] lg:gap-[0.7vw] flex-wrap">
        <span className="roboto-condensed-bold text-[color:var(--text)] text-[3.4vw] lg:text-[0.95vw]">
          CCC <span className="ds-num text-[color:var(--orange)]">{report.cccScore}</span>
        </span>
        <span className="text-[color:var(--text-dim)] text-[3vw] lg:text-[0.8vw]">vs</span>
        <span className="roboto-condensed-bold text-[color:var(--text)] text-[3.4vw] lg:text-[0.95vw]">
          {report.opponentName}{' '}
          <span className="ds-num text-[color:var(--text-muted)]">{report.oppScore}</span>
        </span>
      </div>

      {/* Meta row + Match Centre link */}
      <div className="mt-auto pt-[3.5vw] lg:pt-[1vw] border-t border-[var(--panel-line)] flex items-center justify-between gap-2">
        <p className="roboto-condensed-regular text-[color:var(--text-dim)] text-[2.9vw] lg:text-[0.78vw] truncate">
          {meta.join(' · ')}
        </p>
        <Link
          href={`/match/${report.matchId}`}
          className="roboto-condensed-bold uppercase whitespace-nowrap text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] transition-colors text-[3.1vw] lg:text-[0.82vw]"
        >
          Match Centre &rarr;
        </Link>
      </div>
    </article>
  )
}

function ReportsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-[5vw] md:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="ccc-card rounded-[3vw] lg:rounded-[0.8vw] p-[5vw] lg:p-[1.6vw]"
        >
          <div className="flex items-center justify-between mb-[3.5vw] lg:mb-[1vw]">
            <Skel className="h-[5vw] w-[30vw] lg:h-[1.4vw] lg:w-[8vw]" />
            <Skel className="h-[5vw] w-[12vw] lg:h-[1.4vw] lg:w-[3.4vw] !rounded-full" />
          </div>
          <Skel className="h-[10vw] w-full lg:h-[2.8vw]" />
          <Skel className="mt-[3vw] lg:mt-[0.9vw] h-[16vw] w-full lg:h-[4.4vw]" />
          <Skel className="mt-[3.5vw] lg:mt-[1vw] h-[5vw] w-[60%] lg:h-[1.3vw]" />
        </div>
      ))}
    </div>
  )
}

export default function Page() {
  usePageTitle('Match Reports')
  const [reports, setReports] = useState<MatchReport[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/match-reports?limit=12')
        const data: MatchReportsResponse = await res.json()
        if (Array.isArray(data?.reports)) {
          setReports(data.reports)
        } else {
          throw new Error(data?.error || 'No report data returned from API')
        }
      } catch (err) {
        console.error('Error fetching match reports:', err)
        setError('Unable to load match reports right now.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <section className="base_paddings pt-[104px] pb-[14vw] lg:pt-[140px] lg:pb-[4vw]">
      <div className="max_content center_aligned mx-auto">
        {/* Page header — eyebrow + display title, as on the tournaments page */}
        <div className="mb-[9vw] lg:mb-[2.6vw]">
          <p className="ds-eyebrow ds-eyebrow--orange">Auto-generated from every scorecard</p>
          <h1 className="ds-display mt-[2vw] lg:mt-[0.5vw] text-[8.5vw] lg:text-[2.6vw]">
            Match Reports
          </h1>
          <p className="roboto-condensed-regular mt-[2.5vw] lg:mt-[0.7vw] text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw]">
            Result-by-result recaps of Club Cricket of Chicago&rsquo;s recent matches.
          </p>
          <div className="mt-[3vw] lg:mt-[1vw] h-[1vw] w-[18vw] rounded-full bg-[var(--orange)] lg:h-[0.18vw] lg:w-[5vw]" />
        </div>

        {loading ? (
          <ReportsSkeleton />
        ) : error ? (
          <p className="roboto-condensed-regular text-center text-[color:var(--text)] py-[8vw] lg:py-[3vw]">
            {error}
          </p>
        ) : reports.length === 0 ? (
          <div className="ccc-card rounded-[3vw] lg:rounded-[0.8vw] p-[8vw] lg:p-[2.5vw] text-center">
            <p className="roboto-condensed-bold uppercase text-[color:var(--text)] text-[4.5vw] lg:text-[1.2vw]">
              No match reports yet
            </p>
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw] mt-[2vw] lg:mt-[0.5vw]">
              Reports are generated automatically once completed results sync from CricClubs.
            </p>
            <Link
              href="/schedule"
              className="roboto-condensed-bold uppercase inline-block mt-[4vw] lg:mt-[1.1vw] text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] transition-colors text-[3.4vw] lg:text-[0.9vw]"
            >
              View schedule &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-[5vw] md:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
            {reports.map((r) => (
              <ReportCard key={r.matchId} report={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
