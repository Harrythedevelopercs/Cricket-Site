# UI/UX Evolution Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a safe, temporary preview of the approved UI/UX evolution with an accessible shared shell, a searchable compact Players directory, and clearer tournament and Match Centre journeys.

**Architecture:** Keep the existing Next.js App Router and Chicago Dusk design tokens, but replace imperative navigation behavior with an accessible Radix dialog and move privacy/filter behavior into tested pure utilities. The visual preview is deliberately evolutionary: it modernizes representative data-heavy routes without changing the database, sync jobs, forms, or CricClubs calling behavior.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind utility classes, existing CSS design tokens, Radix UI Dialog, Node test runner through `tsx`, Chrome DevTools, Cloudflare Quick Tunnel.

**Revision (2026-07-13):** At the user’s request, Task 4’s tournament-detail redesign was rolled back to the exact `main` implementation. All other preview tasks remain in place.

---

### Task 1: Tested player privacy and discovery model

**Files:**
- Create: `app/lib/playerDirectory.ts`
- Create: `app/lib/playerDirectory.test.ts`

- [x] **Step 1: Write the failing tests**

Create tests that assert `sanitizePlayerDisplayName` removes phone-like suffixes without damaging ordinary names, and that `filterAndSortPlayers` supports query, leadership-only, and runs/matches/wickets/name sorting without mutating its input.

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx tsx --test app/lib/playerDirectory.test.ts`

Expected: FAIL because `playerDirectory.ts` does not exist.

- [x] **Step 3: Implement the pure directory utilities**

Define a `DirectoryPlayer` shape, a phone-pattern sanitizer that returns `"Player"` when no safe text remains, and stable filtering/sorting with numeric fallbacks of zero.

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx tsx --test app/lib/playerDirectory.test.ts`

Expected: all tests PASS.

- [x] **Step 5: Commit the privacy model**

Run: `git add app/lib/playerDirectory.ts app/lib/playerDirectory.test.ts && git commit -m "test: protect player names and directory sorting"`

### Task 2: Accessible shared shell and navigation

**Files:**
- Create: `app/components/ui/navigationModel.ts`
- Create: `app/components/ui/navigationModel.test.ts`
- Modify: `app/components/ui/HeaderNavPanel.js`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [x] **Step 1: Write the failing navigation-model test**

Test that `buildNavigationItems` inserts Records, Match Reports, Gallery, and Our Story before the Join Us button, relabels the external login destination as Staff Webmail, and does not duplicate local entries already supplied by the CMS.

- [x] **Step 2: Run the model test to verify it fails**

Run: `npx tsx --test app/components/ui/navigationModel.test.ts`

Expected: FAIL because `navigationModel.ts` does not exist.

- [x] **Step 3: Implement the navigation model**

Export the local item list and `buildNavigationItems(items)`, using URL/title keys for de-duplication and keeping the CMS button last.

- [x] **Step 4: Run the model test to verify it passes**

Run: `npx tsx --test app/components/ui/navigationModel.test.ts`

Expected: all tests PASS.

- [x] **Step 5: Replace the imperative mobile menu**

Use the existing `@radix-ui/react-dialog` dependency so the hamburger is a real button with an accessible label and expanded state, the drawer is a labelled modal navigation, focus is trapped/restored, Escape closes it, and each route closes it. Replace nested link/button markup with styled links, and use `buildNavigationItems` after the CMS fetch.

- [x] **Step 6: Give the document a semantic, metadata-aware shell**

Remove the client directive from `app/layout.tsx`, export Next `metadata` and `viewport`, add a keyboard-visible Skip to content link, and wrap route content in `<main id="main-content">`.

- [x] **Step 7: Restore visible keyboard focus and drawer styles**

Remove the global `:focus-visible { outline: none }`, retain the existing orange focus ring for form controls as well as links/buttons, and add responsive overlay/drawer/button CSS that works in both themes and honors reduced motion.

- [x] **Step 8: Verify shell behavior**

Run: `npx tsx --test app/components/ui/navigationModel.test.ts && npm run lint && npx tsc --noEmit`

Expected: tests PASS, no lint errors, and TypeScript exits 0.

- [x] **Step 9: Commit the shared shell**

Run: `git add app/components/ui/navigationModel.ts app/components/ui/navigationModel.test.ts app/components/ui/HeaderNavPanel.js app/layout.tsx app/globals.css && git commit -m "feat: make the site shell accessible"`

### Task 3: Searchable compact Players directory

**Files:**
- Modify: `app/players/page.tsx`
- Modify: `app/components/skeletons/PageSkeletons.tsx`

- [x] **Step 1: Connect the tested directory model**

Add query, leadership, and sort state; sanitize names immediately after fetching; derive visible entries with `filterAndSortPlayers`; and show a live result count plus a useful empty state.

- [x] **Step 2: Replace the oversized card layout**

Build a two-column mobile/four-column desktop grid with compact face-forward cards, one clear profile link per card, leadership badges, and three immediately readable statistics. Use a real `<h1>` and a short introduction above the controls.

- [x] **Step 3: Add accessible discovery controls**

Render labelled search and sort fields, an All Players/Leadership segmented control with pressed state, a Clear action, and responsive sticky controls that do not cover content.

- [x] **Step 4: Update the loading skeleton to match**

Change the players skeleton to two mobile columns and four desktop columns so the loading state does not cause a major layout jump.

- [x] **Step 5: Verify the directory**

Run: `npx tsx --test app/lib/playerDirectory.test.ts && npm run lint && npx tsc --noEmit`

Expected: tests PASS, no lint errors, and TypeScript exits 0.

- [x] **Step 6: Commit the Players preview**

Run: `git add app/players/page.tsx app/components/skeletons/PageSkeletons.tsx && git commit -m "feat: redesign player discovery"`

### Task 4: Tournament detail information hierarchy

**Files:**
- Create: `app/components/tournaments/TournamentDetailView.js`
- Modify: `app/tournaments/[year]/[slug]/page.js`

- [x] **Step 1: Build a clear tournament hero**

Render breadcrumbs, the tournament identity, year, quick previous/next actions as labelled buttons, and four summary metrics from the existing local API response.

- [x] **Step 2: Recompose existing data into scannable sections**

Use Overview/Fixtures & Results/Standings/Player Stats anchor navigation. Reuse existing player, highlights, fixtures, standings, and number-zone components inside consistent cards, while retaining all source data and empty states.

- [x] **Step 3: Remove non-semantic and unstable behavior**

Replace clickable pagination divs with buttons, use stable standing keys, add a visible H1, and set the browser title from the loaded tournament.

- [x] **Step 4: Verify the tournament route**

Run: `npm run lint && npx tsc --noEmit && npm run build`

Expected: no lint errors, TypeScript exits 0, and all Next routes build.

- [x] **Step 5: Commit the tournament preview**

Run: `git add app/components/tournaments/TournamentDetailView.js app/tournaments/[year]/[slug]/page.js && git commit -m "feat: clarify tournament journeys"`

### Task 5: Match Centre summary and mobile scorecard

**Files:**
- Modify: `app/match/[matchId]/page.tsx`

- [x] **Step 1: Strengthen the match summary**

Add a visible H1, an innings-at-a-glance score strip, improved result contrast, a Back to fixtures action, and a clearer date/location metadata row without changing the API request.

- [x] **Step 2: Improve mobile innings navigation**

Give each innings a stable anchor, add a sticky innings jump bar when multiple innings exist, preserve horizontal table scrolling with an explicit hint, and make dismissal text readable rather than miniature.

- [x] **Step 3: Update client-side metadata safely**

Use the existing page-title hook after the local scorecard loads so the tab identifies both teams without causing additional data calls.

- [x] **Step 4: Verify the scorecard with stored data**

Run: `npm run lint && npx tsc --noEmit && npm run build`

Then open `/match/9505` in the local browser and confirm the stored scorecard renders, wicketkeeper dismissals remain human-readable, no horizontal page overflow occurs, and no CricClubs request is made.

- [x] **Step 5: Commit the Match Centre preview**

Run: `git add app/match/[matchId]/page.tsx && git commit -m "feat: improve match centre readability"`

### Task 6: Browser verification and temporary Cloudflare preview

**Files:**
- Modify only if browser verification exposes a preview regression in the files above.

- [x] **Step 1: Run the complete verification suite**

Run: `npx tsx --test app/lib/playerDirectory.test.ts app/components/ui/navigationModel.test.ts && npm run lint && npx tsc --noEmit && npm run build`

Expected: all tests PASS, no lint errors, TypeScript exits 0, and the production build succeeds.

- [x] **Step 2: Start the production preview locally**

Run `npm run start -- --hostname 127.0.0.1 --port 3101` in a persistent session and verify `/`, `/players`, a current tournament detail route, and `/match/9505` return successful responses.

- [x] **Step 3: Test the user journeys in a real browser**

At desktop and mobile widths, verify skip-link/focus behavior, menu open/Escape/focus restore, Players search/filter/sort, tournament anchors, scorecard anchors, light/dark themes, console errors, image failures, and horizontal overflow.

- [x] **Step 4: Start a temporary Cloudflare Quick Tunnel**

Run `cloudflared tunnel --url http://127.0.0.1:3101 --no-autoupdate` in a persistent session and capture the generated `trycloudflare.com` URL.

- [x] **Step 5: Verify the public URL**

Open the generated URL in Chrome, confirm the same four routes load through the tunnel, and only then hand the URL to the user. Keep both local server and tunnel sessions alive for inspection.
