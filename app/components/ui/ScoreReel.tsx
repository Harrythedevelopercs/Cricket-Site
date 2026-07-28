"use client";

// Scoreboard roll — the site's shared "big number" treatment. Digits roll into
// place the way a manual cricket scoreboard does, each one settling a beat after
// the one to its left. Rolls once, when it scrolls into view.
//
// Accessibility: the reels are aria-hidden and the wrapper carries the real value
// as its label, so a screen reader hears "13,942" and never the 0-9 strips.
// Under prefers-reduced-motion the digits are simply placed, with no travel.
//
// Raw CricClubs values are shown as-is (negative ranking points included) — the
// sign and any thousands separators render as static characters between reels.

import { useRef } from "react";
import { useInView, useReducedMotion } from "framer-motion";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const nf = new Intl.NumberFormat("en-US");

export default function ScoreReel({
  value,
  className = "",
  group = true,
  stagger = 0.075,
  duration = 1.35,
  delay = 0,
}: {
  value: number;
  className?: string;
  /** Thousands separators. Off for scores like "118" inside a scorecard. */
  group?: boolean;
  /** Seconds between adjacent digits starting their roll. */
  stagger?: number;
  /** Seconds for a single digit's roll. */
  duration?: number;
  /** Seconds before the first digit moves — lets a caller sync the roll to
      another beat, e.g. the moment a ball hits the stumps. */
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  const label = nf.format(value);
  const chars = (group ? label : String(value)).split("");
  const rolled = reduce || inView;
  let digitIndex = 0;

  return (
    <span ref={ref} className={`ccc-reel ${className}`} role="img" aria-label={label}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} className="ccc-reel-sep" aria-hidden="true">
              {ch}
            </span>
          );
        }
        const digitDelay = delay + digitIndex * stagger;
        digitIndex += 1;
        return (
          <span key={i} className="ccc-reel-slot" aria-hidden="true">
            {/* Invisible glyph sizes the slot, so the reel is exactly one digit
                wide in whatever font the caller is using. */}
            <span className="ccc-reel-ghost">0</span>
            <span
              className="ccc-reel-strip"
              style={{
                transform: `translateY(-${rolled ? Number(ch) : 0}em)`,
                transitionDuration: reduce ? "0s" : `${duration}s`,
                transitionDelay: reduce ? "0s" : `${digitDelay}s`,
              }}
            >
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
