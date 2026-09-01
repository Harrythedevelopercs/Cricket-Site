import { NextRequest, NextResponse } from "next/server";
import { getPlayerProfile } from "../../../lib/data/player";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  const id = Number(playerId);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid playerId" }, { status: 400 });
  }
  try {
    const data = await getPlayerProfile(id);
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
