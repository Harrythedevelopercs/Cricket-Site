"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import ChicagoSkyline from "./ChicagoSkyline";
import ChicagoStar from "./ChicagoStar";

const number = new Intl.NumberFormat("en-US");

// The home page's long-view counterpoint to the current-season hub. This is a
// deliberately singular band rather than three generic stat cards: one timeline,
// one club story, and three live totals that grow with every match.
function AnimatedTotal({ value, reduce }) {
  const totalRef = useRef(null);
  const isInView = useInView(totalRef, { once: true, amount: 0.75 });
  const count = useMotionValue(reduce ? value : 0);
  const formattedCount = useTransform(count, (latest) =>
    number.format(Math.round(latest)),
  );

  useEffect(() => {
    if (reduce) {
      count.jump(value);
      return undefined;
    }

    if (!isInView) return undefined;

    const controls = animate(count, value, {
      duration: 1.25,
      ease: [0.16, 1, 0.3, 1],
    });

    return () => controls.stop();
  }, [count, isInView, reduce, value]);

  return (
    <dd ref={totalRef} className="ds-num">
      <motion.span aria-hidden="true">{formattedCount}</motion.span>
      <span className="sr-only">{number.format(value)}</span>
    </dd>
  );
}

export default function RecordsStrip({ history }) {
  const reduce = useReducedMotion();
  if (!history) return null;

  const stats = [
    { number: "01", label: "Matches played", value: history.matches },
    { number: "02", label: "Runs scored", value: history.runs },
    { number: "03", label: "Wickets taken", value: history.wickets },
  ];

  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <motion.section
      className="ccc-legacy base_paddings"
      aria-labelledby="club-legacy-title"
      {...reveal}
    >
      <div className="max_content center_aligned">
        <div className="ccc-legacy-panel">
          <span className="ccc-legacy-ghost" aria-hidden="true">CCC</span>
          <div className="ccc-legacy-content">
            <div className="ccc-legacy-story">
              <p className="ds-eyebrow ds-eyebrow--orange flex items-center gap-2">
                <ChicagoStar size="0.8em" /> The club legacy
              </p>
              <h2 id="club-legacy-title" className="ds-display ccc-legacy-title">
                Every innings<br />adds to the <span>story.</span>
              </h2>
              <p className="ccc-legacy-copy">
                Season after season since {history.since}, every innings adds another
                line to our Chicago story.
              </p>
              <Link href="/records" className="ccc-btn ccc-btn-primary ccc-legacy-link">
                Open the record books <span className="ccc-btn-arrow">→</span>
              </Link>
            </div>

            <dl className="ccc-legacy-stats" aria-label={`Club totals since ${history.since}`}>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="ccc-legacy-stat"
                  initial={reduce ? false : { opacity: 0, x: 22 }}
                  whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{
                    duration: 0.6,
                    delay: reduce ? 0 : 0.18 + index * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <dt>
                    <span className="ccc-legacy-index" aria-hidden="true">{stat.number}</span>
                    {stat.label}
                  </dt>
                  <AnimatedTotal value={stat.value} reduce={reduce} />
                  <dd className="ccc-legacy-meta">All competitions</dd>
                </motion.div>
              ))}
            </dl>
          </div>

          <div className="ccc-legacy-timeline" aria-hidden="true">
            <span>{history.since}</span>
            <motion.i
              initial={reduce ? false : { scaleX: 0 }}
              whileInView={reduce ? undefined : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{
                duration: 1.1,
                delay: 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
            <span>Today</span>
          </div>
          <ChicagoSkyline className="ccc-legacy-skyline" />
        </div>
      </div>
    </motion.section>
  );
}
