"use client";

// The Number Zone's shared table. Fans compare across disciplines constantly, so
// two things were missing: a way to re-rank by any column, and any visual sense of
// who leads.
//
// - Click a numeric heading to sort by it. Rows then TRAVEL to their new positions
//   (FLIP) instead of blinking, so a player stays followable as the order changes.
// - The column being sorted carries a proportional fill behind its figures, so the
//   shape of the leaderboard is visible without reading every number.
//
// Column order is preserved as (# · Rank · Player · stats…) because the existing
// Number Zone CSS aligns columns by nth-child position.
//
// FLIP measures offsetTop, not getBoundingClientRect, so a scroll between renders
// can't corrupt the deltas.

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export interface StatColumn {
  key: string;
  label: string;
  /** Numeric columns are sortable and can carry the fill. */
  numeric?: boolean;
}

export type StatRow = Record<string, string | number | null | undefined>;

const FLIP_MS = 520;
const FLIP_EASE = "cubic-bezier(.16,1,.3,1)";

/** Stable across re-sorts, which is what FLIP needs to track a row. */
const rowId = (r: StatRow, i: number) => `${r.name ?? ""}|${r.rank ?? ""}|${i}`;

export default function StatTable({
  columns,
  rows,
  leadKey,
}: {
  columns: StatColumn[];
  rows: StatRow[];
  /** The stat this table is really about — sorted and filled by default. */
  leadKey: string;
}) {
  const reduce = useReducedMotion();
  const [sortKey, setSortKey] = useState(leadKey);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const lastTops = useRef<Map<string, number>>(new Map());

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    const arr = rows.map((r, i) => ({ row: r, id: rowId(r, i) }));
    if (!col) return arr;
    return arr.sort((a, b) => {
      const av = a.row[sortKey];
      const bv = b.row[sortKey];
      if (typeof av === "number" && typeof bv === "number") return bv - av;
      return String(av ?? "").localeCompare(String(bv ?? ""));
    });
  }, [rows, sortKey, columns]);

  const sortedCol = columns.find((c) => c.key === sortKey);
  const max = useMemo(() => {
    if (!sortedCol?.numeric) return 0;
    return Math.max(1, ...rows.map((r) => Number(r[sortKey]) || 0));
  }, [rows, sortKey, sortedCol]);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const trs = Array.from(body.querySelectorAll<HTMLTableRowElement>("tr[data-rid]"));
    if (!reduce) {
      for (const tr of trs) {
        const id = tr.dataset.rid;
        if (!id) continue;
        const prev = lastTops.current.get(id);
        const now = tr.offsetTop;
        if (prev !== undefined && Math.abs(prev - now) > 1) {
          tr.animate(
            [{ transform: `translateY(${prev - now}px)` }, { transform: "translateY(0)" }],
            { duration: FLIP_MS, easing: FLIP_EASE }
          );
        }
      }
    }
    lastTops.current = new Map(
      trs.map((tr) => [tr.dataset.rid ?? "", tr.offsetTop])
    );
  }, [sorted, reduce]);

  const width = (key: string) =>
    key === "rank" ? "6%" : key === "name" ? "21%" : undefined;
  const align = (key: string) =>
    key === "rank" ? "center" : key === "name" ? ("left" as const) : undefined;

  // No rows: say so — an eleven-column header over an empty body reads broken.
  if (sorted.length === 0) {
    return (
      <p className="roboto-condensed-regular w-full py-[6vw] lg:py-[2vw] text-center text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw]">
        Nothing recorded for this view yet.
      </p>
    );
  }

  return (
    <table cellSpacing="0">
      <thead>
        <tr>
          <th style={{ width: "4%", textAlign: "center" }} className="p5 white_color">
            #
          </th>
          {columns.map((c) => {
            const isSorted = c.key === sortKey;
            return (
              <th
                key={c.key}
                style={{ width: width(c.key), textAlign: align(c.key) }}
                className={`p5 white_color${c.key === "name" ? "" : " border_th"}`}
                aria-sort={isSorted ? "descending" : undefined}
              >
                {c.numeric ? (
                  <button
                    type="button"
                    className={`ccc-nz-sort${isSorted ? " is-sorted" : ""}`}
                    onClick={() => setSortKey(c.key)}
                    aria-label={`Sort by ${c.label}`}
                  >
                    {c.label}
                    <i aria-hidden="true">▾</i>
                  </button>
                ) : (
                  c.label
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody ref={bodyRef}>
        {sorted.map(({ row, id }, idx) => (
          <tr key={id} data-rid={id}>
            <td style={{ width: "4%", textAlign: "center" }} className="p5 white_color">
              {idx + 1}
            </td>
            {columns.map((c) => {
              const value = row[c.key];
              const filled = c.key === sortKey && max > 0;
              const pct = filled ? ((Number(value) || 0) / max) * 100 : 0;
              return (
                <td
                  key={c.key}
                  style={{ width: width(c.key), textAlign: align(c.key) }}
                  className={`p5 white_color${filled ? " ccc-nz-cell" : ""}`}
                >
                  {filled ? (
                    <span className="ccc-nz-fill" style={{ width: `${pct}%` }} aria-hidden="true" />
                  ) : null}
                  <span className={filled ? "ccc-nz-val" : undefined}>
                    {value ?? "-"}
                  </span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
