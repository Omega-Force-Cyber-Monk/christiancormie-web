import assert from "node:assert/strict";
import test from "node:test";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatNumber,
  getInitials,
} from "./adminFormat.ts";

test("missing/invalid amounts differ from a real zero and preserve cents", () => {
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatCurrency(value), "N/A");
    assert.equal(formatNumber(value), "N/A");
  }
  assert.equal(formatCurrency(0), "$0.00");
  assert.equal(formatCurrency(1234.56), "$1,234.56");
  assert.equal(formatCurrency(-12.34), "-$12.34");
});

test("invalid dates do not throw or produce NaN", () => {
  for (const value of [null, undefined, "", "invalid", "2026-99-99"]) {
    assert.equal(formatDate(value), "N/A");
    assert.equal(formatRelativeTime(value), "N/A");
  }
  assert.match(formatDate("2026-10-14T12:00:00Z"), /2026/);
});

test("initials tolerate absent names and extra whitespace", () => {
  assert.equal(getInitials(null), "?");
  assert.equal(getInitials("  Ada   Lovelace  "), "AL");
});
