import { NextRequest, NextResponse } from "next/server";
import { getMatchReports } from "../../lib/data/matchReports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("limit");
  const parsed = Number(raw);
  const limit =
    raw && Number.isFinite(parsed)
      ? Math.min(Math.max(Math.trunc(parsed), 1), 20)
      : 6;
  try {
    const reports = await getMatchReports(limit);
    return NextResponse.json(
      { reports },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { reports: [], error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
