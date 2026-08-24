'use client';

// Next Match, composed as ONE block: the fixture card and its countdown sit
// side by side instead of a small card orbiting a viewport-wide timer. The
// countdown reads as a sentence — "First ball in 4 days 20 hrs" — with units
// that pluralize correctly ("1 day", not "DAY 1").

import { useEffect, useState } from 'react';
import SectionTitleEle from '../ui/SectionTitleEle';
import SingleFixtureEle from '../ui/SingleFixtureEle';

interface Logo {
  url: string;
}

interface UpcomingMatch {
  id: string;
  title: string;
  t1Name: string;
  t2Name: string;
  groundsName: string;
  date: string;
  t1Logo: Logo[];
  t2Logo: Logo[];
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const remainingUntil = (target: number): Remaining | null => {
  const distance = target - Date.now();
  if (distance <= 0) return null;
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000) / 60_000),
    seconds: Math.floor((distance % 60_000) / 1_000),
  };
};

function CountdownCell({ value, unit }: { value: number; unit: [string, string] }) {
  return (
    <div className="text-center">
      <p className="ds-num leading-none text-[color:var(--text)] text-[9vw] lg:text-[2.9vw] tabular-nums">
        {value}
      </p>
      <p className="ds-eyebrow text-dim mt-[1.5vw] lg:mt-[0.4vw]">
        {value === 1 ? unit[0] : unit[1]}
      </p>
    </div>
  );
}

function Countdown({ targetIso }: { targetIso: string }) {
  const target = new Date(targetIso).getTime();
  const [left, setLeft] = useState<Remaining | null>(() =>
    Number.isFinite(target) ? remainingUntil(target) : null
  );

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const tick = () => setLeft(remainingUntil(target));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!Number.isFinite(target)) return null;

  if (!left) {
    return (
      <p className="roboto-condensed-bold uppercase tracking-wider text-[color:var(--orange)] text-[4.5vw] lg:text-[1.2vw]">
        Match day — play under way
      </p>
    );
  }

  return (
    <div>
      <p className="ds-eyebrow ds-eyebrow--orange mb-[3vw] lg:mb-[0.9vw]">First ball in</p>
      <div className="flex items-start gap-[7vw] lg:gap-[2.6vw]">
        <CountdownCell value={left.days} unit={['day', 'days']} />
        <CountdownCell value={left.hours} unit={['hour', 'hours']} />
        <CountdownCell value={left.minutes} unit={['minute', 'minutes']} />
        <CountdownCell value={left.seconds} unit={['second', 'seconds']} />
      </div>
    </div>
  );
}

export default function UpcomingMatchPanel({ match }: { match?: UpcomingMatch | null }) {
  if (!match) return null;

  return (
    <section className="UMP_container base_paddings">
      <div className="UMP_parent center_aligned max_content">
        <SectionTitleEle>Next Match</SectionTitleEle>

        <div className="grid gap-[8vw] lg:grid-cols-[minmax(0,26vw)_1fr] lg:items-center lg:gap-[4vw]">
          <SingleFixtureEle fixture={match} isActive={false} />
          <div className="lg:border-l lg:border-[var(--panel-line)] lg:pl-[4vw]">
            <Countdown targetIso={match.date} />
          </div>
        </div>
      </div>
    </section>
  );
}
