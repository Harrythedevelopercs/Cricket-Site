"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import UpcomingMatchPanel from "../components/calendar/UpcomingMatchPanel";
import DateCalendar from "../components/calendar/DateCalendar";
import FixturesList, { isUpcomingEntry } from "../components/calendar/FixturesList";
import SectionTitleEle from "../components/ui/SectionTitleEle";
import { ScheduleSkeleton } from "../components/skeletons/PageSkeletons";
import { usePageTitle } from "../lib/usePageTitle";
// Calendar data now comes from the local DB (Neon) via /api/schedule (CCC's fixtures),
// shaped like the old CMS fixture payload.

const VIEWS = [
  { id: "list", label: "List" },
  { id: "calendar", label: "Calendar" },
];

export default function Page() {
  usePageTitle("Schedule");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState(null);
  // The fixtures LIST is the primary view; the month calendar is one tap away.
  const [view, setView] = useState("list");

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((data) => {
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

  if (loading) {
    return <ScheduleSkeleton />;
  }

  if (error) {
    return <div className="error-message">Error loading calendar content: {error}</div>;
  }

  if (upcomingEntries.length === 0) {
    // FixturesList renders the honest empty state (styled, on-theme).
    return (
      <div className="py-20 text-[color:var(--text)]">
        <FixturesList entries={[]} />
      </div>
    );
  }

  return (
    // No forced height: the old `min-h-screen` + `aspect-[16/9]` padded the page out
    // to a full viewport and exposed a big empty band below the short calendar.
    <div className="py-20 text-[color:var(--text)]">
      {/* Next Match card + countdown — unchanged */}
      <UpcomingMatchPanel match={upcomingEntries[0]} />

      {/* Fixtures header + List/Calendar switch */}
      <section className="base_paddings">
        <div className="max_content center_aligned">
          <div className="flex flex-wrap items-center justify-between gap-[4vw] lg:gap-[1vw] mb-[5vw] lg:mb-[1.6vw]">
            <SectionTitleEle>Fixtures</SectionTitleEle>

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
        </div>
      ) : (
        <div role="tabpanel" id="fixtures-panel-calendar" aria-labelledby="fixtures-tab-calendar">
          {/* DateCalendar keeps its original section markup + styles */}
          <DateCalendar matches={{ ...matches, entries: upcomingEntries }} />
        </div>
      )}
    </div>
  );
}
