'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Skel } from '../components/skeletons/PageSkeletons';
import { usePageTitle } from '../lib/usePageTitle';
// Tournaments list comes from the local DB (Neon) via /api/tournaments (includes 2026).

// Short, human format tag derived from the series name.
function formatTag(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('playoff')) return 'Playoffs';
  if (n.includes('t20')) return 'T20';
  if (n.includes('t10')) return 'T10';
  if (n.includes('red ball') || n.includes('redball')) return 'Red Ball';
  return 'League';
}

function TournamentCard({ seriesName, year, hyperLink }) {
  return (
    <Link
      href={hyperLink}
      className="group relative block overflow-hidden rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] bg-[var(--panel)] p-[5vw] lg:p-[1.5vw] transition-all duration-200 hover:border-[var(--orange)] hover:-translate-y-[0.3vw]"
    >
      {/* soft accent glow on hover */}
      <div className="pointer-events-none absolute -right-[8vw] -top-[8vw] h-[20vw] w-[20vw] lg:-right-[5vw] lg:-top-[5vw] lg:h-[10vw] lg:w-[10vw] rounded-full bg-[var(--glow)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <span className="inline-block rounded-full bg-[var(--glow)] px-[3vw] py-[1vw] lg:px-[0.8vw] lg:py-[0.28vw] text-[2.8vw] lg:text-[0.7vw] uppercase tracking-wider roboto-condensed-bold text-[color:var(--orange)]">
        {formatTag(seriesName)}
      </span>

      <div className="mt-[4vw] lg:mt-[1.1vw] flex items-center gap-[3.5vw] lg:gap-[0.9vw]">
        <div className="relative h-[13vw] w-[13vw] shrink-0 lg:h-[3.4vw] lg:w-[3.4vw]">
          <Image src="/images/logo.png" alt="Club Cricket of Chicago" fill className="object-contain" unoptimized />
        </div>
        <h3 className="roboto-condensed-bold uppercase leading-tight text-[color:var(--text)] text-[4.2vw] lg:text-[1.08vw]">
          {seriesName}
        </h3>
      </div>

      <div className="mt-[5vw] lg:mt-[1.4vw] flex items-center justify-between border-t border-[var(--panel-line)] pt-[4vw] lg:pt-[1vw]">
        <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.82vw]">
          {year} Season
        </span>
        <span className="roboto-condensed-bold uppercase text-[color:var(--orange)] text-[3.2vw] lg:text-[0.82vw] transition-transform duration-200 group-hover:translate-x-[1vw] lg:group-hover:translate-x-[0.3vw]">
          View &rarr;
        </span>
      </div>
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

  return (
    <section className="base_paddings pt-[104px] pb-[14vw] lg:pt-[140px] lg:pb-[4vw]">
      <div className="max_content center_aligned mx-auto">
        {/* Page header */}
        <div className="mb-[9vw] lg:mb-[2.6vw]">
          <h1 className="oswald-bold uppercase leading-none text-[color:var(--text)] text-[8.5vw] lg:text-[2.6vw]">
            Tournaments
          </h1>
          <p className="roboto-condensed-regular mt-[2.5vw] lg:mt-[0.7vw] text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw]">
            Club Cricket of Chicago&rsquo;s campaigns across the Midwest Cricket Conference.
          </p>
          <div className="mt-[3vw] lg:mt-[1vw] h-[1vw] w-[18vw] rounded-full bg-[var(--orange)] lg:h-[0.18vw] lg:w-[5vw]" />
        </div>

        {error ? (
          <p className="roboto-condensed-regular text-center text-[color:var(--text)]">{error}</p>
        ) : loading ? (
          <div className="space-y-[8vw] lg:space-y-[2.5vw]">
            {[0, 1].map((g) => (
              <div key={g}>
                <Skel className="mb-[4vw] lg:mb-[1.2vw] h-[6vw] w-[20vw] lg:h-[1.7vw] lg:w-[7vw]" />
                <div className="grid grid-cols-1 gap-[5vw] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
                  {[0, 1, 2].map((i) => (
                    <Skel key={i} className="h-[34vw] w-full lg:h-[9vw]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          groupedTournaments.map((group) => (
            <div key={group.yearSlug} className="mb-[10vw] lg:mb-[3vw]">
              <div className="mb-[5vw] lg:mb-[1.5vw] flex items-center gap-[3vw] lg:gap-[1vw]">
                <h2 className="oswald-bold leading-none text-[color:var(--orange)] text-[6.5vw] lg:text-[1.7vw]">
                  {group.yearTitle}
                </h2>
                <div className="h-px flex-1 bg-[var(--panel-line)]" />
                <span className="roboto-condensed-regular text-[color:var(--text-dim)] text-[3vw] lg:text-[0.8vw]">
                  {group.tournaments.length} {group.tournaments.length === 1 ? 'tournament' : 'tournaments'}
                </span>
              </div>

              {group.tournaments.length ? (
                <div className="grid grid-cols-1 gap-[5vw] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
                  {group.tournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      seriesName={tournament.title}
                      year={group.yearTitle}
                      hyperLink={`/tournaments/${group.yearSlug}/${tournament.slug}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="roboto-condensed-regular italic text-[color:var(--text-muted)]">No tournaments found under this year.</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
