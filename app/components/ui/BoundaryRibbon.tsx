"use client";

// Where a batter's runs actually came from — sixes, fours, and everything run
// between the wickets. Boundary percentage is how cricket describes a batter, and
// it separates an anchor from a hitter in one glance; the career table can't.
//
// The split is exact arithmetic off the career row, never an estimate:
//   run = runs - (fours x 4) - (sixes x 6)
//
// CricClubs rows are shown raw, and occasionally they don't reconcile (a boundary
// count higher than the total it belongs to). Rather than clamp the data, the
// component detects that and renders nothing — no invented remainder, no negative
// segment.

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export interface RunSource {
  runs: number;
  fours: number;
  sixes: number;
}

/** Null when the row can't be split honestly. */
export function splitRuns({ runs, fours, sixes }: RunSource) {
  const inSixes = sixes * 6;
  const inFours = fours * 4;
  const run = runs - inFours - inSixes;
  if (runs <= 0 || run < 0) return null;
  return {
    inSixes,
    inFours,
    run,
    boundaryPct: Math.round(((inFours + inSixes) / runs) * 100),
  };
}

export default function BoundaryRibbon({
  runs,
  fours,
  sixes,
  format,
  innings,
}: RunSource & { format: string; innings: number }) {
  const reduce = useReducedMotion();
  const split = splitRuns({ runs, fours, sixes });
  if (!split) return null;

  const segs = [
    { key: "six", value: split.inSixes, label: `${sixes} ${sixes === 1 ? "six" : "sixes"}` },
    { key: "four", value: split.inFours, label: `${fours} ${fours === 1 ? "four" : "fours"}` },
    { key: "run", value: split.run, label: "run between wickets" },
  ].filter((s) => s.value > 0);

  return (
    <div className="ccc-ribbon-shell">
      <div className="ccc-ribbon-head">
        <div>
          <p className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[2.8vw] lg:text-[0.72vw]">
            {format} · {innings} {innings === 1 ? "innings" : "innings"}
          </p>
          <p className="roboto-condensed-med text-[color:var(--text)] text-[3.6vw] lg:text-[0.95vw] mt-[0.5vw] lg:mt-[0.15vw]">
            {runs.toLocaleString()} runs
          </p>
        </div>
        <p className="ds-num text-[color:var(--orange)] text-[5.5vw] lg:text-[1.5vw] leading-none">
          {split.boundaryPct}%
          <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[0.5em] ml-[1vw] lg:ml-[0.3vw]">
            in boundaries
          </span>
        </p>
      </div>

      <div
        className="ccc-ribbon"
        role="img"
        aria-label={`${runs} runs: ${split.inSixes} in sixes, ${split.inFours} in fours, ${split.run} run between the wickets`}
      >
        {segs.map((s, i) => (
          <motion.span
            key={s.key}
            className={`ccc-rseg ccc-rseg--${s.key}`}
            title={`${s.value} runs — ${s.label}`}
            initial={reduce ? false : { width: 0 }}
            whileInView={{ width: `${(s.value / runs) * 100}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.3, delay: reduce ? 0 : i * 0.16, ease: EASE }}
          >
            <b>{s.value}</b>
            <s>{s.label}</s>
          </motion.span>
        ))}
      </div>
    </div>
  );
}
