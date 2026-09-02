"use client";

// The tournament's stat tables — the section fans come to compare. The header
// names the tournament ("RedBall Premier Stats") and carries a strip of the
// season's other tournaments; those are links, so a click swaps the whole page,
// not just the tables. Each discipline opens on its top ten by the sorted
// column, with a footer control for the full list.
//
// CSS still uses the legacy NZ_* class names from when this was "Number Zone".

import { useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { useReducedMotion } from "framer-motion";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

import { compactSeriesName } from "../../lib/seriesName";
import RenderBattingDataTable from "./RenderBattingDataTable";
import RenderBowlingDataTable from "./RenderBowlingDataTable";
import RenderFieldingDataTable from "./RenderFieldingDataTable";
import RenderRankingDataTable from "./RenderRankingDataTable";

export const TOP_N = 10;

// "Rohit Channananjundarya" -> first + the rest; a third name is kept, not dropped.
const splitName = (player) => {
  const parts = (player?.player || "").split(" ").filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") };
};

// Dims while the next tournament's page is on its way, so a click against a
// cold server isn't a dead click.
function SeasonLinkLabel({ children }) {
  const { pending } = useLinkStatus();
  return <span className={pending ? "is-pending" : undefined}>{children}</span>;
}

function SeasonLink({ href, label, active }) {
  return (
    <Link
      href={href}
      scroll={false}
      prefetch={true}
      aria-current={active ? "page" : undefined}
      className={`ccc-nz-tab${active ? " is-active" : ""}`}
    >
      <SeasonLinkLabel>{label}</SeasonLinkLabel>
    </Link>
  );
}

export default function TournamentStats({ tournament, siblings = [], year }) {
  const reduce = useReducedMotion();
  const [tab, setTab] = useState(0);
  // Expanded per discipline: opening Batting leaves Bowling at its top ten.
  const [open, setOpen] = useState([false, false, false, false]);
  const footRef = useRef(null);

  const battingData = (tournament?.battingNumberZone ?? []).map((player) => ({
    ...splitName(player),
    matches: player?.mat || 0,
    innings: player?.ins || 0,
    ballsFaced: player?.bf || 0,
    runsScored: player?.runs || 0,
    fours: player?.fours || 0,
    sixers: player?.sixes || 0,
    fifties: player?.fifties || 0,
    hundreds: player?.hundreds || 0,
    notOuts: player?.no || 0,
    highestScore: player?.hs || 0,
    rank: player?.rank ?? null,
  }));

  const bowlingData = (tournament?.bowlingNumberZone ?? []).map((player) => ({
    ...splitName(player),
    matches: player?.mat || 0,
    innings: player?.ins || 0,
    balls: player?.balls || 0,
    runs: player?.runs || 0,
    wickets: player?.wkts || 0,
    points: player?.pts || 0,
    catches: player?.cths || 0,
    fourWickets: player?.fourW || 0,
    fiveWickets: player?.fiveW || 0,
    dotBalls: player?.db || 0,
    rank: player?.rank ?? null,
  }));

  const fieldingData = (tournament?.fieldingNumberZone ?? []).map((player) => ({
    ...splitName(player),
    totalMatches: player?.mat || 0,
    catches: player?.cths || 0,
    wkcatches: player?.wc || 0,
    direct: player?.dr || 0,
    indirect: player?.idr || 0,
    stumpings: player?.stm || 0,
    total: player?.to || 0,
    rank: player?.rank ?? null,
  }));

  const rankingData = (tournament?.rankingZone ?? []).map((player) => ({
    ...splitName(player),
    battingPoints: player?.battingPoints || 0,
    bowlingPoints: player?.bowlingPoints || 0,
    fieldingPoints: player?.fieldingPoints || 0,
    otherPoints: player?.otherPoints || 0,
    total: player?.total || 0,
    rank: player?.rank ?? null,
  }));

  const panels = [
    { label: "Batting", cls: "batting_table", rows: battingData.length,
      render: (limit) => <RenderBattingDataTable battingData={battingData} limit={limit} /> },
    { label: "Bowling", cls: "bowling_table", rows: bowlingData.length,
      render: (limit) => <RenderBowlingDataTable bowlingData={bowlingData} limit={limit} /> },
    { label: "Fielding", cls: "fielding_table", rows: fieldingData.length,
      render: (limit) => <RenderFieldingDataTable fieldingData={fieldingData} limit={limit} /> },
    { label: "Rankings", cls: "rankings_table", rows: rankingData.length,
      render: (limit) => <RenderRankingDataTable rankingData={rankingData} limit={limit} /> },
  ];

  const total = panels[tab].rows;
  const expanded = open[tab];
  const toggle = () => {
    const next = !expanded;
    setOpen((o) => o.map((v, i) => (i === tab ? next : v)));
    // Collapsing pulls the page up by a dozen-plus rows; keep the control that
    // was just clicked in view instead of stranding the reader in the footer.
    if (!next) {
      requestAnimationFrame(() =>
        footRef.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" })
      );
    }
  };

  const title = compactSeriesName(tournament?.title);

  return (
    <section className="NZ_container center_aligned" aria-labelledby="tournament-stats-title">
      <div className="NZ_title ccc-nz-head">
        <h5 id="tournament-stats-title" className="oswald-bold p1 white_color uppercase">
          {title} Stats
        </h5>
        {siblings.length > 1 ? (
          <nav className="ccc-nz-tabs" aria-label={`Tournaments in ${year}`}>
            {siblings.map((t) => (
              <SeasonLink
                key={t.slug}
                href={`/tournaments/${year}/${t.slug}`}
                label={compactSeriesName(t.title)}
                active={t.slug === tournament?.slug}
              />
            ))}
          </nav>
        ) : null}
      </div>

      <div className="NZ_NT_container">
        <Tabs selectedIndex={tab} onSelect={(i) => setTab(i)}>
          <div className="NZ_NT_tabList_parent">
            <TabList>
              {panels.map((p) => (
                <Tab key={p.label} className="roboto-condensed-bold react-tabs__tab p4 grey_text">
                  {p.label}
                </Tab>
              ))}
            </TabList>
          </div>

          {panels.map((p, i) => (
            <TabPanel key={p.label} className={`react-tabs__tab-panel NZNT_table ${p.cls}`}>
              {p.render(open[i] ? undefined : TOP_N)}
            </TabPanel>
          ))}
        </Tabs>

        {total > TOP_N ? (
          <div className="ccc-nz-foot" ref={footRef}>
            <p className="ccc-nz-foot-note">
              {expanded ? `All ${total} players` : `Top ${TOP_N} of ${total} players`}
            </p>
            <button
              type="button"
              className="ccc-btn ccc-btn-ghost ccc-nz-more"
              aria-expanded={expanded}
              onClick={toggle}
            >
              {expanded ? `Show top ${TOP_N}` : `Show all ${total}`}
              <i className={`ccc-nz-more-chev${expanded ? " is-open" : ""}`} aria-hidden="true">▾</i>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
