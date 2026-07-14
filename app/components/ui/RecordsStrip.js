import Link from "next/link";

// Slim cross-link band: the record books live at /records but had no home-page
// entry point (reports and gallery already have their own sections).
export default function RecordsStrip() {
  return (
    <section className="base_paddings py-[6vw] lg:py-[2.2vw]">
      <div className="max_content center_aligned">
        <Link
          href="/records"
          className="ccc-card ccc-card-hover group flex flex-wrap items-center justify-between gap-5 px-6 py-5 lg:px-9 lg:py-7"
        >
          <div className="min-w-0">
            <p className="ds-eyebrow ds-eyebrow--orange">The record books</p>
            <h2 className="oswald-bold mt-1 uppercase text-[color:var(--text)] text-[5.5vw] lg:text-[1.6vw]">
              Club records &amp; milestones
            </h2>
            <p className="roboto-condensed-regular mt-1 text-[color:var(--text-muted)] text-[3.2vw] lg:text-[0.95vw]">
              Career leaders, season bests, and every CCC milestone in one place.
            </p>
          </div>
          <span className="ccc-btn ccc-btn-primary shrink-0" aria-hidden="true">
            View records <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </Link>
      </div>
    </section>
  );
}
