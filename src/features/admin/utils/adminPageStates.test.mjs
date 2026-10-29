import assert from "node:assert/strict";
import test from "node:test";
import { adminApi } from "../api/admin.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { adminListQuery, adminListPosition } from "./adminList.ts";
import AdminUsers from "../pages/AdminUsersPage.tsx";
import AdminBookings from "../pages/AdminBookingsPage.tsx";
import AdminVendors from "../pages/AdminVendorsPage.tsx";
import AdminCommunity from "../pages/AdminCommunityPage.tsx";
import AdminReviews from "../pages/AdminReviewsModerationPage.tsx";
import AdminPayments from "../pages/AdminPaymentsPage.tsx";
import AdminRewards from "../pages/AdminRewardsPage.tsx";
import {
  adminTestStore,
  renderAdmin,
  json,
  usersResponse,
  bookingsResponse,
  vendorsResponse,
  communityResponse,
  reviewsResponse,
  paymentsResponse,
  rewardsResponse,
  userDto,
} from "./admin.test-fixtures.mjs";

const cases = [
  [
    "Users",
    AdminUsers,
    "getAdminUsersManagement",
    adminListQuery(1, 10, {}),
    usersResponse(),
    usersResponse([]),
    "Real User",
  ],
  [
    "Bookings",
    AdminBookings,
    "getAdminBookingsManagement",
    adminListQuery(1, 5, {}),
    bookingsResponse(),
    bookingsResponse([]),
    "Real Truck",
  ],
  [
    "Vendors",
    AdminVendors,
    "getAdminVendorsManagement",
    adminListQuery(1, 10, {}),
    vendorsResponse(),
    vendorsResponse([]),
    "Real Vendor",
  ],
  [
    "Community",
    AdminCommunity,
    "getAdminCommunityManagement",
    adminListQuery(1, 10, {}),
    communityResponse(),
    communityResponse([]),
    "Actual post content",
  ],
  [
    "Reviews",
    AdminReviews,
    "getAdminReviewsManagement",
    adminListQuery(1, 10, {}),
    reviewsResponse(),
    reviewsResponse([]),
    "Actual feedback",
  ],
  [
    "Payments",
    AdminPayments,
    "getAdminPaymentsManagement",
    adminListQuery(1, 10, {}),
    paymentsResponse(),
    paymentsResponse({ payoutRequests: [] }),
    "Payout Vendor",
  ],
  [
    "Rewards",
    AdminRewards,
    "getAdminRewardsManagement",
    { limit: 100 },
    rewardsResponse(),
    rewardsResponse({ leaderboard: [] }),
    "Ranked Truck",
  ],
];
for (const [name, Page, endpoint, args, populated, empty, label] of cases) {
  test(`${name}: loading, initial failure, retry, retained rows on refresh failure and actual empty result`, async () => {
    const store = adminTestStore();
    const original = globalThis.fetch;
    let response = json({ message: "private database detail" }, 503);
    globalThis.fetch = async () => response.clone();
    const request = store.dispatch(adminApi.endpoints[endpoint].initiate(args));
    try {
      assert.match(renderAdmin(store, Page), /animate-pulse/);
      await request;
      assert.match(renderAdmin(store, Page), /Retry/);
      assert.doesNotMatch(renderAdmin(store, Page), /private database detail/);
      response = json(populated);
      await request.refetch().unwrap();
      assert.match(renderAdmin(store, Page), new RegExp(label));
      response = json({}, 503);
      await request.refetch();
      const retained = renderAdmin(store, Page);
      assert.match(retained, new RegExp(label));
      assert.match(retained, /Retry/);
      response = json(empty);
      await request.refetch().unwrap();
      assert.match(renderAdmin(store, Page), /No .*found/);
      assert.doesNotMatch(renderAdmin(store, Page), new RegExp(label));
    } finally {
      request.unsubscribe();
      globalThis.fetch = original;
      store.dispatch(baseApi.util.resetApiState());
    }
  });
}

test("filter/category/tab/page-size changes reset pages, including returning to previous filters", () => {
  let position = { key: "all|10", page: 5 };
  for (const key of [
    "active|10",
    "all|10",
    "all|50",
    "all|10",
    "reported|10",
    "all|10",
  ]) {
    position = adminListPosition(position, key);
    assert.equal(position.page, 1);
    position = { key, page: 3 };
    assert.equal(adminListPosition(position, key).page, 3);
  }
});

test("suspend/retrieve errors remain recoverable without modifying identity or calling refresh", async () => {
  const store = adminTestStore();
  const original = globalThis.fetch;
  const identity = store.getState().auth;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ message: "Not allowed" }, 403);
  };
  try {
    for (const endpoint of ["suspendAdminUser", "retrieveAdminUser"]) {
      await assert.rejects(
        store.dispatch(adminApi.endpoints[endpoint].initiate(userDto().id)).unwrap(),
        (error) => error.status === 403,
      );
    }
    assert.equal(store.getState().auth, identity);
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});
