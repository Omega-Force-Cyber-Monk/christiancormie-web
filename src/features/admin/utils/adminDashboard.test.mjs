import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { URL } from "node:url";
import { setImmediate } from "node:timers";
import { adminApi } from "../api/admin.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import AdminDashboardPage from "../pages/AdminDashboardPage.tsx";
import AdminPaymentsPage from "../pages/AdminPaymentsPage.tsx";
import { ReturnedUserTiers } from "../pages/AdminRewardsPage.tsx";
import {
  RevenueTrendChart,
  MonthlyBookingsChart,
} from "../components/dashboard/DashboardCharts.tsx";
import { AdminOperationalTable } from "../components/AdminOperationalTable.tsx";
import { paymentRows, rewardRows } from "./adminOperations.ts";
import { adminListQuery } from "./adminList.ts";
import {
  adminTestStore,
  renderAdmin,
  json,
  paymentsResponse,
  rewardsResponse,
} from "./admin.test-fixtures.mjs";
import { clearSession, sessionStarted } from "../../auth/store/auth.slice.ts";
const cleanup = (s) => s.dispatch(baseApi.util.resetApiState());
const tick = () => new Promise((resolve) => setImmediate(resolve));
const metric = (value) => ({ value, previousValue: 0, changePercent: 100 });
const dashboardResponse = (overrides = {}) => ({
  generatedAt: "2026-10-29T00:00:00Z",
  cards: {
    totalUsers: metric(1234),
    activeVendors: metric(72),
    liveDrops: metric(3),
    monthlyBookings: metric(678),
    revenueThisMonth: metric(123456.78),
    commissionEarned: metric(9876.54),
    pendingPayouts: metric(2),
    activeDisputes: { ...metric(9), source: "review_reports" },
  },
  charts: {
    revenueTrend: [{ month: "Oct", revenue: 123456.78 }],
    monthlyBookings: [{ month: "Oct", bookings: 678 }],
  },
  recentActivity: [
    {
      id: "actual-booking-id",
      type: "booking",
      title: "Ada Lovelace created booking",
      subtitle: "BOOK-123 · $125.50",
      status: "CONFIRMED",
      createdAt: "2026-10-28T09:00:00Z",
    },
    {
      id: "actual-payout-id",
      type: "payout",
      title: "Actual Truck requested payout",
      subtitle: "$25.50",
      status: "PROCESSING",
      createdAt: "2026-10-28T08:00:00Z",
    },
  ],
  ...overrides,
});

for (const [endpoint, path, arg, response] of [
  ["getAdminDashboard", "dashboard", undefined, dashboardResponse()],
  [
    "getAdminPaymentsManagement",
    "payments-management",
    { limit: 11, offset: 10, status: "PENDING" },
    paymentsResponse(),
  ],
  [
    "getAdminRewardsManagement",
    "rewards-management",
    { limit: 11, offset: 10 },
    rewardsResponse(),
  ],
])
  test(`${endpoint} retains the existing JWT GET contract, query and cache tag`, async () => {
    const s = adminTestStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      const u = new URL(request.url);
      assert.equal(u.pathname, `/api/v1/admin/${path}`);
      assert.equal(request.method, "GET");
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      assert.deepEqual(
        Object.fromEntries(u.searchParams),
        Object.fromEntries(
          Object.entries(arg ?? {}).map(([key, value]) => [key, String(value)]),
        ),
      );
      return json(response);
    };
    const req = s.dispatch(adminApi.endpoints[endpoint].initiate(arg));
    try {
      assert.deepEqual(await req.unwrap(), response);
      const tag =
        endpoint === "getAdminDashboard"
          ? "AdminDashboard"
          : endpoint === "getAdminPaymentsManagement"
            ? "AdminPayments"
            : "AdminRewards";
      assert.equal(baseApi.util.selectInvalidatedBy(s.getState(), [tag]).length, 1);
    } finally {
      req.unsubscribe();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("dashboard uses real metrics, report source, complete titles and exact backend statuses without assuming currency", async () => {
  const s = adminTestStore();
  try {
    await s.dispatch(
      baseApi.util.upsertQueryData("getAdminDashboard", undefined, dashboardResponse()),
    );
    const html = renderAdmin(s, AdminDashboardPage);
    for (const text of [
      "1,234",
      "72",
      "678",
      "123,456.78 (currency unavailable)",
      "9,876.54 (currency unavailable)",
      "Active Review Reports",
      "Ada Lovelace created booking",
      "CONFIRMED",
      "PROCESSING",
      "BOOK-123 · $125.50",
    ])
      assert.ok(html.includes(text), text);
    assert.doesNotMatch(html, /Active Disputes|>review<|>LP<|\$123,456.78|\$9,876.54/);
    assert.match(html, /Currency is not provided/);
  } finally {
    cleanup(s);
  }
});
test("dashboard initial error exposes Retry without false-empty sections; refresh failures preserve validated data", async () => {
  const s = adminTestStore();
  const original = globalThis.fetch;
  let response = json({ message: "private SQL detail" }, 503);
  globalThis.fetch = async () => response.clone();
  const req = s.dispatch(adminApi.endpoints.getAdminDashboard.initiate());
  try {
    assert.match(renderAdmin(s, AdminDashboardPage), /animate-pulse/);
    await req;
    const failure = renderAdmin(s, AdminDashboardPage);
    assert.match(failure, /role="alert"/);
    assert.match(failure, /Retry/);
    assert.doesNotMatch(failure, /No .*found|private SQL/);
    response = json(dashboardResponse());
    await req.refetch().unwrap();
    assert.match(renderAdmin(s, AdminDashboardPage), /CONFIRMED/);
    response = json({}, 503);
    await req.refetch();
    const retained = renderAdmin(s, AdminDashboardPage);
    assert.match(retained, /CONFIRMED/);
    assert.match(retained, /Previously loaded data/);
    assert.match(retained, /Retry/);
    response = json(
      dashboardResponse({
        charts: { revenueTrend: [], monthlyBookings: [] },
        recentActivity: [],
      }),
    );
    await req.refetch().unwrap();
    const empty = renderAdmin(s, AdminDashboardPage);
    assert.match(empty, /No revenue trend found/);
    assert.match(empty, /No booking chart found/);
    assert.match(empty, /No recent activity found/);
    assert.doesNotMatch(empty, /CONFIRMED/);
  } finally {
    req.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("dashboard handles null values, nullable activity metadata and invalid dates without fabricated zero/status", async () => {
  const s = adminTestStore();
  const d = dashboardResponse();
  d.cards.revenueThisMonth = metric(null);
  d.cards.activeVendors = metric(0);
  d.recentActivity = [
    {
      id: "nullable",
      type: "booking",
      title: null,
      subtitle: null,
      status: null,
      createdAt: "invalid",
    },
  ];
  d.charts = {
    revenueTrend: [{ month: "Oct", revenue: null }],
    monthlyBookings: [{ month: "Oct", bookings: null }],
  };
  try {
    await s.dispatch(baseApi.util.upsertQueryData("getAdminDashboard", undefined, d));
    const html = renderAdmin(s, AdminDashboardPage);
    assert.match(html, />Activity</);
    assert.match(html, /N\/A/);
    assert.doesNotMatch(html, /NaN|Invalid Date|>review<|\$0.00/);
    assert.match(html, />0</);
  } finally {
    cleanup(s);
  }
});
test("charts expose only backend buckets, high values, missing values and genuine zero in accessible data", () => {
  const revenue = renderToStaticMarkup(
    h(RevenueTrendChart, {
      data: [
        { name: "Actual Month", revenue: 123456.78 },
        { name: "Unknown Month", revenue: null },
        { name: "Zero Month", revenue: 0 },
      ],
    }),
  );
  assert.match(revenue, /Actual Month/);
  assert.match(revenue, /123,456.78 \(currency unavailable\)/);
  assert.match(revenue, /N\/A/);
  assert.match(revenue, /0.00 \(currency unavailable\)/);
  assert.doesNotMatch(revenue, /\$|Jan|Feb/);
  const bookings = renderToStaticMarkup(
    h(MonthlyBookingsChart, { data: [{ name: "Actual Month", bookings: 678 }] }),
  );
  assert.match(bookings, /678/);
  assert.match(bookings, /<caption>Monthly bookings/);
});
test("dashboard background fetching has explicit feedback and retains loaded activity", async () => {
  const s = adminTestStore();
  const original = globalThis.fetch;
  let release;
  globalThis.fetch = () =>
    new Promise((r) => {
      release = r;
    });
  await s.dispatch(
    baseApi.util.upsertQueryData("getAdminDashboard", undefined, dashboardResponse()),
  );
  const req = s.dispatch(
    adminApi.endpoints.getAdminDashboard.initiate(undefined, { forceRefetch: true }),
  );
  try {
    while (!release) await tick();
    const html = renderAdmin(s, AdminDashboardPage);
    assert.match(html, /Refreshing dashboard/);
    assert.match(html, /Ada Lovelace/);
    release(json(dashboardResponse()));
    await req.unwrap();
  } finally {
    release?.(json(dashboardResponse()));
    req.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("payment summaries use unknown currency while payout rows preserve their actual currency and nulls", async () => {
  const s = adminTestStore();
  const d = paymentsResponse();
  d.payoutRequests[0].currency = "CAD";
  try {
    await s.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminPaymentsManagement",
        adminListQuery(1, 10, {}),
        d,
      ),
    );
    const html = renderAdmin(s, AdminPaymentsPage);
    assert.match(html, /1,000.00 \(currency unavailable\)/);
    assert.match(html, /CA\$125.50/);
    assert.doesNotMatch(html, />\$1,000.00</);
    const nulls = paymentsResponse();
    nulls.payoutRequests[0].amount = null;
    nulls.transactions[0].amount = null;
    nulls.revenueOverview.monthlyRevenueBreakdown[0].revenue = null;
    for (const tab of ["Payout Requests", "Transaction History", "Revenue Overview"])
      assert.equal(paymentRows(tab, nulls)[0].value, "N/A");
    nulls.payoutRequests[0].amount = 0;
    assert.equal(paymentRows("Payout Requests", nulls)[0].value, "$0.00");
  } finally {
    cleanup(s);
  }
});
test("tier counts explicitly identify returned users and preserve actual tier names alongside top-user rows", () => {
  const d = rewardsResponse();
  d.topUsers[0].tier.name = "Backend Tier Name";
  const tiers = renderToStaticMarkup(h(ReturnedUserTiers, { data: d }));
  assert.match(tiers, /not all platform members/);
  assert.match(tiers, /Backend Tier Name/);
  assert.doesNotMatch(tiers, /\[object Object\]/);
  const rows = renderToStaticMarkup(
    h(AdminOperationalTable, {
      rows: rewardRows("Top Users", d),
      emptyMessage: "Empty",
    }),
  );
  assert.match(rows, /Top User/);
  assert.match(rows, /Backend Tier Name/);
  assert.match(rows, /500 lifetime points/);
  const missing = rewardsResponse();
  missing.topUsers[0].tier = null;
  assert.equal(rewardRows("Top Users", missing)[0].status, "N/A");
  missing.redeemTransactions[0].user = null;
  missing.redeemTransactions[0].points = null;
  assert.equal(rewardRows("Redeem Transactions", missing)[0].name, "N/A");
  assert.equal(rewardRows("Redeem Transactions", missing)[0].value, "N/A points");
});
for (const action of ["logout", "replace"])
  test(`${action} during admin read cannot restore old dashboard data`, async () => {
    const s = adminTestStore();
    const original = globalThis.fetch;
    let release;
    globalThis.fetch = () =>
      new Promise((r) => {
        release = r;
      });
    const req = s.dispatch(adminApi.endpoints.getAdminDashboard.initiate());
    try {
      while (!release) await tick();
      s.dispatch(
        action === "logout"
          ? clearSession("expired")
          : sessionStarted({ accessToken: "new-access", refreshToken: "new-refresh" }),
      );
      release(json(dashboardResponse()));
      await req;
      assert.deepEqual(s.getState().api.queries, {});
    } finally {
      release?.(json(dashboardResponse()));
      req.unsubscribe();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
