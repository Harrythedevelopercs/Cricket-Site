'use client'

export const dynamic = 'force-dynamic'

// Club Records & Milestones — all-time CCC leaders, season bests and career
// milestones, aggregated in the DB reader (app/lib/data/records.ts) and served
// by /api/records. Client-fetch pattern matches app/players/page.tsx.

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Skel } from '../components/skeletons/PageSkeletons'
import { usePageTitle } from '../lib/usePageTitle'
import type {
  CareerLeader,
  ClubRecords,
  MilestoneEntry,
  SeasonBestItem,
  SeasonBests,
} from '../lib/data/records'

const FALLBACK_PIC = '/images/sample_player_image.png'
const seasonsLabel = (n: number) => `${n} ${n === 1 ? 'season' : 'seasons'}`

function SectionHeading({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-[5vw] lg:mb-[1.6vw]">
      <div className="flex items-center gap-[3vw] lg:gap-[0.8vw]">
        <span className="inline-block w-[1.2vw] lg:w-[5px] h-[7vw] lg:h-[1.9vw] bg-[var(--orange)] rounded-[2px]" />
        <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[6.5vw] lg:text-[2vw] leading-none tracking-wide">
          {children}
        </h2>
      </div>
      {sub && (
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] mt-[2vw] lg:mt-[0.5vw] pl-[4.2vw] lg:pl-[1.5vw] text-[3.2vw] lg:text-[0.9vw]">
          {sub}
        </p>
      )}
    </div>
  )
}

/* One career-leader table (Most Runs / Most Wickets / Most Dismissals). Row style
   follows the leaderboard conventions of HomeSeasonHub's PerformerList. */
function LeaderTable({
  title,
  unit,
  leaders,
}: {
  title: string
  unit: string
  leaders: CareerLeader[]
}) {
  return (
    <div className="ccc-card rounded-[3vw] lg:rounded-[0.7vw] p-[5vw] lg:p-[1.6vw]">
      <p className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[3.4vw] lg:text-[1vw] mb-[4vw] lg:mb-[1.2vw]">
        {title}
      </p>

      {leaders.length === 0 ? (
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.9vw]">
          No {unit.toLowerCase()} recorded yet.
        </p>
      ) : (
        <>
          {/* Featured #1 */}
          <div className="flex items-center gap-[4vw] lg:gap-[1vw] pb-[4vw] lg:pb-[1.1vw] mb-[3vw] lg:mb-[1vw] border-b border-[var(--panel-line)]">
            <div className="relative w-[16vw] h-[16vw] lg:w-[4vw] lg:h-[4vw] rounded-full overflow-hidden ring-2 ring-[var(--orange)] shrink-0 bg-[var(--panel-2)]">
              <Image
                src={leaders[0].pic || FALLBACK_PIC}
                alt={leaders[0].name}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="roboto-condensed-bold text-[color:var(--text)] text-[4.2vw] lg:text-[1.15vw] truncate">
                {leaders[0].name}
              </p>
              <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.8vw]">
                {seasonsLabel(leaders[0].seasons)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="ds-num text-[color:var(--orange)] text-[8vw] lg:text-[2.4vw] leading-none">
                {leaders[0].value.toLocaleString()}
              </p>
              <p className="roboto-condensed-regular text-[color:var(--text-muted)] uppercase text-[2.4vw] lg:text-[0.7vw]">
                {unit}
              </p>
            </div>
          </div>

          {/* Ranks 2–8 */}
          <ul className="flex flex-col gap-[2.5vw] lg:gap-[0.7vw]">
            {leaders.slice(1).map((p, i) => (
              <li key={p.playerId} className="flex items-center gap-[3vw] lg:gap-[0.8vw]">
                <span className="roboto-condensed-bold text-[color:var(--text-dim)] w-[5vw] lg:w-[1.4vw] text-center text-[3.2vw] lg:text-[0.9vw]">
                  {i + 2}
                </span>
                <div className="relative w-[9vw] h-[9vw] lg:w-[2.2vw] lg:h-[2.2vw] rounded-full overflow-hidden shrink-0 bg-[var(--panel-2)]">
                  <Image
                    src={p.pic || FALLBACK_PIC}
                    alt={p.name}
                    fill
                    sizes="36px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="roboto-condensed-med text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.95vw] truncate">
                    {p.name}
                  </p>
                  <p className="roboto-condensed-regular text-[color:var(--text-dim)] text-[2.5vw] lg:text-[0.7vw]">
                    {seasonsLabel(p.seasons)}
                  </p>
                </div>
                <p className="ds-num text-[color:var(--text)] text-[3.8vw] lg:text-[1.05vw]">
                  {p.value.toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/* One "Season Bests" card per tracked year. */
function SeasonCard({ s }: { s: SeasonBests }) {
  const rows: { label: string; item: SeasonBestItem | null; fmt?: (v: number) => string }[] = [
    { label: 'Most Runs', item: s.mostRuns },
    { label: 'Most Wickets', item: s.mostWickets },
    { label: 'Highest Score', item: s.highestScore },
    { label: 'Best Economy', item: s.bestEconomy, fmt: (v) => v.toFixed(2) },
  ]
  const empty = rows.every((r) => !r.item)

  return (
    <div className="ccc-card ccc-card-hover rounded-[3vw] lg:rounded-[0.7vw] p-[5vw] lg:p-[1.3vw] h-full">
      <div className="flex items-baseline justify-between border-b border-[var(--panel-line)] pb-[3vw] lg:pb-[0.8vw] mb-[3.5vw] lg:mb-[0.9vw]">
        <p className="ds-num text-[color:var(--orange)] text-[7vw] lg:text-[1.8vw] leading-none">
          {s.year}
        </p>
        <p className="roboto-condensed-bold uppercase tracking-wider text-[color:var(--text-dim)] text-[2.6vw] lg:text-[0.68vw]">
          Season
        </p>
      </div>

      {empty ? (
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.85vw]">
          No CCC stats recorded for this season.
        </p>
      ) : (
        <ul className="flex flex-col gap-[3vw] lg:gap-[0.8vw]">
          {rows.map((r) => (
            <li key={r.label} className="flex items-end justify-between gap-[2vw] lg:gap-[0.6vw]">
              <div className="min-w-0">
                <p className="roboto-condensed-bold uppercase tracking-wider text-[color:var(--text-dim)] text-[2.6vw] lg:text-[0.66vw]">
                  {r.label}
                </p>
                <p className="roboto-condensed-med text-[color:var(--text-muted)] text-[3.3vw] lg:text-[0.88vw] truncate">
                  {r.item ? r.item.name : 'Not recorded'}
                </p>
              </div>
              <p className="ds-num text-[color:var(--text)] text-[4.5vw] lg:text-[1.2vw] leading-none shrink-0">
                {r.item ? (r.fmt ? r.fmt(r.item.value) : r.item.value.toLocaleString()) : '—'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* One milestone pill in the strip. */
function MilestonePill({ m }: { m: MilestoneEntry }) {
  return (
    <div className="flex items-center gap-[3vw] lg:gap-[0.8vw] rounded-full border border-[var(--panel-line)] bg-[var(--panel)] py-[1.5vw] pl-[2vw] pr-[4.5vw] lg:py-[0.4vw] lg:pl-[0.5vw] lg:pr-[1.2vw]">
      <div className="relative w-[9vw] h-[9vw] lg:w-[2.2vw] lg:h-[2.2vw] rounded-full overflow-hidden shrink-0 bg-[var(--panel-2)]">
        <Image
          src={m.pic || FALLBACK_PIC}
          alt={m.name}
          fill
          sizes="36px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="min-w-0">
        <p className="roboto-condensed-bold text-[color:var(--text)] text-[3.4vw] lg:text-[0.92vw] leading-tight truncate">
          {m.name}
        </p>
        <p className="roboto-condensed-bold uppercase tracking-wider text-[color:var(--orange)] text-[2.5vw] lg:text-[0.66vw]">
          {m.threshold.toLocaleString()}+ club {m.kind}
        </p>
      </div>
      <p className="ds-num text-[color:var(--text)] text-[4.2vw] lg:text-[1.1vw] pl-[2vw] lg:pl-[0.6vw] shrink-0">
        {m.total.toLocaleString()}
      </p>
    </div>
  )
}

/* Loading skeleton mirroring the page layout (leader tables → season grid → strip). */
function RecordsSkeleton() {
  return (
    <div>
      <Skel className="h-[6vw] lg:h-[1.9vw] w-[40vw] lg:w-[14vw] mb-[5vw] lg:mb-[1.6vw]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[4vw] lg:gap-[1.4vw] mb-[11vw] lg:mb-[3.5vw]">
        {[0, 1, 2].map((i) => (
          <Skel key={i} className="h-[90vw] lg:h-[26vw] w-full" />
        ))}
      </div>
      <Skel className="h-[6vw] lg:h-[1.9vw] w-[40vw] lg:w-[14vw] mb-[5vw] lg:mb-[1.6vw]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[4vw] lg:gap-[1.2vw] mb-[11vw] lg:mb-[3.5vw]">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skel key={i} className="h-[60vw] sm:h-[46vw] lg:h-[15vw] w-full" />
        ))}
      </div>
      <Skel className="h-[6vw] lg:h-[1.9vw] w-[40vw] lg:w-[14vw] mb-[5vw] lg:mb-[1.6vw]" />
      <div className="flex flex-wrap gap-[3vw] lg:gap-[0.9vw]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skel key={i} className="h-[13vw] lg:h-[3.4vw] w-[60vw] lg:w-[16vw] !rounded-full" />
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  usePageTitle('Club Records')
  const [records, setRecords] = useState<ClubRecords | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/records')
        const data: { records?: ClubRecords; error?: string } = await res.json()
        if (!res.ok || !data.records) {
          throw new Error(data.error || 'No records returned from API')
        }
        setRecords(data.records)
      } catch (err) {
        console.error('Error fetching club records:', err)
        setError('Unable to load club records right now. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const hasAnyData =
    !!records &&
    (records.careerLeaders.runs.length > 0 ||
      records.careerLeaders.wickets.length > 0 ||
      records.careerLeaders.dismissals.length > 0)

  return (
    <section className="base_paddings pt-[104px] pb-[14vw] lg:pt-[140px] lg:pb-[4vw]">
      <div className="max_content center_aligned mx-auto">
        {/* Page header */}
        <div className="mb-[9vw] lg:mb-[2.8vw]">
          <p className="ds-eyebrow">Every run counted &middot; 2022&ndash;2026</p>
          <h1 className="ds-display mt-[2.5vw] lg:mt-[0.7vw] text-[11vw] lg:text-[3.4vw]">
            Club Records
          </h1>
          <p className="roboto-condensed-regular mt-[2.5vw] lg:mt-[0.7vw] text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw]">
            All-time Club Cricket of Chicago leaders, season bests and career milestones —
            straight from the scorebook, exactly as recorded.
          </p>
          <div className="mt-[3vw] lg:mt-[1vw] h-[1vw] w-[18vw] rounded-full bg-[var(--orange)] lg:h-[0.18vw] lg:w-[5vw]" />
        </div>

        {error ? (
          <p className="roboto-condensed-regular text-center text-[color:var(--text)] py-[10vw] lg:py-[4vw]">
            {error}
          </p>
        ) : loading ? (
          <RecordsSkeleton />
        ) : !hasAnyData ? (
          <p className="roboto-condensed-regular text-center text-[color:var(--text-muted)] py-[10vw] lg:py-[4vw]">
            No CCC stats in the records book yet — check back after the next data sync.
          </p>
        ) : (
          records && (
            <>
              {/* Career leaders */}
              <SectionHeading sub="All seasons combined — Club Cricket of Chicago only">
                Career Leaders
              </SectionHeading>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-[4vw] lg:gap-[1.4vw] mb-[11vw] lg:mb-[3.5vw]">
                <LeaderTable title="Most Runs" unit="Runs" leaders={records.careerLeaders.runs} />
                <LeaderTable
                  title="Most Wickets"
                  unit="Wkts"
                  leaders={records.careerLeaders.wickets}
                />
                <LeaderTable
                  title="Most Dismissals"
                  unit="Dismissals"
                  leaders={records.careerLeaders.dismissals}
                />
              </div>

              {/* Season bests */}
              <SectionHeading sub="The best single-season performances, year by year">
                Season Bests
              </SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-[4vw] lg:gap-[1.2vw] mb-[11vw] lg:mb-[3.5vw]">
                {records.seasonBests.map((s) => (
                  <SeasonCard key={s.year} s={s} />
                ))}
              </div>

              {/* Milestones */}
              <SectionHeading sub="Career thresholds crossed in club colors">
                Milestones
              </SectionHeading>
              {records.milestones.length === 0 ? (
                <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.9vw]">
                  No career milestones crossed yet — the first 500-run and 25-wicket club
                  careers will appear here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-[3vw] lg:gap-[0.9vw]">
                  {records.milestones.map((m) => (
                    <MilestonePill key={`${m.kind}-${m.playerId}`} m={m} />
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </section>
  )
}
