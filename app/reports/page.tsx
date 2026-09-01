import type { Metadata } from "next";

import { getMatchReports } from "../lib/data/matchReports";
import ReportsClient, { type MatchReport } from "./ReportsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Match Reports",
  description:
    "Result-by-result recaps of Club Cricket of Chicago's recent matches, generated from every scorecard.",
};

export default async function ReportsPage() {
  // First paint carries the reports; on a DB hiccup the client falls back to
  // /api/match-reports.
  let initialReports: MatchReport[] | null = null;
  try {
    initialReports = ((await getMatchReports(12)) ?? []) as unknown as MatchReport[];
  } catch {
    initialReports = null;
  }
  return <ReportsClient initialReports={initialReports} />;
}
