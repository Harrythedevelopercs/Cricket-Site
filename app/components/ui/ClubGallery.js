"use client";

// "From the Field" — a horizontal strip of real club photography on the home
// page. Renders nothing until the manifest has photos, so the section can ship
// ahead of the assets.

import Image from "next/image";
import Link from "next/link";
import { CLUB_PHOTOS } from "../../lib/clubPhotos";

export default function ClubGallery({ limit = 8 }) {
  const photos = CLUB_PHOTOS.slice(0, limit);
  if (photos.length === 0) return null;

  return (
    <section className="base_paddings py-[9vw] lg:py-[3vw] relative z-[6]">
      <div className="max_content center_aligned mx-auto">
        <div className="flex items-end justify-between mb-[5vw] lg:mb-[1.6vw]">
          <div className="flex items-center gap-[3vw] lg:gap-[0.8vw]">
            <span className="inline-block w-[1.2vw] lg:w-[5px] h-[7vw] lg:h-[1.9vw] bg-[var(--orange)] rounded-[2px]" />
            <h2 className="oswald-bold text-[color:var(--text)] uppercase text-[6.5vw] lg:text-[2vw] leading-none tracking-wide">
              From the Field
            </h2>
          </div>
          <Link
            href="/gallery"
            className="roboto-condensed-bold text-[color:var(--orange)] uppercase tracking-wider text-[3vw] lg:text-[0.85vw] no_underline hover:underline shrink-0"
          >
            All photos →
          </Link>
        </div>

        <div className="flex gap-[3vw] lg:gap-[1vw] overflow-x-auto pb-[2vw] lg:pb-[0.6vw] snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
          {photos.map((p) => (
            <Link
              key={p.src}
              href="/gallery"
              className="relative shrink-0 snap-start w-[70vw] h-[46vw] lg:w-[22vw] lg:h-[14.6vw] rounded-[2vw] lg:rounded-[0.6vw] overflow-hidden bg-[var(--panel)] group"
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 1024px) 70vw, 22vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                unoptimized
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
