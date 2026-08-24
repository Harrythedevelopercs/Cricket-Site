"use client";

// A wickets total that behaves like a wicket. A ball arrives, strikes, and the
// bails leave — the sport's single most recognisable image, spent on the one
// number that earns it.
//
// Every beat hangs off one impact moment (IMPACT_S) so cause and effect line up:
// the ball lands, then the timber shudders, the bails go, dust kicks, and the
// count starts rolling. The bails use two nested transforms — X travels linear
// while Y rises and falls — so they trace a real parabola instead of sliding in
// a straight line, with the timber spinning independently inside that.
//
// Under prefers-reduced-motion nothing is armed: the stumps stand, the bails
// stay on, and the number is simply placed.

import { useEffect, useId, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import ScoreReel from "./ScoreReel";

/** Seconds from the start of the sequence to the ball striking. */
export const IMPACT_S = 0.6;

export default function StumpsCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  // Fire the sequence even if it never scrolls into view (same settle window
  // as ScoreReel), so the wicket count doesn't rest at zero off-screen.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 4000);
    return () => clearTimeout(t);
  }, []);
  const play = (inView || settled) && !reduce;
  const uid = useId().replace(/:/g, "");

  return (
    <span ref={ref} className={`ccc-stumps${play ? " play" : ""}`}>
      <span className="ccc-stumps-art">
        {/* cropped to the timber so the art fills its box; the ball starts
            outside this window and flies in (overflow is visible) */}
        <svg viewBox="34 26 122 158" aria-hidden="true">
          <defs>
            {/* Timber tones come from CSS vars so they can flip with the theme —
                the dark-mode cream is nearly invisible on a white panel. */}
            <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--timber-hi)" />
              <stop offset="40%" stopColor="var(--timber)" />
              <stop offset="100%" stopColor="var(--timber-lo)" />
            </linearGradient>
            <linearGradient id={`bail-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--orange-bright)" />
              <stop offset="100%" stopColor="var(--orange-deep)" />
            </linearGradient>
            <radialGradient id={`ball-${uid}`} cx="34%" cy="28%" r="74%">
              <stop offset="0%" stopColor="#E8695E" />
              <stop offset="58%" stopColor="#B43024" />
              <stop offset="100%" stopColor="#6B160F" />
            </radialGradient>
          </defs>

          <ellipse cx="95" cy="174" rx="66" ry="5" fill="var(--panel-line-strong)" />

          <rect className="ccc-stump ccc-stump-1" x="54.5" y="52" width="11" height="120" rx="5.5" fill={`url(#wood-${uid})`} />
          <rect className="ccc-stump ccc-stump-2" x="89.5" y="52" width="11" height="120" rx="5.5" fill={`url(#wood-${uid})`} />
          <rect className="ccc-stump ccc-stump-3" x="124.5" y="52" width="11" height="120" rx="5.5" fill={`url(#wood-${uid})`} />

          {/* bails fly backward, along the line the ball was travelling */}
          <g className="ccc-bail-x" style={{ ["--bx" as string]: "-64px" }}>
            <g className="ccc-bail-y" style={{ ["--by" as string]: "-72px" }}>
              <g className="ccc-bail" style={{ ["--br" as string]: "-560deg" }}>
                <rect x="52" y="44" width="46" height="8" rx="4" fill={`url(#bail-${uid})`} />
                <circle cx="55" cy="48" r="3.4" fill="var(--orange-deep)" />
                <circle cx="95" cy="48" r="3.4" fill="var(--orange-deep)" />
              </g>
            </g>
          </g>
          <g className="ccc-bail-x" style={{ ["--bx" as string]: "-34px" }}>
            <g className="ccc-bail-y" style={{ ["--by" as string]: "-58px" }}>
              <g className="ccc-bail" style={{ ["--br" as string]: "-410deg" }}>
                <rect x="92" y="44" width="46" height="8" rx="4" fill={`url(#bail-${uid})`} />
                <circle cx="95" cy="48" r="3.4" fill="var(--orange-deep)" />
                <circle cx="135" cy="48" r="3.4" fill="var(--orange-deep)" />
              </g>
            </g>
          </g>

          <circle className="ccc-impact" cx="130" cy="60" r="13" fill="none" stroke="var(--orange-bright)" strokeWidth="2.5" />

          <g className="ccc-dust" style={{ ["--dx" as string]: "-16px", ["--dy" as string]: "-9px" }}>
            <circle cx="126" cy="62" r="3.4" fill="var(--dust)" />
          </g>
          <g className="ccc-dust" style={{ ["--dx" as string]: "12px", ["--dy" as string]: "-14px" }}>
            <circle cx="133" cy="58" r="2.6" fill="var(--dust)" />
          </g>
          <g className="ccc-dust" style={{ ["--dx" as string]: "-22px", ["--dy" as string]: "6px" }}>
            <circle cx="128" cy="66" r="2.2" fill="var(--dust)" />
          </g>

          <g className="ccc-cricball">
            <circle cx="130" cy="60" r="9.5" fill={`url(#ball-${uid})`} />
            <path d="M124 53.4 A9.5 9.5 0 0 0 124 66.6" fill="none" stroke="#FBF7EF" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1.6 2.4" />
            <path d="M136 53.4 A9.5 9.5 0 0 1 136 66.6" fill="none" stroke="#FBF7EF" strokeWidth="1.1" strokeLinecap="round" strokeDasharray="1.6 2.4" />
          </g>
        </svg>
      </span>

      <span className="ccc-stumps-fig">
        <ScoreReel value={value} delay={reduce ? 0 : IMPACT_S} duration={1.5} />
      </span>
    </span>
  );
}
