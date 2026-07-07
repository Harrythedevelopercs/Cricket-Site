"use client";

// Photo gallery — the club's own match photography, full set.

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { CLUB_PHOTOS } from "../lib/clubPhotos";
import PageTransition from "../components/ui/PageTransition";
import { usePageTitle } from "../lib/usePageTitle";

interface ClubPhoto {
  src: string;
  alt: string;
  w: number;
  h: number;
}

function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
}: {
  photo: ClubPhoto;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-[4vw] lg:p-[3vw]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
    >
      <div
        className="relative max-w-[92vw] max-h-[84vh] w-full h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="92vw"
          className="object-contain"
          unoptimized
          priority
        />
      </div>
      <p className="absolute bottom-[3vw] lg:bottom-[1.5vw] left-1/2 -translate-x-1/2 roboto-condensed-regular text-white/80 text-[3.2vw] lg:text-[0.95vw] text-center px-4">
        {photo.alt}
      </p>
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute top-[3vw] right-[3vw] lg:top-[1.5vw] lg:right-[1.5vw] text-white/80 hover:text-white oswald-regular text-[7vw] lg:text-[2vw] leading-none"
      >
        ×
      </button>
      <button
        aria-label="Previous photo"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-[2vw] lg:left-[1vw] top-1/2 -translate-y-1/2 text-white/70 hover:text-white oswald-regular text-[9vw] lg:text-[2.6vw] leading-none px-2"
      >
        ‹
      </button>
      <button
        aria-label="Next photo"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-[2vw] lg:right-[1vw] top-1/2 -translate-y-1/2 text-white/70 hover:text-white oswald-regular text-[9vw] lg:text-[2.6vw] leading-none px-2"
      >
        ›
      </button>
    </div>
  );
}

export default function GalleryPage() {
  usePageTitle("From the Field");
  const photos = CLUB_PHOTOS as ClubPhoto[];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const close = useCallback(() => setOpenIdx(null), []);
  const prev = useCallback(
    () => setOpenIdx((i) => (i == null ? i : (i + photos.length - 1) % photos.length)),
    [photos.length]
  );
  const next = useCallback(
    () => setOpenIdx((i) => (i == null ? i : (i + 1) % photos.length)),
    [photos.length]
  );

  return (
    <PageTransition>
      <section className="base_paddings pt-[100px] lg:pt-[136px] pb-[10vw] lg:pb-[4vw] min-h-screen">
        <div className="max_content center_aligned mx-auto">
          <p className="ds-eyebrow ds-eyebrow--orange">Club Cricket of Chicago</p>
          <h1 className="ds-display text-[color:var(--text)] uppercase text-[10vw] lg:text-[3.4vw] leading-none mb-[2vw] lg:mb-[0.6vw]">
            From the Field
          </h1>
          <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw]">
            Our own matches, our own people — photographed by the club.
          </p>
          <p className="roboto-condensed-regular text-[color:var(--text-dim)] text-[3.2vw] lg:text-[0.85vw] mt-[2vw] lg:mt-[0.5vw] mb-[7vw] lg:mb-[2.2vw]">
            Got shots from a match day? Send them to{" "}
            <a
              href="mailto:connect@clubcricketofchicago.com?subject=Match%20photos"
              className="text-[color:var(--orange)] underline underline-offset-2"
            >
              connect@clubcricketofchicago.com
            </a>{" "}
            — we&apos;ll add the best ones here.
          </p>

          {photos.length === 0 ? (
            <div className="ccc-card rounded-[2vw] lg:rounded-[0.6vw] p-[8vw] lg:p-[3vw] text-center">
              <p className="roboto-condensed-regular text-[color:var(--text-muted)] text-[3.6vw] lg:text-[1vw]">
                Photos from recent matches are on their way.
              </p>
            </div>
          ) : (
            <div className="columns-2 lg:columns-3 gap-[3vw] lg:gap-[1vw] [column-fill:_balance]">
              {photos.map((p, i) => (
                <button
                  key={p.src}
                  onClick={() => setOpenIdx(i)}
                  className="relative block w-full mb-[3vw] lg:mb-[1vw] rounded-[2vw] lg:rounded-[0.6vw] overflow-hidden bg-[var(--panel)] group break-inside-avoid"
                  aria-label={`Open photo: ${p.alt}`}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    width={p.w}
                    height={p.h}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {openIdx != null && photos[openIdx] && (
        <Lightbox photo={photos[openIdx]} onClose={close} onPrev={prev} onNext={next} />
      )}
    </PageTransition>
  );
}
