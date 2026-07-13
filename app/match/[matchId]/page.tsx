"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MatchCentreSkeleton } from "../../components/skeletons/PageSkeletons";
import { usePageTitle } from "../../lib/usePageTitle";

interface Bat {
  name: string;
  dismissal: string;
  notOut: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
}
interface Bowl {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  wides: number;
  noBalls: number;
  econ: string;
}
interface Extras {
  b: number;
  lb: number;
  wd: number;
  nb: number;
  pn: number;
  total: number;
}
interface FoW {
  runs: number;
  wicket: number;
  over: string;
  player: string;
}
interface Innings {
  teamName: string;
  total: number;
  wickets: number;
  overs: string;
  runRate: string;
  extras: Extras;
  didNotBat: string[];
  fallOfWickets: FoW[];
  batting: Bat[];
  bowling: Bowl[];
}
interface MatchCard {
  matchId: number;
  found: boolean;
  teamOne: string;
  teamTwo: string;
  teamOneLogo: string;
  teamTwoLogo: string;
  result: string;
  date: string;
  seriesName: string;
  location: string;
  innings: Innings[];
  error?: string;
}

function Th({ children, right = false }: { children: ReactNode; right?: boolean }) {
  return (
    <th
      className={`roboto-condensed-bold text-[color:var(--text-muted)] uppercase px-[2vw] lg:px-[0.7vw] py-[2vw] lg:py-[0.6vw] text-[2.5vw] lg:text-[0.74vw] whitespace-nowrap ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Num({ children, lead = false }: { children: ReactNode; lead?: boolean }) {
  return (
    <td
      className={`text-right px-[2vw] lg:px-[0.7vw] py-[2vw] lg:py-[0.5vw] text-[2.8vw] lg:text-[0.85vw] whitespace-nowrap ${
        lead ? "roboto-condensed-bold text-[color:var(--text)]" : "roboto-condensed-regular text-[color:var(--text-muted)]"
      }`}
    >
      {children}
    </td>
  );
}

function InningsCard({ inn, index }: { inn: Innings; index: number }) {
  const ex = inn.extras;
  const exParts = [
    ["b", ex.b],
    ["lb", ex.lb],
    ["w", ex.wd],
    ["nb", ex.nb],
    ["p", ex.pn],
  ]
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ");
  const fow = inn.fallOfWickets
    .map((f) => `${f.wicket}-${f.runs} (${f.player}${f.over ? `, ${f.over}` : ""})`)
    .join("   ");

  return (
    <article id={`innings-${index + 1}`} className="scroll-mt-36 bg-[var(--panel)] rounded-[2.5vw] lg:rounded-[0.7vw] border border-[var(--panel-line)] overflow-hidden mb-[5vw] lg:mb-[1.6vw]">
      <div className="flex items-center justify-between bg-[var(--panel-2)] px-[4vw] lg:px-[1.3vw] py-[3vw] lg:py-[0.9vw]">
        <div>
          <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--orange)] lg:text-[0.68rem]">Innings {index + 1}</p>
          <h2 className="roboto-condensed-bold mt-1 text-[color:var(--text)] uppercase text-[4vw] lg:text-[1.1vw]">{inn.teamName}</h2>
        </div>
        <p className="oswald-bold text-[color:var(--orange)] text-[5vw] lg:text-[1.5vw] leading-none">
          {inn.total}/{inn.wickets}
          <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.8vw] ml-[1.5vw] lg:ml-[0.4vw]">
            ({inn.overs} ov)
          </span>
        </p>
      </div>

      {/* Batting */}
      <p className="border-b border-[var(--panel-line)] px-[4vw] py-2 text-[0.66rem] uppercase tracking-wide text-[color:var(--text-dim)] lg:hidden">Swipe table for all columns →</p>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${inn.teamName} batting scorecard`}>
        <table className="min-w-full">
          <thead>
            <tr className="bg-[var(--panel-2)] border-b border-[var(--panel-line)]">
              <Th>Batting</Th>
              <Th right>R</Th>
              <Th right>B</Th>
              <Th right>4s</Th>
              <Th right>6s</Th>
              <Th right>SR</Th>
            </tr>
          </thead>
          <tbody>
            {inn.batting.map((b, i) => (
              <tr key={i} className="bg-[var(--panel)] border-b border-[var(--panel-line)]">
                <td className="px-[2vw] lg:px-[0.7vw] py-[2vw] lg:py-[0.5vw]">
                  <p className="roboto-condensed-bold text-[color:var(--text)] text-[3.2vw] lg:text-[0.9vw]">
                    {b.name}
                    {b.notOut ? <span className="text-[color:var(--win)]"> *</span> : null}
                  </p>
                  <p className="roboto-condensed-regular mt-1 min-w-[150px] text-[color:var(--text-muted)] text-[0.72rem] leading-snug lg:min-w-0 lg:text-[0.76vw]">
                    {b.dismissal}
                  </p>
                </td>
                <Num lead>{b.runs}</Num>
                <Num>{b.balls}</Num>
                <Num>{b.fours}</Num>
                <Num>{b.sixes}</Num>
                <Num>{b.sr}</Num>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Extras + Total + DNB + FoW */}
      <div className="px-[4vw] lg:px-[1.3vw] py-[3vw] lg:py-[1vw] border-t border-[var(--panel-line)]">
        <div className="flex justify-between items-baseline">
          <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw]">
            Extras
            {exParts ? (
              <span className="text-[color:var(--text-dim)]"> ({exParts})</span>
            ) : null}
          </span>
          <span className="roboto-condensed-bold text-[color:var(--text)] text-[3.2vw] lg:text-[0.9vw]">
            {ex.total}
          </span>
        </div>
        <div className="flex justify-between items-baseline mt-[2vw] lg:mt-[0.6vw] pt-[2vw] lg:pt-[0.6vw] border-t border-[var(--panel-line)]">
          <span className="roboto-condensed-bold text-[color:var(--text)] uppercase text-[3.2vw] lg:text-[0.95vw]">
            Total
            <span className="roboto-condensed-regular text-[color:var(--text-muted)] normal-case">
              {" "}
              ({inn.overs} ov{inn.runRate ? `, RR ${inn.runRate}` : ""})
            </span>
          </span>
          <span className="oswald-bold text-[color:var(--orange)] text-[4.5vw] lg:text-[1.3vw]">
            {inn.total}/{inn.wickets}
          </span>
        </div>
        {inn.didNotBat.length > 0 ? (
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[2.8vw] lg:text-[0.8vw] mt-[3vw] lg:mt-[0.8vw]">
            <span className="text-[color:var(--text-dim)]">Did not bat: </span>
            {inn.didNotBat.join(", ")}
          </p>
        ) : null}
        {fow ? (
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[2.8vw] lg:text-[0.8vw] mt-[2vw] lg:mt-[0.5vw]">
            <span className="text-[color:var(--text-dim)]">Fall of wickets: </span>
            {fow}
          </p>
        ) : null}
      </div>

      {/* Bowling */}
      {inn.bowling.length > 0 ? (
        <div className="overflow-x-auto border-t border-[var(--panel-line)]" tabIndex={0} role="region" aria-label={`${inn.teamName} bowling scorecard`}>
          <table className="min-w-full">
            <thead>
              <tr className="bg-[var(--panel-2)] border-b border-[var(--panel-line)]">
                <Th>Bowling</Th>
                <Th right>O</Th>
                <Th right>M</Th>
                <Th right>R</Th>
                <Th right>W</Th>
                <Th right>Econ</Th>
              </tr>
            </thead>
            <tbody>
              {inn.bowling.map((b, i) => (
                <tr key={i} className="bg-[var(--panel)] border-b border-[var(--panel-line)]">
                  <td className="px-[2vw] lg:px-[0.7vw] py-[2vw] lg:py-[0.5vw] roboto-condensed-bold text-[color:var(--text)] text-[3.2vw] lg:text-[0.9vw]">
                    {b.name}
                  </td>
                  <Num>{b.overs}</Num>
                  <Num>{b.maidens}</Num>
                  <Num>{b.runs}</Num>
                  <Num lead>{b.wickets}</Num>
                  <Num>{b.econ}</Num>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  );
}

export default function MatchCentre() {
  const params = useParams();
  const id = Array.isArray(params?.matchId) ? params.matchId[0] : params?.matchId;
  const [m, setM] = useState<MatchCard | null>(null);
  const [loading, setLoading] = useState(true);
  usePageTitle(m?.teamOne && m?.teamTwo ? `${m.teamOne} vs ${m.teamTwo}` : "Match Centre");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/match/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setM(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <MatchCentreSkeleton />;
  if (!m || m.error || !m.found || m.innings.length === 0)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="roboto-condensed-regular text-[color:var(--text)] p3">Scorecard unavailable for this match.</p>
        <Link href="/" className="roboto-condensed-bold text-[color:var(--orange)] uppercase hover:underline">
          ← Home
        </Link>
      </div>
    );

  return (
    <section className="base_paddings pt-[100px] pb-[8vw] lg:pt-[136px] lg:pb-[3vw]">
      <div className="max_content center_aligned mx-auto">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 lg:mb-7">
          <Link href="/schedule" className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-muted)] hover:text-[color:var(--orange)]">← Back to fixtures</Link>
          <span className="text-xs uppercase tracking-[0.12em] text-[color:var(--text-dim)]">Match #{m.matchId}</span>
        </div>
        <div className="ccc-card bg-[var(--panel)] rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] p-[6vw] lg:p-[1.8vw] mb-[6vw] lg:mb-[2vw]">
          {m.seriesName ? (
            <p className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[3vw] lg:text-[0.85vw] text-center mb-[3vw] lg:mb-[1vw]">
              {m.seriesName}
            </p>
          ) : null}
          <h1 className="ds-display mx-auto max-w-4xl text-center text-[clamp(2rem,8vw,4rem)] lg:text-[clamp(2.5rem,4vw,5rem)]">
            {m.teamOne} <span className="text-[color:var(--orange)]">vs</span> {m.teamTwo}
          </h1>
          <div className="mt-6 flex items-center justify-center gap-[5vw] lg:mt-8 lg:gap-[2.5vw]">
            <div className="flex flex-col items-center gap-[2vw] lg:gap-[0.6vw] w-[30%]">
              <div className="relative w-[16vw] h-[16vw] lg:w-[4.5vw] lg:h-[4.5vw] rounded-full overflow-hidden bg-[rgba(255,255,255,0.04)] border border-[var(--panel-line-strong)]">
                <Image src={m.teamOneLogo || "/images/placeholder_logo.png"} alt={m.teamOne} fill sizes="72px" className="object-contain" unoptimized />
              </div>
              <p className="roboto-condensed-bold text-[color:var(--text)] text-center uppercase text-[3vw] lg:text-[0.9vw] leading-tight">
                {m.teamOne}
              </p>
            </div>
            <span className="oswald-bold text-[color:var(--orange)] text-[5vw] lg:text-[1.6vw]">VS</span>
            <div className="flex flex-col items-center gap-[2vw] lg:gap-[0.6vw] w-[30%]">
              <div className="relative w-[16vw] h-[16vw] lg:w-[4.5vw] lg:h-[4.5vw] rounded-full overflow-hidden bg-[rgba(255,255,255,0.04)] border border-[var(--panel-line-strong)]">
                <Image src={m.teamTwoLogo || "/images/placeholder_logo.png"} alt={m.teamTwo} fill sizes="72px" className="object-contain" unoptimized />
              </div>
              <p className="roboto-condensed-bold text-[color:var(--text)] text-center uppercase text-[3vw] lg:text-[0.9vw] leading-tight">
                {m.teamTwo}
              </p>
            </div>
          </div>
          {m.result ? (
            <p className="roboto-condensed-bold text-[color:var(--win)] text-center text-[3.4vw] lg:text-[1vw] mt-[4vw] lg:mt-[1.2vw]">
              {m.result}
            </p>
          ) : null}
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-center text-[2.8vw] lg:text-[0.8vw] mt-[2vw] lg:mt-[0.5vw]">
            {[m.date, m.location].filter(Boolean).join(" · ")}
          </p>
          <div className="mx-auto mt-5 grid max-w-2xl grid-cols-2 gap-2 lg:mt-6 lg:gap-3">
            {m.innings.map((inn, index) => (
              <a key={`${inn.teamName}-${index}`} href={`#innings-${index + 1}`} className="rounded-[var(--radius-sm)] border border-[var(--panel-line)] bg-[var(--panel-2)] px-3 py-3 text-center transition-colors hover:border-[var(--orange)] lg:px-5 lg:py-4">
                <span className="block truncate text-[0.62rem] font-semibold uppercase tracking-wide text-[color:var(--text-muted)] lg:text-xs">{inn.teamName}</span>
                <span className="ds-num mt-1 block text-xl text-[color:var(--text)] lg:text-2xl">{inn.total}/{inn.wickets} <small className="font-normal text-[0.65rem] text-[color:var(--text-dim)]">({inn.overs})</small></span>
              </a>
            ))}
          </div>
        </div>

        {m.innings.length > 1 ? (
          <nav aria-label="Jump to innings" className="sticky top-[74px] z-20 mb-4 flex gap-2 overflow-x-auto rounded-full border border-[var(--panel-line)] bg-[color-mix(in_srgb,var(--ink)_90%,transparent)] p-1.5 backdrop-blur-xl lg:top-[88px] lg:mx-auto lg:mb-6 lg:w-fit">
            {m.innings.map((inn, index) => (
              <a key={`${inn.teamName}-nav-${index}`} href={`#innings-${index + 1}`} className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)] hover:bg-[var(--panel)] hover:text-[color:var(--orange)]">
                {index + 1}. {inn.teamName}
              </a>
            ))}
          </nav>
        ) : null}

        {m.innings.map((inn, i) => (
          <InningsCard key={i} inn={inn} index={i} />
        ))}
      </div>
    </section>
  );
}
