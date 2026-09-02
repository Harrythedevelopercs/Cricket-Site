import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getFixtureEntries, getTournamentEntries } from "../../../lib/data/tournaments";
import { compactSeriesName } from "../../../lib/seriesName";
import TournamentDetailClient from "./TournamentDetailClient";

// Server-first, like the other DB-backed pages: first paint carries the
// tournament, and the client component fetches /api/tournaments only when this
// pass failed. Every tournament is its own URL, so the prev/next arrows and the
// tab strip in the stats section are plain links that swap the whole page.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ year: string; slug: string }> };
type Entry = Record<string, unknown>;

const isTournamentOf = (year: string) => (e: Entry) =>
  e.typeHandle === "tournamentPage" && (e.parent as Entry | undefined)?.slug === year;

// One season's tournament pages. Null means the DB didn't answer — never to be
// conflated with "this year has no tournaments", which is a real 404.
async function loadSeason(year: string): Promise<Entry[] | null> {
  try {
    const { entries } = await getTournamentEntries(year);
    return entries.filter(isTournamentOf(year));
  } catch {
    return null;
  }
}

async function loadFixtures(slug: string): Promise<Entry[] | null> {
  try {
    const { entries } = await getFixtureEntries(slug);
    return entries.filter((e) => Array.isArray(e.mappedSeries) && e.mappedSeries.length > 0);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, slug } = await params;
  const season = await loadSeason(year);
  const tournament = season?.find((e) => e.slug === slug);
  if (!tournament) return { title: "Tournament" };
  const name = String(tournament.title ?? "");
  return {
    title: `${compactSeriesName(name)} ${year}`,
    description: `Standings, results and Club Cricket of Chicago player stats from the ${name}.`,
  };
}

export default async function TournamentPage({ params }: Props) {
  const { year, slug } = await params;
  const [season, fixtures] = await Promise.all([loadSeason(year), loadFixtures(slug)]);

  if (season === null) {
    // DB hiccup: hand the client nothing and let it fetch (and show the retry
    // card if that fails too).
    return <TournamentDetailClient year={year} slug={slug} initial={null} />;
  }
  const tournament = season.find((e) => e.slug === slug);
  if (!tournament) notFound();

  return (
    <TournamentDetailClient
      year={year}
      slug={slug}
      initial={{
        tournament,
        // Only what the tab strip needs — not three full stat payloads.
        siblings: season.map((e) => ({ slug: String(e.slug), title: String(e.title ?? "") })),
        fixtures,
      }}
    />
  );
}
