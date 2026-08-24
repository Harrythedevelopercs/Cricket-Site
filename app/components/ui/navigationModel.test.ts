import assert from "node:assert/strict";
import test from "node:test";

import { buildNavigationItems } from "./navigationModel";

test("buildNavigationItems adds local routes before the primary action", () => {
  const items = buildNavigationItems([
    { id: "home", title: "Home", buttonToggle: false, hyperlink: { url: "/" }, navigationIcon: [] },
    { id: "login", title: "Log In", buttonToggle: false, hyperlink: { url: "https://mail.example.com" }, navigationIcon: [] },
    { id: "join", title: "Join Us", buttonToggle: true, hyperlink: { url: "/join-us" }, navigationIcon: [] },
  ]);

  assert.deepEqual(items.map((item) => item.title), [
    "Home",
    "Records",
    "Match Reports",
    "Gallery",
    "Our Story",
    "Join Us",
  ]);
});

test("buildNavigationItems de-duplicates CMS entries by destination", () => {
  const items = buildNavigationItems([
    { id: "cms-gallery", title: "Photos", buttonToggle: false, hyperlink: { url: "/gallery/" }, navigationIcon: [] },
    { id: "join", title: "Join Us", buttonToggle: true, hyperlink: { url: "/join-us" }, navigationIcon: [] },
  ]);

  assert.equal(items.filter((item) => item.hyperlink.url.replace(/\/$/, "") === "/gallery").length, 1);
  assert.equal(items.at(-1)?.title, "Join Us");
});
