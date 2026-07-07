"use client";

import Image from "next/image";
import Link from "next/link";

// Format the stored match date (UTC, to avoid an off-by-one day shift).
// CricClubs matchDate is "MM/DD/YYYY" — parse via Date.UTC so browsers east of
// UTC don't render the previous day.
function formatResultDate(s) {
  if (!s) return "";
  const mdY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(s).trim());
  const d = mdY
    ? new Date(Date.UTC(Number(mdY[3]), Number(mdY[1]) - 1, Number(mdY[2])))
    : new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function RecentResults({ results }) {
  if (!results || results.length === 0) return null;

  return (
    <section className="base_paddings recentResults relative z-[8] py-[5%] lg:py-[3%]">
      <div className="max_content center_aligned mx-auto">
        <h2 className="text-center roboto-condensed-bold text-[color:var(--text)] uppercase text-[6vw] lg:text-[2.2vw] mb-[5%] lg:mb-[2.5%]">
          Recent Results
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[4vw] lg:gap-[1.5vw]">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/match/${r.id}`}
              className="ccc-card ccc-card-hover block rounded-[3vw] lg:rounded-[0.8vw] p-[4vw] lg:p-[1.4vw]"
            >
              <div className="flex justify-between items-center mb-[4%]">
                <p className="roboto-condensed-regular text-[color:var(--orange)] text-[3vw] lg:text-[0.85vw] truncate pr-2">
                  {r.seriesName}
                </p>
                <span
                  className={`roboto-condensed-bold text-white rounded-full px-[3vw] lg:px-[0.8vw] py-[0.4vw] text-[2.6vw] lg:text-[0.75vw] ${
                    /\btie(d)?\b/i.test(r.result || "")
                      ? "bg-[var(--text-dim)]"
                      : r.cccWon
                      ? "bg-[var(--win)]"
                      : "bg-[var(--loss)]"
                  }`}
                >
                  {/\btie(d)?\b/i.test(r.result || "") ? "TIE" : r.cccWon ? "WON" : "LOST"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[3%] w-[44%]">
                  <Image
                    src={r.cccLogo || "/images/placeholder_logo.png"}
                    alt="Club Cricket of Chicago"
                    width={44}
                    height={44}
                    className="rounded-full object-contain w-[10vw] h-[10vw] lg:w-[2.6vw] lg:h-[2.6vw]"
                    unoptimized
                  />
                  <div className="min-w-0">
                    <p className="roboto-condensed-bold text-[color:var(--text)] text-[3.4vw] lg:text-[0.95vw]">
                      CCC
                    </p>
                    <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw]">
                      {r.cccScore}
                    </p>
                  </div>
                </div>

                <p className="roboto-condensed-bold text-[color:var(--orange)] text-[3.4vw] lg:text-[1vw]">
                  vs
                </p>

                <div className="flex items-center gap-[3%] w-[44%] justify-end text-right">
                  <div className="min-w-0">
                    <p className="roboto-condensed-bold text-[color:var(--text)] text-[3.4vw] lg:text-[0.95vw] truncate">
                      {r.opponentName}
                    </p>
                    <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw]">
                      {r.oppScore}
                    </p>
                  </div>
                  <Image
                    src={r.opponentLogo || "/images/placeholder_logo.png"}
                    alt={r.opponentName}
                    width={44}
                    height={44}
                    className="rounded-full object-contain w-[10vw] h-[10vw] lg:w-[2.6vw] lg:h-[2.6vw]"
                    unoptimized
                  />
                </div>
              </div>

              <div className="mt-[4%] pt-[3%] border-t border-[var(--panel-line)] flex items-center justify-center gap-[2.5vw] lg:gap-[0.6vw] flex-wrap text-center">
                {r.date && formatResultDate(r.date) && (
                  <span className="roboto-condensed-med text-[color:var(--text)] text-[2.8vw] lg:text-[0.8vw]">
                    {formatResultDate(r.date)}
                  </span>
                )}
                {r.date && r.result && (
                  <span className="text-[color:var(--text-dim)] text-[2.6vw] lg:text-[0.7vw]">•</span>
                )}
                {r.result && (
                  <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[2.8vw] lg:text-[0.8vw]">
                    {r.result}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
