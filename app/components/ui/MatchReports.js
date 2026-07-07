"use client";

import Link from "next/link";

// Compact home-page "Match Reports" section — the 3 most recent auto-generated
// reports (from /api/match-reports, passed in as props), each linking to its
// Match Centre, with a trailing link to the full /reports page.

// Stored match dates are strings like "06/28/2026" (or ISO). Parse to a UTC instant and
// format with timeZone "UTC" (same rule as HeroBanner's formatMatch) to avoid the
// off-by-one-day shift.
function formatReportDate(s) {
  if (!s) return "";
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const d = m
    ? new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])))
    : new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// First sentence of the generated recap (sentences are period-delimited).
function firstSentence(recap) {
  if (!recap) return "";
  const m = recap.match(/^[^.]*\./);
  return m ? m[0] : recap;
}

export default function MatchReports({ reports }) {
  if (!reports || reports.length === 0) return null;
  const latest = reports.slice(0, 3);

  return (
    <section className="base_paddings matchReports relative z-[8] py-[5%] lg:py-[3%]">
      <div className="max_content center_aligned mx-auto">
        <h2 className="text-center roboto-condensed-bold text-[color:var(--text)] uppercase text-[6vw] lg:text-[2.2vw] mb-[5%] lg:mb-[2.5%]">
          Match Reports
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[4vw] lg:gap-[1.5vw]">
          {latest.map((r) => {
            const tied = /\btie(d)?\b/i.test(r.result || "");
            return (
              <Link
                key={r.matchId}
                href={`/match/${r.matchId}`}
                className="ccc-card ccc-card-hover block rounded-[3vw] lg:rounded-[0.8vw] p-[4vw] lg:p-[1.4vw]"
              >
                <div className="flex justify-between items-center mb-[4%]">
                  <p className="roboto-condensed-regular text-[color:var(--orange)] text-[3vw] lg:text-[0.85vw] truncate pr-2">
                    {r.seriesName}
                  </p>
                  <span
                    className={`roboto-condensed-bold text-white rounded-full px-[3vw] lg:px-[0.8vw] py-[0.4vw] text-[2.6vw] lg:text-[0.75vw] ${
                      tied
                        ? "bg-[var(--text-dim)]"
                        : r.cccWon
                        ? "bg-[var(--win)]"
                        : "bg-[var(--loss)]"
                    }`}
                  >
                    {tied ? "TIE" : r.cccWon ? "WON" : "LOST"}
                  </span>
                </div>

                <h3 className="roboto-condensed-bold uppercase leading-tight text-[color:var(--text)] text-[4.2vw] lg:text-[1.1vw]">
                  {r.headline}
                </h3>

                <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.1vw] lg:text-[0.86vw] leading-relaxed mt-[2.5vw] lg:mt-[0.6vw]">
                  {firstSentence(r.recap)}
                </p>

                <div className="mt-[4%] pt-[3%] border-t border-[var(--panel-line)] flex items-center justify-between gap-2">
                  <span className="roboto-condensed-regular text-[color:var(--text-dim)] text-[2.8vw] lg:text-[0.78vw] truncate">
                    {formatReportDate(r.date)}
                  </span>
                  <span className="roboto-condensed-bold uppercase whitespace-nowrap text-[color:var(--orange)] text-[3vw] lg:text-[0.8vw]">
                    Match Centre &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-[6vw] lg:mt-[1.8vw]">
          <Link
            href="/reports"
            className="roboto-condensed-bold uppercase text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] transition-colors text-[3.6vw] lg:text-[0.95vw]"
          >
            All reports &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
