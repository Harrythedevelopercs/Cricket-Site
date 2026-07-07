"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

function SectionHeading({ children, sub }) {
  return (
    <div className="mb-[5vw] lg:mb-[1.6vw]">
      <div className="flex items-center gap-[3vw] lg:gap-[0.8vw]">
        <span className="inline-block w-[1.2vw] lg:w-[5px] h-[7vw] lg:h-[1.9vw] bg-[var(--orange)] rounded-[2px]" />
        <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[6.5vw] lg:text-[2vw] leading-none tracking-wide">
          {children}
        </h2>
      </div>
      {sub && (
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] mt-[2vw] lg:mt-[0.5vw] pl-[4.2vw] lg:pl-[1.5vw] text-[3.2vw] lg:text-[0.9vw]">
          {sub}
        </p>
      )}
    </div>
  );
}

// Recent-form strip: one square per completed match, oldest → newest.
// Reads like a football form guide — a cricket-club fact, not a stat card.
const FORM_STYLE = {
  W: { bg: "var(--win)", label: "Won" },
  L: { bg: "var(--loss)", label: "Lost" },
  T: { bg: "var(--text-dim)", label: "Tied" },
  N: { bg: "var(--panel-line)", label: "No result" },
};
function FormStrip({ form }) {
  if (!form || form.length === 0) return null;
  return (
    <div
      className="flex items-center gap-[1.4vw] lg:gap-[0.35vw] mt-[3vw] lg:mt-[1vw]"
      aria-label={`Recent form: ${form.map((f) => FORM_STYLE[f]?.label ?? f).join(", ")}`}
    >
      <span className="roboto-condensed-bold text-[color:var(--text-dim)] uppercase tracking-wider text-[2.6vw] lg:text-[0.7vw] mr-[1vw] lg:mr-[0.3vw]">
        Form
      </span>
      {form.map((f, i) => (
        <span
          key={i}
          title={FORM_STYLE[f]?.label ?? f}
          className="oswald-bold text-white leading-none rounded-[1vw] lg:rounded-[0.25vw] w-[5.4vw] h-[5.4vw] lg:w-[1.4vw] lg:h-[1.4vw] flex items-center justify-center text-[3vw] lg:text-[0.75vw]"
          style={{ backgroundColor: FORM_STYLE[f]?.bg ?? "var(--panel-line)", opacity: i === form.length - 1 ? 1 : 0.75 }}
        >
          {f}
        </span>
      ))}
    </div>
  );
}

function PerformerList({ title, unit, players }) {
  if (!players || players.length === 0) return null;
  const [lead, ...rest] = players;
  return (
    <div className="ccc-card rounded-[3vw] lg:rounded-[0.7vw] p-[5vw] lg:p-[1.6vw]">
      <p className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[3.4vw] lg:text-[1vw] mb-[4vw] lg:mb-[1.2vw]">
        {title}
      </p>

      <div className="flex items-center gap-[4vw] lg:gap-[1vw] pb-[4vw] lg:pb-[1.1vw] mb-[3vw] lg:mb-[1vw] border-b border-[var(--panel-line)]">
        <div className="relative w-[16vw] h-[16vw] lg:w-[4vw] lg:h-[4vw] rounded-full overflow-hidden ring-2 ring-[var(--orange)] shrink-0 bg-[var(--panel-2)]">
          <Image
            src={lead.pic || "/images/sample_player_image.png"}
            alt={lead.name}
            fill
            sizes="64px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="roboto-condensed-bold text-[color:var(--text)] text-[4.2vw] lg:text-[1.15vw] truncate">
            {lead.name}
          </p>
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.8vw]">
            Club Cricket of Chicago
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="oswald-bold text-[color:var(--orange)] text-[8vw] lg:text-[2.4vw] leading-none">
            {lead.value}
          </p>
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] uppercase text-[2.4vw] lg:text-[0.7vw]">
            {unit}
          </p>
        </div>
      </div>

      <ul className="flex flex-col gap-[2.5vw] lg:gap-[0.7vw]">
        {rest.map((p, i) => (
          <li key={i} className="flex items-center gap-[3vw] lg:gap-[0.8vw]">
            <span className="roboto-condensed-bold text-[color:var(--text-dim)] w-[5vw] lg:w-[1.4vw] text-center text-[3.2vw] lg:text-[0.9vw]">
              {i + 2}
            </span>
            <div className="relative w-[9vw] h-[9vw] lg:w-[2.2vw] lg:h-[2.2vw] rounded-full overflow-hidden shrink-0 bg-[var(--panel-2)]">
              <Image
                src={p.pic || "/images/sample_player_image.png"}
                alt={p.name}
                fill
                sizes="36px"
                className="object-cover"
                unoptimized
              />
            </div>
            <p className="roboto-condensed-med text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.95vw] truncate flex-1">
              {p.name}
            </p>
            <p className="oswald-regular text-[color:var(--text)] text-[3.8vw] lg:text-[1.05vw]">
              {p.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DivisionCard({ d }) {
  return (
    <Link href={`/tournaments/${d.year}/${d.slug}`} className="block group h-full">
      <div className="ccc-card ccc-card-hover rounded-[3vw] lg:rounded-[0.7vw] p-[5vw] lg:p-[1.5vw] h-full">
        <p className="roboto-condensed-bold text-[color:var(--text)] uppercase text-[3.8vw] lg:text-[1vw] leading-tight min-h-[2.4em]">
          {d.name}
        </p>
        <div className="flex items-end gap-[2vw] lg:gap-[0.5vw] mt-[3vw] lg:mt-[1vw]">
          <span className="oswald-bold text-[color:var(--orange)] text-[11vw] lg:text-[3vw] leading-none">
            {d.position ? ordinal(d.position) : "—"}
          </span>
          {d.position ? (
            <span className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw] mb-[1vw] lg:mb-[0.3vw]">
              of {d.teams}
            </span>
          ) : null}
        </div>
        <div className="flex gap-[5vw] lg:gap-[1.4vw] mt-[3vw] lg:mt-[1vw] roboto-condensed-regular text-[color:var(--text-muted)] text-[3vw] lg:text-[0.85vw]">
          <span>
            <span className="text-[color:var(--win)] roboto-condensed-bold">{d.won}</span> W
          </span>
          <span>
            <span className="text-[color:var(--loss)] roboto-condensed-bold">{d.lost}</span> L
          </span>
          <span>
            <span className="text-[color:var(--text)] roboto-condensed-bold">{d.points}</span> Pts
          </span>
        </div>
        <FormStrip form={d.form} />
        <p className="roboto-condensed-bold text-[color:var(--orange)] text-[3vw] lg:text-[0.8vw] uppercase mt-[4vw] lg:mt-[1vw] tracking-wider group-hover:underline">
          View table →
        </p>
      </div>
    </Link>
  );
}

// "Stats updated Sun, Jun 28 · 9:40 PM" — when the CricClubs mirror last synced.
function SyncStamp({ iso }) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const label = d.toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    timeZone: "America/Chicago",
  });
  return (
    <p className="roboto-condensed-regular text-[color:var(--text-dim)] text-[2.8vw] lg:text-[0.78vw] mt-[3vw] lg:mt-[1vw]">
      Stats updated {label} · via CricClubs
    </p>
  );
}

// A completed CCC match from a previous season, played around this week's date.
function OnThisDayCard({ item }) {
  if (!item) return null;
  return (
    <div className="ccc-card rounded-[3vw] lg:rounded-[0.7vw] p-[5vw] lg:p-[1.4vw] mt-[6vw] lg:mt-[1.6vw] flex flex-wrap items-center gap-x-[4vw] gap-y-[2vw] lg:gap-x-[1.4vw]">
      <p className="ds-eyebrow ds-eyebrow--orange shrink-0">This week in club history</p>
      <p className="roboto-condensed-bold text-[color:var(--text)] text-[3.8vw] lg:text-[1vw]">
        {item.dateLabel}
        <span className="text-[color:var(--text-muted)] font-normal"> · CCC </span>
        <span className="text-[color:var(--orange)]">{item.cccScore}</span>
        <span className="text-[color:var(--text-muted)] font-normal"> vs {item.opponentName} </span>
        {item.oppScore}
      </p>
      {item.result && (
        <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.85vw]">
          {item.result}
        </p>
      )}
    </div>
  );
}

export default function HomeSeasonHub() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data || data.error) return null;
  const { season, stats, topBatsmen, topBowlers, divisions, syncedAt, onThisDay } = data;

  return (
    <section className="base_paddings py-[9vw] lg:py-[3vw] relative z-[6]">
      <div className="max_content center_aligned mx-auto">
        <SectionHeading
          sub={`${season} — ${Number(stats.matches).toLocaleString()} matches · ${Number(
            stats.runs
          ).toLocaleString()} runs · ${Number(stats.wickets).toLocaleString()} wickets · ${Number(
            stats.sixes
          ).toLocaleString()} sixes`}
        >
          Our Divisions
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[4vw] lg:gap-[1.4vw]">
          {divisions.map((d) => (
            <DivisionCard key={d.slug} d={d} />
          ))}
        </div>
        <SyncStamp iso={syncedAt} />
        <OnThisDayCard item={onThisDay} />
        <div className="mb-[11vw] lg:mb-[3.5vw]" />

        <SectionHeading sub="Club Cricket of Chicago leaders">
          Leading This Season
        </SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[4vw] lg:gap-[1.4vw]">
          <PerformerList title="Most Runs" unit="Runs" players={topBatsmen} />
          <PerformerList title="Most Wickets" unit="Wkts" players={topBowlers} />
        </div>
      </div>
    </section>
  );
}
