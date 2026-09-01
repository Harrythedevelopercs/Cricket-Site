import { getTournamentList } from "../lib/data/tournaments";
import TournamentsClient from "./TournamentsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournaments",
  description:
    "Every Club Cricket of Chicago campaign in the Midwest Cricket Conference — and how each one went.",
};

export default async function TournamentsPage() {
  // First paint carries the trophy cabinet; on a DB hiccup the client falls
  // back to /api/tournaments?view=list.
  let initialEntries = null;
  try {
    const data = await getTournamentList();
    initialEntries = data.entries ?? [];
  } catch {
    initialEntries = null;
  }
  return <TournamentsClient initialEntries={initialEntries} />;
}
