"use client";

// Career milestones as a journey past gates rather than a row of pills. The bar
// runs out to a player's career total, and each threshold it crosses lights and
// sparks — the way a ground applauds a fifty as it happens.
//
// One shared scale per discipline, so the gates line up as vertical columns down
// the group and two players' bars are directly comparable.
//
// The gates come from the same ladders records.ts uses to derive the entries
// (RUN_THRESHOLDS / WICKET_THRESHOLDS), so they can't drift apart.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import ScoreReel from "./ScoreReel";
import type { MilestoneEntry } from "../../lib/data/records";

const FALLBACK_PIC = "/images/sample_player_image.png";
const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const DUR_S = 1.9;
const SPARKS = 5;

/* When does a cubic-bezier(.16,1,.3,1) bar reach `frac` of its travel? No closed
   form, so this is the standard cheap inverse — close enough that the spark reads
   as synced to the crossing, which is all it needs to do. */
const crossingAt = (frac: number) => 1 - Math.pow(1 - Math.min(1, frac), 1 / 3);

function GateRow({
  entry,
  gates,
  scaleMax,
  unit,
  index,
}: {
  entry: MilestoneEntry;
  gates: number[];
  scaleMax: number;
  unit: string;
  index: number;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [lit, setLit] = useState<number[]>([]);

  const pct = (entry.total / scaleMax) * 100;
  const crossed = gates.filter((g) => entry.total >= g);
  const rowDelay = index * 0.12;

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      setLit(crossed);
      return undefined;
    }
    const timers = crossed.map((g) =>
      setTimeout(
        () => setLit((prev) => (prev.includes(g) ? prev : [...prev, g])),
        (rowDelay + crossingAt((g / scaleMax) * 100 / pct) * DUR_S) * 1000
      )
    );
    return () => timers.forEach(clearTimeout);
    // `crossed` is derived from props that don't change for a mounted row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce]);

  return (
    <li ref={ref} className="ccc-gate-row">
      <Link href={`/players/${entry.playerId}`} className="ccc-gate-head">
        <span className="ccc-gate-pic">
          <Image src={entry.pic || FALLBACK_PIC} alt={entry.name} fill sizes="40px" className="object-cover" unoptimized />
        </span>
        <span className="ccc-gate-name">{entry.name}</span>
        <span className="ccc-gate-total">
          <ScoreReel value={entry.total} delay={reduce ? 0 : rowDelay} duration={DUR_S} />
          <i>{unit}</i>
        </span>
      </Link>

      <div className="ccc-gate-track">
        <motion.span
          className="ccc-gate-bar"
          initial={reduce ? false : { width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: DUR_S, delay: reduce ? 0 : rowDelay, ease: EASE }}
        />
        {gates.map((g) => {
          const on = lit.includes(g);
          const at = (g / scaleMax) * 100;
          // A gate close to the end has no room for its label on the right, and
          // the track clips overflow — so flip it inside.
          const nearEnd = at > 82;
          return (
            <span
              key={g}
              className={`ccc-gate${on ? " hit" : ""}${nearEnd ? " ccc-gate--end" : ""}`}
              style={{ left: `${at}%` }}
            >
              <i>{g.toLocaleString()}</i>
              {on
                ? Array.from({ length: SPARKS }, (_, s) => (
                    <b
                      key={s}
                      className="ccc-gate-spark"
                      style={{
                        ["--dx" as string]: `${Math.cos((-40 - s * 26) * (Math.PI / 180)) * (14 + s * 4)}px`,
                        ["--dy" as string]: `${Math.sin((-40 - s * 26) * (Math.PI / 180)) * (14 + s * 4)}px`,
                        animationDelay: `${s * 0.03}s`,
                      }}
                    />
                  ))
                : null}
            </span>
          );
        })}
      </div>
    </li>
  );
}

export default function MilestoneGates({
  entries,
  gates,
  unit,
  title,
}: {
  entries: MilestoneEntry[];
  gates: number[];
  unit: string;
  title: string;
}) {
  if (entries.length === 0) return null;

  // Shared scale: far enough past the biggest total that the leader's bar stops
  // short of the end, and never below the top gate so the ladder stays visible.
  const scaleMax = Math.max(gates[0], ...entries.map((e) => e.total)) * 1.06;
  const ladder = [...gates].sort((a, b) => a - b);

  return (
    <div className="ccc-gate-group">
      <p className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[3.2vw] lg:text-[0.9vw] mb-[3vw] lg:mb-[1vw]">
        {title}
      </p>
      <ul className="ccc-gate-list">
        {entries.map((e, i) => (
          <GateRow
            key={`${e.kind}-${e.playerId}`}
            entry={e}
            gates={ladder}
            scaleMax={scaleMax}
            unit={unit}
            index={i}
          />
        ))}
      </ul>
    </div>
  );
}
