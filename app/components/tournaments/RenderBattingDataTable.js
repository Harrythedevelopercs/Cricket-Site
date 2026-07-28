"use client";

import StatTable from "./StatTable";

const COLUMNS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Player" },
  { key: "matches", label: "Mat", numeric: true },
  { key: "innings", label: "Ins", numeric: true },
  { key: "ballsFaced", label: "BF", numeric: true },
  { key: "runsScored", label: "Rns", numeric: true },
  { key: "fours", label: "4s", numeric: true },
  { key: "sixers", label: "6s", numeric: true },
  { key: "fifties", label: "50s", numeric: true },
  { key: "hundreds", label: "100s", numeric: true },
  { key: "notOuts", label: "NO", numeric: true },
  { key: "highestScore", label: "HS", numeric: true },
];

export default function RenderBattingDataTable({ battingData }) {
  const rows = battingData.map((r) => ({
    ...r,
    name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
  }));
  return <StatTable columns={COLUMNS} rows={rows} leadKey="runsScored" />;
}
