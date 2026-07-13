"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PlayersGridSkeleton } from "../components/skeletons/PageSkeletons";
import {
  filterAndSortPlayers,
  sanitizePlayerDisplayName,
  type DirectoryPlayer,
  type PlayerSort,
} from "../lib/playerDirectory";
import { usePageTitle } from "../lib/usePageTitle";

interface PlayerImage { url: string; alt?: string }
interface Player extends DirectoryPlayer {
  id: string;
  title?: string;
  playerImage?: PlayerImage[];
  jerseyNumber?: number;
  matches?: number;
  totalruns?: number;
  wickets?: number;
  playerid?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  leadershipLabel?: string | null;
}

interface PlayersResponse { entries: Player[] }

const SORT_OPTIONS: Array<{ value: PlayerSort; label: string }> = [
  { value: "runs", label: "Most runs" },
  { value: "matches", label: "Most matches" },
  { value: "wickets", label: "Most wickets" },
  { value: "name", label: "Name A–Z" },
];

function profileImage(player: Player) {
  const file = player.playerImage?.[0]?.url?.split("/").pop()?.split("?")[0];
  return file ? `/images/players/faces/${file}` : "/images/sample_player_image.png";
}

function PlayerCard({ player }: { player: Player }) {
  const href = `/players/${player.playerid || player.id}`;
  const leader = player.isCaptain || player.isViceCaptain;

  return (
    <Link
      href={href}
      className="group block rounded-[var(--radius)] focus-visible:outline-offset-4"
      aria-label={`View ${player.title}'s profile`}
    >
      <article className="ccc-card ccc-card-hover relative h-full overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[var(--panel-line-strong)] transition-colors group-hover:bg-[var(--orange)]" />
        <div className="relative aspect-square overflow-hidden bg-[var(--panel-2)]">
          <div
            className="absolute inset-0 scale-[1.01] bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.045]"
            style={{ backgroundImage: `url(${profileImage(player)})` }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(5,7,12,0.72)] to-transparent" />
          {leader ? (
            <span
              title={player.leadershipLabel || (player.isCaptain ? "Captain" : "Vice-captain")}
              className="absolute right-2.5 top-2.5 rounded-full bg-[var(--orange)] px-2.5 py-1 font-bold text-[0.7rem] leading-none text-[#1a0d05] shadow-lg lg:text-xs"
            >
              {player.isCaptain ? "CAPTAIN" : "VICE-CAPTAIN"}
            </span>
          ) : null}
        </div>

        <div className="p-3.5 lg:p-5">
          <div className="flex min-h-[3.1rem] items-start justify-between gap-2">
            <h2 className="roboto-condensed-bold line-clamp-2 text-[0.94rem] uppercase leading-[1.2] text-[color:var(--text)] lg:text-lg">
              {player.title}
            </h2>
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-[color:var(--orange)] transition-transform group-hover:translate-x-1">→</span>
          </div>
          <dl className="mt-3 grid grid-cols-3 border-t border-[var(--panel-line)] pt-3 lg:mt-4 lg:pt-4">
            <div>
              <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-dim)] lg:text-[0.65rem]">Matches</dt>
              <dd className="ds-num mt-1 text-base text-[color:var(--text)] lg:text-xl">{player.matches ?? 0}</dd>
            </div>
            <div className="border-x border-[var(--panel-line)] px-2 lg:px-3">
              <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-dim)] lg:text-[0.65rem]">Runs</dt>
              <dd className="ds-num mt-1 text-base text-[color:var(--orange)] lg:text-xl">{player.totalruns ?? 0}</dd>
            </div>
            <div className="pl-2 lg:pl-3">
              <dt className="text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-dim)] lg:text-[0.65rem]">Wickets</dt>
              <dd className="ds-num mt-1 text-base text-[color:var(--text)] lg:text-xl">{player.wickets ?? 0}</dd>
            </div>
          </dl>
        </div>
      </article>
    </Link>
  );
}

export default function PlayersPage() {
  usePageTitle("Players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [query, setQuery] = useState("");
  const [leadershipOnly, setLeadershipOnly] = useState(false);
  const [sort, setSort] = useState<PlayerSort>("runs");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/players");
        if (!response.ok) throw new Error(`Players request failed: ${response.status}`);
        const data: PlayersResponse = await response.json();
        setPlayers((data.entries || []).map((player) => ({
          ...player,
          title: sanitizePlayerDisplayName(player.title),
        })));
      } catch (fetchError) {
        console.error("Error fetching players:", fetchError);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const visiblePlayers = useMemo(
    () => filterAndSortPlayers(players, { query, leadershipOnly, sort }),
    [players, query, leadershipOnly, sort],
  );
  const hasFilters = Boolean(query || leadershipOnly || sort !== "runs");

  return (
    <section className="base_paddings pb-20 pt-28 lg:pb-24 lg:pt-40">
      <div className="max_content center_aligned mx-auto">
        <header className="max-w-3xl">
          <p className="ds-eyebrow ds-eyebrow--orange">The CCC squad</p>
          <h1 className="ds-display mt-3 text-[clamp(3.5rem,12vw,7.5rem)] lg:text-[clamp(5rem,7vw,8rem)]">Find your player</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[color:var(--text-muted)] lg:text-lg">
            Explore the full Club Cricket of Chicago roster. Search a name, find club leaders, or sort career totals at a glance.
          </p>
        </header>

        <div className="sticky top-[74px] z-30 mt-8 rounded-[var(--radius)] border border-[var(--panel-line-strong)] bg-[color-mix(in_srgb,var(--ink)_92%,transparent)] p-3 shadow-2xl backdrop-blur-xl lg:top-[86px] lg:mt-12 lg:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_210px_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Search players</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type a player name"
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--panel-line-strong)] bg-[var(--panel)] px-4 text-base text-[color:var(--text)] placeholder:text-[color:var(--text-dim)]"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Show</span>
              <div className="grid h-11 grid-cols-2 rounded-[var(--radius-sm)] border border-[var(--panel-line-strong)] bg-[var(--panel)] p-1">
                <button
                  type="button"
                  aria-pressed={!leadershipOnly}
                  onClick={() => setLeadershipOnly(false)}
                  className={`rounded-md px-3 text-sm font-semibold transition-colors ${!leadershipOnly ? "bg-[var(--orange)] text-[#1a0d05]" : "text-[color:var(--text-muted)]"}`}
                >All</button>
                <button
                  type="button"
                  aria-pressed={leadershipOnly}
                  onClick={() => setLeadershipOnly(true)}
                  className={`rounded-md px-3 text-sm font-semibold transition-colors ${leadershipOnly ? "bg-[var(--orange)] text-[#1a0d05]" : "text-[color:var(--text-muted)]"}`}
                >Leaders</button>
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as PlayerSort)}
                className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--panel-line-strong)] bg-[var(--panel)] px-3 text-sm font-semibold text-[color:var(--text)]"
              >
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>

            <button
              type="button"
              onClick={() => { setQuery(""); setLeadershipOnly(false); setSort("runs"); }}
              disabled={!hasFilters}
              className="h-11 rounded-[var(--radius-sm)] border border-[var(--panel-line-strong)] px-4 text-sm font-semibold uppercase tracking-wide text-[color:var(--text)] transition-colors hover:border-[var(--orange)] hover:text-[color:var(--orange)] disabled:cursor-not-allowed disabled:opacity-35"
            >Clear</button>
          </div>
        </div>

        <div className="mb-5 mt-8 flex items-center justify-between gap-4 lg:mb-7 lg:mt-10">
          <p aria-live="polite" className="text-sm text-[color:var(--text-muted)]">
            <span className="ds-num text-lg text-[color:var(--text)]">{visiblePlayers.length}</span> {visiblePlayers.length === 1 ? "player" : "players"}
          </p>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--panel-line)]" />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6"><PlayersGridSkeleton count={12} /></div>
        ) : error ? (
          <div className="ccc-card p-8 text-center text-[color:var(--text-muted)]">The roster could not be loaded. Please try again shortly.</div>
        ) : visiblePlayers.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {visiblePlayers.map((player) => <PlayerCard key={player.id} player={player} />)}
          </div>
        ) : (
          <div className="ccc-card py-16 text-center">
            <p className="ds-display text-4xl">No player found</p>
            <p className="mt-3 text-[color:var(--text-muted)]">Try a different name or reset the filters.</p>
            <button type="button" onClick={() => { setQuery(""); setLeadershipOnly(false); }} className="ccc-btn ccc-btn-primary mt-6">Show all players</button>
          </div>
        )}
      </div>
    </section>
  );
}
