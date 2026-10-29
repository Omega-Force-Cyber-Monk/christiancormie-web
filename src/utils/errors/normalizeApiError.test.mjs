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

test("Nest validation arrays preserve readable messages and safe details without guessing fields", () => {
  const details = { requestId: "test-request" };
  const error = normalizeApiError({
    status: 400,
    data: {
      message: [
        "email must be an email",
        "password must be longer than or equal to 8 characters",
      ],
      details,
    },
  });
  assert.equal(error.kind, "VALIDATION");
  assert.equal(
    error.message,
    "email must be an email password must be longer than or equal to 8 characters",
  );
  assert.deepEqual(error.validationMessages, [
    "email must be an email",
    "password must be longer than or equal to 8 characters",
  ]);
  assert.equal(error.fieldErrors, undefined);
  assert.deepEqual(error.details, details);
});

test("array handling tolerates malformed members, deduplicates and preserves distinct validations", () => {
  const error = normalizeApiError({
    status: 422,
    data: {
      message: [
        null,
        "",
        "   ",
        12,
        { message: "not a string" },
        " email must be an email ",
        "email must be an email",
        "Another validation",
      ],
    },
  });
  assert.deepEqual(error.validationMessages, [
    "email must be an email",
    "Another validation",
  ]);
  assert.equal(error.message, "email must be an email Another validation");
  for (const message of [[], [null, 1, {}], "", " "]) {
    const fallback = normalizeApiError({ status: 400, data: { message } });
    assert.equal(fallback.message, "The request could not be completed.");
    assert.equal(fallback.fieldErrors, undefined);
    assert.equal(fallback.validationMessages, undefined);
  }
});

test("string messages, status, code and structured fields retain their contract", () => {
  const error = normalizeApiError({
    status: 422,
    data: {
      message: "Check your input",
      code: "VALIDATION_FAILED",
      errors: {
        email: ["Invalid email", "Another error"],
        password: "Too short",
        ignored: null,
      },
      details: { reason: "invalid" },
    },
  });
  assert.equal(error.message, "Check your input");
  assert.equal(error.kind, "VALIDATION");
  assert.equal(error.status, 422);
  assert.equal(error.code, "VALIDATION_FAILED");
  assert.deepEqual(error.fieldErrors, {
    email: "Invalid email",
    password: "Too short",
  });
  assert.deepEqual(error.details, { reason: "invalid" });
  assert.equal(error.validationMessages, undefined);
});

test("structured maps coexist with validation arrays and ignore unsafe or malformed fields", () => {
  const errors = JSON.parse(
    '{"email":[null,"","Useful email error"],"profile.name":"Name error","constructor":"unsafe","__proto__":"unsafe","items[0].__proto__.name":"unsafe","empty":[]}',
  );
  const error = normalizeApiError({
    status: 400,
    data: { message: ["A validation failed"], errors },
  });
  assert.deepEqual(error.fieldErrors, {
    email: "Useful email error",
    "profile.name": "Name error",
  });
  assert.equal(error.message, "A validation failed");
});

test("all 5xx payload internals are suppressed, including field messages, details and codes", () => {
  for (const status of [500, 502, 503]) {
    const error = normalizeApiError({
      status,
      data: {
        message: ["password secret", "database stack trace"],
        errors: { email: "private SQL" },
        details: { stack: "private stack", token: "private token" },
        code: "PRIVATE_DB_CODE",
      },
    });
    assert.equal(error.kind, "SERVER");
    assert.equal(
      error.message,
      "The server could not complete the request. Please try again.",
    );
    assert.equal(error.fieldErrors, undefined);
    assert.equal(error.validationMessages, undefined);
    assert.equal(error.details, undefined);
    assert.equal(error.code, undefined);
    assert.doesNotMatch(JSON.stringify(error), /private|secret|PRIVATE/);
  }
  assert.doesNotMatch(
    JSON.stringify(
      normalizeApiError({
        status: "FETCH_ERROR",
        error: "private request URL or headers",
      }),
    ),
    /private/,
  );
});
