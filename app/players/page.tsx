import type { Metadata } from "next";

import { getPlayerEntries } from "../lib/data/players";
import PlayersDirectoryClient, { type Player } from "./PlayersDirectoryClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Players",
  description:
    "The full Club Cricket of Chicago roster — search players, find club leaders, and compare career runs, wickets, and matches.",
};

export default async function PlayersPage() {
  // First paint carries the roster; on a DB hiccup the client falls back to /api/players.
  let initialPlayers: Player[] | null = null;
  try {
    const data = await getPlayerEntries();
    initialPlayers = (data.entries ?? []) as unknown as Player[];
  } catch {
    initialPlayers = null;
  }
  return <PlayersDirectoryClient initialPlayers={initialPlayers} />;
}
