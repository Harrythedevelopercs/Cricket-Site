"use client";

// A cricket ball's stitched seam as the site's section rule — the stitches draw in
// as the divider scrolls into view. Signs a section boundary without another logo.

import { motion, useReducedMotion } from "framer-motion";

const STITCHES = 26;

export default function SeamRule({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <div className={`ccc-seam ${className}`} aria-hidden="true">
      <svg viewBox="0 0 600 26" preserveAspectRatio="none">
        <line x1="0" y1="13" x2="600" y2="13" className="ccc-seam-rule" />
        {Array.from({ length: STITCHES }, (_, i) => {
          const x = 40 + (i * 520) / (STITCHES - 1);
          const up = i % 2 === 0;
          return (
            <motion.line
              key={i}
              className="ccc-seam-stitch"
              x1={x - 5}
              y1={up ? 7 : 19}
              x2={x + 5}
              y2={up ? 19 : 7}
              initial={reduce ? false : { opacity: 0, scale: 0.2 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.028, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </svg>
    </div>
  );
}
