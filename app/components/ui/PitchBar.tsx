"use client";

// The match result on a 22-yard strip. A chase is spatial — how much of the other
// side's ground you covered — and bars sized against the highest innings say that
// faster than two numbers side by side.
//
// Keeps the anchor links to each innings card that the plain summary grid had.

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export interface PitchInnings {
  teamName: string;
  total: number;
  wickets: number;
  overs: string;
}

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function PitchBar({ innings }: { innings: PitchInnings[] }) {
  const reduce = useReducedMotion();
  if (!innings || innings.length === 0) return null;

  const max = Math.max(1, ...innings.map((i) => i.total));

  return (
    <div className="ccc-pitch" aria-label="Innings totals">
      {/* the creases */}
      <span className="ccc-pitch-crease ccc-pitch-crease--l" aria-hidden="true" />
      <span className="ccc-pitch-crease ccc-pitch-crease--r" aria-hidden="true" />

      {innings.map((inn, i) => (
        <Link
          key={`${inn.teamName}-${i}`}
          href={`#innings-${i + 1}`}
          className="ccc-pitch-row"
        >
          <motion.span
            className="ccc-pitch-fill"
            aria-hidden="true"
            style={{
              background:
                i % 2
                  ? "linear-gradient(90deg, color-mix(in srgb, var(--orange) 30%, transparent), transparent)"
                  : "linear-gradient(90deg, color-mix(in srgb, var(--chart-2) 34%, transparent), transparent)",
            }}
            initial={reduce ? false : { width: 0 }}
            whileInView={{ width: `${(inn.total / max) * 100}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.5, delay: reduce ? 0 : i * 0.22, ease: EASE }}
          />
          <span className="ccc-pitch-team">{inn.teamName}</span>
          <span className="ccc-pitch-overs">{inn.overs} ov</span>
          <span className="ccc-pitch-score">
            {inn.total}
            <i>/{inn.wickets}</i>
          </span>
        </Link>
      ))}
    </div>
  );
}
