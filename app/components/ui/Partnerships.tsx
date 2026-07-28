"use client";

// An innings as the chain of partnerships that built it, with each stand growing
// until a wicket ends it.
//
// The obvious alternative — pinning each wicket to a shared axis by runs — cannot
// work with real data: CCC's innings in match 9591 lost wickets at 52 and 54, two
// runs apart, so the labels collide at any width. Segments can't overlap, and the
// wicket detail moves to chips below that wrap instead.
//
// Partnerships are also the more cricket-native reading: an innings is a sequence
// of stands, not a set of points on a line.

import { motion, useReducedMotion } from "framer-motion";

export interface FoWEntry {
  runs: number;
  wicket: number;
  over: string;
  player: string;
}

const ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const ordinal = (n: number) => ORD[n - 1] ?? `${n}th`;

export interface Stand {
  runs: number;
  /** The wicket that ended this stand, or null if it was unbroken. */
  endedBy: FoWEntry | null;
  wicketNumber: number;
}

/** Successive gaps between falls, plus whatever was added after the last one. */
export function buildStands(fow: FoWEntry[], total: number): Stand[] {
  const ordered = [...fow].sort((a, b) => a.wicket - b.wicket);
  const stands: Stand[] = [];
  let prev = 0;
  for (const f of ordered) {
    stands.push({ runs: Math.max(0, f.runs - prev), endedBy: f, wicketNumber: f.wicket });
    prev = f.runs;
  }
  if (total > prev) {
    stands.push({ runs: total - prev, endedBy: null, wicketNumber: ordered.length + 1 });
  }
  return stands;
}

export default function Partnerships({
  fallOfWickets,
  total,
  teamName,
}: {
  fallOfWickets: FoWEntry[];
  total: number;
  teamName: string;
}) {
  const reduce = useReducedMotion();
  if (!fallOfWickets || fallOfWickets.length === 0 || total <= 0) return null;

  const stands = buildStands(fallOfWickets, total);
  if (stands.length === 0) return null;

  // Each stand starts once the one before it has finished drawing.
  let elapsed = 0;
  const timed = stands.map((s) => {
    const dur = 0.2 + (s.runs / total) * 1.3;
    const at = elapsed;
    elapsed += dur * 0.75;
    return { ...s, dur, at };
  });

  return (
    <div className="mt-[4vw] lg:mt-[1vw]">
      <p className="roboto-condensed-bold uppercase tracking-wider text-[color:var(--text-dim)] text-[2.6vw] lg:text-[0.7vw] mb-[2vw] lg:mb-[0.5vw]">
        Partnerships
      </p>

      <div
        className="ccc-pship-track"
        role="img"
        aria-label={`${teamName} partnerships: ${stands
          .map((s) => `${ordinal(s.wicketNumber)} ${s.runs}`)
          .join(", ")}`}
      >
        {timed.map((s, i) => (
          <motion.span
            key={i}
            className={`ccc-pship${s.endedBy ? "" : " is-unbroken"}`}
            title={
              s.endedBy
                ? `${ordinal(s.wicketNumber)} wicket — ${s.runs} runs, ended by ${s.endedBy.player} at ${s.endedBy.runs}`
                : `Unbroken ${ordinal(s.wicketNumber)}-wicket stand — ${s.runs} runs`
            }
            style={{
              background:
                i % 2
                  ? "color-mix(in srgb, var(--lake) 30%, transparent)"
                  : "color-mix(in srgb, var(--orange) 24%, transparent)",
            }}
            initial={reduce ? false : { width: 0 }}
            whileInView={{ width: `${(s.runs / total) * 100}%` }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: reduce ? 0 : s.dur, delay: reduce ? 0 : s.at, ease: "easeOut" }}
          >
            <b>{s.runs}</b>
          </motion.span>
        ))}
      </div>

      <div className="ccc-fow-chips">
        {fallOfWickets.map((f) => (
          <motion.span
            key={f.wicket}
            className="ccc-fow-chip"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.35, delay: reduce ? 0 : 0.1 + f.wicket * 0.08 }}
          >
            <b>
              {f.runs}-{f.wicket}
            </b>
            <s>{f.player}</s>
            {f.over ? <em>{f.over} ov</em> : null}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
