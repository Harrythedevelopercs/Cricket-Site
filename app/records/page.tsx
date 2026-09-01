import type { Metadata } from "next";

import { getClubRecords } from "../lib/data/records";
import type { ClubRecords } from "../lib/data/records";
import RecordsClient from "./RecordsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Club Records",
  description:
    "All-time Club Cricket of Chicago leaders, season bests and career milestones — straight from the scorebook.",
};

export default async function RecordsPage() {
  // First paint carries the records; on a DB hiccup the client falls back to
  // /api/records.
  let initialRecords: ClubRecords | null = null;
  try {
    initialRecords = await getClubRecords();
  } catch {
    initialRecords = null;
  }
  return <RecordsClient initialRecords={initialRecords} />;
}
