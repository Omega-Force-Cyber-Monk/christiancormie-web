import assert from "node:assert/strict";
import test from "node:test";
import { normalizeApiError } from "./normalizeApiError.ts";

test("unknown/primitive errors are safe", () => {
  for (const value of [null, undefined, "oops", 42, { status: 400, data: null }]) {
    assert.equal(typeof normalizeApiError(value).message, "string");
  }
});

test("temporary failures differ from definitive authentication errors", () => {
  assert.equal(normalizeApiError({ status: "FETCH_ERROR" }).kind, "NETWORK");
  assert.equal(normalizeApiError({ status: "TIMEOUT_ERROR" }).kind, "NETWORK");
  assert.equal(normalizeApiError({ status: 401 }).kind, "AUTHENTICATION");
  const error = normalizeApiError({
    status: 500,
    data: { message: "private database details" },
  });
  assert.equal(error.kind, "SERVER");
  assert.ok(!error.message.includes("private"));
});

test("validation errors map to fields without inventing empty field errors", () => {
  assert.deepEqual(
    normalizeApiError({ status: 422, data: { errors: { email: ["Invalid email"] } } })
      .fieldErrors,
    { email: "Invalid email" },
  );
  assert.equal(
    normalizeApiError({ status: 400, data: { errors: {} } }).fieldErrors,
    undefined,
  );
});
