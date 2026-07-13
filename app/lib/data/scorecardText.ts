const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  dagger: "†",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&#(?:x([\da-f]+)|(\d+));|&([a-z]+);/gi, (entity, hex, decimal, named) => {
    if (hex || decimal) {
      const codePoint = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
      } catch {
        return entity;
      }
    }
    return NAMED_ENTITIES[String(named).toLowerCase()] ?? entity;
  });
}

/** Turn CricClubs' raw dismissal HTML into readable, plain scorecard text. */
export function formatDismissal(raw: unknown): string {
  const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  const text = decodeHtmlEntities(value)
    .replace(/\bnull\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const keeperCatch = text.match(/^c\s*†\s*(.*?)\s+b\s+(.+)$/i);
  if (!keeperCatch) return text;

  const catcher = keeperCatch[1].trim();
  const bowler = keeperCatch[2].trim();
  return catcher ? `c ${catcher} (wk) b ${bowler}` : `c (wk) b ${bowler}`;
}
