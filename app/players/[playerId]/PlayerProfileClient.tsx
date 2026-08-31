"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PlayerProfileSkeleton } from "../../components/skeletons/PageSkeletons";
import ScoreReel from "../../components/ui/ScoreReel";
import StumpsCounter from "../../components/ui/StumpsCounter";
import BoundaryRibbon from "../../components/ui/BoundaryRibbon";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface BattingRow {
  format: string;
  matches: number;
  innings: number;
  runs: number;
  highestScore: number;
  average: string;
  strikeRate: string;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
}
interface BowlingRow {
  format: string;
  matches: number;
  innings: number;
  overs: string;
  runs: number;
  wickets: number;
  maidens: number;
  average: string;
  economy: string;
  fourWickets: number;
  fiveWickets: number;
}
interface RecentFormEntry {
  matchId: number;
  date: string;
  opponent: string;
  result: string;
  won: boolean | null;
  batting: { runs: number; balls: number; dismissal: string; notOut: boolean } | null;
  bowling: { overs: string; runs: number; wickets: number } | null;
}
export interface Profile {
  playerId: number;
  /** False when neither the DB nor CricClubs knows this player id. */
  found?: boolean;
  name: string;
  photo: string;
  role: string;
  bio: { battingStyle: string; bowlingStyle: string; age: number | null } | null;
  season: { matches: number; runs: number; highestScore: number; sixes: number; wickets: number };
  recentForm?: RecentFormEntry[];
  careerBatting: BattingRow[];
  careerBowling: BowlingRow[];
  error?: string;
}

function Stat({
  label,
  value,
  stumps = false,
}: {
  label: string;
  value: number;
  /* Wickets get the bails — the one tile where the sport has its own image. */
  stumps?: boolean;
}) {
  return (
    <div className="ccc-card bg-[var(--panel)] border border-[var(--panel-line)] rounded-[2vw] lg:rounded-[0.6vw] p-[4vw] lg:p-[1.2vw] text-center">
      <p className="oswald-bold text-[color:var(--orange)] text-[7vw] lg:text-[2vw] leading-none tabular-nums flex justify-center">
        {stumps ? <StumpsCounter value={value} /> : <ScoreReel value={value} />}
      </p>
      <p className="roboto-condensed-bold text-[color:var(--text-muted)] uppercase tracking-wider text-[2.6vw] lg:text-[0.72vw] mt-[1.5vw] lg:mt-[0.4vw]">
        {label}
      </p>
    </div>
  );
}
/* The one thing worth shouting about in an innings — a hundred, a fifty, or a
   multi-wicket haul. Batting milestone wins when a player did both. */
function inningsFlag(f: RecentFormEntry): string | null {
  const runs = f.batting?.runs ?? 0;
  const wkts = f.bowling?.wickets ?? 0;
  if (runs >= 100) return "TON";
  if (runs >= 50) return "50";
  if (wkts >= 5) return "5W";
  if (wkts >= 4) return "4W";
  return null;
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="roboto-condensed-bold text-[color:var(--orange)] uppercase text-left px-[2vw] lg:px-[0.7vw] py-[2vw] lg:py-[0.6vw] text-[2.6vw] lg:text-[0.78vw] whitespace-nowrap">
      {children}
    </th>
  );
}
function Td({ children, lead = false }: { children: ReactNode; lead?: boolean }) {
  return (
    <td
      className={`px-[2vw] lg:px-[0.7vw] py-[2vw] lg:py-[0.55vw] text-[2.8vw] lg:text-[0.85vw] whitespace-nowrap tabular-nums ${
        lead ? "roboto-condensed-bold text-[color:var(--text)]" : "roboto-condensed-regular text-[color:var(--text-muted)]"
      }`}
    >
      {children}
    </td>
  );
}

export default function PlayerProfileClient({
  playerId,
  initialProfile,
}: {
  playerId: string;
  initialProfile: Profile | null;
}) {
  const [p, setP] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(initialProfile === null);
  const reduce = useReducedMotion();

  useEffect(() => {
    // The server page passes the profile when Neon answered; fetch only as a fallback.
    if (initialProfile !== null || !playerId) return;
    fetch(`/api/player/${playerId}`)
      .then(async (r) => {
        const d = await r.json();
        // A failed read is { error } with a 500 — fall through to the
        // unavailable card via the catch, never store the error payload as data.
        if (!r.ok || d?.error) throw new Error(d?.error || `Player request failed: ${r.status}`);
        setP(d);
      })
      .catch((e) => console.error("Player profile fetch failed:", e))
      .finally(() => setLoading(false));
  }, [playerId, initialProfile]);

  if (loading) return <PlayerProfileSkeleton />;
  if (!p || p.error || p.found === false)
    return (
      <div className="min-h-[60vh] base_paddings flex items-center justify-center">
        <div className="ccc-card w-full max-w-2xl px-6 py-14 text-center">
          <p className="ds-eyebrow ds-eyebrow--orange">Player profile</p>
          <p className="ds-display mt-3 text-4xl">No profile to show</p>
          <p className="mt-3 text-[color:var(--text-muted)]">
            This player may not be in the books yet — or the server is still waking up.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary">
              Try again
            </button>
            <Link href="/players" className="ccc-btn ccc-btn-ghost">
              All players
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <section className="base_paddings pt-[100px] pb-[8vw] lg:pt-[136px] lg:pb-[3vw]">
      <div className="max_content center_aligned mx-auto">
        <Link
          href="/players"
          className="roboto-condensed-bold text-[color:var(--orange)] text-[3.4vw] lg:text-[0.9vw] uppercase tracking-wider hover:underline"
        >
          ← All Players
        </Link>

        {/* Hero */}
        <div className="ccc-card flex flex-col lg:flex-row items-center lg:items-end gap-[5vw] lg:gap-[2vw] mt-[5vw] lg:mt-[1.5vw] mb-[8vw] lg:mb-[2.5vw] bg-[var(--panel)] rounded-[3vw] lg:rounded-[0.8vw] border border-[var(--panel-line)] p-[6vw] lg:p-[2vw]">
          <div className="relative w-[42vw] h-[42vw] lg:w-[12vw] lg:h-[12vw] rounded-[2vw] lg:rounded-[0.6vw] overflow-hidden ring-2 ring-[var(--orange)] shrink-0 bg-[var(--panel-2)]">
            {/* Optimized on purpose: raw CricClubs uploads run 15 KB–1.2 MB; the
                optimizer serves a ~200px WebP from the edge instead of the original. */}
            <Image
              src={p.photo || "/images/sample_player_image.png"}
              alt={p.name}
              fill
              sizes="200px"
              className="object-cover"
            />
          </div>
          <div className="text-center lg:text-left flex-1">
            {p.role ? (
              <span className="inline-block roboto-condensed-bold uppercase bg-[var(--orange)] rounded-full px-[3vw] lg:px-[0.9vw] py-[1vw] lg:py-[0.2vw] text-[2.8vw] lg:text-[0.75vw] tracking-wider mb-[2vw] lg:mb-[0.6vw]" style={{ color: "#1a0d05" }}>
                {p.role}
              </span>
            ) : null}
            <h1 className="oswald-bold text-[color:var(--text)] uppercase text-[8.5vw] lg:text-[3vw] leading-none">
              {p.name}
            </h1>
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] mt-[1.5vw] lg:mt-[0.4vw] text-[3.4vw] lg:text-[1vw]">
              Club Cricket of Chicago
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-[5vw] lg:gap-x-[1.6vw] gap-y-[1vw] mt-[3vw] lg:mt-[0.8vw] roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw]">
              {p.bio?.battingStyle ? (
                <span>
                  <span className="text-[color:var(--text-dim)]">Batting </span>
                  {p.bio.battingStyle}
                </span>
              ) : null}
              {p.bio?.bowlingStyle ? (
                <span>
                  <span className="text-[color:var(--text-dim)]">Bowling </span>
                  {p.bio.bowlingStyle}
                </span>
              ) : null}
              {p.bio?.age ? (
                <span>
                  <span className="text-[color:var(--text-dim)]">Age </span>
                  {p.bio.age}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Season */}
        <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[5.5vw] lg:text-[1.6vw] mb-[3vw] lg:mb-[1vw]">
          Summer 2026 <span className="text-[color:var(--orange)]">Season</span>
        </h2>
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-[2.5vw] lg:gap-[1vw] mb-[8vw] lg:mb-[2.5vw]">
          <Stat label="Matches" value={p.season.matches} />
          <Stat label="Runs" value={p.season.runs} />
          <Stat label="HS" value={p.season.highestScore} />
          <Stat label="Wickets" value={p.season.wickets} stumps />
          <Stat label="Sixes" value={p.season.sixes} />
        </div>

        {/* Recent form — last few appearances from stored scorecards */}
        {p.recentForm && p.recentForm.length > 0 ? (
          <>
            <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[5.5vw] lg:text-[1.6vw] mb-[3vw] lg:mb-[1vw]">
              Recent <span className="text-[color:var(--orange)]">Form</span>
            </h2>
            <div className="ccc-tape mb-[8vw] lg:mb-[2.5vw]">
              {(() => {
                // Bars are relative to this player's best innings in the window, so a
                // century can never look the same size as a nine.
                const best = Math.max(1, ...p.recentForm.map((f) => f.batting?.runs ?? 0));
                return p.recentForm.map((f, i) => {
                  const flag = inningsFlag(f);
                  const pct = f.batting ? (f.batting.runs / best) * 100 : 0;
                  return (
                    <motion.div
                      key={f.matchId}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.09, ease: EASE }}
                    >
                      <Link href={`/match/${f.matchId}`} className="ccc-tape-row">
                        {f.won !== null ? (
                          <span
                            aria-label={f.won ? "Won" : "Lost"}
                            className="ccc-tape-res"
                            style={{ background: f.won ? "var(--win)" : "var(--loss)" }}
                          >
                            {f.won ? "W" : "L"}
                          </span>
                        ) : (
                          <span aria-hidden="true" className="ccc-tape-res" style={{ background: "var(--text-dim)" }} />
                        )}

                        <span className="ccc-tape-opp">
                          <b>vs {f.opponent}</b>
                          <s>{f.date}</s>
                        </span>

                        <span className="ccc-tape-flag">{flag ? <em>{flag}</em> : null}</span>

                        <span className="ccc-tape-track">
                          <span className="ccc-tape-bar-wrap">
                            <motion.span
                              className="ccc-tape-bar"
                              initial={reduce ? false : { width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true, amount: 0.5 }}
                              transition={{ duration: 0.9, delay: reduce ? 0 : 0.2 + i * 0.09, ease: EASE }}
                            />
                          </span>
                        </span>

                        <span className={`ccc-tape-fig${f.batting ? "" : " is-empty"}`}>
                          {f.batting ? (
                            <>
                              <b>
                                {f.batting.runs}
                                {f.batting.notOut ? <i>*</i> : null}
                              </b>
                              <s>({f.batting.balls})</s>
                            </>
                          ) : (
                            <>
                              <b>—</b>
                              <s>bat</s>
                            </>
                          )}
                        </span>

                        <span className={`ccc-tape-fig${f.bowling ? "" : " is-empty"}`}>
                          {f.bowling ? (
                            <>
                              <b>
                                {f.bowling.wickets}/{f.bowling.runs}
                              </b>
                              <s>({f.bowling.overs})</s>
                            </>
                          ) : (
                            <>
                              <b>—</b>
                              <s>bowl</s>
                            </>
                          )}
                        </span>
                      </Link>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </>
        ) : null}

        {/* Career batting */}
        {p.careerBatting.length > 0 ? (
          <>
            <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[5.5vw] lg:text-[1.6vw] mb-[3vw] lg:mb-[1vw]">
              Career <span className="text-[color:var(--orange)]">Batting</span>
            </h2>
            {/* Where the runs came from, for the format the player has actually
                played most — the table below can't answer that. */}
            {(() => {
              const main = [...p.careerBatting].sort((a, b) => b.runs - a.runs)[0];
              return main ? (
                <BoundaryRibbon
                  runs={main.runs}
                  fours={main.fours}
                  sixes={main.sixes}
                  format={main.format}
                  innings={main.innings}
                />
              ) : null;
            })()}
            <div className="overflow-x-auto rounded-[2vw] lg:rounded-[0.6vw] border border-[var(--panel-line)] mb-[8vw] lg:mb-[2.5vw] bg-[var(--panel)]">
              <table className="min-w-full">
                <thead className="bg-[var(--panel-2)]">
                  <tr>
                    <Th>Format</Th>
                    <Th>Mat</Th>
                    <Th>Inns</Th>
                    <Th>Runs</Th>
                    <Th>HS</Th>
                    <Th>Avg</Th>
                    <Th>SR</Th>
                    <Th>50s</Th>
                    <Th>100s</Th>
                    <Th>4s</Th>
                    <Th>6s</Th>
                  </tr>
                </thead>
                <tbody>
                  {p.careerBatting.map((b, i) => (
                    <tr key={i} className="border-t border-[var(--panel-line)]">
                      <Td lead>{b.format}</Td>
                      <Td>{b.matches}</Td>
                      <Td>{b.innings}</Td>
                      <Td lead>{b.runs}</Td>
                      <Td>{b.highestScore}</Td>
                      <Td>{b.average}</Td>
                      <Td>{b.strikeRate}</Td>
                      <Td>{b.fifties}</Td>
                      <Td>{b.hundreds}</Td>
                      <Td>{b.fours}</Td>
                      <Td>{b.sixes}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {/* Career bowling */}
        {p.careerBowling.length > 0 ? (
          <>
            <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[5.5vw] lg:text-[1.6vw] mb-[3vw] lg:mb-[1vw]">
              Career <span className="text-[color:var(--orange)]">Bowling</span>
            </h2>
            <div className="overflow-x-auto rounded-[2vw] lg:rounded-[0.6vw] border border-[var(--panel-line)] bg-[var(--panel)]">
              <table className="min-w-full">
                <thead className="bg-[var(--panel-2)]">
                  <tr>
                    <Th>Format</Th>
                    <Th>Mat</Th>
                    <Th>Inns</Th>
                    <Th>Overs</Th>
                    <Th>Runs</Th>
                    <Th>Wkts</Th>
                    <Th>Avg</Th>
                    <Th>Econ</Th>
                    <Th>4w</Th>
                    <Th>5w</Th>
                  </tr>
                </thead>
                <tbody>
                  {p.careerBowling.map((b, i) => (
                    <tr key={i} className="border-t border-[var(--panel-line)]">
                      <Td lead>{b.format}</Td>
                      <Td>{b.matches}</Td>
                      <Td>{b.innings}</Td>
                      <Td>{b.overs}</Td>
                      <Td>{b.runs}</Td>
                      <Td lead>{b.wickets}</Td>
                      <Td>{b.average}</Td>
                      <Td>{b.economy}</Td>
                      <Td>{b.fourWickets}</Td>
                      <Td>{b.fiveWickets}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
