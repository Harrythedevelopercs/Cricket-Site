"use client";

import StatTable from "./StatTable";

const COLUMNS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Player" },
  { key: "matches", label: "Mat", numeric: true },
  { key: "innings", label: "Ins", numeric: true },
  { key: "balls", label: "Balls", numeric: true },
  { key: "runs", label: "Runs", numeric: true },
  { key: "wickets", label: "Wkts", numeric: true },
  { key: "points", label: "Pts", numeric: true },
  { key: "catches", label: "Cths", numeric: true },
  { key: "fourWickets", label: "4W", numeric: true },
  { key: "fiveWickets", label: "5W", numeric: true },
  { key: "dotBalls", label: "DB", numeric: true },
];

export default function RenderBowlingDataTable({ bowlingData, limit }) {
  const rows = bowlingData.map((r) => ({
    ...r,
    name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
  }));
  return <StatTable columns={COLUMNS} rows={rows} leadKey="wickets" limit={limit} />;
}
