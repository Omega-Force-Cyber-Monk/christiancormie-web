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
function renderPage(tab) {
  return renderToStaticMarkup(
    h(MemoryRouter, { initialEntries: ["/?tab=" + tab] }, h(VendorLeaderboardPage)),
  );
}
test("Top Rated and Most Booked preserve the seven source trucks, metrics and podium", () => {
  assert.equal(vendorRankedTrucks.length, 7);
  for (const tab of ["top-rated", "most-booked", "invalid"]) {
    const html = renderPage(tab);
    assert.equal(
      (html.match(/class="vendor-ranking vendor-ranking--/g) ?? []).length,
      7,
    );
    for (const truck of vendorRankedTrucks) assert.ok(html.includes(truck.name));
    for (const text of [
      "1,234 reviews",
      "2,103 reviews",
      "0.5 mi",
      "Gold",
      "Silver",
      "Bronze",
      "Sample rankings",
    ])
      assert.ok(html.includes(text), text);
    assert.ok(!html.includes("Lionel Messi"));
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.match(
      html,
      new RegExp(
        `id="leaderboard-tab-${parseVendorLeaderboardTab(tab)}"[^>]*aria-selected="true"[^>]*tabindex="0"`,
      ),
    );
    assert.match(html, /role="tabpanel"[^>]*aria-labelledby="leaderboard-tab-/);
  }
});
test("Most points replaces trucks with seven member portraits and descending point totals", () => {
  const html = renderPage("most-points");
  assert.equal(vendorRankedMembers.length, 7);
  for (const member of vendorRankedMembers) assert.ok(html.includes(member.name));
  assert.equal((html.match(/class="vendor-ranking-portrait"/g) ?? []).length, 7);
  assert.match(html, /1,890 Points/);
  assert.match(html, /1,050 Points/);
  assert.match(html, /Member points rankings/);
  assert.ok(!html.includes("Burger Bliss"));
  assert.ok(!html.includes("reviews"));
  assert.deepEqual(
    vendorRankedMembers.map((x) => x.points),
    [1890, 1889, 1850, 1234, 1150, 1100, 1050],
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
        sessionId: "vendor-leaderboard-test",
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
test("Leaderboard retains verified Vendor authentication, metadata and navigation isolation", async () => {
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
  assert.match(html, /Burger Bliss/);
  assert.match(
    await renderAt("VENDOR", "?tab=most-booked"),
    /id="leaderboard-tab-most-booked"[^>]*aria-selected="true"/,
  );
  assert.match(await renderAt("VENDOR", "?tab=most-points"), /Lionel Messi/);
  assert.match(await renderAt("VENDOR", "?tab=invalid"), /Burger Bliss/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role, "?tab=most-points"), "");
});
