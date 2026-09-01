import { NextResponse } from "next/server";
import { getRecentResults } from "../../lib/data/recentResults";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const param = new URL(request.url).searchParams.get("limit");
    // Number(null) is 0, which would clamp to 1 — an absent param must mean the default.
    const raw = param === null ? NaN : Number(param);
    const limit = Number.isInteger(raw) ? Math.min(Math.max(raw, 1), 30) : 6;
    const results = await getRecentResults(limit);
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { results: [], error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
