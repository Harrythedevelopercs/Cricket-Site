"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { MatchCentreSkeleton } from "../../components/skeletons/PageSkeletons";

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
export interface MatchCard {
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

// "29.2" overs -> 29 + 2/6 (cricket overs count 6 balls, not tenths).
function parseOvers(o: string): number | null {
  const m = o.trim().match(/^(\d+)(?:\.(\d))?$/);
  if (!m) return null;
  return Number(m[1]) + (m[2] ? Number(m[2]) / 6 : 0);
}

// Series styles in fixed order; 3rd/4th innings (rare) reuse the hues with a dash
// so identity never rests on color alone.
const SERIES_STYLE = [
  { stroke: "var(--chart-1)", dash: undefined },
  { stroke: "var(--chart-2)", dash: undefined },
  { stroke: "var(--chart-1)", dash: "6 4" },
  { stroke: "var(--chart-2)", dash: "6 4" },
];

const niceStep = (max: number, steps: number[], targetTicks: number) =>
  steps.find((s) => max / s <= targetTicks) ?? steps[steps.length - 1];

interface ActiveDot {
  px: number;
  py: number;
  label: string;
  team: string;
  stroke: string;
}

/** Both innings' runs-vs-overs lines on one labeled axis pair (the match "worm"). */
function WormChart({ innings }: { innings: Innings[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<ActiveDot | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setWidth(Math.floor(entries[0].contentRect.width))
    );
    ro.observe(el);
    setWidth(Math.floor(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);

  // Dot positions are in pixels, so a resize invalidates the anchored tooltip.
  useEffect(() => setActive(null), [width]);

  const series = innings
    .map((inn, index) => {
      const pts = inn.fallOfWickets
        .map((f) => ({
          x: parseOvers(f.over),
          y: f.runs,
          label: `${f.wicket}-${f.runs} ${f.player}${f.over ? ` (${f.over} ov)` : ""}`,
        }))
        .filter((p): p is { x: number; y: number; label: string } => p.x !== null)
        .sort((a, b) => a.x - b.x);
      const lastX = pts.length ? pts[pts.length - 1].x : 0;
      const endX = Math.max(parseOvers(inn.overs) ?? 0, lastX);
      return { name: inn.teamName, total: inn.total, wickets: inn.wickets, pts, endX, index };
    })
    .filter((s) => s.endX > 0);
  if (series.length === 0) return null;

  const xMax = Math.max(...series.map((s) => s.endX));
  const yTop = Math.max(1, ...series.map((s) => Math.max(s.total, ...s.pts.map((p) => p.y))));
  const yStep = niceStep(yTop, [5, 10, 20, 25, 50, 100, 200], 5);
  const yMax = Math.ceil(yTop / yStep) * yStep;
  const xStep = niceStep(xMax, [1, 2, 5, 10, 20], 8);

  const H = 252;
  const M = { top: 28, right: 48, bottom: 26, left: 36 };
  const iw = width - M.left - M.right;
  const ih = H - M.top - M.bottom;
  const sx = (x: number) => M.left + (x / xMax) * iw;
  const sy = (y: number) => M.top + ih - (y / yMax) * ih;

  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v);
  const xTicks: number[] = [];
  for (let v = 0; v <= Math.floor(xMax); v += xStep) xTicks.push(v);

  // Direct end labels; nudge apart when the two totals land too close.
  const endLabels = series.map((s) => ({ ...s, ly: sy(s.total) }));
  endLabels
    .slice()
    .sort((a, b) => a.ly - b.ly)
    .forEach((l, i, arr) => {
      if (i > 0 && l.ly - arr[i - 1].ly < 14) l.ly = arr[i - 1].ly + 14;
    });

  const summary = series
    .map((s) => `${s.name} ${s.total}/${s.wickets}`)
    .join("; ");

  return (
    <div className="ccc-card mb-[6vw] rounded-[3vw] border border-[var(--panel-line)] bg-[var(--panel)] p-[4vw] lg:mb-[2vw] lg:rounded-[0.8vw] lg:p-[1.5vw]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-dim)] lg:text-[0.74rem]">
          Run progression
        </h2>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {series.map((s) => {
            const style = SERIES_STYLE[s.index % SERIES_STYLE.length];
            return (
              <span
                key={`${s.name}-${s.index}`}
                className="roboto-condensed-regular flex items-center gap-2 text-[0.74rem] text-[color:var(--text-muted)] lg:text-[0.82rem]"
              >
                <svg width="20" height="6" aria-hidden="true">
                  <line x1="0" y1="3" x2="20" y2="3" stroke={style.stroke} strokeWidth="3" strokeDasharray={style.dash} strokeLinecap="round" />
                </svg>
                {s.name}
              </span>
            );
          })}
        </div>
      </div>
      <div ref={containerRef} className="relative">
        {width > 80 ? (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={`Run progression by overs: ${summary}. Dots mark each fall of wickets.`}
            onClick={() => setActive(null)}
          >
            {yTicks.map((v) => (
              <g key={`y${v}`}>
                <line
                  x1={M.left}
                  x2={width - M.right}
                  y1={sy(v)}
                  y2={sy(v)}
                  stroke={v === 0 ? "var(--panel-line-strong)" : "var(--panel-line)"}
                  strokeWidth={1}
                />
                <text x={M.left - 7} y={sy(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="var(--text-dim)">
                  {v}
                </text>
              </g>
            ))}
            {xTicks.map((v) => (
              <text key={`x${v}`} x={sx(v)} y={H - M.bottom + 16} textAnchor="middle" fontSize={11} fill="var(--text-dim)">
                {v}
              </text>
            ))}
            <text x={width - M.right + 7} y={H - M.bottom + 16} textAnchor="start" fontSize={11} fill="var(--text-dim)">
              overs
            </text>
            <text x={M.left - 7} y={12} textAnchor="end" fontSize={11} fill="var(--text-dim)">
              runs
            </text>
            {series.map((s) => {
              const style = SERIES_STYLE[s.index % SERIES_STYLE.length];
              const last = s.pts.length ? s.pts[s.pts.length - 1] : null;
              const lineEnd =
                !last || s.endX > last.x || s.total > last.y ? [{ x: s.endX, y: s.total }] : [];
              const linePts = [{ x: 0, y: 0 }, ...s.pts, ...lineEnd];
              const d = linePts.map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`).join(" ");
              return (
                <g key={`s${s.index}`}>
                  <path d={d} fill="none" stroke={style.stroke} strokeWidth={2} strokeLinejoin="round" strokeDasharray={style.dash} />
                  {s.pts.map((p) => {
                    const dot: ActiveDot = {
                      px: sx(p.x),
                      py: sy(p.y),
                      label: p.label,
                      team: s.name,
                      stroke: style.stroke,
                    };
                    return (
                      <g key={p.label}>
                        <circle cx={dot.px} cy={dot.py} r={4.5} fill={style.stroke} stroke="var(--panel)" strokeWidth={2} />
                        <circle
                          cx={dot.px}
                          cy={dot.py}
                          r={15}
                          fill="transparent"
                          className="cursor-pointer focus:outline-none"
                          tabIndex={0}
                          aria-label={`${s.name}: ${p.label}`}
                          onMouseEnter={() => setActive(dot)}
                          onMouseLeave={() => setActive(null)}
                          onFocus={() => setActive(dot)}
                          onBlur={() => setActive(null)}
                          onClick={(event) => {
                            event.stopPropagation();
                            setActive((current) => (current?.label === dot.label && current?.team === dot.team ? null : dot));
                          }}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {endLabels.map((l) => (
              <text key={`e${l.index}`} x={sx(l.endX) + 7} y={l.ly} dominantBaseline="middle" fontSize={12} fontWeight={700} fill="var(--text)">
                {l.total}/{l.wickets}
              </text>
            ))}
            {active ? (
              <circle cx={active.px} cy={active.py} r={7.5} fill={active.stroke} stroke="var(--panel)" strokeWidth={2.5} pointerEvents="none" />
            ) : null}
          </svg>
        ) : null}
        {active ? (
          <div
            className="pointer-events-none absolute z-10 rounded-[var(--radius-sm)] border border-[var(--panel-line-strong)] bg-[var(--panel-2)] px-3 py-2 shadow-xl"
            style={{
              left: Math.min(Math.max(active.px, 90), Math.max(width - 90, 90)),
              top: active.py - 12,
              transform: "translate(-50%, -100%)",
            }}
            role="status"
          >
            <p className="flex items-center gap-1.5 whitespace-nowrap text-[0.66rem] font-semibold uppercase tracking-wide text-[color:var(--text-dim)]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: active.stroke }} />
              {active.team}
            </p>
            <p className="roboto-condensed-bold whitespace-nowrap text-[0.88rem] text-[color:var(--text)]">
              {active.label}
            </p>
          </div>
        ) : null}
      </div>
      <p className="mt-1 text-[0.66rem] text-[color:var(--text-dim)] lg:text-[0.72rem]">
        Dots mark the fall of each wicket — hover or tap one for the batter and score.
      </p>
    </div>
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

export default function MatchCentreClient({
  matchId,
  initialMatch,
}: {
  matchId: string;
  initialMatch: MatchCard | null;
}) {
  const [m, setM] = useState<MatchCard | null>(initialMatch);
  const [loading, setLoading] = useState(initialMatch === null);

  useEffect(() => {
    // The server page passes the scorecard when Neon answered; fetch only as a fallback.
    if (initialMatch !== null || !matchId) return;
    fetch(`/api/match/${matchId}`)
      .then((r) => r.json())
      .then((d) => {
        setM(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [matchId, initialMatch]);

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

        <WormChart innings={m.innings} />

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
