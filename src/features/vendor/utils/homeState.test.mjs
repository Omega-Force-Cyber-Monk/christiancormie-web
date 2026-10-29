import { seedVendorHome, ownerId } from "./vendor.test-fixtures.mjs";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import {
  initialVendorHomeState,
  vendorHomeReducer,
  vendorHomeUpdateSchema,
  shareVendorHomeQr,
} from "./homeState.ts";
import { vendorHomeBookings } from "../data/home.data.ts";
import { VendorHomeUpdateForm } from "../components/home/VendorHomeUpdateForm.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { ROUTES } from "../../../constants/routes.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { DashboardLayout } from "../../../layouts/DashboardLayout/DashboardLayout.tsx";

test("QR and booking overlays open and close with selected context without changing fixtures", () => {
  let state = initialVendorHomeState();
  state = vendorHomeReducer(state, { type: "open", overlay: "qr" });
  assert.equal(state.overlay, "qr");
  for (const booking of vendorHomeBookings) {
    state = vendorHomeReducer(state, {
      type: "open",
      overlay: { bookingId: booking.id },
    });
    assert.equal(state.overlay.bookingId, booking.id);
  }
  assert.equal(
    vendorHomeReducer(state, { type: "open", overlay: { bookingId: "missing" } }),
    state,
  );
  state = vendorHomeReducer(state, { type: "open", overlay: null });
  assert.equal(state.overlay, null);
  assert.deepEqual(
    vendorHomeBookings.map((item) => item.status),
    ["Confirmed", "Pending"],
  );
});

test("local updates validate, trim text, close the composer and ignore duplicate IDs", () => {
  const state = initialVendorHomeState();
  assert.equal(vendorHomeUpdateSchema.safeParse({ text: " \n " }).success, false);
  assert.equal(
    vendorHomeReducer(state, {
      type: "save-update",
      update: { id: "empty", text: " " },
    }),
    state,
  );
  const update = { id: "local-1", text: "  Tacos ready!  " };
  const saved = vendorHomeReducer(
    { ...state, overlay: "post" },
    { type: "save-update", update },
  );
  assert.equal(saved.overlay, null);
  assert.equal(saved.updates[0].text, "Tacos ready!");
  assert.equal(vendorHomeReducer(saved, { type: "save-update", update }), saved);
  assert.equal(state.updates.length, 0);
  assert.equal(initialVendorHomeState().updates.length, 0);
});

test("composer renders the retained draft with backend confirmation language", () => {
  const html = renderToStaticMarkup(
    h(VendorHomeUpdateForm, { draft: "Opening at noon", onDraft() {}, onSave() {} }),
  );
  assert.match(html, /Opening at noon/);
  assert.match(html, /published only after backend confirmation/);
  assert.match(html, /Publish update/);
});

const qrFile = new File(["<svg/>"], "sample.svg", { type: "image/svg+xml" });
const qrUrl = "https://example.invalid/assets/sample.svg";
test("QR sharing prefers the original artwork file when native file sharing is supported", async () => {
  let shared;
  const result = await shareVendorHomeQr(qrFile, qrUrl, {
    canShare: () => true,
    share: async (data) => {
      shared = data;
    },
  });
  assert.equal(result, "shared");
  assert.equal(shared.files[0], qrFile);
});

test("QR sharing supports native URL sharing, clipboard fallback and manual fallback", async () => {
  let shared;
  assert.equal(
    await shareVendorHomeQr(qrFile, qrUrl, {
      canShare: () => false,
      share: async (data) => {
        shared = data;
      },
    }),
    "shared",
  );
  assert.equal(shared.url, qrUrl);
  let copied;
  assert.equal(
    await shareVendorHomeQr(qrFile, qrUrl, {
      copy: async (url) => {
        copied = url;
      },
    }),
    "copied",
  );
  assert.equal(copied, qrUrl);
  assert.equal(
    await shareVendorHomeQr(qrFile, qrUrl, {
      share: async () => {
        throw new Error("Unavailable");
      },
      copy: async () => {
        throw new Error("Denied");
      },
    }),
    "manual",
  );
  assert.equal(await shareVendorHomeQr(qrFile, qrUrl, {}), "manual");
});

test("cancelling native share does not copy or falsely report success", async () => {
  let copies = 0;
  const error = new Error("Cancelled");
  error.name = "AbortError";
  assert.equal(
    await shareVendorHomeQr(qrFile, qrUrl, {
      share: async () => {
        throw error;
      },
      copy: async () => {
        copies++;
      },
    }),
    "cancelled",
  );
  assert.equal(copies, 0);
});

test("home retains authentication, Vendor role protection and existing UI", () => {
  const home = matchRoutes(appRoutes, ROUTES.VENDOR_DASHBOARD);
  assert.ok(home.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    home.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  for (const [path, role] of [
    [ROUTES.VENDOR_PRODUCTS, "VENDOR"],
    [ROUTES.CUSTOMER_ORDERS, "CUSTOMER"],
    [ROUTES.ADMIN_DASHBOARD, "ADMIN"],
    [ROUTES.VENDOR_STAFF_DASHBOARD, "VENDOR_STAFF"],
  ]) {
    const matches = matchRoutes(appRoutes, path);
    assert.ok(
      matches.some(({ route }) => route.element?.type === AuthGuard),
      path,
    );
    assert.ok(
      matches.some(({ route }) => route.element?.type === DashboardLayout),
      path,
    );
    assert.deepEqual(
      matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
        .allowedRoles,
      [role],
    );
  }
});

function storeFor(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-home-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: ownerId,
        name: "Test Vendor",
        email: "test@example.invalid",
        roles: [role],
        role,
      }),
    );
  }
  return store;
}
function RouteTree() {
  return useRoutes(appRoutes);
}
async function renderAt(role, path = ROUTES.VENDOR_DASHBOARD, store = storeFor(role)) {
  if (role === "VENDOR") await seedVendorHome(store);
  return new Promise((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk;
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      h(Provider, { store }, h(MemoryRouter, { initialEntries: [path] }, h(RouteTree))),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
test("verified Vendor Home renders its single shared shell with mocked backend content without a server or network", async () => {
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-home-shell/);
  assert.match(html, /Actual Vendor Kitchen/);
  for (const text of [
    "Post Update",
    "Earnings &amp; Analytics",
    "QR Code",
    "BK-2026-0007",
    "Actual Food Truck",
    "Recent Activity",
  ])
    assert.ok(html.includes(text), text);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /href="\/dashboard\/vendor\/orders"/);
  assert.doesNotMatch(html, /Role-aware workspace/);
});

test("anonymous visitors and other roles cannot access home", async () => {
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role), "");
});
