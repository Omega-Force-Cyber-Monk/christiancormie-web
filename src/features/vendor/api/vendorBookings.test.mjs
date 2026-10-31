import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import {
  vendorTestStore,
  seedVendorHome,
  ownerId,
  vendorId,
  truckId,
  profileDto,
  json,
} from "../utils/vendor.test-fixtures.mjs";
import { vendorApi } from "./vendor.api.ts";
import { vendorBookingsApi } from "./vendorBookings.api.ts";
import {
  vendorBookingSchema,
  vendorBookingTrackingSchema,
  vendorDecisionAllowed,
  vendorDecisionBodySchema,
} from "../schemas/vendorBookings.schema.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { bookingsApi } from "../../customer/api/bookings.api.ts";
import VendorOrdersPage from "../pages/VendorOrdersPage.tsx";
import { RequestOrderDetails } from "../components/requests/RequestOrderDetails.tsx";
import {
  VendorBookingCard,
  VendorBookingTimeline,
} from "../components/requests/VendorBookingViews.tsx";
import {
  clearSession,
  activeRoleSelected,
  identityVerified,
  sessionRestored,
} from "../../auth/store/auth.slice.ts";

const bookingId = "11111111-1111-4111-8111-111111111111";
const customerId = "22222222-2222-4222-8222-222222222222";
const scope = { sessionId: "vendor-integration-test", userId: ownerId, role: "VENDOR" };
const selected = { ...scope, bookingId };
const listArg = { ...scope, filters: { tab: "REQUESTS", source: "ALL" } };
const decision = { ...selected, action: "accept", confirmed: true, body: {} };
const counts = { bookings: 4, community: 7, messages: 2 };
const booking = (o = {}) => ({
  id: bookingId,
  bookingNumber: "BD-REAL-VENDOR-001",
  customerId,
  vendorId,
  foodTruckId: truckId,
  communityRequestId: null,
  status: "PENDING",
  bookingType: "EVENT",
  eventType: "CORPORATE_EVENT",
  eventName: "Actual customer event",
  eventDescription: "Actual request description",
  startsAt: "2026-12-10T15:00:00Z",
  endsAt: "2026-12-10T18:00:00Z",
  guestCount: 60,
  address: "Actual event address",
  specialInstructions: "Actual instructions",
  createdAt: "2026-10-29T12:00:00Z",
  completionRequestedAt: null,
  completionApprovedAt: null,
  completedAt: null,
  paymentReleasedAt: null,
  contactPhone: "+12025550199",
  totalAmount: "1234.50",
  customer: {
    id: customerId,
    email: "customer@example.invalid",
    phone: null,
    profile: {
      displayName: "Actual Customer",
      firstName: null,
      lastName: null,
      avatarUrl: null,
    },
  },
  vendor: {
    id: vendorId,
    userId: ownerId,
    businessName: "Actual Vendor Kitchen",
    businessPhone: null,
  },
  foodTruck: { id: truckId, vendorId, name: "Actual Food Truck" },
  ...o,
});
const tracking = (o = {}) => ({
  bookingId,
  bookingNumber: "BD-REAL-VENDOR-001",
  roleView: "VENDOR",
  currentStep: "BOOKING_CONFIRMED",
  completion: {
    requestedAt: null,
    approvedAt: null,
    paymentReleasedAt: null,
    hasOpenIssue: false,
  },
  steps: [
    {
      key: "BOOKING_CONFIRMED",
      label: "Booking confirmed",
      status: "CURRENT",
      completedAt: null,
    },
    {
      key: "COMPLETION_REQUEST_SENT",
      label: "Completion request sent",
      status: "PENDING",
      completedAt: null,
    },
    { key: "COMPLETED", label: "Completed", status: "PENDING", completedAt: null },
  ],
  ...o,
});
const ep = (name) => vendorBookingsApi.endpoints[name];
test("notification booking URL opens authoritative Vendor detail; invalid UUID stays in list", async () => {
  await mocked(async (store) => {
    await seed(store);
    const render = (value) =>
      renderToStaticMarkup(
        React.createElement(
          Provider,
          { store },
          React.createElement(
            MemoryRouter,
            { initialEntries: [`/dashboard/vendor/orders?booking=${value}`] },
            React.createElement(VendorOrdersPage),
          ),
        ),
      );
    assert.match(render(bookingId), /Actual customer event/);
    assert.match(render(bookingId), /Back to bookings/);
    assert.doesNotMatch(render("fixture-id"), /Actual customer event/);
  });
});
async function seed(store, b = booking()) {
  await seedVendorHome(store);
  await store.dispatch(
    vendorBookingsApi.util.upsertQueryData(
      "getVendorBooking",
      selected,
      vendorBookingSchema.parse(b),
    ),
  );
}
async function mocked(
  run,
  handler = () => {
    throw new Error("Unexpected HTTP");
  },
) {
  const store = vendorTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await run(store);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
for (const [name, arg, result, path] of [
  ["getVendorBookings", listArg, [booking()], "/bookings/vendor/mine"],
  ["getVendorBookingCounts", scope, counts, "/bookings/vendor/requests/counts"],
  ["getVendorBooking", selected, booking(), `/bookings/${bookingId}`],
  ["getVendorBookingTracking", selected, tracking(), `/bookings/${bookingId}/tracking`],
]) {
  test(`${name}: exact raw GET contract, bearer and real identities`, async () => {
    await mocked(
      async (store) => {
        await seed(store);
        assert.deepEqual(
          await store.dispatch(ep(name).initiate(arg, { forceRefetch: true })).unwrap(),
          result,
        );
      },
      async (r) => {
        assert.equal(r.method, "GET");
        assert.equal(new globalThis.URL(r.url).pathname, `/api/v1${path}`);
        assert.equal(r.headers.get("authorization"), "Bearer test-access");
        return json(result);
      },
    );
  });
  for (const status of [400, 403, 404, 409])
    test(`${name}: ${status} never becomes empty success`, async () => {
      await mocked(
        async (store) => {
          await seed(store);
          await assert.rejects(
            store.dispatch(ep(name).initiate(arg, { forceRefetch: true })).unwrap(),
            (e) => e.status === status,
          );
        },
        async () => json({ message: "Booking unavailable" }, status),
      );
    });
}
test("server filters are exact; no unsupported pagination or client sort", async () => {
  await mocked(
    async (store) => {
      await seed(store);
      const filters = {
        tab: "ORDERS",
        source: "COMMUNITY",
        status: "PENDING,QUOTED",
        foodTruckId: truckId,
      };
      await store
        .dispatch(ep("getVendorBookings").initiate({ ...scope, filters }))
        .unwrap();
    },
    async (r) => {
      assert.deepEqual(Object.fromEntries(new globalThis.URL(r.url).searchParams), {
        tab: "ORDERS",
        source: "COMMUNITY",
        status: "PENDING,QUOTED",
        foodTruckId: truckId,
      });
      return json([]);
    },
  );
});
test("invalid filters, owner profile mismatch, restricted profile and fixture UUIDs send no requests", async () => {
  await mocked(async (store) => {
    await seed(store);
    for (const filters of [
      { limit: 20 },
      { tab: "TODAY" },
      { status: "PAID" },
      { source: "OTHER" },
      { foodTruckId: "fixture" },
    ])
      await assert.rejects(
        store
          .dispatch(ep("getVendorBookings").initiate({ ...scope, filters }))
          .unwrap(),
      );
    await assert.rejects(
      store
        .dispatch(
          ep("getVendorBooking").initiate({ ...selected, bookingId: "fixture" }),
        )
        .unwrap(),
    );
    for (const profile of [
      profileDto({ userId: customerId }),
      profileDto({ status: "SUSPENDED" }),
      profileDto({ dashboardAccess: { allowed: false, status: "RESTRICTED" } }),
    ]) {
      await seedVendorHome(store, { profile });
      await assert.rejects(
        store
          .dispatch(ep("getVendorBookings").initiate(listArg, { forceRefetch: true }))
          .unwrap(),
      );
    }
  });
});
test("staff JWT actor can read resolved vendor records; owner decisions and Orders screen remain blocked", async () => {
  await mocked(
    async (store) => {
      const staffScope = {
        ...scope,
        userId: "44444444-4444-4444-8444-444444444444",
        role: "VENDOR_STAFF",
      };
      store.dispatch(
        identityVerified({
          id: staffScope.userId,
          name: "Staff",
          email: "staff@example.invalid",
          roles: ["VENDOR", "VENDOR_STAFF"],
          role: "VENDOR_STAFF",
        }),
      );
      await seedVendorHome(store);
      const b = await store
        .dispatch(ep("getVendorBookings").initiate({ ...staffScope, filters: {} }))
        .unwrap();
      assert.equal(b[0].vendorId, vendorId);
      assert.deepEqual(
        await store
          .dispatch(ep("getVendorBookingCounts").initiate(staffScope))
          .unwrap(),
        counts,
      );
      assert.equal(
        (
          await store
            .dispatch(ep("getVendorBooking").initiate({ ...staffScope, bookingId }))
            .unwrap()
        ).id,
        bookingId,
      );
      assert.equal(
        (
          await store
            .dispatch(
              ep("getVendorBookingTracking").initiate({ ...staffScope, bookingId }),
            )
            .unwrap()
        ).roleView,
        "VENDOR",
      );
      await assert.rejects(
        store
          .dispatch(ep("decideVendorBooking").initiate({ ...decision, ...staffScope }))
          .unwrap(),
      );
      const html = renderToStaticMarkup(
        React.createElement(Provider, { store }, React.createElement(VendorOrdersPage)),
      );
      assert.ok(html.includes("active Vendor role is required"));
      assert.ok(!html.includes("Actual customer event"));
    },
    async (r) => {
      const path = new globalThis.URL(r.url).pathname;
      assert.equal(r.method, "GET");
      return json(
        path.endsWith("/counts")
          ? counts
          : path.endsWith("/tracking")
            ? tracking()
            : path.endsWith(`/${bookingId}`)
              ? booking()
              : [booking()],
      );
    },
  );
});
for (const [name, arg, response] of [
  ["getVendorBookings", listArg, { items: [booking()] }],
  ["getVendorBookingCounts", scope, { counts }],
  ["getVendorBookings", listArg, [booking({ vendorId: customerId })]],
  [
    "getVendorBookings",
    listArg,
    [booking({ customer: { ...booking().customer, id: ownerId } })],
  ],
  ["getVendorBooking", selected, booking({ id: truckId })],
  ["getVendorBookingTracking", selected, tracking({ bookingId: truckId })],
  ["getVendorBookingTracking", selected, tracking({ roleView: "CUSTOMER" })],
])
  test(`${name}: rejects wrong envelope/association/selection`, async () => {
    await mocked(
      async (store) => {
        await seed(store);
        await assert.rejects(
          store.dispatch(ep(name).initiate(arg, { forceRefetch: true })).unwrap(),
        );
      },
      async () => json(response),
    );
  });
for (const [action, from, to] of [
  ["accept", "PENDING", "ACCEPTED"],
  ["reject", "PENDING", "REJECTED"],
  ["reject", "ACCEPTED", "REJECTED"],
  ["reject", "QUOTED", "REJECTED"],
])
  test(`${action} ${from}: confirmed owner PATCH and server status, no quote/payment call`, async () => {
    let calls = 0;
    await mocked(
      async (store) => {
        await seed(store, booking({ status: from }));
        await store.dispatch(
          vendorBookingsApi.util.upsertQueryData("getVendorBookings", listArg, [
            booking({ status: from }),
          ]),
        );
        await store.dispatch(
          vendorBookingsApi.util.upsertQueryData(
            "getVendorBookingCounts",
            scope,
            counts,
          ),
        );
        await store.dispatch(
          bookingsApi.util.upsertQueryData(
            "getCustomerBookings",
            { ...scope, role: "CUSTOMER" },
            [],
          ),
        );
        const response = await store
          .dispatch(
            ep("decideVendorBooking").initiate({
              ...decision,
              action,
              body: { reason: "  Actual reason  " },
            }),
          )
          .unwrap();
        assert.equal(response.status, to);
        assert.equal(calls, 1);
        assert.equal(
          ep("getVendorBookings").select(listArg)(store.getState()).data,
          undefined,
        );
        assert.equal(
          ep("getVendorBookingCounts").select(scope)(store.getState()).data,
          undefined,
        );
        assert.equal(
          ep("getVendorBooking").select(selected)(store.getState()).data,
          undefined,
        );
        assert.equal(
          bookingsApi.endpoints.getCustomerBookings.select({
            ...scope,
            role: "CUSTOMER",
          })(store.getState()).data,
          undefined,
        );
      },
      async (r) => {
        calls++;
        assert.equal(r.method, "PATCH");
        assert.equal(
          new globalThis.URL(r.url).pathname,
          `/api/v1/bookings/${bookingId}/${action}`,
        );
        assert.deepEqual(await r.json(), { reason: "Actual reason" });
        return json(booking({ status: to }));
      },
    );
  });
test("optional blank reason becomes empty DTO, unsupported reason types/properties fail validation", () => {
  for (const body of [{}, { reason: "" }, { reason: "  " }])
    assert.deepEqual(vendorDecisionBodySchema.parse(body), {});
  for (const body of [{ reason: 42 }, { reason: null }, { reason: "Actual", vendorId }])
    assert.equal(vendorDecisionBodySchema.safeParse(body).success, false);
});
test("unsupported states, missing end time, confirmation, actor or real selection cannot write", async () => {
  await mocked(async (store) => {
    for (const b of [booking({ status: "CONFIRMED" }), booking({ endsAt: null })]) {
      await seed(store, b);
      for (const action of ["accept", "reject"])
        await assert.rejects(
          store
            .dispatch(ep("decideVendorBooking").initiate({ ...decision, action }))
            .unwrap(),
        );
    }
    await seed(store, booking({ status: "QUOTED" }));
    await assert.rejects(
      store.dispatch(ep("decideVendorBooking").initiate(decision)).unwrap(),
    );
    await seed(store);
    for (const change of [
      { confirmed: false },
      { role: "CUSTOMER" },
      { sessionId: "stale" },
      { bookingId: "fixture" },
      { body: { reason: 42 } },
    ])
      await assert.rejects(
        store
          .dispatch(ep("decideVendorBooking").initiate({ ...decision, ...change }))
          .unwrap(),
      );
  });
});
for (const status of [400, 403, 404, 409, 500])
  test(`decision ${status}: no client success, selected identity remains usable for retry`, async () => {
    await mocked(
      async (store) => {
        await seed(store);
        await assert.rejects(
          store.dispatch(ep("decideVendorBooking").initiate(decision)).unwrap(),
          (e) => e.status === status,
        );
        assert.equal(selected.bookingId, bookingId);
      },
      async () => json({ message: "Unavailable" }, status),
    );
  });
test("network decision failure refreshes uncertain state and supports a verified retry", async () => {
  let calls = 0;
  await mocked(
    async (store) => {
      await seed(store);
      await assert.rejects(
        store.dispatch(ep("decideVendorBooking").initiate(decision)).unwrap(),
      );
      await seed(store);
      assert.equal(
        (await store.dispatch(ep("decideVendorBooking").initiate(decision)).unwrap())
          .status,
        "ACCEPTED",
      );
    },
    async () => {
      if (!calls++) throw new TypeError("offline");
      return json(booking({ status: "ACCEPTED" }));
    },
  );
});
test("concurrent accept/reject for same booking sends one mutation", async () => {
  let release;
  let started;
  let calls = 0;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      await seed(store);
      const first = store.dispatch(ep("decideVendorBooking").initiate(decision));
      await ready;
      await assert.rejects(
        store
          .dispatch(
            ep("decideVendorBooking").initiate({ ...decision, action: "reject" }),
          )
          .unwrap(),
      );
      release(json(booking({ status: "ACCEPTED" })));
      await first.unwrap();
      assert.equal(calls, 1);
    },
    () => {
      calls++;
      started();
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
test("decision refreshes subscribed list/count/detail/tracking and T04 count cache", async () => {
  let changed = false;
  const calls = [];
  await mocked(
    async (store) => {
      await seed(store);
      await store.dispatch(
        vendorBookingsApi.util.upsertQueryData("getVendorBookings", listArg, [
          booking(),
        ]),
      );
      await store.dispatch(
        vendorBookingsApi.util.upsertQueryData("getVendorBookingCounts", scope, counts),
      );
      await store.dispatch(
        vendorBookingsApi.util.upsertQueryData(
          "getVendorBookingTracking",
          selected,
          tracking(),
        ),
      );
      const requests = [
        store.dispatch(ep("getVendorBookings").initiate(listArg)),
        store.dispatch(ep("getVendorBookingCounts").initiate(scope)),
        store.dispatch(ep("getVendorBooking").initiate(selected)),
        store.dispatch(ep("getVendorBookingTracking").initiate(selected)),
        store.dispatch(vendorApi.endpoints.getVendorRequestCounts.initiate()),
      ];
      await Promise.all(requests);
      await store.dispatch(ep("decideVendorBooking").initiate(decision)).unwrap();
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      for (const [name, arg] of [
        ["getVendorBookings", listArg],
        ["getVendorBookingCounts", scope],
        ["getVendorBooking", selected],
        ["getVendorBookingTracking", selected],
      ])
        assert.equal(ep(name).select(arg)(store.getState()).error, undefined);
      assert.equal(
        ep("getVendorBooking").select(selected)(store.getState()).data.status,
        "ACCEPTED",
      );
      for (const suffix of ["/mine", "/counts", `/${bookingId}`, "/tracking"])
        assert.ok(
          calls.some((p) => p.endsWith(suffix)),
          suffix,
        );
      assert.equal(
        vendorApi.endpoints.getVendorRequestCounts.select()(store.getState()).error,
        undefined,
      );
      requests.forEach((r) => r.unsubscribe());
    },
    async (r) => {
      const p = new globalThis.URL(r.url).pathname;
      calls.push(p);
      if (r.method === "PATCH") {
        changed = true;
        return json(booking({ status: "ACCEPTED" }));
      }
      if (p.endsWith("/counts")) return json(counts);
      if (p.endsWith("/mine")) return json(changed ? [] : [booking()]);
      if (p.endsWith("/tracking")) return json(tracking());
      return json(booking({ status: changed ? "ACCEPTED" : "PENDING" }));
    },
  );
});
test("late booking read cannot populate a replacement session", async () => {
  let release;
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      await seed(store);
      const req = store.dispatch(
        ep("getVendorBooking").initiate(selected, { forceRefetch: true }),
      );
      await ready;
      store.dispatch(
        sessionRestored({
          accessToken: "new",
          refreshToken: "new",
          sessionId: "new-session",
          user: null,
        }),
      );
      release(json(booking()));
      await req;
      assert.equal(
        ep("getVendorBooking").select(selected)(store.getState()).data,
        undefined,
      );
    },
    () => {
      started();
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
for (const response of [
  booking({ id: truckId, status: "ACCEPTED" }),
  booking({ status: "CONFIRMED" }),
  booking({
    customerId: ownerId,
    customer: { ...booking().customer, id: ownerId },
    status: "ACCEPTED",
  }),
])
  test("decision rejects mismatched selected booking/customer/status", async () => {
    await mocked(
      async (store) => {
        await seed(store);
        await assert.rejects(
          store.dispatch(ep("decideVendorBooking").initiate(decision)).unwrap(),
        );
      },
      async () => json(response),
    );
  });
for (const action of [
  clearSession("expired"),
  activeRoleSelected("CUSTOMER"),
  sessionRestored({
    accessToken: "new",
    refreshToken: "new",
    sessionId: "new",
    user: null,
  }),
])
  test(`late decision discarded after ${action.type}`, async () => {
    let release;
    let started;
    const ready = new Promise((r) => {
      started = r;
    });
    await mocked(
      async (store) => {
        store.dispatch(
          identityVerified({
            id: ownerId,
            name: "Owner",
            email: "owner@example.invalid",
            roles: ["VENDOR", "CUSTOMER"],
            role: "VENDOR",
          }),
        );
        await seed(store);
        const req = store.dispatch(ep("decideVendorBooking").initiate(decision));
        await ready;
        store.dispatch(action);
        release(json(booking({ status: "ACCEPTED" })));
        await req;
        assert.equal(Object.keys(store.getState().api.queries).length, 0);
        assert.equal(Object.keys(store.getState().api.mutations).length, 0);
      },
      () => {
        started();
        return new Promise((r) => {
          release = r;
        });
      },
    );
  });
test("real cards/details/timeline use server states and precision, with no fixture payment success", () => {
  const b = vendorBookingSchema.parse(booking());
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(VendorBookingCard, { booking: b, onDetails() {} }),
      React.createElement(RequestOrderDetails, { booking: b, onBack() {} }),
      React.createElement(VendorBookingTimeline, {
        tracking: vendorBookingTrackingSchema.parse(tracking()),
      }),
    ),
  );
  for (const s of [
    bookingId,
    customerId,
    "Actual Customer",
    "Actual Food Truck",
    "Actual Vendor Kitchen",
    "PENDING",
    "CURRENT",
    "Currency unavailable 1,234.50",
  ])
    assert.ok(html.includes(s), s);
  for (const s of [
    "Sample Booking Timeline",
    "Deposit received",
    "$",
    "Send quote",
    "Accept quote",
  ])
    assert.ok(!html.includes(s), s);
  assert.equal(vendorDecisionAllowed(b, "accept"), true);
});
test("owner Orders UI shows loading, actual counts, empty/error/retry without fixture bookings", async () => {
  let status = 200;
  await mocked(
    async (store) => {
      await seed(store);
      const render = () =>
        renderToStaticMarkup(
          React.createElement(
            Provider,
            { store },
            React.createElement(
              MemoryRouter,
              null,
              React.createElement(VendorOrdersPage),
            ),
          ),
        );
      assert.ok(render().includes("Loading bookings"));
      await store.dispatch(ep("getVendorBookingCounts").initiate(scope)).unwrap();
      await store.dispatch(ep("getVendorBookings").initiate(listArg)).unwrap();
      const empty = render();
      assert.ok(empty.includes("No bookings match"));
      assert.ok(empty.includes("4</span>"));
      assert.ok(empty.includes("7</span>"));
      status = 403;
      await assert.rejects(
        store
          .dispatch(ep("getVendorBookings").initiate(listArg, { forceRefetch: true }))
          .unwrap(),
      );
      const denied = render();
      assert.ok(denied.includes("Retry"));
      assert.ok(!denied.includes("No bookings match"));
    },
    async (r) =>
      json(
        new globalThis.URL(r.url).pathname.endsWith("/counts")
          ? counts
          : status === 200
            ? []
            : { message: "Forbidden" },
        status,
      ),
  );
});
