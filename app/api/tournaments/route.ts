import { NextRequest, NextResponse } from "next/server";
import { getTournamentEntries, getTournamentList } from "../../lib/data/tournaments";

// Serves tournament data from the DB in the same shape the CMS used, so the
// existing tournament page renders it unchanged.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view");
  const year = request.nextUrl.searchParams.get("year");
  try {
    // ?view=list -> cheap stubs (no per-series build); ?year=YYYY -> one season's full
    // details; no params -> all (backward compatible).
    const data =
      view === "list"
        ? await getTournamentList()
        : await getTournamentEntries(year ?? undefined);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { entries: [], error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
