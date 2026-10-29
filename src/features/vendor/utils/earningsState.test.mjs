import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import {
  earningsTransactions,
  qrScanData,
  followerData,
  topDropLocations,
  creditSummary,
  creditRedemptions,
} from "../data/earnings.data.ts";
import {
  formatEarningsMoney,
  initialVendorEarningsState,
  parseEarningsTab,
  paymentMethodPreviewSchema,
  vendorEarningsReducer,
} from "./earningsState.ts";
import { VendorEarningsOverview } from "../components/earnings/VendorEarningsOverview.tsx";
import { VendorAnalyticsOverview } from "../components/earnings/VendorAnalyticsOverview.tsx";
import { VendorCreditDetailsContent } from "../components/earnings/VendorCreditDetails.tsx";
import { VendorMetricChart } from "../components/earnings/VendorMetricChart.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { navigationItems } from "../../../config/navigation/navigation.config.ts";
const noop = () => {};
const reduce = vendorEarningsReducer;

test("earnings is the default tab and unsupported URL values fall back safely", () => {
  assert.equal(parseEarningsTab(null), "earnings");
  assert.equal(parseEarningsTab("analytics"), "analytics");
  for (const value of ["earnings", "unknown", "ADMIN", "", "Analytics"])
    assert.equal(parseEarningsTab(value), "earnings");
});
test("credits start accepting and modal open/close keeps acceptance synchronized in both representations", () => {
  let state = initialVendorEarningsState();
  assert.equal(state.acceptingCredits, true);
  assert.equal(state.creditsOpen, false);
  state = reduce(state, { type: "toggle-credits" });
  assert.equal(state.acceptingCredits, false);
  state = reduce(state, { type: "credits-open", open: true });
  assert.equal(state.creditsOpen, true);
  assert.equal(state.acceptingCredits, false);
  const html = renderToStaticMarkup(
    h(VendorCreditDetailsContent, {
      id: "credits-test",
      accepting: state.acceptingCredits,
      onToggle: noop,
      onClose: noop,
    }),
  );
  for (const text of [
    "Not Accepting",
    "Turn On Credit Acceptance",
    'aria-pressed="false"',
    "Close BiteDrop Credits details",
  ])
    assert.ok(html.includes(text), text);
  state = reduce(state, { type: "toggle-credits" });
  state = reduce(state, { type: "credits-open", open: false });
  state = reduce(state, { type: "credits-open", open: true });
  assert.equal(state.acceptingCredits, true);
  assert.equal(state.creditsOpen, true);
  assert.match(state.status, /local preview only/);
  assert.equal(initialVendorEarningsState().acceptingCredits, true);
});
test("credit acceptance toggles do not alter historical redemptions, transactions, chart points or payment defaults", () => {
  const reference = JSON.stringify({
    creditSummary,
    creditRedemptions,
    qrScanData,
    followerData,
    earningsTransactions,
  });
  let state = initialVendorEarningsState();
  state = reduce(state, { type: "toggle-credits" });
  state = reduce(state, { type: "toggle-credits" });
  assert.equal(state.defaultMethodId, "sample-bank");
  assert.equal(state.methods.length, 1);
  assert.equal(
    JSON.stringify({
      creditSummary,
      creditRedemptions,
      qrScanData,
      followerData,
      earningsTransactions,
    }),
    reference,
  );
});
test("payment preview validation accepts only a label and exactly four sample digits, preserving leading zeroes", () => {
  assert.deepEqual(
    paymentMethodPreviewSchema.parse({ label: "  Sample bank  ", lastFour: " 0123 " }),
    { label: "Sample bank", lastFour: "0123" },
  );
  for (const values of [
    { label: " ", lastFour: "1234" },
    { label: "Bank", lastFour: "" },
    { label: "Bank", lastFour: "123" },
    { label: "Bank", lastFour: "12345" },
    { label: "Bank", lastFour: "12a4" },
    { label: "Bank", lastFour: "-123" },
  ])
    assert.equal(paymentMethodPreviewSchema.safeParse(values).success, false);
  const parsed = paymentMethodPreviewSchema.parse({
    label: "Demo",
    lastFour: "1234",
    accountNumber: "not retained",
  });
  assert.equal("accountNumber" in parsed, false);
});
test("Add preview cancel is harmless, valid save updates local methods and duplicate IDs are ignored", () => {
  let state = initialVendorEarningsState();
  state = reduce(state, { type: "add-open", open: true });
  assert.equal(state.addOpen, true);
  state = reduce(state, { type: "add-open", open: false });
  assert.equal(state.methods.length, 1);
  state = reduce(state, { type: "add-open", open: true });
  const action = {
    type: "add-method",
    id: "new-bank",
    values: { label: " Local bank ", lastFour: "0123" },
  };
  state = reduce(state, action);
  assert.equal(state.addOpen, false);
  assert.equal(state.methods.length, 2);
  assert.equal(state.methods[1].label, "Local bank");
  assert.equal(state.methods[1].lastFour, "0123");
  action.values.label = "Changed outside state";
  assert.equal(state.methods[1].label, "Local bank");
  assert.equal(reduce(state, action), state);
  assert.equal(state.defaultMethodId, "sample-bank");
  assert.match(state.status, /No bank account was linked/);
  assert.equal(initialVendorEarningsState().methods.length, 1);
});
test("invalid payment data and missing IDs never change local methods", () => {
  const state = initialVendorEarningsState();
  for (const action of [
    { type: "add-method", id: "", values: { label: "Bank", lastFour: "1234" } },
    {
      type: "add-method",
      id: "new",
      values: { label: "Bank", lastFour: "1234567890" },
    },
    { type: "add-method", id: "new", values: { label: "", lastFour: "1234" } },
  ])
    assert.equal(reduce(state, action), state);
});
test("default method can change only to an existing local method", () => {
  let state = initialVendorEarningsState();
  assert.equal(reduce(state, { type: "default-method", id: "missing" }), state);
  state = reduce(state, {
    type: "add-method",
    id: "new",
    values: { label: "Sample", lastFour: "1234" },
  });
  state = reduce(state, { type: "default-method", id: "new" });
  assert.equal(state.defaultMethodId, "new");
  state = reduce(state, { type: "default-method", id: "sample-bank" });
  assert.equal(state.defaultMethodId, "sample-bank");
});
test("formatting preserves cents, zero and source formatting while missing/non-finite amounts remain distinct", () => {
  assert.equal(formatEarningsMoney(17300), "$173");
  assert.equal(formatEarningsMoney(9500), "$95");
  assert.equal(formatEarningsMoney(12345), "$123.45");
  assert.equal(formatEarningsMoney(500, true), "$5.00");
  assert.equal(formatEarningsMoney(0), "$0");
  for (const value of [undefined, null, NaN, Infinity])
    assert.equal(formatEarningsMoney(value), "Not available");
});
test("illustrative chart points reconcile with displayed totals and source duplicates have independent UI keys", () => {
  assert.equal(
    qrScanData.reduce((sum, point) => sum + point.value, 0),
    585,
  );
  assert.equal(followerData.at(-1).value, 1240);
  assert.equal(followerData.at(-1).value - followerData[0].value, 260);
  assert.equal(creditSummary.total * 500, creditSummary.appliedCents);
  assert.equal(
    Math.round((creditSummary.total / 7) * 10) / 10,
    creditSummary.averagePerDay,
  );
  assert.equal(creditRedemptions.length, 5);
  assert.equal(earningsTransactions.length, 6);
  assert.equal(new Set(earningsTransactions.map((t) => t.id)).size, 6);
  assert.equal(
    earningsTransactions.filter((t) => t.transactionId === "294785").length,
    2,
  );
  assert.equal(
    topDropLocations.filter((l) => l.name === "Castro District, SF").length,
    2,
  );
});
test("Earnings renders the source bank, status colors/content and all six transaction entries", () => {
  const state = initialVendorEarningsState();
  const html = renderToStaticMarkup(
    h(VendorEarningsOverview, {
      methods: state.methods,
      defaultMethodId: state.defaultMethodId,
      onAdd: noop,
      onDefault: noop,
    }),
  );
  for (const text of [
    "Payment Methods",
    "Bank Account",
    "4532",
    "Default",
    "Recent Transactions",
    "processing",
    "completed",
    "$173",
    "$95",
    "294785",
    "Apr 12, 2026",
  ])
    assert.ok(html.includes(text), text);
  assert.equal((html.match(/vendor-transaction-status--/g) ?? []).length, 6);
  assert.match(html, /sample payment method/);
});
test("Analytics renders charts with accessible data, redemptions and a connected credits dialog control", () => {
  for (const accepting of [true, false]) {
    const html = renderToStaticMarkup(
      h(VendorAnalyticsOverview, {
        accepting,
        creditsOpen: false,
        onToggle: noop,
        onOpen: noop,
      }),
    );
    for (const text of [
      "QR SCANS",
      "585",
      "FOLLOWERS",
      "1,240",
      "TOP DROP LOCATIONS",
      "156 scans",
      "Credit Redemptions",
      "125",
      "$625",
      "17.9",
      "Maria Chen",
      "Sara Johnson",
      "Manual Code",
      "How Credit Acceptance Grows Your Business",
      'aria-haspopup="dialog"',
      'aria-expanded="false"',
    ])
      assert.ok(html.includes(text), text);
    assert.ok(html.includes(accepting ? "Currently Accepting" : "Not Accepting"));
    assert.ok(
      html.includes(
        accepting ? "Turn Off Credit Acceptance" : "Turn On Credit Acceptance",
      ),
    );
  }
  for (const metric of ["scans", "followers"]) {
    const html = renderToStaticMarkup(h(VendorMetricChart, { metric }));
    assert.match(html, /chart data/);
    assert.match(html, /Use arrow keys/);
    assert.ok(html.includes(metric === "scans" ? "Mon" : "W1"));
  }
});
test("expanded credit details preserve all three design sections, original artwork and unverified-terms boundary", () => {
  const html = renderToStaticMarkup(
    h(VendorCreditDetailsContent, {
      id: "credits-test",
      accepting: false,
      onToggle: noop,
      onClose: noop,
    }),
  );
  for (const text of [
    "How Credit Redemption Works",
    "Customer chooses redemption",
    "Verify purchase minimum",
    "Free/Featured: $10",
    "Premium: $5",
    "Founding: $0",
    "no processing fees",
    "Why This Grows Your Business",
    "2.3x",
    "Redemption Method Details",
    "Staff Scan",
    "Manual Entry",
    "Self-Service",
    "Local preview only",
  ]) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /not verified account rules or guarantees/);
  assert.equal((html.match(/<img /g) ?? []).length, 10);
  assert.match(html, /id="credits-test-title"/);
  assert.match(html, /id="credits-test-description"/);
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
        sessionId: "vendor-earnings-test",
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
          { initialEntries: [ROUTES.VENDOR_EARNINGS + query] },
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
test("earnings retains authentication, Vendor role protection and existing UI", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_EARNINGS);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    navigationItems.find((n) => n.path === ROUTES.VENDOR_EARNINGS).allowedRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-earnings-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(
    html,
    /aria-current="page"[^>]*href="\/dashboard\/vendor\/earnings-and-analytics"/,
  );
  assert.match(html, /Payment Methods/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tabpanel"/);
  const analytics = await renderAt("VENDOR", "?tab=analytics");
  assert.match(analytics, /TOP DROP LOCATIONS/);
  assert.match(analytics, /QR SCANS/);
  assert.match(analytics, /local previews/);
  assert.match(await renderAt("VENDOR", "?tab=invalid"), /Payment Methods/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role, "?tab=analytics"), "");
});
