import assert from "node:assert/strict";
import test from "node:test";
import { URLSearchParams } from "node:url";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import { VendorPasswordPreviewForm } from "../components/settings/VendorPasswordPreviewForm.tsx";
import { VendorStaffManagement } from "../components/settings/VendorStaffManagement.tsx";
import {
  initialVendorSettingsState,
  vendorSettingsReducer,
  parseVendorSettingsView,
  vendorSettingsViewQuery,
  formatStaffDate,
  hasStaffEmail,
} from "./settingsState.ts";
import {
  vendorPasswordPreviewSchema,
  vendorStaffEmailSchema,
} from "../schemas/settings.schema.ts";
import { vendorStaffFixtures, vendorSettingsPreviews } from "../data/settings.data.ts";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { navigationItems } from "../../../config/navigation/navigation.config.ts";
import { routeMetadata } from "../../../router/metadata/routeMetadata.ts";
const noop = () => {};
const reduce = vendorSettingsReducer;
const addition = (overrides = {}) => ({
  type: "add",
  id: "local-staff",
  email: " New@Example.com ",
  addedOn: "2026-10-20",
  ...overrides,
});
test("settings is the safe default and staff navigation preserves unrelated query state", () => {
  for (const value of [null, "", "unknown", "Staff"])
    assert.equal(parseVendorSettingsView(value), "settings");
  assert.equal(parseVendorSettingsView("staff"), "staff");
  const original = new URLSearchParams("keep=1");
  const staff = vendorSettingsViewQuery(original, "staff");
  assert.equal(staff.get("view"), "staff");
  assert.equal(original.has("view"), false);
  const back = vendorSettingsViewQuery(staff, "settings");
  assert.equal(back.has("view"), false);
  assert.equal(back.get("keep"), "1");
});
test("staff creation normalizes email, retains the source entries, and labels local-only results", () => {
  const original = initialVendorSettingsState();
  const next = reduce(original, addition());
  assert.equal(next.staff.length, 3);
  assert.deepEqual(next.staff.slice(0, 2), original.staff);
  assert.equal(next.staff[2].email, "new@example.com");
  assert.equal(next.staff[2].locked, true);
  assert.match(next.staff[2].pin, /^\d{4}$/);
  assert.equal(new Set(next.staff.map((x) => x.pin)).size, 3);
  assert.match(next.status, /No invitation was sent/);
  assert.equal(original.staff.length, 2);
  assert.equal(vendorStaffFixtures.length, 2);
});
test("duplicate emails and IDs, invalid emails and dates never enter the local staff list", () => {
  const state = initialVendorSettingsState();
  for (const values of [
    { email: "bad" },
    { email: "" },
    { email: " MARIA@EXAMPLE.COM " },
    { id: "maria" },
    { id: "" },
    { addedOn: "invalid" },
    { addedOn: "2026-02-30" },
  ])
    assert.equal(reduce(state, addition(values)), state);
  assert.equal(hasStaffEmail(state.staff, " JAKE@example.com "), true);
  assert.equal(
    vendorStaffEmailSchema.safeParse({ email: "not-an-email" }).success,
    false,
  );
});
test("lock toggle and PIN reset affect only the selected sample member", () => {
  const initial = initialVendorSettingsState();
  const unlocked = reduce(initial, { type: "toggle-lock", id: "maria" });
  assert.equal(unlocked.staff[0].locked, false);
  assert.equal(unlocked.staff[1], initial.staff[1]);
  assert.equal(initial.staff[0].locked, true);
  const locked = reduce(unlocked, { type: "toggle-lock", id: "maria" });
  assert.equal(locked.staff[0].locked, true);
  const reset = reduce(locked, { type: "reset-pin", id: "jake" });
  assert.notEqual(reset.staff[1].pin, locked.staff[1].pin);
  assert.equal(reset.staff[0], locked.staff[0]);
  assert.match(reset.staff[1].pin, /^\d{4}$/);
  assert.match(reset.status, /No real credential was changed/);
  const resetAgain = reduce(reset, { type: "reset-pin", id: "jake" });
  assert.notEqual(resetAgain.staff[1].pin, reset.staff[1].pin);
});
test("confirmed local removal supports empty and re-add while missing IDs are ignored", () => {
  let state = initialVendorSettingsState();
  for (const type of ["remove", "reset-pin", "toggle-lock"])
    assert.equal(reduce(state, { type, id: "missing" }), state);
  state = reduce(state, { type: "remove", id: "maria" });
  assert.equal(state.staff.length, 1);
  assert.equal(state.staff[0].id, "jake");
  state = reduce(state, { type: "remove", id: "jake" });
  assert.equal(state.staff.length, 0);
  const empty = renderToStaticMarkup(
    h(VendorStaffManagement, { state, dispatch: noop, onBack: noop }),
  );
  assert.match(empty, /No staff members/);
  assert.match(empty, /Add Staff/);
  state = reduce(state, addition());
  assert.equal(state.staff.length, 1);
  assert.equal(initialVendorSettingsState().staff.length, 2);
});
test("staff dates are source-formatted and invalid input cannot throw", () => {
  assert.equal(formatStaffDate("2026-05-15"), "15/05/2026");
  assert.equal(formatStaffDate("2026-05-18"), "18/05/2026");
  for (const value of ["bad", "2026-02-30", "2026-13-01", ""])
    assert.equal(formatStaffDate(value), "Date unavailable");
});
test("password preview requires all fields, matching confirmation and a changed value", () => {
  const valid = {
    currentPassword: "old-example",
    newPassword: "new-example",
    confirmPassword: "new-example",
  };
  assert.equal(vendorPasswordPreviewSchema.safeParse(valid).success, true);
  for (const field of Object.keys(valid))
    assert.equal(
      vendorPasswordPreviewSchema.safeParse({ ...valid, [field]: "" }).success,
      false,
    );
  const mismatch = vendorPasswordPreviewSchema.safeParse({
    ...valid,
    confirmPassword: "different",
  });
  assert.equal(mismatch.success, false);
  assert.ok(mismatch.error.issues.some((issue) => issue.path[0] === "confirmPassword"));
  const unchanged = vendorPasswordPreviewSchema.safeParse({
    ...valid,
    newPassword: valid.currentPassword,
    confirmPassword: valid.currentPassword,
  });
  assert.equal(unchanged.success, false);
  assert.ok(unchanged.error.issues.some((issue) => issue.path[0] === "newPassword"));
});
test("password form has associated private fields, autocomplete, cancellation and an honest preview boundary", () => {
  const html = renderToStaticMarkup(
    h(VendorPasswordPreviewForm, { onCancel: noop, onValidated: noop }),
  );
  for (const text of [
    "Current Password",
    "New Password",
    "Confirm New Password",
    "Cancel",
    "Change Password",
    "no password is changed",
  ])
    assert.ok(html.includes(text), text);
  assert.equal((html.match(/type="password"/g) ?? []).length, 3);
  assert.equal((html.match(/autoComplete="new-password"/gi) ?? []).length, 2);
  assert.equal((html.match(/<label[^>]*for=/g) ?? []).length, 3);
  assert.match(html, /noValidate=""/i);
});
test("staff design exposes initial count, dates, demo PINs and accessible controls for every sample member", () => {
  const html = renderToStaticMarkup(
    h(VendorStaffManagement, {
      state: initialVendorSettingsState(),
      dispatch: noop,
      onBack: noop,
    }),
  );
  for (const text of [
    "Staff Management",
    "Staff Members (2)",
    "Staff email address",
    "maria@example.com",
    "jake@example.com",
    "15/05/2026",
    "18/05/2026",
    "1504",
    "5678",
    "Add Staff",
    "Back to Settings",
  ]) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /aria-expanded="true"/);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 2);
  assert.equal((html.match(/aria-label="Remove /g) ?? []).length, 2);
  assert.equal((html.match(/aria-label="Reset sample PIN/g) ?? []).length, 2);
});
test("unsupported settings destinations have explicit local previews without invented prices or deletion claims", () => {
  assert.equal(Object.keys(vendorSettingsPreviews).length, 4);
  for (const preview of Object.values(vendorSettingsPreviews))
    assert.match(preview.description, /preview/);
  assert.match(vendorSettingsPreviews.delete.description, /does not delete/);
  assert.match(
    vendorSettingsPreviews.verification.description,
    /No verification status/,
  );
});
function RouteTree() {
  return useRoutes(appRoutes);
}
function renderAt(role, query = "") {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-settings-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: "test-vendor",
        name: "Test Vendor",
        email: "test@example.invalid",
        role,
      }),
    );
  }
  return new Promise((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk;
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      h(
        Provider,
        { store },
        h(
          MemoryRouter,
          { initialEntries: [ROUTES.VENDOR_SETTINGS + query] },
          h(RouteTree),
        ),
      ),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
test("Settings preserves verified Vendor authentication, route metadata, one shell and active Settings navigation", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_SETTINGS);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    navigationItems.find((n) => n.path === ROUTES.VENDOR_SETTINGS).allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    routeMetadata.find((n) => n.path === ROUTES.VENDOR_SETTINGS).requiredRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-settings-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/settings"/);
  for (const label of [
    "Manage",
    "Security",
    "Staff Management",
    "Plan and pricing",
    "Truck verification",
    "Current Password",
    "Help and support",
    "Delete account",
  ])
    assert.ok(html.includes(label), label);
  assert.match(await renderAt("VENDOR", "?view=staff"), /maria@example.com/);
  assert.match(await renderAt("VENDOR", "?view=invalid"), /Current Password/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role, "?view=staff"), "");
});
