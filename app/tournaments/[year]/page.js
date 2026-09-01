'use client';

import { useEffect, useState } from 'react';
import SectionTitleEle from '../../components/ui/SectionTitleEle';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Skel } from '../../components/skeletons/PageSkeletons';
// Tournaments list now comes from the local DB (Neon) via /api/tournaments (includes 2026).

const getFullImageUrl = (url) => {
  const cmsBaseUrl = process.env.NEXT_PUBLIC_CMS_URL || 'https://cms-ccc.ddev.site/';
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
  const baseUrl = cmsBaseUrl.endsWith('/') ? cmsBaseUrl : `${cmsBaseUrl}/`;
  return `${baseUrl}${cleanUrl}`;
};

function SeriesCard({ imageUrl, seriesName, hyperLink }) {
  return (
    <div className="w-full h-auto">
      <Link href={hyperLink}>
        <Image
          src={imageUrl}
          width={750}
          height={960}
          className="w-full h-auto object-contain"
          alt={`${seriesName} Flag Image`}
          unoptimized
        />
        <h4 className="roboto-condensed-med p1 text-[color:var(--text)] text-center uppercase mt-[2%]">
          {seriesName}
        </h4>
      </Link>
    </div>
  );
}

export default function Page() {
  const [entries, setEntries] = useState([]);
  // 'loading' → 'ready' | 'empty' (the year has no series) | 'failed' (the
  // server couldn't answer — a different message, never "no series found").
  const [state, setState] = useState('loading');
  const pathname = usePathname();
  const currentSlug = pathname.split('/').pop();

  useEffect(() => {
    fetch('/api/tournaments?view=list')
      .then(async (r) => {
        const data = await r.json();
        // A failed read is { entries: [], error } with a 500 — it must land in
        // the failed state, not read as a year with no series.
        if (!r.ok || data?.error || !Array.isArray(data?.entries)) {
          throw new Error(data?.error || `Tournaments request failed: ${r.status}`);
        }

        const relatedTournaments = data.entries.filter(
          (entry) =>
            entry.typeHandle === 'tournamentPage' && entry.parent && entry.parent.slug === currentSlug
        );

        if (!relatedTournaments.length) {
          setState('empty');
        } else {
          setEntries(relatedTournaments);
          setState('ready');
        }
      })
      .catch((err) => {
        console.error('Error fetching tournament data:', err);
        setState('failed');
      });
  }, [currentSlug]);

  return (
    <section className="allPlayersPanel_header base_paddings">
      <div className="LSC_parent PlayersPage center_aligned px-[3.5%] py-[2%] bg-[var(--panel)] border border-[var(--panel-line)] rounded-[2vw] pb-[6vw]">
        <SectionTitleEle>Series</SectionTitleEle>
        <hr className="w-full h-[0.1vw] bg-[var(--panel-line-strong)] border-none" />

        {state === 'loading' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[8vw] mt-[5%]">
            {[0, 1, 2].map((i) => (
              <Skel key={i} className="aspect-[3/4] w-full" />
            ))}
          </div>
        ) : state === 'failed' ? (
          <div className="py-[8vw] lg:py-[3vw] text-center">
            <p className="roboto-condensed-bold uppercase text-[color:var(--text)] text-[4.5vw] lg:text-[1.2vw]">
              This season didn&rsquo;t load
            </p>
            <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.4vw] lg:text-[0.92vw] mt-[2vw] lg:mt-[0.5vw]">
              Usually a slow wake-up, not an outage — give it a moment and try again.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="ccc-btn ccc-btn-primary mt-[4vw] lg:mt-[1.1vw]">
              Reload
            </button>
          </div>
        ) : state === 'empty' ? (
          <div className="py-[8vw] lg:py-[3vw] text-center">
            <p className="roboto-condensed-bold uppercase text-[color:var(--text)] text-[4.5vw] lg:text-[1.2vw]">
              No series recorded for this season
            </p>
            <Link
              href="/tournaments"
              className="roboto-condensed-bold uppercase inline-block mt-[3vw] lg:mt-[0.9vw] text-[color:var(--orange)] hover:text-[color:var(--orange-bright)] transition-colors text-[3.4vw] lg:text-[0.9vw]"
            >
              All tournaments &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-[8vw] mt-[5%]">
            {entries.map((entry) => (
              <SeriesCard
                key={entry.id}
                imageUrl={entry.flagImage?.[0]?.url ? getFullImageUrl(entry.flagImage[0].url) : '/images/logo.png'}
                seriesName={entry.title}
                hyperLink={`/tournaments/${currentSlug}/${entry.slug}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
