"use client";

// A spinning seam for the handful of genuinely indeterminate waits — Neon cold
// starts and the CMS-backed pages that still render bare "Loading…" text.
//
// Deliberately NOT a replacement for the page skeletons in PageSkeletons.tsx:
// those mirror each page's real layout and so avoid a content shift when the data
// lands, which a centred spinner cannot do. This is only for the places that had
// no loading treatment at all.

export default function BallLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="ccc-ball-loader" role="status" aria-live="polite">
      <span className="ccc-ball-loader-art" aria-hidden="true">
        <svg viewBox="0 0 100 100">
          <defs>
            <radialGradient id="ccc-loader-leather" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#E8695E" />
              <stop offset="62%" stopColor="#A82A20" />
              <stop offset="100%" stopColor="#6E1710" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="46" fill="url(#ccc-loader-leather)" />
          <path
            d="M22 22 A46 46 0 0 1 22 78"
            fill="none" stroke="#F4EFE6" strokeWidth="2.4"
            strokeDasharray="5 6" strokeLinecap="round"
          />
          <path
            d="M31 17 A46 46 0 0 1 31 83"
            fill="none" stroke="#F4EFE6" strokeWidth="2"
            strokeDasharray="5 6" strokeLinecap="round" opacity="0.65"
          />
          <ellipse cx="34" cy="27" rx="13" ry="8" fill="#fff" opacity="0.2" transform="rotate(-28 34 27)" />
        </svg>
      </span>
      <p className="ccc-ball-loader-label">{label}</p>
    </div>
  );
}
