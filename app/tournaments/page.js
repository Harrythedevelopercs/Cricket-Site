'use client';

export const dynamic = 'force-dynamic';

// The trophy cabinet: every campaign leads with how it WENT — division position,
// P/W/L and points from the standings — not just a name and a link. The current
// season gets full cards; past seasons compress into one row per campaign.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Skel } from '../components/skeletons/PageSkeletons';
import { usePageTitle } from '../lib/usePageTitle';

// Short, human format tag derived from the series name.
function formatTag(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('playoff')) return 'Playoffs';
  if (n.includes('t20')) return 'T20';
  if (n.includes('t10')) return 'T10';
  if (n.includes('red ball') || n.includes('redball')) return 'Red Ball';
  return 'League';
}

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

function Trophy({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M6 3h12v2h3v3c0 2.6-1.9 4.7-4.4 5A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.4 13C4.9 12.7 3 10.6 3 8V5h3V3zm-1 4v1c0 1.4.9 2.6 2.1 3A6 6 0 0 1 7 9V7H5zm14 0h-2v2c0 .7-.1 1.4-.3 2 1.3-.4 2.3-1.6 2.3-3V7z" />
    </svg>
  );
}

// The finish, worn as a medal: CHAMPIONS (1st) in orange, RUNNERS-UP (2nd) in lake.
// Only for completed seasons — a live 1st place is a table position, not a title.
function HonourBadge({ outcome, completed }) {
  if (!completed || !outcome?.position || outcome.position > 2) return null;
  const champion = outcome.position === 1;
  return (
    <span
      className={`inline-flex items-center gap-[1.2vw] lg:gap-[0.3vw] rounded-full px-[2.6vw] py-[1vw] lg:px-[0.7vw] lg:py-[0.24vw] text-[2.6vw] lg:text-[0.68vw] uppercase tracking-wider roboto-condensed-bold ${
        champion
          ? 'bg-[var(--orange)] text-[#1a0d05]'
          : 'border border-[color:var(--lake)] text-[color:var(--lake)]'
      }`}
    >
      <Trophy className="h-[3.2vw] w-[3.2vw] lg:h-[0.85vw] lg:w-[0.85vw]" />
      {champion ? 'Champions' : 'Runners-up'}
    </span>
  );
}

// "P 12 · W 5 · L 6 · NR 1 · 11 pts" — raw standings figures; T/NR only when non-zero.
// A campaign whose standings carry no match record (playoff brackets) shows nothing.
function RecordLine({ outcome, className = '' }) {
  if (!outcome || outcome.played === 0) return null;
  const parts = [
    `P ${outcome.played}`,
    `W ${outcome.won}`,
    `L ${outcome.lost}`,
    ...(outcome.tied > 0 ? [`T ${outcome.tied}`] : []),
    ...(outcome.noResult > 0 ? [`NR ${outcome.noResult}`] : []),
  ];
  return (
    <p className={`roboto-condensed-regular text-[color:var(--text-muted)] ${className}`}>
      {parts.join(' · ')}
      <span className="text-[color:var(--text-dim)]"> · {outcome.points} pts</span>
    </p>
  );
}

function Position({ outcome, big }) {
  const num = big ? 'text-[11vw] lg:text-[2.9vw]' : 'text-[6.5vw] lg:text-[1.5vw]';
  if (!outcome?.position) {
    return (
      <span className={`ds-num leading-none text-[color:var(--text-dim)] ${num}`}>—</span>
    );
  }
  return (
    <span className="flex items-end gap-[1.6vw] lg:gap-[0.4vw]">
      <span className={`ds-num leading-none text-[color:var(--orange)] ${num}`}>
        {ordinal(outcome.position)}
      </span>
      <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.8vw] leading-none mb-[0.6vw] lg:mb-[0.15vw]">
        of {outcome.teams}
      </span>
    </span>
  );
}

// Current season: a full card per campaign, led by the live table position.
function SeasonCard({ tournament, hyperLink, completed }) {
  return (
    <Link
      href={hyperLink}
      className="group relative block overflow-hidden rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] bg-[var(--panel)] p-[5vw] lg:p-[1.5vw] transition-all duration-200 hover:border-[var(--orange)] hover:-translate-y-[0.3vw]"
    >
      <div className="pointer-events-none absolute -right-[8vw] -top-[8vw] h-[20vw] w-[20vw] lg:-right-[5vw] lg:-top-[5vw] lg:h-[10vw] lg:w-[10vw] rounded-full bg-[var(--glow)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center justify-between gap-[2vw] lg:gap-[0.6vw]">
        <span className="inline-block rounded-full bg-[var(--glow)] px-[3vw] py-[1vw] lg:px-[0.8vw] lg:py-[0.28vw] text-[2.8vw] lg:text-[0.7vw] uppercase tracking-wider roboto-condensed-bold text-[color:var(--orange)]">
          {formatTag(tournament.title)}
        </span>
        <HonourBadge outcome={tournament.outcome} completed={completed} />
      </div>

      <div className="mt-[4.5vw] lg:mt-[1.2vw]">
        <Position outcome={tournament.outcome} big />
      </div>

      <h3 className="roboto-condensed-bold mt-[2.5vw] lg:mt-[0.65vw] uppercase leading-tight text-[color:var(--text)] text-[4.2vw] lg:text-[1.08vw]">
        {tournament.title}
      </h3>

      <RecordLine
        outcome={tournament.outcome}
        className="mt-[1.8vw] lg:mt-[0.45vw] text-[3.2vw] lg:text-[0.82vw]"
      />

      <div className="mt-[4.5vw] lg:mt-[1.2vw] flex items-center justify-between border-t border-[var(--panel-line)] pt-[3.5vw] lg:pt-[0.9vw]">
        <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.82vw]">
          {completed ? 'Final table' : 'Live table'}
        </span>
        <span className="roboto-condensed-bold uppercase text-[color:var(--orange)] text-[3.2vw] lg:text-[0.82vw] transition-transform duration-200 group-hover:translate-x-[1vw] lg:group-hover:translate-x-[0.3vw]">
          View &rarr;
        </span>
      </div>
    </Link>
  );
}

// Past seasons: one compact row per campaign — name, finish, record, honours.
function SeasonRow({ tournament, hyperLink, completed }) {
  return (
    <Link
      href={hyperLink}
      className="group grid grid-cols-[1fr_auto] items-center gap-x-[3vw] gap-y-[1.5vw] lg:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1.4fr)_auto_auto] lg:gap-x-[1.4vw] rounded-[2.5vw] lg:rounded-[0.6vw] border border-[var(--panel-line)] bg-[var(--panel)] px-[4vw] py-[3.5vw] lg:px-[1.2vw] lg:py-[0.85vw] transition-colors hover:border-[var(--orange)]"
    >
      <span className="flex min-w-0 items-center gap-[2.5vw] lg:gap-[0.7vw]">
        <span className="shrink-0 rounded-full bg-[var(--glow)] px-[2.6vw] py-[0.9vw] lg:px-[0.7vw] lg:py-[0.24vw] text-[2.6vw] lg:text-[0.66vw] uppercase tracking-wider roboto-condensed-bold text-[color:var(--orange)]">
          {formatTag(tournament.title)}
        </span>
        <span className="roboto-condensed-bold truncate uppercase leading-tight text-[color:var(--text)] text-[3.7vw] lg:text-[0.95vw]">
          {tournament.title}
        </span>
      </span>

      <span className="justify-self-end lg:justify-self-start">
        <Position outcome={tournament.outcome} />
      </span>

      <RecordLine outcome={tournament.outcome} className="col-span-2 lg:col-span-1 text-[3vw] lg:text-[0.8vw]" />

      <span className="hidden lg:inline-flex">
        <HonourBadge outcome={tournament.outcome} completed={completed} />
      </span>

      <span
        aria-hidden="true"
        className="hidden lg:inline text-[color:var(--orange)] transition-transform duration-200 group-hover:translate-x-[0.3vw]"
      >
        &rarr;
      </span>

      {/* Honours ride below the record on mobile, where the row wraps. */}
      <span className="col-span-2 lg:hidden empty:hidden">
        <HonourBadge outcome={tournament.outcome} completed={completed} />
      </span>
    </Link>
  );
}

export default function Page() {
  usePageTitle('Tournaments');
  const [groupedTournaments, setGroupedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/tournaments?view=list')
      .then((r) => r.json())
      .then((data) => {
        if (!data?.entries) return;

        const yearEntries = data.entries.filter((e) => e.typeHandle === 'tournamentYearPage');
        const tournamentEntries = data.entries.filter((e) => e.typeHandle === 'tournamentPage');

        const grouped = yearEntries.map((year) => ({
          yearTitle: year.title,
          yearSlug: year.slug,
          tournaments: tournamentEntries.filter((e) => e.parent?.slug === year.slug),
        }));

        setGroupedTournaments(grouped);
      })
      .catch((err) => {
        console.error('Error fetching tournament data:', err);
        setError('Unable to load tournament data');
      })
      .finally(() => setLoading(false));
  }, []);

  // Years arrive newest-first; only the newest season's table is still moving.
  const currentYear = groupedTournaments[0]?.yearTitle;

  return (
    <section className="base_paddings pt-[104px] pb-[14vw] lg:pt-[140px] lg:pb-[4vw]">
      <div className="max_content center_aligned mx-auto">
        {/* Page header */}
        <div className="mb-[9vw] lg:mb-[2.6vw]">
          <h1 className="oswald-bold uppercase leading-none text-[color:var(--text)] text-[8.5vw] lg:text-[2.6vw]">
            Tournaments
          </h1>
          <p className="roboto-condensed-regular mt-[2.5vw] lg:mt-[0.7vw] text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw]">
            Every Club Cricket of Chicago campaign in the Midwest Cricket Conference — and how each one went.
          </p>
          <div className="mt-[3vw] lg:mt-[1vw] h-[1vw] w-[18vw] rounded-full bg-[var(--orange)] lg:h-[0.18vw] lg:w-[5vw]" />
        </div>

        {error ? (
          <p className="roboto-condensed-regular text-center text-[color:var(--text)]">{error}</p>
        ) : loading ? (
          <div className="space-y-[8vw] lg:space-y-[2.5vw]">
            <div>
              <Skel className="mb-[4vw] lg:mb-[1.2vw] h-[6vw] w-[20vw] lg:h-[1.7vw] lg:w-[7vw]" />
              <div className="grid grid-cols-1 gap-[5vw] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
                {[0, 1, 2].map((i) => (
                  <Skel key={i} className="h-[42vw] w-full lg:h-[11vw]" />
                ))}
              </div>
            </div>
            <div>
              <Skel className="mb-[4vw] lg:mb-[1.2vw] h-[6vw] w-[20vw] lg:h-[1.7vw] lg:w-[7vw]" />
              <div className="space-y-[3vw] lg:space-y-[0.7vw]">
                {[0, 1, 2].map((i) => (
                  <Skel key={i} className="h-[14vw] w-full lg:h-[3.4vw]" />
                ))}
              </div>
            </div>
          </div>
        ) : (
          groupedTournaments.map((group) => {
            const isCurrent = group.yearTitle === currentYear;
            return (
              <div key={group.yearSlug} className="mb-[10vw] lg:mb-[3vw]">
                <div className="mb-[5vw] lg:mb-[1.5vw] flex items-center gap-[3vw] lg:gap-[1vw]">
                  <h2 className="oswald-bold leading-none text-[color:var(--orange)] text-[6.5vw] lg:text-[1.7vw]">
                    {group.yearTitle}
                  </h2>
                  {isCurrent && (
                    <span className="rounded-full border border-[color:var(--panel-line-strong)] px-[2.6vw] py-[0.9vw] lg:px-[0.7vw] lg:py-[0.22vw] text-[2.6vw] lg:text-[0.66vw] uppercase tracking-wider roboto-condensed-bold text-[color:var(--text-muted)]">
                      In progress
                    </span>
                  )}
                  <div className="h-px flex-1 bg-[var(--panel-line)]" />
                  <span className="roboto-condensed-regular text-[color:var(--text-dim)] text-[3vw] lg:text-[0.8vw]">
                    {group.tournaments.length} {group.tournaments.length === 1 ? 'tournament' : 'tournaments'}
                  </span>
                </div>

                {group.tournaments.length ? (
                  isCurrent ? (
                    <div className="grid grid-cols-1 gap-[5vw] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
                      {group.tournaments.map((tournament) => (
                        <SeasonCard
                          key={tournament.id}
                          tournament={tournament}
                          completed={false}
                          hyperLink={`/tournaments/${group.yearSlug}/${tournament.slug}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-[3vw] lg:space-y-[0.7vw]">
                      {group.tournaments.map((tournament) => (
                        <SeasonRow
                          key={tournament.id}
                          tournament={tournament}
                          completed
                          hyperLink={`/tournaments/${group.yearSlug}/${tournament.slug}`}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <p className="roboto-condensed-regular italic text-[color:var(--text-muted)]">No tournaments found under this year.</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
