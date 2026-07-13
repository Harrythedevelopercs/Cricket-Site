import assert from "node:assert/strict";
import test from "node:test";

async function loadFormatter() {
  try {
    return (await import("./scorecardText")).formatDismissal;
  } catch {
    return undefined;
  }
}

test("formats a wicketkeeper catch without exposing the HTML entity", async () => {
  const formatDismissal = await loadFormatter();
  if (!formatDismissal) assert.fail("formatDismissal is not implemented");

  assert.equal(
    formatDismissal("c &#8224;Ravi P b Aakash P"),
    "c Ravi P (wk) b Aakash P"
  );
});

test("removes missing-catcher artifacts from wicketkeeper dismissals", async () => {
  const formatDismissal = await loadFormatter();
  if (!formatDismissal) assert.fail("formatDismissal is not implemented");

  assert.equal(formatDismissal("c &#8224;null b Ajith R"), "c (wk) b Ajith R");
  assert.equal(formatDismissal("c &#8224; b Deep S"), "c (wk) b Deep S");
});

test("decodes other entities and preserves ordinary dismissal notation", async () => {
  const formatDismissal = await loadFormatter();
  if (!formatDismissal) assert.fail("formatDismissal is not implemented");

  assert.equal(formatDismissal("run out (Tom &amp; Jerry)"), "run out (Tom & Jerry)");
  assert.equal(formatDismissal("  c  Nitant K   b  Aditya A  "), "c Nitant K b Aditya A");
  assert.equal(formatDismissal("not out"), "not out");
});
