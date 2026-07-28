"use client";

// "8th" on its own says nothing — 8th of 9 and 8th of 20 are different seasons.
// The strip lays the whole division out left to right, first place to last, and
// marks where the club actually stands, so the gap left to climb is visible.
//
// Only position and division size are needed, which is all the home payload
// carries; it deliberately doesn't pretend to be the full table.

import { motion, useReducedMotion } from "framer-motion";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export default function LadderStrip({
  position,
  teams,
}: {
  position: number | null;
  teams: number;
}) {
  const reduce = useReducedMotion();
  if (!position || teams <= 1) return null;

  return (
    <div
      className="ccc-ladder"
      role="img"
      aria-label={`${ordinal(position)} of ${teams} in the division`}
    >
      {Array.from({ length: teams }, (_, i) => {
        const rank = i + 1;
        const isCCC = rank === position;
        return (
          <motion.span
            key={rank}
            className={`ccc-rung${isCCC ? " is-ccc" : ""}`}
            title={isCCC ? `Club Cricket of Chicago — ${ordinal(rank)}` : ordinal(rank)}
            initial={reduce ? false : { scaleY: 0, opacity: 0 }}
            whileInView={{ scaleY: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{
              duration: 0.4,
              // fills from last place up to first, so the club's rung lands late
              delay: reduce ? 0 : (teams - rank) * 0.045,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        );
      })}
    </div>
  );
}
