// Upcoming CCC fixtures as an iCalendar feed, so members can subscribe from
// Apple/Google/Outlook calendars. Reads the same cached DB entries as /api/schedule.

import { getCalendarEntries } from "../../lib/data/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// "2026-07-19T13:30:00.000Z" -> "20260719T133000Z"
const icsUtc = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

export async function GET() {
  let entries: Record<string, unknown>[] = [];
  try {
    entries = (await getCalendarEntries()).entries as Record<string, unknown>[];
  } catch {
    entries = [];
  }

  const stamp = icsUtc(new Date().toISOString());
  const events = entries.flatMap((e) => {
    const date = typeof e.date === "string" ? e.date : "";
    if (!date) return [];
    const summary = esc(String(e.title || "CCC fixture"));
    const location = esc(String(e.groundsName || ""));
    const description = esc(String(e.division || ""));
    // Date-only fixtures are stored as midnight UTC (no Chicago match starts then);
    // emit those as all-day events instead of a bogus 00:00 start.
    const allDay = date.endsWith("T00:00:00.000Z");
    const start = allDay
      ? `DTSTART;VALUE=DATE:${date.slice(0, 10).replace(/-/g, "")}`
      : `DTSTART:${icsUtc(date)}`;
    return [
      [
        "BEGIN:VEVENT",
        `UID:ccc-fixture-${e.id}@clubcricketofchicago.com`,
        `DTSTAMP:${stamp}`,
        start,
        ...(allDay ? [] : ["DURATION:PT4H"]),
        `SUMMARY:${summary}`,
        ...(location ? [`LOCATION:${location}`] : []),
        ...(description ? [`DESCRIPTION:${description}`] : []),
        "END:VEVENT",
      ].join("\r\n"),
    ];
  });

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Club Cricket of Chicago//Fixtures//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Club Cricket of Chicago fixtures",
    "X-WR-TIMEZONE:America/Chicago",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ccc-fixtures.ics"',
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  });
}
