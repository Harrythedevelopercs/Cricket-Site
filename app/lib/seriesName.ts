// Short, human label for a CricClubs series name, for headings and tab strips
// that already sit under the season's year:
//
//   "Master Royal RedBall Premier"        -> "RedBall Premier"
//   "RedBall Division II"                 -> "RedBall Div II"
//   "Master Royal RedBall 2024 Playoffs"  -> "RedBall Playoffs"
//   "SBCC T20 Blast 2025"                 -> "SBCC T20 Blast"
//
// Drops the year (the page is already under it), the title sponsor's prefix,
// and abbreviates "Division". Everything else is left as CricClubs spells it —
// "Red Ball" and "RedBall" both survive, on purpose.

const SPONSOR_PREFIXES = ["Master Royal"];

export function compactSeriesName(name: string | null | undefined): string {
  const raw = (name ?? "").trim();
  let s = raw;
  for (const prefix of SPONSOR_PREFIXES) {
    if (s.toLowerCase().startsWith(`${prefix.toLowerCase()} `)) s = s.slice(prefix.length);
  }
  s = s
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(/\bDivision\b/gi, "Div")
    .replace(/\s+/g, " ")
    .trim();
  return s || raw;
}
