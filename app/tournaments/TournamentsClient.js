'use client';

// The trophy cabinet: every campaign is a full card that leads with how it
// WENT — division position, P/W/L and points from the standings. Cards are
// physical: they rise in with a stagger, tilt under the pointer (mouse only,
// never under prefers-reduced-motion) and carry a soft sheen that follows
// the cursor. One quiet per-format glow keys the corner of each card.

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Skel } from '../components/skeletons/PageSkeletons';
import LadderStrip from '../components/ui/LadderStrip';
import ChicagoStar from '../components/ui/ChicagoStar';

// Short, human format tag derived from the series name.
function formatTag(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('playoff')) return 'Playoffs';
  if (n.includes('t20')) return 'T20';
  if (n.includes('t10')) return 'T10';
  if (n.includes('red ball') || n.includes('redball')) return 'Red Ball';
  return 'League';
}

// One quiet per-format tint, used as a soft corner glow on each card. Mixed
// from theme tokens so both themes hold; the red-ball ember is the ball's own
// pigment.
const FORMAT_GLOW = {
  'Red Ball': 'color-mix(in srgb, #B43024 26%, transparent)',
  T20: 'color-mix(in srgb, var(--lake) 26%, transparent)',
  T10: 'color-mix(in srgb, var(--lake) 26%, transparent)',
  Playoffs: 'color-mix(in srgb, var(--orange) 22%, transparent)',
  League: 'color-mix(in srgb, var(--lake) 14%, transparent)',
};

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

// The ball the competition is actually played with — red for red-ball cricket,
// white for the T20/T10 formats. Fixed pigments on purpose: a cricket ball is
// the same object in both themes.
function BallMark({ white = false, className = '' }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id={`ball-${uid}`} cx="34%" cy="28%" r="74%">
          {white ? (
            <>
              <stop offset="0%" stopColor="#FFFDF7" />
              <stop offset="62%" stopColor="#EFE9DB" />
              <stop offset="100%" stopColor="#C4BBA6" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#E8695E" />
              <stop offset="58%" stopColor="#B43024" />
              <stop offset="100%" stopColor="#6B160F" />
            </>
          )}
        </radialGradient>
      </defs>
      <circle
        cx="12" cy="12" r="10"
        fill={`url(#ball-${uid})`}
        stroke={white ? 'rgba(80,66,40,0.4)' : 'rgba(0,0,0,0.28)'}
        strokeWidth="0.6"
      />
      <path d="M8.6 3.9 A10 10 0 0 0 8.6 20.1" fill="none" stroke={white ? '#B43024' : '#FBF7EF'} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="1.3 1.9" />
      <path d="M15.4 3.9 A10 10 0 0 1 15.4 20.1" fill="none" stroke={white ? '#B43024' : '#FBF7EF'} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="1.3 1.9" />
    </svg>
  );
}

// Every campaign gets a small pictorial mark keyed to its format — the ball
// it's played with, a trophy for playoffs, the Chicago star for leagues.
// Bare objects, no container chrome.
function FormatMark({ name, className = '' }) {
  const tag = formatTag(name);
  const base = `inline-flex shrink-0 items-center justify-center ${className}`;
  if (tag === 'Red Ball') {
    return (
      <span className={base} title="Red-ball cricket">
        <BallMark className="h-full w-full" />
      </span>
    );
  }
  if (tag === 'T20' || tag === 'T10') {
    return (
      <span className={base} title={`${tag} — white-ball cricket`}>
        <BallMark white className="h-full w-full" />
      </span>
    );
  }
  if (tag === 'Playoffs') {
    return (
      <span className={`${base} text-[color:var(--orange)]`} title="Playoffs">
        <Trophy className="h-full w-full" />
      </span>
    );
  }
  return (
    <span className={`${base} text-[color:var(--lake)]`} title="League">
      <ChicagoStar size="100%" />
    </span>
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

function Position({ outcome }) {
  if (!outcome?.position) {
    return (
      <span className="ds-num leading-none text-[color:var(--text-dim)] text-[11vw] lg:text-[2.9vw]">—</span>
    );
  }
  return (
    <span className="flex items-end gap-[1.6vw] lg:gap-[0.4vw]">
      <span className="ds-num leading-none text-[color:var(--orange)] text-[11vw] lg:text-[2.9vw]">
        {ordinal(outcome.position)}
      </span>
      <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.8vw] leading-none mb-[0.6vw] lg:mb-[0.15vw]">
        of {outcome.teams}
      </span>
    </span>
  );
}

// Every campaign as a physical card. The tilt writes transforms straight to
// the element (no re-render per pointer event); touch never triggers it, and
// prefers-reduced-motion turns it off entirely.
function SeasonCard({ tournament, hyperLink, completed, index }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const glow = FORMAT_GLOW[formatTag(tournament.title)] ?? FORMAT_GLOW.League;

  const onPointerMove = (e) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    if (!reduce) {
      el.style.transition = 'transform 0s';
      const rx = (0.5 - py) * 3.5;
      const ry = (px - 0.5) * 4.5;
      el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }
  };
  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1)';
    el.style.transform = '';
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: reduce ? 0 : (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Link
        ref={ref}
        href={hyperLink}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="group relative flex h-full flex-col overflow-hidden rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] bg-[var(--panel)] p-[5vw] lg:p-[1.5vw] transition-colors duration-200 hover:border-[var(--orange)] focus-visible:border-[var(--orange)]"
        style={{ backgroundImage: `radial-gradient(95% 75% at 100% 0%, ${glow} 0%, transparent 58%)` }}
      >
        {/* pointer-following sheen — visible only while hovered */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(40% 55% at var(--mx, 70%) var(--my, 20%), rgba(255,255,255,0.10), transparent 72%)',
            mixBlendMode: 'soft-light',
          }}
        />

        <div className="flex items-center justify-between gap-[2vw] lg:gap-[0.6vw]">
          <span className="inline-flex items-center gap-[2vw] lg:gap-[0.5vw] text-[2.8vw] lg:text-[0.72vw] uppercase tracking-[0.14em] roboto-condensed-bold text-[color:var(--text-muted)]">
            <FormatMark name={tournament.title} className="h-[4.6vw] w-[4.6vw] lg:h-[1.15vw] lg:w-[1.15vw] transition-transform duration-500 group-hover:rotate-[24deg]" />
            {formatTag(tournament.title)}
          </span>
          <HonourBadge outcome={tournament.outcome} completed={completed} />
        </div>

        <h3 className="roboto-condensed-bold mt-[3.5vw] lg:mt-[0.95vw] min-h-[2.5em] uppercase leading-tight text-[color:var(--text)] text-[4.2vw] lg:text-[1.08vw]">
          {tournament.title}
        </h3>

        <div className="mt-[2vw] lg:mt-[0.5vw]">
          <Position outcome={tournament.outcome} />
        </div>

        {/* The whole division laid out left to right, the club's rung lit — the
            same ladder the home season hub uses, so "9th of 10" is a picture. */}
        {tournament.outcome?.position ? (
          <LadderStrip position={tournament.outcome.position} teams={tournament.outcome.teams} />
        ) : null}

        <RecordLine
          outcome={tournament.outcome}
          className="mt-[2.5vw] lg:mt-[0.65vw] text-[3.2vw] lg:text-[0.82vw]"
        />

        <div className="mt-auto flex items-center justify-between border-t border-[var(--panel-line)] pt-[3.5vw] lg:pt-[0.9vw]">
          <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.82vw]">
            {completed ? 'Final table' : 'Live table'}
          </span>
          <span className="roboto-condensed-bold uppercase text-[color:var(--orange)] text-[3.2vw] lg:text-[0.82vw] transition-transform duration-200 group-hover:translate-x-[1vw] lg:group-hover:translate-x-[0.3vw]">
            View &rarr;
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const groupEntries = (entries) => {
  const yearEntries = entries.filter((e) => e.typeHandle === 'tournamentYearPage');
  const tournamentEntries = entries.filter((e) => e.typeHandle === 'tournamentPage');
  return yearEntries.map((year) => ({
    yearTitle: year.title,
    yearSlug: year.slug,
    tournaments: tournamentEntries.filter((e) => e.parent?.slug === year.slug),
  }));
};

export default function TournamentsClient({ initialEntries }) {
  const [groupedTournaments, setGroupedTournaments] = useState(() =>
    initialEntries ? groupEntries(initialEntries) : []
  );
  const [loading, setLoading] = useState(initialEntries === null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // The server page passes the list when the DB answered; fetch only as the
    // fallback for that first-paint miss.
    if (initialEntries !== null) return;
    fetch('/api/tournaments?view=list')
      .then(async (r) => {
        const data = await r.json();
        // A failed read is { entries: [], error } with a 500 — and a missing
        // entries array must become the error state, never a silent blank page.
        if (!r.ok || data?.error || !Array.isArray(data?.entries)) {
          throw new Error(data?.error || `Tournaments request failed: ${r.status}`);
        }
        setGroupedTournaments(groupEntries(data.entries));
      })
      .catch((err) => {
        console.error('Error fetching tournament data:', err);
        setError('Unable to load tournament data');
      })
      .finally(() => setLoading(false));
  }, [initialEntries]);

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
          <div className="ccc-card mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="ds-display text-4xl">The record books didn&rsquo;t open</p>
            <p className="mt-3 text-[color:var(--text-muted)]">
              Usually a slow wake-up, not an outage — give it a moment and try again.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary mt-6">
              Reload tournaments
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-[8vw] lg:space-y-[2.5vw]">
            {[0, 1].map((g) => (
              <div key={g}>
                <Skel className="mb-[4vw] lg:mb-[1.2vw] h-[6vw] w-[20vw] lg:h-[1.7vw] lg:w-[7vw]" />
                <div className="grid grid-cols-1 gap-[5vw] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
                  {[0, 1, 2].map((i) => (
                    <Skel key={i} className="h-[52vw] w-full lg:h-[13vw]" />
                  ))}
                </div>
              </div>
            ))}
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
                  <div className="grid grid-cols-1 gap-[5vw] sm:grid-cols-2 lg:grid-cols-3 lg:gap-[1.5vw]">
                    {group.tournaments.map((tournament, index) => (
                      <SeasonCard
                        key={tournament.id}
                        tournament={tournament}
                        completed={!isCurrent}
                        index={index}
                        hyperLink={`/tournaments/${group.yearSlug}/${tournament.slug}`}
                      />
                    ))}
                  </div>
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
