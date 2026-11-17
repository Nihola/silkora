import assert from "node:assert/strict";
import test from "node:test";
import { scoreMatch, type MatchTraveler } from "../lib/host-match.ts";

const traveler: MatchTraveler = { languages: ["English"], interests: ["food", "history"], maxPrice: 20, needs: ["halal", "family"], preferRural: true, preferWomenRun: true };

test("scoreMatch returns a perfect score and reasons for a complete fit", () => {
  const result = scoreMatch(traveler, { languages: ["English"], interests: ["food", "history"], price: 18, rural: true, womenRun: true, accessibility: { halal: true, family: true } });
  assert.equal(result.score, 100);
  assert.deepEqual(new Set(result.reasons.map(({ key }) => key)), new Set(["language", "interest", "price", "needs", "preference"]));
});

test("scoreMatch is case-insensitive and never exceeds its bounds", () => {
  const result = scoreMatch({ ...traveler, languages: ["english"], interests: ["FOOD"] }, { languages: ["English"], interests: ["food"], price: 500, rural: false, womenRun: false });
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.ok(result.reasons.some(({ key }) => key === "language"));
});

test("scoreMatch gives a small preference boost and keeps required needs visible", () => {
  const base = scoreMatch({ ...traveler, needs: [], preferRural: false, preferWomenRun: false }, { languages: [], interests: [], price: 20, rural: false, womenRun: false });
  const preferred = scoreMatch({ ...traveler, needs: [], preferRural: true, preferWomenRun: true }, { languages: [], interests: [], price: 20, rural: true, womenRun: true });
  assert.equal(preferred.score - base.score, 5);
  assert.ok(scoreMatch(traveler, { languages: [], interests: [], price: 20, rural: false, womenRun: false }).score < 100);
});
