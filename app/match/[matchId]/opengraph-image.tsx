// Social-share card for a match: both teams, scores, and the result.
// Served from the DB-backed match reader — no CricClubs calls beyond the
// existing once-then-store rule.

import { ImageResponse } from "next/og";
import { getMatchCard } from "../../lib/data/match";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Match scorecard summary";

const INK = "#0E1320";
const PANEL = "#162033";
const LINE = "rgba(176, 192, 222, 0.2)";
const TEXT = "#F4F0E8";
const MUTED = "#AAB3C5";
const ORANGE = "#F47A2A";
const WIN = "#57C18C";

interface InningsLite {
  teamName: string;
  total: number;
  wickets: number;
  overs: string;
}

function scoreFor(teamName: string, innings: InningsLite[]) {
  const inn = innings.find((i) => i.teamName === teamName);
  return inn ? `${inn.total}/${inn.wickets} (${inn.overs})` : "";
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const id = Number(matchId);
  const m =
    Number.isInteger(id) && id > 0
      ? await getMatchCard(id).catch(() => null)
      : null;

  const teamBlock = (name: string, score: string) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: 380,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          fontSize: 36,
          fontWeight: 700,
          color: TEXT,
          textAlign: "center",
          textTransform: "uppercase",
          lineHeight: 1.15,
        }}
      >
        {name}
      </div>
      {score ? (
        <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: ORANGE }}>{score}</div>
      ) : null}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: INK,
          padding: 56,
        }}
      >
        <div style={{ display: "flex", height: 10, width: 220, backgroundColor: ORANGE, borderRadius: 6 }} />
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: PANEL,
            border: `2px solid ${LINE}`,
            borderRadius: 28,
            marginTop: 36,
            padding: 48,
            gap: 30,
          }}
        >
          {m && m.found ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                gap: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                  fontSize: 24,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: ORANGE,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {m.seriesName || "Match Centre"}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  width: "100%",
                  gap: 28,
                }}
              >
                {teamBlock(m.teamOne, scoreFor(m.teamOne, m.innings))}
                <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: MUTED, marginTop: 6 }}>vs</div>
                {teamBlock(m.teamTwo, scoreFor(m.teamTwo, m.innings))}
              </div>
              {m.result ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    fontSize: 30,
                    fontWeight: 700,
                    color: WIN,
                    textAlign: "center",
                  }}
                >
                  {m.result}
                </div>
              ) : null}
              {m.date || m.location ? (
                <div style={{ display: "flex", justifyContent: "center", width: "100%", fontSize: 22, color: MUTED }}>
                  {[m.date, m.location].filter(Boolean).join(" · ")}
                </div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 54, fontWeight: 800, color: TEXT, textTransform: "uppercase" }}>
              Match Centre
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 32,
            fontSize: 26,
            color: MUTED,
          }}
        >
          <div style={{ display: "flex", fontWeight: 700, color: TEXT }}>Club Cricket of Chicago</div>
          <div style={{ display: "flex" }}>clubcricketofchicago.com</div>
        </div>
      </div>
    ),
    size
  );
}
