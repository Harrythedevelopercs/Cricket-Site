export type PlayerSort = "runs" | "matches" | "wickets" | "name";

export interface DirectoryPlayer {
  id: string;
  title?: string;
  matches?: number;
  totalruns?: number;
  wickets?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  [key: string]: unknown;
}

interface DirectoryOptions {
  query: string;
  leadershipOnly: boolean;
  sort: PlayerSort;
}

const PHONE_PATTERN = /(?:\+?1[\s.-]*)?(?:\(?\d{3}\)?[\s.-]*)\d{3}[\s.-]*\d{4}\b/g;

export function sanitizePlayerDisplayName(value?: string | null): string {
  const clean = String(value ?? "")
    .replace(PHONE_PATTERN, " ")
    .replace(/\s+/g, " ")
    .replace(/[\s([{,:;|/-]+$/g, "")
    .replace(/^[\s)\]}:;|/-]+/g, "")
    .trim();

  return clean || "Player";
}

const numberValue = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

export function filterAndSortPlayers<T extends DirectoryPlayer>(
  players: readonly T[],
  { query, leadershipOnly, sort }: DirectoryOptions,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = players.filter((player) => {
    if (leadershipOnly && !player.isCaptain && !player.isViceCaptain) return false;
    return !normalizedQuery || sanitizePlayerDisplayName(player.title).toLocaleLowerCase().includes(normalizedQuery);
  });

  return [...visible].sort((a, b) => {
    if (sort === "name") {
      return sanitizePlayerDisplayName(a.title).localeCompare(sanitizePlayerDisplayName(b.title));
    }

    const key = sort === "runs" ? "totalruns" : sort;
    return (
      numberValue(b[key]) - numberValue(a[key]) ||
      sanitizePlayerDisplayName(a.title).localeCompare(sanitizePlayerDisplayName(b.title))
    );
  });
}
