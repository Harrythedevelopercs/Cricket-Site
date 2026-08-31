"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import UpcomingMatchPanel from "../components/calendar/UpcomingMatchPanel";
import DateCalendar from "../components/calendar/DateCalendar";
import FixturesList, { isUpcomingEntry } from "../components/calendar/FixturesList";
import ResultsList from "../components/calendar/ResultsList";
import RecentResults from "../components/ui/RecentResults";
import SectionTitleEle from "../components/ui/SectionTitleEle";
import { ScheduleSkeleton } from "../components/skeletons/PageSkeletons";
import { usePageTitle } from "../lib/usePageTitle";
// Calendar data now comes from the local DB (Neon) via /api/schedule (CCC's fixtures),
// shaped like the old CMS fixture payload.

const VIEWS = [
  { id: "list", label: "List" },
  { id: "calendar", label: "Calendar" },
  { id: "results", label: "Results" },
];

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// A division's current table line, same visual language as the home season hub.
function DivisionSnapshotCard({ d }) {
  return (
    <Link href={`/tournaments/${d.year}/${d.slug}`} className="no_underline block group">
      <div className="ccc-card ccc-card-hover rounded-[3vw] lg:rounded-[0.7vw] p-[4.5vw] lg:p-[1.3vw] h-full">
        <p className="roboto-condensed-bold text-[color:var(--text)] uppercase text-[3.9vw] lg:text-[1vw] leading-tight">
          {d.name}
        </p>
        <div className="flex items-end gap-[2vw] lg:gap-[0.5vw] mt-[3vw] lg:mt-[0.9vw]">
          {/* Raw standings, always — even a 10th of 10 is shown as-is. */}
          <span className="ds-num text-[color:var(--orange)] text-[10vw] lg:text-[2.6vw] leading-none">
            {d.position ? ordinal(d.position) : "—"}
          </span>
          <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw] mb-[1vw] lg:mb-[0.25vw]">
            {d.position ? `of ${d.teams}` : "table pending"}
          </span>
        </div>
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.85vw] mt-[2.5vw] lg:mt-[0.7vw]">
          W {d.won} · L {d.lost}
          <span className="text-[color:var(--text-dim)]"> · {d.points} pts</span>
        </p>
      </div>
    </Link>
  );
}

export default function Page() {
  usePageTitle("Schedule");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState(null);
  // The fixtures LIST is the primary view; the month calendar is one tap away.
  const [view, setView] = useState("list");
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(false);
  const [divisions, setDivisions] = useState(null);

  // Results load lazily, the first time that tab is opened. A failed read is
  // { results: [], error } with a 500 — flagged as an error, or ResultsList
  // would show its honest-looking "No completed matches yet" over an outage.
  const loadResults = () => {
    setResultsLoading(true);
    fetch("/api/recent-results?limit=20")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || data?.error) throw new Error(data?.error || `Results request failed: ${r.status}`);
        setResults(data.results || []);
        setResultsError(false);
      })
      .catch(() => {
        setResults([]);
        setResultsError(true);
      })
      .finally(() => setResultsLoading(false));
  };

  useEffect(() => {
    if (view !== "results" || results !== null) return;
    loadResults();
     
  }, [view, results]);

  useEffect(() => {
    fetch("/api/schedule")
      .then(async (r) => {
        const data = await r.json();
        // A failed read comes back as { entries: [], error } with a 500 — without
        // this check it renders as a false "no upcoming fixtures" (the classic
        // Neon cold-start moment) instead of an honest error.
        if (!r.ok || data?.error) throw new Error(data?.error || `Schedule request failed: ${r.status}`);
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data from Calendar API:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Upcoming fixtures only, earliest first. isUpcomingEntry is UTC-safe: date-only
  // fixtures (midnight UTC) stay listed through their match day instead of vanishing
  // the evening before (the local-timezone off-by-one).
  const upcomingEntries = useMemo(() => {
    if (!matches?.entries) return [];
    return matches.entries
      .filter((entry) => isUpcomingEntry(entry))
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [matches]);

  // Season's-end backfill: with two or fewer fixtures left the list can't carry the
  // page, so it fills out with where the season stands and how it's been going.
  const fewFixtures = !loading && !error && upcomingEntries.length <= 2;
  useEffect(() => {
    if (!fewFixtures) return;
    if (results === null && !resultsLoading) {
      loadResults();
    }
    if (divisions === null) {
      // The backfill is bonus content — on failure it stays absent rather than
      // rendering around missing data ({ error } carries no divisions key).
      fetch("/api/home")
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok || data?.error) throw new Error(data?.error || `Home request failed: ${r.status}`);
          setDivisions(data.divisions || []);
        })
        .catch(() => setDivisions([]));
    }
     
  }, [fewFixtures, results, resultsLoading, divisions]);

  if (loading) {
    return <ScheduleSkeleton />;
  }

  if (error) {
    return (
      <div className="base_paddings py-20 pt-32 lg:pt-40 text-[color:var(--text)]">
        <div className="max_content center_aligned">
          <div className="ccc-card mx-auto max-w-2xl px-6 py-14 text-center">
            <p className="ds-eyebrow ds-eyebrow--orange">Schedule</p>
            <p className="ds-display mt-3 text-4xl">The calendar didn&rsquo;t load</p>
            <p className="mt-3 text-[color:var(--text-muted)]">
              Usually a slow wake-up, not an outage — give it a moment and try again.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary mt-6">
              Reload the schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // No forced height: the old `min-h-screen` + `aspect-[16/9]` padded the page out
    // to a full viewport and exposed a big empty band below the short calendar.
    // With no upcoming fixtures the tabs stay usable (offseason = Results season);
    // FixturesList renders the honest empty state for the list view.
    <div className="py-20 text-[color:var(--text)]">
      {/* Next Match card + countdown — unchanged */}
      {upcomingEntries.length > 0 ? <UpcomingMatchPanel match={upcomingEntries[0]} /> : null}

      {/* Fixtures header + List/Calendar switch */}
      <section className="base_paddings">
        <div className="max_content center_aligned">
          <div className="flex flex-wrap items-center justify-between gap-[4vw] lg:gap-[1vw] mb-[5vw] lg:mb-[1.6vw]">
            <SectionTitleEle>Fixtures</SectionTitleEle>

            <a
              href="/api/calendar"
              className="order-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--panel-line-strong)] px-[4.5vw] py-[1.8vw] text-[3vw] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)] transition-colors hover:border-[var(--orange)] hover:text-[color:var(--orange)] lg:order-none lg:px-[1.2vw] lg:py-[0.5vw] lg:text-[0.75rem]"
            >
              <span aria-hidden="true">📅</span> Add to calendar (.ics)
            </a>

            <div
              role="tablist"
              aria-label="Fixtures view"
              className="inline-flex items-center gap-1 rounded-full border border-[color:var(--panel-line-strong)] p-1"
            >
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  type="button"
                  id={`fixtures-tab-${v.id}`}
                  aria-selected={view === v.id}
                  aria-controls={`fixtures-panel-${v.id}`}
                  onClick={() => setView(v.id)}
                  className={`rounded-full px-[4.5vw] py-[1.8vw] text-[3vw] font-semibold uppercase tracking-[0.14em] transition-colors lg:px-[1.2vw] lg:py-[0.45vw] lg:text-[0.75rem] ${
                    view === v.id
                      ? "bg-[color:var(--panel-2)] text-[color:var(--orange)]"
                      : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {view === "list" ? (
        <div role="tabpanel" id="fixtures-panel-list" aria-labelledby="fixtures-tab-list">
          <FixturesList entries={upcomingEntries} />

          {fewFixtures && divisions?.length > 0 && (
            <section className="base_paddings mt-[10vw] lg:mt-[3vw]">
              <div className="max_content center_aligned">
                <SectionTitleEle>Where the season stands</SectionTitleEle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[4vw] lg:gap-[1.2vw]">
                  {divisions.map((d) => (
                    <DivisionSnapshotCard key={d.slug} d={d} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {fewFixtures && !resultsError && <RecentResults results={(results || []).slice(0, 6)} />}
        </div>
      ) : view === "calendar" ? (
        <div role="tabpanel" id="fixtures-panel-calendar" aria-labelledby="fixtures-tab-calendar">
          {/* DateCalendar keeps its original section markup + styles */}
          <DateCalendar matches={{ ...matches, entries: upcomingEntries }} />
        </div>
      ) : (
        <div role="tabpanel" id="fixtures-panel-results" aria-labelledby="fixtures-tab-results">
          {resultsError && !resultsLoading ? (
            <div className="base_paddings">
              <div className="max_content center_aligned">
                <div className="ccc-card mx-auto max-w-2xl px-6 py-12 text-center">
                  <p className="roboto-condensed-bold uppercase text-[color:var(--text)] text-[4.5vw] lg:text-[1.2vw]">
                    Results didn&rsquo;t load
                  </p>
                  <p className="roboto-condensed-regular mt-2 text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw]">
                    Usually a slow wake-up, not an outage.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setResults(null); setResultsError(false); }}
                    className="ccc-btn ccc-btn-primary mt-5"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ResultsList results={results} loading={resultsLoading} />
          )}
        </div>
      )}
    </div>
  );
}
