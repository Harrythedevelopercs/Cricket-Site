"use client";

import StatTable from "./StatTable";

const COLUMNS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Player" },
  { key: "battingPoints", label: "Batting Points", numeric: true },
  { key: "bowlingPoints", label: "Bowling Points", numeric: true },
  { key: "fieldingPoints", label: "Fielding Points", numeric: true },
  { key: "otherPoints", label: "Other Points", numeric: true },
  { key: "total", label: "Total", numeric: true },
];

export default function RenderRankingDataTable({ rankingData, limit }) {
  const rows = rankingData.map((r) => ({
    ...r,
    name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
  }));
  return <StatTable columns={COLUMNS} rows={rows} leadKey="total" limit={limit} />;
}
