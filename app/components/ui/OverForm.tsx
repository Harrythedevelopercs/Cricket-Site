"use client";

// Recent form as an over. Football uses squares; cricket counts in balls, so each
// completed result is a stitched leather ball bowled left to right, oldest first.
//
// The last ball is deliberately NOT the pulsing one. A pulsing red ball reads as
// "the loss you're heading into" — so the only element that pulses is a separate,
// hollow ball at the end representing the next scheduled fixture. It has no result
// yet, so it never carries a win or loss colour.
//
// Leather tones come from CSS custom properties (see globals.css) so they re-skin
// with the light/dark theme like every other surface.

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { FormLetter, NextFixture } from "../../lib/data/home";

const RESULT_LABEL: Record<FormLetter, string> = {
  W: "Won",
  L: "Lost",
  T: "Tied",
  N: "No result",
};

/** "2026-08-09" -> "Aug 9" (display only; the raw value is never shown). */
function shortDate(iso: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return "";
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
}

function Ball({ gradId }: { gradId: string }) {
  return (
    <svg viewBox="0 0 46 46" aria-hidden="true">
      <defs>
        <radialGradient id={gradId} cx="34%" cy="27%" r="74%">
          <stop offset="0%" stopColor="var(--leather-hi)" />
          <stop offset="58%" stopColor="var(--leather)" />
          <stop offset="100%" stopColor="var(--leather-lo)" />
        </radialGradient>
      </defs>
      <circle cx="23" cy="23" r="21" fill={`url(#${gradId})`} />
      {/* the two seam rows */}
      <path
        d="M10 9 A21 21 0 0 0 10 37"
        fill="none"
        stroke="#FBF7EF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2.1 3.3"
        opacity="0.92"
      />
      <path
        d="M36 9 A21 21 0 0 1 36 37"
        fill="none"
        stroke="#FBF7EF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2.1 3.3"
        opacity="0.92"
      />
      <ellipse
        cx="16" cy="13" rx="6.6" ry="4.2"
        fill="#fff" opacity="0.24"
        transform="rotate(-28 16 13)"
      />
      <circle cx="23" cy="23" r="21" fill="none" stroke="rgba(0,0,0,.3)" strokeWidth="1" />
    </svg>
  );
}

export default function OverForm({
  form,
  next,
}: {
  form: FormLetter[];
  next?: NextFixture | null;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  if (!form || form.length === 0) return null;

  const spoken = form.map((f) => RESULT_LABEL[f] ?? f).join(", ");
  const nextSpoken = next?.opponent
    ? `. Next: ${next.opponent}${next.date ? ` on ${shortDate(next.date)}` : ""}`
    : "";

  const drop = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 10, scale: 0.7 },
          whileInView: { opacity: 1, y: 0, scale: 1 },
          viewport: { once: true, amount: 0.6 },
          transition: {
            duration: 0.45,
            delay: i * 0.11,
            ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
          },
        };

  const size = "w-[6.4vw] h-[6.4vw] lg:w-[1.7vw] lg:h-[1.7vw]";
  const glyph = "text-[3vw] lg:text-[0.8vw]";

  return (
    <div
      className="flex items-center gap-[1.5vw] lg:gap-[0.36vw] mt-[3vw] lg:mt-[1vw]"
      aria-label={`Recent form: ${spoken}${nextSpoken}`}
    >
      <span className="roboto-condensed-bold text-[color:var(--text-dim)] uppercase tracking-wider text-[2.6vw] lg:text-[0.7vw] mr-[1vw] lg:mr-[0.3vw]">
        Form
      </span>

      {form.map((f, i) => (
        <motion.span
          key={i}
          {...drop(i)}
          title={RESULT_LABEL[f] ?? f}
          className={`ccc-ball ccc-ball--${f.toLowerCase()} ${size}`}
        >
          <Ball gradId={`ball-${uid}-${i}`} />
          <span className={`ccc-ball-lbl ${glyph}`}>{f}</span>
        </motion.span>
      ))}

      {next ? (
        <motion.span
          {...drop(form.length)}
          title={`Next: vs ${next.opponent}${next.date ? ` · ${shortDate(next.date)}` : ""}`}
          className={`ccc-ball ccc-ball--next ${size}`}
        >
          <svg viewBox="0 0 46 46" aria-hidden="true">
            <circle
              cx="23" cy="23" r="20"
              fill="none" stroke="var(--orange)" strokeWidth="2"
              strokeDasharray="4 4.6" opacity="0.9"
            />
          </svg>
          <span className={`ccc-ball-lbl ${glyph}`}>?</span>
        </motion.span>
      ) : null}
    </div>
  );
}
