import type { Metadata } from "next";

import { getPlayerProfile } from "../../lib/data/player";
import PlayerProfileClient, { type Profile } from "./PlayerProfileClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ playerId: string }> };

const parseId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

async function loadProfile(raw: string): Promise<Profile | null> {
  const id = parseId(raw);
  if (id === null) return null;
  try {
    return (await getPlayerProfile(id)) as Profile;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const p = await loadProfile(playerId);
  if (!p || !p.bio) return { title: "Player Profile" };
  const description = [
    p.role,
    `${p.season.runs} runs and ${p.season.wickets} wickets this season for Club Cricket of Chicago`,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: p.name,
    description,
    openGraph: {
      title: `${p.name} | Club Cricket of Chicago`,
      description,
      ...(p.photo ? { images: [{ url: p.photo }] } : {}),
    },
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { playerId } = await params;
  const initialProfile = await loadProfile(playerId);
  return <PlayerProfileClient playerId={playerId} initialProfile={initialProfile} />;
}
