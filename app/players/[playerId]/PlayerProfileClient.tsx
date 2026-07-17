"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayerProfileSkeleton } from "../../components/skeletons/PageSkeletons";

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

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="ccc-card bg-[var(--panel)] border border-[var(--panel-line)] rounded-[2vw] lg:rounded-[0.6vw] p-[4vw] lg:p-[1.2vw] text-center">
      <p className="oswald-bold text-[color:var(--orange)] text-[7vw] lg:text-[2vw] leading-none tabular-nums">{value}</p>
      <p className="roboto-condensed-bold text-[color:var(--text-muted)] uppercase tracking-wider text-[2.6vw] lg:text-[0.72vw] mt-[1.5vw] lg:mt-[0.4vw]">
        {label}
      </p>
    </div>
  );
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

  useEffect(() => {
    // The server page passes the profile when Neon answered; fetch only as a fallback.
    if (initialProfile !== null || !playerId) return;
    fetch(`/api/player/${playerId}`)
      .then((r) => r.json())
      .then((d) => {
        setP(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [playerId, initialProfile]);

  if (loading) return <PlayerProfileSkeleton />;
  if (!p || p.error)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="roboto-condensed-regular text-[color:var(--text)] p3">Player profile unavailable.</p>
        <Link href="/players" className="roboto-condensed-bold text-[color:var(--orange)] uppercase hover:underline">
          ← All Players
        </Link>
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
          <Stat label="Wickets" value={p.season.wickets} />
          <Stat label="Sixes" value={p.season.sixes} />
        </div>

        {/* Recent form — last few appearances from stored scorecards */}
        {p.recentForm && p.recentForm.length > 0 ? (
          <>
            <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[5.5vw] lg:text-[1.6vw] mb-[3vw] lg:mb-[1vw]">
              Recent <span className="text-[color:var(--orange)]">Form</span>
            </h2>
            <div className="mb-[8vw] overflow-hidden rounded-[2vw] border border-[var(--panel-line)] bg-[var(--panel)] lg:mb-[2.5vw] lg:rounded-[0.6vw]">
              {p.recentForm.map((f) => (
                <Link
                  key={f.matchId}
                  href={`/match/${f.matchId}`}
                  className="group flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--panel-line)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[var(--panel-2)] lg:px-6 lg:py-3.5"
                >
                  {f.won !== null ? (
                    <span
                      aria-label={f.won ? "Won" : "Lost"}
                      className="roboto-condensed-bold flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] text-[#0b1220]"
                      style={{ background: f.won ? "var(--win)" : "var(--loss)" }}
                    >
                      {f.won ? "W" : "L"}
                    </span>
                  ) : (
                    <span aria-hidden="true" className="h-6 w-6 shrink-0" />
                  )}
                  <span className="roboto-condensed-regular shrink-0 text-[0.78rem] text-[color:var(--text-dim)] lg:w-24 lg:text-[0.85rem]">
                    {f.date}
                  </span>
                  <span className="roboto-condensed-bold min-w-0 flex-1 truncate text-[0.85rem] uppercase text-[color:var(--text)] lg:text-[0.95rem]">
                    vs {f.opponent}
                  </span>
                  <span className="flex basis-full items-center gap-4 pl-10 lg:basis-auto lg:pl-0">
                    <span className="roboto-condensed-regular text-[0.82rem] tabular-nums text-[color:var(--text-muted)] lg:text-[0.9rem]">
                      <span className="text-[color:var(--text-dim)]">Bat </span>
                      {f.batting ? `${f.batting.runs}${f.batting.notOut ? "*" : ""} (${f.batting.balls})` : "—"}
                    </span>
                    <span className="roboto-condensed-regular text-[0.82rem] tabular-nums text-[color:var(--text-muted)] lg:text-[0.9rem]">
                      <span className="text-[color:var(--text-dim)]">Bowl </span>
                      {f.bowling ? `${f.bowling.wickets}/${f.bowling.runs} (${f.bowling.overs})` : "—"}
                    </span>
                    <span aria-hidden="true" className="ml-auto shrink-0 text-[color:var(--orange)] transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        ) : null}

        {/* Career batting */}
        {p.careerBatting.length > 0 ? (
          <>
            <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[5.5vw] lg:text-[1.6vw] mb-[3vw] lg:mb-[1vw]">
              Career <span className="text-[color:var(--orange)]">Batting</span>
            </h2>
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
