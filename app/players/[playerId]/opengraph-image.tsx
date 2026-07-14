// Social-share card for a player profile: photo, name, role, season line.
// Reads the same cached DB-backed profile as the page.

import { ImageResponse } from "next/og";
import { getPlayerProfile } from "../../lib/data/player";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Player profile summary";

const INK = "#0E1320";
const PANEL = "#162033";
const LINE = "rgba(176, 192, 222, 0.2)";
const TEXT = "#F4F0E8";
const MUTED = "#AAB3C5";
const ORANGE = "#F47A2A";

export default async function OgImage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = await params;
  const id = Number(playerId);
  const p =
    Number.isInteger(id) && id > 0
      ? await getPlayerProfile(id).catch(() => null)
      : null;
  const known = !!p?.bio;

  const stat = (value: string, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: ORANGE }}>{value}</div>
      <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: MUTED }}>
        {label}
      </div>
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
            alignItems: "center",
            backgroundColor: PANEL,
            border: `2px solid ${LINE}`,
            borderRadius: 28,
            marginTop: 36,
            padding: 56,
            gap: 56,
          }}
        >
          {known && p.photo ? (
            <img
              src={p.photo}
              alt=""
              width={300}
              height={300}
              style={{ borderRadius: 24, objectFit: "cover", border: `4px solid ${ORANGE}` }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}>
            {known && p.role ? (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  backgroundColor: ORANGE,
                  color: "#1a0d05",
                  borderRadius: 999,
                  padding: "8px 24px",
                  fontSize: 24,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                }}
              >
                {p.role}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                fontSize: known && p.name.length > 18 ? 62 : 76,
                fontWeight: 800,
                color: TEXT,
                textTransform: "uppercase",
                lineHeight: 1.05,
              }}
            >
              {known ? p.name : "Player Profile"}
            </div>
            {known ? (
              <div style={{ display: "flex", gap: 48, marginTop: 8 }}>
                {stat(String(p.season.matches), "Matches")}
                {stat(String(p.season.runs), "Runs")}
                {stat(String(p.season.wickets), "Wickets")}
              </div>
            ) : null}
          </div>
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
