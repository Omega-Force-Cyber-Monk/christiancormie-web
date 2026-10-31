import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import {
  memberStore,
  viewerId,
  truckId,
  postId,
  json,
} from "../../social/utils/member.test-fixtures.mjs";
import { baseApi } from "../../../services/api/baseApi.ts";
import { bookingsApi } from "./bookings.api.ts";
import {
  bookingSchema,
  bookingStatusSchema,
  trackingSchema,
} from "../schemas/booking.schema.ts";
import OrdersPage, {
  BookingList,
  BookingInformation,
  BookingTimeline,
} from "../pages/CustomerOrdersPage.tsx";
import {
  activeRoleSelected,
  clearSession,
  sessionRestored,
} from "../../auth/store/auth.slice.ts";

const scope = { sessionId: "member-test", userId: viewerId, role: "CUSTOMER" };
const selected = { ...scope, bookingId: postId };
const booking = (overrides = {}) => ({
  id: postId,
  bookingNumber: "BD-REAL-123",
  customerId: viewerId,
  vendorId: truckId,
  foodTruckId: truckId,
  status: "PAYMENT_PENDING",
  bookingType: "EVENT",
  eventType: "CORPORATE_EVENT",
  eventName: "Actual event",
  eventDescription: null,
  startsAt: "2026-11-10T12:00:00Z",
  endsAt: null,
  guestCount: 21,
  address: "Actual address",
  specialInstructions: null,
  createdAt: "2026-10-29T12:00:00Z",
  vendor: { id: truckId, businessName: "Actual vendor" },
  foodTruck: { id: truckId, vendorId: truckId, name: "Actual truck" },
  ...overrides,
});
const tracking = (overrides = {}) => ({
  bookingId: postId,
  bookingNumber: "BD-REAL-123",
  roleView: "CUSTOMER",
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
  ],
  ...overrides,
});
async function mocked(run, handler) {
  const original = globalThis.fetch;
  const store = memberStore();
  globalThis.fetch = handler;
  try {
    await run(store);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
const endpoint = (name) => bookingsApi.endpoints[name];
test("notification booking URL selects only a real owned list record and rejects fixture targets", async () => {
  await mocked(
    async (store) => {
      await store.dispatch(endpoint("getCustomerBookings").initiate(scope)).unwrap();
      const render = (value) =>
        renderToStaticMarkup(
          React.createElement(
            Provider,
            { store },
            React.createElement(
              MemoryRouter,
              { initialEntries: [`/dashboard/customer/orders?booking=${value}`] },
              React.createElement(OrdersPage),
            ),
          ),
        );
      assert.match(render(postId), /Loading booking details/);
      assert.doesNotMatch(render("fixture-id"), /Loading booking details/);
      assert.match(render(truckId), /requested booking is not available/);
    },
    async () => json([booking()]),
  );
});
for (const [name, arg, data, path] of [
  ["getCustomerBookings", scope, [booking()], "/bookings/mine"],
  [
    "getCustomerBooking",
    selected,
    {
      ...booking(),
      completionRequestedAt: null,
      completionApprovedAt: null,
      completedAt: null,
      paymentReleasedAt: null,
    },
    `/bookings/${postId}`,
  ],
  ["getCustomerBookingTracking", selected, tracking(), `/bookings/${postId}/tracking`],
]) {
  test(`${name}: exact GET contract, credentials and projected data`, async () => {
    await mocked(
      async (store) => {
        const result = await store.dispatch(endpoint(name).initiate(arg)).unwrap();
        assert.deepEqual(result, data);
      },
      async (request) => {
        assert.equal(new globalThis.URL(request.url).pathname, `/api/v1${path}`);
        assert.equal(request.method, "GET");
        assert.equal(request.headers.get("authorization"), "Bearer test-access");
        return json(data);
      },
    );
  });
  for (const status of [403, 404, 500])
    test(`${name}: ${status} never becomes empty success`, async () => {
      await mocked(
        async (store) => {
          await assert.rejects(store.dispatch(endpoint(name).initiate(arg)).unwrap());
          assert.equal(endpoint(name).select(arg)(store.getState()).data, undefined);
        },
        async () => json({ message: "Unavailable" }, status),
      );
    });
}
test("empty list is successful; network error can be retried", async () => {
  let calls = 0;
  await mocked(
    async (store) => {
      await assert.rejects(
        store.dispatch(endpoint("getCustomerBookings").initiate(scope)).unwrap(),
      );
      assert.deepEqual(
        await store
          .dispatch(
            endpoint("getCustomerBookings").initiate(scope, { forceRefetch: true }),
          )
          .unwrap(),
        [],
      );
    },
    async () => {
      if (!calls++) throw new TypeError("offline");
      return json([]);
    },
  );
});
test("Orders hides stale records on denied refresh, renders Retry, then recovers empty", async () => {
  let response = [booking()];
  let status = 200;
  await mocked(
    async (store) => {
      const render = () =>
        renderToStaticMarkup(
          React.createElement(
            Provider,
            { store },
            React.createElement(MemoryRouter, null, React.createElement(OrdersPage)),
          ),
        );
      await store.dispatch(endpoint("getCustomerBookings").initiate(scope)).unwrap();
      assert.ok(render().includes("Actual event"));
      response = { message: "Access denied" };
      status = 403;
      await assert.rejects(
        store
          .dispatch(
            endpoint("getCustomerBookings").initiate(scope, { forceRefetch: true }),
          )
          .unwrap(),
      );
      const denied = render();
      assert.ok(denied.includes('role="alert"'));
      assert.ok(denied.includes("Retry"));
      assert.ok(!denied.includes("Actual event"));
      assert.ok(!denied.includes("No bookings yet"));
      response = [];
      status = 200;
      await store
        .dispatch(
          endpoint("getCustomerBookings").initiate(scope, { forceRefetch: true }),
        )
        .unwrap();
      assert.ok(render().includes("No bookings yet"));
    },
    async () => json(response, status),
  );
});
test("wrapped, duplicate and incomplete booking contracts are rejected", async () => {
  for (const response of [
    { items: [booking()] },
    [booking(), booking()],
    [booking({ startsAt: null })],
  ]) {
    await mocked(
      async (store) => {
        await assert.rejects(
          store.dispatch(endpoint("getCustomerBookings").initiate(scope)).unwrap(),
        );
      },
      async () => json(response),
    );
  }
});
for (const bad of [
  booking({ id: "fixture-1" }),
  booking({ customerId: truckId }),
  booking({ status: "PAID" }),
  booking({ foodTruck: { id: truckId, vendorId: postId, name: "Wrong vendor" } }),
]) {
  test(`invalid identity/status/association rejected: ${JSON.stringify(bad).slice(0, 110)}`, async () => {
    await mocked(
      async (store) => {
        await assert.rejects(
          store.dispatch(endpoint("getCustomerBookings").initiate(scope)).unwrap(),
        );
      },
      async () => json([bad]),
    );
  });
}
test("detail and tracking must match selected UUID and Customer view", async () => {
  for (const [name, response] of [
    ["getCustomerBooking", booking({ id: truckId })],
    ["getCustomerBookingTracking", tracking({ bookingId: truckId })],
    ["getCustomerBookingTracking", tracking({ roleView: "VENDOR" })],
  ]) {
    await mocked(
      async (store) => {
        await assert.rejects(
          store.dispatch(endpoint(name).initiate(selected)).unwrap(),
        );
      },
      async () => json(response),
    );
  }
});
test("role, unverified identity, stale scope and fixture UUIDs never send HTTP", async () => {
  await mocked(
    async (store) => {
      for (const arg of [
        { ...selected, role: "VENDOR" },
        { ...selected, sessionId: "old" },
        { ...selected, bookingId: "fixture" },
      ])
        await assert.rejects(
          store.dispatch(endpoint("getCustomerBooking").initiate(arg)).unwrap(),
        );
      store.dispatch(
        sessionRestored({
          accessToken: "new",
          refreshToken: "new",
          sessionId: "new",
          user: null,
        }),
      );
      await assert.rejects(
        store.dispatch(endpoint("getCustomerBookings").initiate(scope)).unwrap(),
      );
    },
    () => {
      throw new Error("Unexpected HTTP");
    },
  );
});
for (const action of [
  activeRoleSelected("VENDOR"),
  clearSession("expired"),
  sessionRestored({
    accessToken: "new",
    refreshToken: "new",
    sessionId: "replacement",
    user: null,
  }),
]) {
  test(`late read discarded on ${action.type}`, async () => {
    let release;
    let started;
    const ready = new Promise((r) => {
      started = r;
    });
    await mocked(
      async (store) => {
        const request = store.dispatch(endpoint("getCustomerBookings").initiate(scope));
        await ready;
        store.dispatch(action);
        release(json([booking()]));
        await request;
        assert.equal(
          endpoint("getCustomerBookings").select(scope)(store.getState()).data,
          undefined,
        );
        assert.equal(Object.keys(store.getState().api.queries).length, 0);
      },
      () => {
        started();
        return new Promise((r) => {
          release = r;
        });
      },
    );
  });
}
test("status projection preserves all backend booking states and strips unreviewed financial fields", () => {
  for (const status of bookingStatusSchema.options)
    assert.equal(bookingSchema.parse(booking({ status })).status, status);
  const parsed = bookingSchema.parse(
    booking({
      payments: [{ id: truckId, status: "SUCCEEDED" }],
      totalAmount: "100.00",
    }),
  );
  assert.equal(parsed.payments, undefined);
  assert.equal(parsed.totalAmount, undefined);
  assert.equal(
    trackingSchema.safeParse(
      tracking({
        steps: [
          { key: "DEPOSIT", status: "PAID", label: "Deposit", completedAt: null },
        ],
      }),
    ).success,
    false,
  );
});
test("list, detail, empty and timeline render actual data without payment-success claims", () => {
  const b = bookingSchema.parse(booking());
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(BookingList, {
        bookings: [b],
        selected: b.id,
        onSelect() {},
      }),
      React.createElement(BookingInformation, { booking: b }),
      React.createElement(BookingTimeline, {
        tracking: trackingSchema.parse(tracking()),
      }),
    ),
  );
  for (const value of [
    b.id,
    b.startsAt,
    b.status,
    "Actual vendor",
    "Actual truck",
    "Actual address",
    "CURRENT",
    "Payment status is unavailable",
  ])
    assert.ok(html.includes(value), value);
  assert.ok(!html.includes("Payment confirmed by the backend"));
  assert.ok(!html.includes("$"));
  assert.ok(
    renderToStaticMarkup(
      React.createElement(BookingList, { bookings: [], selected: null, onSelect() {} }),
    ).includes("No bookings yet"),
  );
});
test("Orders shows loading and denies active Vendor session without exposing records", () => {
  const store = memberStore();
  try {
    const render = () =>
      renderToStaticMarkup(
        React.createElement(
          Provider,
          { store },
          React.createElement(MemoryRouter, null, React.createElement(OrdersPage)),
        ),
      );
    assert.ok(render().includes("Loading bookings"));
    store.dispatch(activeRoleSelected("VENDOR"));
    const html = render();
    assert.ok(html.includes("verified Customer session is required"));
    assert.ok(!html.includes("No bookings yet"));
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});
