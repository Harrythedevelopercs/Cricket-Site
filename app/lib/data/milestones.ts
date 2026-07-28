// Career milestone ladders — the single source of truth for both the server-side
// derivation (records.ts picks the highest threshold a player has crossed) and the
// client-side gate markers (MilestoneGates.tsx draws one gate per rung).
//
// This module deliberately has NO imports. records.ts pulls in Prisma, so a client
// component importing the ladders from there would drag the database client into
// the browser bundle.

/** Career run milestones, highest first. */
export const RUN_THRESHOLDS = [1500, 1000, 500];

/** Career wicket milestones, highest first. */
export const WICKET_THRESHOLDS = [75, 50, 25];
