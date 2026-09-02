"use client";

import StatTable from "./StatTable";

const COLUMNS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Player" },
  { key: "totalMatches", label: "Mat", numeric: true },
  { key: "catches", label: "Cths", numeric: true },
  { key: "wkcatches", label: "WC", numeric: true },
  { key: "direct", label: "DR", numeric: true },
  { key: "indirect", label: "IDR", numeric: true },
  { key: "stumpings", label: "STM", numeric: true },
  { key: "total", label: "TO", numeric: true },
];

export default function RenderFieldingDataTable({ fieldingData, limit }) {
  const rows = fieldingData.map((r) => ({
    ...r,
    name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
  }));
  return <StatTable columns={COLUMNS} rows={rows} leadKey="total" limit={limit} />;
}
