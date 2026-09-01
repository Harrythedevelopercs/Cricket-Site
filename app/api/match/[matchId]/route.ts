import { NextRequest, NextResponse } from "next/server";
import { getMatchCard } from "../../../lib/data/match";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const id = Number(matchId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }
  try {
    const data = await getMatchCard(id);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
