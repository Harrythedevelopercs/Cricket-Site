import type { Metadata } from "next";

import { getMatchCard } from "../../lib/data/match";
import MatchCentreClient, { type MatchCard } from "./MatchCentreClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ matchId: string }> };

const parseId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// getMatchCard only calls CricClubs for a real match with no stored scorecard (the
// existing once-then-store rule), so metadata + page render stay on the DB path.
async function loadCard(raw: string): Promise<MatchCard | null> {
  const id = parseId(raw);
  if (id === null) return null;
  try {
    return (await getMatchCard(id)) as MatchCard;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { matchId } = await params;
  const m = await loadCard(matchId);
  if (!m || !m.found) return { title: "Match Centre" };
  const title = `${m.teamOne} vs ${m.teamTwo}`;
  const description =
    [m.result, m.seriesName, m.date].filter(Boolean).join(" · ") ||
    "Full match scorecard from Club Cricket of Chicago.";
  return {
    title,
    description,
    openGraph: { title: `${title} | Club Cricket of Chicago`, description },
  };
}

export default async function MatchPage({ params }: Props) {
  const { matchId } = await params;
  const initialMatch = await loadCard(matchId);
  return <MatchCentreClient matchId={matchId} initialMatch={initialMatch} />;
}
