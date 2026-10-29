import { memberStore, seedRankings } from "../../social/utils/member.test-fixtures.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { URLSearchParams } from "node:url";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import VendorLeaderboardPage from "../pages/VendorLeaderboardPage.tsx";
import {
  adjacentLeaderboardTab,
  parseVendorLeaderboardTab,
  vendorLeaderboardTabQuery,
  vendorLeaderboardTabs,
  vendorRankedMembers,
  vendorRankedTrucks,
} from "../data/leaderboard.data.ts";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { navigationItems } from "../../../config/navigation/navigation.config.ts";
import { routeMetadata } from "../../../router/metadata/routeMetadata.ts";

test("all design tabs are addressable and malformed query values fall back safely", () => {
  for (const { id } of vendorLeaderboardTabs)
    assert.equal(parseVendorLeaderboardTab(id), id);
  for (const value of [null, "", "unknown", "MOST-POINTS", "__proto__"])
    assert.equal(parseVendorLeaderboardTab(value), "top-rated");
});
test("tab transitions retain unrelated URL state without mutating the previous URL", () => {
  const original = new URLSearchParams("tab=top-rated&keep=1");
  const booked = vendorLeaderboardTabQuery(original, "most-booked");
  const points = vendorLeaderboardTabQuery(booked, "most-points");
  assert.equal(original.get("tab"), "top-rated");
  assert.equal(booked.get("tab"), "most-booked");
  assert.equal(points.get("tab"), "most-points");
  assert.equal(points.get("keep"), "1");
  assert.equal(vendorLeaderboardTabQuery(points, "top-rated").get("tab"), "top-rated");
});
test("keyboard tabs wrap in both directions and support Home and End", () => {
  assert.equal(adjacentLeaderboardTab("top-rated", "ArrowLeft"), "most-points");
  assert.equal(adjacentLeaderboardTab("most-points", "ArrowRight"), "top-rated");
  assert.equal(adjacentLeaderboardTab("top-rated", "ArrowRight"), "most-booked");
  assert.equal(adjacentLeaderboardTab("most-points", "ArrowLeft"), "most-booked");
  assert.equal(adjacentLeaderboardTab("most-booked", "Home"), "top-rated");
  assert.equal(adjacentLeaderboardTab("top-rated", "End"), "most-points");
  for (const key of ["Tab", "Escape", " ", "Enter"])
    assert.equal(adjacentLeaderboardTab("top-rated", key), undefined);
});
async function renderPage(tab) {
  const store = memberStore("VENDOR");
  await seedRankings(store, parseVendorLeaderboardTab(tab));
  try {
    return renderToStaticMarkup(
      h(
        Provider,
        { store },
        h(MemoryRouter, { initialEntries: ["/?tab=" + tab] }, h(VendorLeaderboardPage)),
      ),
    );
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
}
test("Top Rated and Most Booked use backend ranks and correct distinct metrics", async () => {
  assert.equal(vendorRankedTrucks.length, 7);
  for (const tab of ["top-rated", "most-booked", "invalid"]) {
    const html = await renderPage(tab);
    assert.match(html, /Ranked Truck/);
    assert.match(html, /vendor-ranking--5/);
    assert.match(html, tab === "most-booked" ? /34 bookings/ : /12 reviews/);
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.match(html, /role="tabpanel"/);
    assert.doesNotMatch(html, /0.5 mi|Sample rankings/);
  }
});
test("Most points renders backend member identity and lifetime points", async () => {
  assert.equal(vendorRankedMembers.length, 7);
  const html = await renderPage("most-points");
  assert.match(html, /Ranked Member/);
  assert.match(html, /8400 Points/);
  assert.match(html, /Member points rankings/);
  assert.doesNotMatch(html, /Burger Bliss|reviews/);
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
        sessionId: "vendor-leaderboard-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: "test-vendor",
        name: "Test Vendor",
        email: "test@example.invalid",
        roles: [role],
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
          { initialEntries: [ROUTES.VENDOR_LEADERBOARD + query] },
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
test("leaderboard retains authentication, Vendor role protection and existing UI", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_LEADERBOARD);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    navigationItems.find((n) => n.path === ROUTES.VENDOR_LEADERBOARD).allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    routeMetadata.find((n) => n.path === ROUTES.VENDOR_LEADERBOARD).requiredRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-leaderboard-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/leaderboard"/);
  assert.match(html, /Loading rankings/);
  assert.match(
    await renderAt("VENDOR", "?tab=most-booked"),
    /id="leaderboard-tab-most-booked"[^>]*aria-selected="true"/,
  );
  assert.match(await renderAt("VENDOR", "?tab=most-points"), /Loading rankings/);
  assert.match(await renderAt("VENDOR", "?tab=invalid"), /Loading rankings/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role, "?tab=most-points"), "");
});
