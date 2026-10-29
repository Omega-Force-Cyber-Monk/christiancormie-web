import assert from "node:assert/strict";
import test from "node:test";
import { applyServerFieldErrors } from "./applyServerFieldErrors.ts";
import { normalizeApiError } from "./normalizeApiError.ts";
import { normalizeAuthError } from "../../features/auth/utils/authErrors.ts";

test("only structured field errors apply generically; validation arrays stay at form level", () => {
  const calls = [];
  const setError = (...args) => calls.push(args);
  applyServerFieldErrors(
    normalizeApiError({ status: 400, data: { message: ["email must be an email"] } }),
    setError,
  );
  assert.deepEqual(calls, []);
  applyServerFieldErrors(
    normalizeApiError({ status: 422, data: { errors: { email: ["Invalid email"] } } }),
    setError,
  );
  assert.deepEqual(calls, [["email", { type: "server", message: "Invalid email" }]]);
});

test("form-specific allowlists prevent unsupported or unsafe server fields being registered", () => {
  const calls = [];
  const fields = JSON.parse(
    '{"email":"Bad email","businessName":"Unsupported by this form","__proto__":"unsafe","profile.constructor":"unsafe"}',
  );
  applyServerFieldErrors(
    { kind: "VALIDATION", message: "Invalid", fieldErrors: fields },
    (...args) => calls.push(args),
    ["email", "password"],
  );
  assert.deepEqual(calls, [["email", { type: "server", message: "Bad email" }]]);
});

test("auth field mapping recognizes validator diagnostics but never general prose or unknown fields", () => {
  const error = normalizeAuthError({
    status: 400,
    data: {
      message: [
        "email delivery failed",
        "phone must be a valid phone number",
        "phone must be a string",
        "displayName must be shorter than or equal to 150 characters",
        "unrecognized must be a string",
        "A general validation failure",
      ],
    },
  });
  assert.deepEqual(error.fieldErrors, {
    phone: "phone must be a valid phone number",
    name: "displayName must be shorter than or equal to 150 characters",
  });
  assert.match(error.message, /email delivery failed/);
  assert.equal(error.validationMessages.length, 6);
  const unmapped = normalizeAuthError({
    status: 400,
    data: { message: ["email delivery failed"] },
  });
  assert.equal(unmapped.fieldErrors, undefined);
});

test("explicit structured errors take priority over auth array mappings and 422 arrays also work", () => {
  const error = normalizeAuthError({
    status: 422,
    data: {
      message: ["email must be an email", "displayName must be a string"],
      errors: { email: "Explicit email error", name: ["Explicit name error"] },
    },
  });
  assert.deepEqual(error.fieldErrors, {
    email: "Explicit email error",
    name: "Explicit name error",
  });
  const calls = [];
  applyServerFieldErrors(error, (...args) => calls.push(args), ["email", "password"]);
  assert.equal(calls.length, 1);
});

test("server failures cannot leak through auth-specific mapping into fields", () => {
  const error = normalizeAuthError({
    status: 500,
    data: {
      message: ["email must be secret"],
      errors: { password: "private" },
      details: "private",
    },
  });
  const calls = [];
  applyServerFieldErrors(error, (...args) => calls.push(args));
  assert.deepEqual(calls, []);
  assert.doesNotMatch(JSON.stringify(error), /private|secret/);
});
