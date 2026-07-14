import { NextResponse } from "next/server";
import { getRecentResults } from "../../lib/data/recentResults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const raw = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isInteger(raw) ? Math.min(Math.max(raw, 1), 30) : 6;
    const results = await getRecentResults(limit);
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { results: [], error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
