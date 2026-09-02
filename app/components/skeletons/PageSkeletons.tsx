// Theme-aware, branded loading skeletons shown while client-side data is fetched.
// They mirror each page's real layout so the page doesn't flash empty (or a bare
// "Loading…") on a cold load. The shimmer and surfaces come from token-driven
// classes (.ccc-skel, var(--panel)/var(--panel-line)) so they match both themes.

import type { CSSProperties } from "react";

export function Skel({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <div className={`ccc-skel ${className}`} style={style} aria-hidden="true" />;
}

/* One player tile — mirrors the compact directory card. */
export function PlayerCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--panel-line)] bg-[var(--panel)]">
      <Skel className="aspect-square w-full !rounded-none" />
      <div className="p-3.5 lg:p-5">
        <Skel className="h-5 w-3/4" />
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--panel-line)] pt-3">
          <Skel className="h-8 w-full" />
          <Skel className="h-8 w-full" />
          <Skel className="h-8 w-full" />
        </div>
      </div>
    </div>
  );
}

/* Grid of player tiles — drop into the page's existing .players_panel_container. */
export function PlayersGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </>
  );
}

function TableBlockSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-[var(--panel)] rounded-[2.5vw] lg:rounded-[0.7vw] border border-[var(--panel-line)] p-[4vw] lg:p-[1.3vw] mb-[5vw] lg:mb-[1.6vw]">
      <Skel className="h-[4vw] lg:h-[1.2vw] w-[40%] mb-[3vw] lg:mb-[1vw]" />
      {Array.from({ length: rows }).map((_, r) => (
        <Skel key={r} className="h-[3.2vw] lg:h-[1vw] w-full mb-[2vw] lg:mb-[0.6vw]" />
      ))}
    </div>
  );
}

/* Player profile — header (avatar + name/meta) then two stat-table blocks. */
export function PlayerProfileSkeleton() {
  return (
    <section className="base_paddings pt-[100px] pb-[8vw] lg:pt-[136px] lg:pb-[3vw]">
      <div className="max_content center_aligned mx-auto">
        <div className="flex items-center gap-[4vw] lg:gap-[1.5vw] mb-[6vw] lg:mb-[2vw]">
          <Skel className="rounded-full w-[22vw] h-[22vw] lg:w-[7vw] lg:h-[7vw]" />
          <div className="flex-1">
            <Skel className="h-[5.5vw] lg:h-[1.9vw] w-[55%] mb-[2.5vw] lg:mb-[0.9vw]" />
            <Skel className="h-[3vw] lg:h-[1vw] w-[38%] mb-[1.8vw] lg:mb-[0.6vw]" />
            <Skel className="h-[3vw] lg:h-[1vw] w-[28%]" />
          </div>
        </div>
        <TableBlockSkeleton rows={4} />
        <TableBlockSkeleton rows={4} />
      </div>
    </section>
  );
}

/* Match centre — header card (two crests + VS) then two innings table blocks. */
export function MatchCentreSkeleton() {
  return (
    <section className="base_paddings pt-[100px] pb-[8vw] lg:pt-[136px] lg:pb-[3vw]">
      <div className="max_content center_aligned mx-auto">
        <div className="bg-[var(--panel)] rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] p-[6vw] lg:p-[1.8vw] mb-[6vw] lg:mb-[2vw]">
          <Skel className="h-[3vw] lg:h-[0.9vw] w-[35%] mx-auto mb-[4vw] lg:mb-[1.2vw]" />
          <div className="flex items-center justify-center gap-[5vw] lg:gap-[2.5vw]">
            <div className="flex flex-col items-center gap-[2vw] lg:gap-[0.6vw] w-[30%]">
              <Skel className="rounded-full w-[16vw] h-[16vw] lg:w-[4.5vw] lg:h-[4.5vw]" />
              <Skel className="h-[3vw] lg:h-[1vw] w-[70%]" />
            </div>
            <Skel className="h-[6vw] lg:h-[1.8vw] w-[8%]" />
            <div className="flex flex-col items-center gap-[2vw] lg:gap-[0.6vw] w-[30%]">
              <Skel className="rounded-full w-[16vw] h-[16vw] lg:w-[4.5vw] lg:h-[4.5vw]" />
              <Skel className="h-[3vw] lg:h-[1vw] w-[70%]" />
            </div>
          </div>
        </div>
        <TableBlockSkeleton rows={6} />
        <TableBlockSkeleton rows={6} />
      </div>
    </section>
  );
}

/* Tournament detail — featured banner, then the stats table. */
export function TournamentDetailSkeleton() {
  return (
    <section className="base_paddings pt-[100px] pb-[6vw] lg:pt-[136px] lg:pb-[2.5vw]">
      <div className="max_content center_aligned mx-auto">
        <Skel className="w-full h-[55vw] lg:h-[15vw] mb-[6vw] lg:mb-[1.8vw]" />
        <Skel className="h-[5vw] lg:h-[1.6vw] w-[28%] mb-[3vw] lg:mb-[1vw]" />
        <Skel className="w-full h-[70vw] lg:h-[24vw]" />
      </div>
    </section>
  );
}

/* Schedule — title, next-match band, then the calendar grid. */
export function ScheduleSkeleton() {
  return (
    <section className="base_paddings pt-[100px] pb-[6vw] lg:pt-[136px] lg:pb-[2.5vw]">
      <div className="max_content center_aligned mx-auto">
        <Skel className="h-[6vw] lg:h-[2vw] w-[24%] mb-[5vw] lg:mb-[1.4vw]" />
        <Skel className="w-full h-[30vw] lg:h-[9vw] mb-[6vw] lg:mb-[1.8vw]" />
        <Skel className="w-full h-[78vw] lg:h-[26vw]" />
      </div>
    </section>
  );
}
