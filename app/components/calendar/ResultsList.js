"use client";

// Recent CCC results as a schedule tab — same card language as FixturesList,
// each row linking to its Match Centre scorecard.

import Image from "next/image";
import Link from "next/link";
import { Skel } from "../skeletons/PageSkeletons";

// Raw stored dates are CricClubs "MM/DD/YYYY"; format via UTC so the shown day
// never shifts by one (same rule as FixturesList).
function formatDate(raw) {
  const m = (raw || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { weekday: "", day: raw || "" };
  const d = new Date(Date.UTC(+m[3], +m[1] - 1, +m[2]));
  return {
    weekday: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
  };
}

function ResultRow({ r }) {
  const fmt = formatDate(r.date);
  return (
    <li>
      <Link
        href={`/match/${r.id}`}
        className="group flex flex-wrap items-center gap-x-[4vw] gap-y-[2.5vw] px-[4vw] py-[4.5vw] transition-colors hover:bg-[var(--panel-2)] lg:gap-x-[1.4vw] lg:gap-y-3 lg:px-[1.6vw] lg:py-[1.15vw]"
      >
        {/* Won/lost marker */}
        <span
          aria-label={r.cccWon ? "Won" : "Lost"}
          className="roboto-condensed-bold flex h-[8vw] w-[8vw] shrink-0 items-center justify-center rounded-full text-[3.4vw] text-[#0b1220] lg:h-[2vw] lg:w-[2vw] lg:text-[0.85vw]"
          style={{ background: r.cccWon ? "var(--win)" : "var(--loss)" }}
        >
          {r.cccWon ? "W" : "L"}
        </span>

        {/* Date */}
        <div className="w-[17vw] shrink-0 lg:w-[4.6vw]">
          <p className="ds-eyebrow text-dim">{fmt.weekday}</p>
          <p className="roboto-condensed-bold text-[3.4vw] leading-tight lg:text-[0.95vw]">{fmt.day}</p>
        </div>

        {/* Opponent + result line */}
        <div className="flex min-w-[46vw] flex-1 items-center gap-[3vw] lg:min-w-0 lg:gap-[0.9vw]">
          <div className="relative h-[11vw] w-[11vw] shrink-0 overflow-hidden rounded-full border border-[var(--panel-line)] bg-[var(--panel-2)] lg:h-[3.1vw] lg:w-[3.1vw]">
            <Image
              src={r.opponentLogo || "/images/placeholder_logo.png"}
              alt=""
              fill
              sizes="48px"
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="roboto-condensed-bold p4 truncate leading-tight">
              <span className="text-dim font-normal">vs&nbsp;</span>
              {r.opponentName}
            </p>
            <p className="text-muted p6 mt-1 truncate">{r.result || r.seriesName}</p>
          </div>
        </div>

        {/* Scores */}
        <div className="ml-auto shrink-0 text-right">
          <p className="ds-num text-[4.2vw] leading-none text-[color:var(--text)] lg:text-[1.15vw]">
            {r.cccScore || "—"}
          </p>
          <p className="roboto-condensed-regular mt-1 text-[2.8vw] text-[color:var(--text-dim)] lg:text-[0.75vw]">
            them {r.oppScore || "—"}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="shrink-0 text-[color:var(--orange)] transition-transform group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    </li>
  );
}

export default function ResultsList({ results, loading }) {
  return (
    <section className="base_paddings">
      <div className="max_content center_aligned">
        {loading ? (
          <div className="flex flex-col gap-[3vw] lg:gap-[0.9vw]">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skel key={i} className="h-[22vw] w-full lg:h-[5.4vw]" />
            ))}
          </div>
        ) : !results || results.length === 0 ? (
          <div className="ccc-card px-[6vw] py-[10vw] text-center lg:px-[3vw] lg:py-[4vw]">
            <p className="ds-eyebrow ds-eyebrow--orange">Results</p>
            <p className="ds-display mt-[3vw] text-[8vw] leading-none lg:mt-[0.8vw] lg:text-[2.1vw]">
              No completed matches yet
            </p>
            <p className="text-muted p5 mx-auto mt-[3vw] max-w-[46ch] lg:mt-[0.8vw]">
              Results appear here as soon as scorecards are finalized after each match.
            </p>
          </div>
        ) : (
          <ul className="ccc-card list-none divide-y divide-[color:var(--panel-line)] overflow-hidden">
            {results.map((r) => (
              <ResultRow key={r.id} r={r} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
