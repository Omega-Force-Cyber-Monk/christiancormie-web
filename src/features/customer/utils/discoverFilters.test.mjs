import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultDiscoverFilters,
  getDiscoverFilterCount,
  matchesDiscoverFilters,
} from "./discoverFilters.ts";

const sample = { cuisine: "Mexican", distance: 1, rating: 4.2, stars: 5 };

test("default filters include every sample and have no active criteria", () => {
  assert.equal(getDiscoverFilterCount(defaultDiscoverFilters), 0);
  assert.equal(matchesDiscoverFilters(sample, defaultDiscoverFilters), true);
});

test("cuisines match any selection while distance and rating apply together", () => {
  const filters = { cuisines: ["Japanese", "Mexican"], distance: 1, minimumRating: 4 };
  assert.equal(getDiscoverFilterCount(filters), 4);
  assert.equal(matchesDiscoverFilters(sample, filters), true);
  assert.equal(
    matchesDiscoverFilters({ ...sample, cuisine: "Italian" }, filters),
    false,
  );
  assert.equal(matchesDiscoverFilters({ ...sample, distance: 1.1 }, filters), false);
  assert.equal(matchesDiscoverFilters({ ...sample, rating: 3.9 }, filters), false);
});

test("rating thresholds are inclusive and prefer exact scores to card stars", () => {
  const filters = { cuisines: [], distance: null, minimumRating: 4.5 };
  assert.equal(matchesDiscoverFilters(sample, filters), false);
  assert.equal(matchesDiscoverFilters({ ...sample, rating: 4.5 }, filters), true);
  assert.equal(matchesDiscoverFilters({ ...sample, rating: undefined }, filters), true);
  assert.equal(
    matchesDiscoverFilters({ ...sample, rating: undefined, stars: 4 }, filters),
    false,
  );
});
