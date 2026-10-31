import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import {
  vendorTestStore,
  seedVendorHome,
  ownerId,
  vendorId,
  truckId,
  json,
} from "../../vendor/utils/vendor.test-fixtures.mjs";
import { baseApi } from "../../../services/api/baseApi.ts";
import { vendorBookingsApi } from "../../vendor/api/vendorBookings.api.ts";
import { vendorQuotesApi } from "../../vendor/api/vendorQuotes.api.ts";
import { vendorFinancialApi } from "../api/vendorFinancial.api.ts";
import {
  summarySchema,
  vendorTransactionSchema,
} from "../schemas/vendorFinancial.schema.ts";
import {
  quoteInputSchema,
  bookingQuoteSchema,
  validQuoteForGuests,
} from "../../bookings/schemas/bookingQuote.schema.ts";
import { bookingDetailSchema } from "../../customer/schemas/booking.schema.ts";
import { BookingQuoteReview } from "../../bookings/components/BookingQuoteReview.tsx";
import { RequestQuoteForm } from "../../vendor/components/requests/RequestQuoteForm.tsx";
import {
  FinancialSummary,
  VendorTransactionDetails,
  VendorFinancialPanel,
} from "../../vendor/components/earnings/VendorFinancialPanel.tsx";
import {
  identityVerified,
  clearSession,
  sessionRestored,
} from "../../auth/store/auth.slice.ts";

const bookingId = "11111111-1111-4111-8111-111111111111";
const customerId = "22222222-2222-4222-8222-222222222222";
const quoteId = "33333333-3333-4333-8333-333333333333";
const paymentId = "44444444-4444-4444-8444-444444444444";
const scope = { sessionId: "vendor-integration-test", userId: ownerId, role: "VENDOR" };
const selected = { ...scope, bookingId };
const filters = { page: 1, limit: 20 };
const listArg = { ...scope, filters };
const quote = (o = {}) => ({
  id: quoteId,
  bookingId,
  vendorId,
  status: "PENDING",
  pricingModel: "FLAT_FEE",
  pricePerPerson: null,
  selectedMenuItems: ["Actual menu"],
  extraCharges: [{ label: "Setup", amount: 10 }],
  baseServiceFee: "100.00",
  transportFee: "0.00",
  serviceFee: "0.00",
  taxAmount: "0.00",
  discountAmount: "0.00",
  totalAmount: "110.00",
  paymentPreference: "DEPOSIT_ONLY",
  depositAmount: "20.00",
  depositPercent: "18.18",
  balanceDueAtEvent: "90.00",
  message: null,
  noteToClient: "Actual vendor note",
  terms: "Actual supplied terms",
  expiresAt: "2099-11-01T00:00:00Z",
  createdAt: "2026-10-29T12:00:00Z",
  ...o,
});
const booking = (o = {}) => ({
  id: bookingId,
  bookingNumber: "BD-REAL-01",
  customerId,
  vendorId,
  foodTruckId: truckId,
  communityRequestId: null,
  status: "PENDING",
  bookingType: "EVENT",
  eventType: "OTHER",
  eventName: "Actual event",
  eventDescription: null,
  startsAt: "2026-12-01T12:00:00Z",
  endsAt: "2026-12-01T15:00:00Z",
  guestCount: 10,
  address: "Actual address",
  contactPhone: null,
  totalAmount: "0.00",
  specialInstructions: null,
  createdAt: "2026-10-29T12:00:00Z",
  completionRequestedAt: null,
  completionApprovedAt: null,
  completedAt: null,
  paymentReleasedAt: null,
  vendor: {
    id: vendorId,
    userId: ownerId,
    businessName: "Actual Vendor Kitchen",
    businessPhone: null,
  },
  foodTruck: { id: truckId, vendorId, name: "Actual Food Truck" },
  customer: {
    id: customerId,
    email: "customer@example.invalid",
    phone: null,
    profile: null,
  },
  quotes: [],
  ...o,
});
const input = {
  pricingModel: "FLAT_FEE",
  baseServiceFee: 100,
  extraCharges: [{ label: "Setup", amount: 10 }],
  paymentPreference: "DEPOSIT_ONLY",
  depositAmount: 20,
  terms: "Actual supplied terms",
  expiresAt: "2099-11-01T00:00:00Z",
};
const result = () => ({
  message: "Quote sent successfully",
  quote: quote(),
  booking: booking({ status: "QUOTED", quotes: [quote()] }),
  breakdown: { commissionAmount: 2.6, vendorNetAmount: 17.4 },
});
const counts = {
  totalPayments: 5,
  succeededPayments: 1,
  failedPayments: 1,
  processingPayments: 2,
  refundedPayments: 1,
};
const transaction = (o = {}) => ({
  paymentId,
  bookingId,
  bookingNumber: "BD-REAL-01",
  eventName: "Actual event",
  eventStartsAt: "2026-12-01T12:00:00Z",
  foodTruck: { id: truckId, name: "Actual Food Truck" },
  customer: { id: customerId, name: "Actual Customer", email: "strip@example.invalid" },
  stripePaymentIntentId: "must-strip",
  grossAmount: "123456789.50",
  commissionAmount: "12.30",
  vendorNetAmount: "123456777.20",
  currency: "EUR",
  paymentStatus: "PROCESSING",
  payout: null,
  refunds: [],
  paidAt: null,
  createdAt: "2026-10-29T12:00:00Z",
  ...o,
});
const refund = () => ({
  id: quoteId,
  paymentId,
  bookingId,
  bookingNumber: "BD-REAL-01",
  eventName: "Actual event",
  amount: "12.30",
  currency: "EUR",
  reason: "Actual refund reason",
  status: "REFUNDED",
  processedAt: "2026-10-29T13:00:00Z",
  paymentStatus: "PARTIALLY_REFUNDED",
});
const payout = () => ({
  id: quoteId,
  vendorId,
  paymentId,
  bookingId,
  amount: "80.00",
  currency: "JPY",
  status: "PENDING",
  paidAt: null,
  createdAt: "2026-10-29T12:00:00Z",
});
const paged = (items) => ({
  items,
  meta: { page: 1, limit: 20, total: items.length, totalPages: items.length ? 1 : 0 },
});
async function mocked(
  run,
  handler = () => {
    throw new Error("Unexpected HTTP");
  },
) {
  const store = vendorTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  await seedVendorHome(store);
  await store.dispatch(
    vendorBookingsApi.util.upsertQueryData("getVendorBooking", selected, booking()),
  );
  try {
    await run(store);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
const ep = (name) => vendorFinancialApi.endpoints[name];
for (const [name, arg, response, path] of [
  [
    "getVendorFinancialSummary",
    scope,
    { ...counts, totalGross: "99999.99", currency: "USD" },
    "/payments/vendor/summary",
  ],
  [
    "getVendorTransactions",
    listArg,
    paged([transaction()]),
    "/payments/vendor/transactions",
  ],
  [
    "getVendorTransaction",
    { ...scope, paymentId },
    transaction(),
    `/payments/vendor/transactions/${paymentId}`,
  ],
  ["getVendorRefundHistory", listArg, paged([refund()]), "/payments/vendor/refunds"],
  ["getVendorPayoutHistory", scope, [payout()], "/payments/payouts/mine"],
]) {
  test(`${name}: exact GET contract, actual identities and safe projection`, async () => {
    await mocked(
      async (store) => {
        const r = await store.dispatch(ep(name).initiate(arg)).unwrap();
        assert.ok(r);
        assert.ok(!JSON.stringify(r).includes("must-strip"));
        assert.ok(!JSON.stringify(r).includes("strip@example.invalid"));
        if (name === "getVendorFinancialSummary") assert.deepEqual(r, counts);
      },
      async (r) => {
        assert.equal(r.method, "GET");
        assert.equal(new globalThis.URL(r.url).pathname, `/api/v1${path}`);
        assert.equal(r.headers.get("authorization"), "Bearer test-access");
        return json(response);
      },
    );
  });
  for (const status of [400, 403, 404, 409, 500])
    test(`${name}: ${status} never becomes empty/financial success`, async () => {
      await mocked(
        async (store) => {
          await assert.rejects(
            store.dispatch(ep(name).initiate(arg)).unwrap(),
            (e) => e.status === status,
          );
        },
        async () => json({ message: "Unavailable" }, status),
      );
    });
}
test("financial pagination/date/status parameters are exact; empty and network retry remain distinct", async () => {
  let calls = 0;
  const arg = {
    ...scope,
    filters: {
      page: 2,
      limit: 10,
      status: "FAILED",
      from: "2026-10-01T00:00:00Z",
      to: "2026-10-29T23:59:59Z",
    },
  };
  await mocked(
    async (store) => {
      await assert.rejects(
        store.dispatch(ep("getVendorTransactions").initiate(arg)).unwrap(),
      );
      const r = await store
        .dispatch(ep("getVendorTransactions").initiate(arg, { forceRefetch: true }))
        .unwrap();
      assert.deepEqual(r.items, []);
    },
    async (r) => {
      assert.deepEqual(Object.fromEntries(new globalThis.URL(r.url).searchParams), {
        ...arg.filters,
        page: "2",
        limit: "10",
      });
      if (!calls++) throw new TypeError("offline");
      return json({ items: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0 } });
    },
  );
});
test("financial filters and payout/detail identities fail closed", async () => {
  await mocked(async (store) => {
    for (const f of [
      { page: 0, limit: 20 },
      { page: 1, limit: 101 },
      { ...filters, status: "PAID" },
      { ...filters, vendorId },
      { ...filters, from: "bad" },
    ])
      await assert.rejects(
        store
          .dispatch(ep("getVendorTransactions").initiate({ ...scope, filters: f }))
          .unwrap(),
      );
    await assert.rejects(
      store
        .dispatch(
          ep("getVendorTransaction").initiate({ ...scope, paymentId: "fixture" }),
        )
        .unwrap(),
    );
  });
  await mocked(
    async (store) => {
      await assert.rejects(
        store.dispatch(ep("getVendorPayoutHistory").initiate(scope)).unwrap(),
      );
    },
    async () => json([{ ...payout(), vendorId: customerId }]),
  );
  await mocked(
    async (store) => {
      await assert.rejects(
        store
          .dispatch(ep("getVendorTransaction").initiate({ ...scope, paymentId }))
          .unwrap(),
      );
    },
    async () => json(transaction({ paymentId: quoteId })),
  );
});
test("summary monetary totals are withheld; individual explicit currencies/precision and statuses survive", () => {
  const summary = summarySchema.parse({
    ...counts,
    totalGross: "99999.99",
    totalNet: "88888.88",
    currency: "USD",
  });
  const html = renderToStaticMarkup(React.createElement(FinancialSummary, { summary }));
  assert.ok(!html.includes("99999.99"));
  assert.ok(!html.includes("USD"));
  assert.ok(html.includes("not settled earnings"));
  const detail = renderToStaticMarkup(
    React.createElement(VendorTransactionDetails, {
      transaction: vendorTransactionSchema.parse(transaction()),
    }),
  );
  assert.ok(detail.includes("EUR 123,456,789.50"));
  assert.ok(detail.includes("not yet confirmed"));
  assert.ok(detail.includes("No payout record"));
  assert.ok(!detail.includes("Payment confirmed by the backend"));
  assert.equal(
    vendorTransactionSchema.parse(transaction({ currency: "JPY" })).currency,
    "JPY",
  );
});
test("quote DTO supports flat/per-person and full/deposit without fixed minimum or commission", () => {
  assert.equal(validQuoteForGuests(quoteInputSchema.parse(input), 10), true);
  assert.equal(
    validQuoteForGuests(
      quoteInputSchema.parse({
        pricingModel: "PER_PERSON",
        pricePerPerson: 12.34,
        paymentPreference: "PREPAID_IN_FULL",
      }),
      10,
    ),
    true,
  );
  assert.equal(
    validQuoteForGuests(quoteInputSchema.parse({ ...input, depositAmount: 0.01 }), 10),
    true,
  );
  for (const v of [
    { ...input, baseServiceFee: -1 },
    { ...input, pricingModel: "PER_PERSON" },
    { ...input, depositPercent: 101 },
    { ...input, expiresAt: "2020-01-01T00:00:00Z" },
    { ...input, commissionAmount: 15 },
    { ...input, extraCharges: [{ label: " ", amount: 1 }] },
    { ...input, paymentPreference: "NO_PREFERENCE" },
  ])
    assert.equal(quoteInputSchema.safeParse(v).success, false);
  assert.equal(
    validQuoteForGuests(quoteInputSchema.parse({ ...input, depositAmount: 1000 }), 10),
    false,
  );
  assert.equal(
    validQuoteForGuests(quoteInputSchema.parse({ ...input, discountAmount: 1000 }), 10),
    false,
  );
});
test("real quote POST returns server breakdown, refreshes booking and never accepts quote or calls Stripe", async () => {
  const paths = [];
  await mocked(
    async (store) => {
      const r = await store
        .dispatch(
          vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
            ...selected,
            confirmed: true,
            body: input,
          }),
        )
        .unwrap();
      assert.equal(r.quote.id, quoteId);
      assert.equal(r.breakdown.commissionAmount, 2.6);
      assert.deepEqual(paths, [
        `POST /api/v1/bookings/${bookingId}/quotes`,
        `GET /api/v1/bookings/${bookingId}`,
      ]);
    },
    async (r) => {
      paths.push(`${r.method} ${new globalThis.URL(r.url).pathname}`);
      if (r.method === "POST") {
        assert.deepEqual(await r.json(), input);
        return json(result(), 201);
      }
      return json(result().booking);
    },
  );
});
test("uncertain committed quote is reconciled by GET; a second POST is blocked", async () => {
  let writes = 0;
  await mocked(
    async (store) => {
      await assert.rejects(
        store
          .dispatch(
            vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
              ...selected,
              confirmed: true,
              body: input,
            }),
          )
          .unwrap(),
      );
      await assert.rejects(
        store
          .dispatch(
            vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
              ...selected,
              confirmed: true,
              body: input,
            }),
          )
          .unwrap(),
      );
      assert.equal(writes, 1);
    },
    async (r) => {
      if (r.method === "POST") {
        writes++;
        return json({ message: "Notification failed" }, 500);
      }
      return json(result().booking);
    },
  );
});
for (const status of [400, 403, 404, 409])
  test(`quote POST ${status} retains failure while reconciling the booking`, async () => {
    await mocked(
      async (store) => {
        await assert.rejects(
          store
            .dispatch(
              vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
                ...selected,
                confirmed: true,
                body: input,
              }),
            )
            .unwrap(),
          (e) => e.status === status,
        );
      },
      async (r) =>
        json(
          r.method === "POST" ? { message: "Quote unavailable" } : booking(),
          r.method === "POST" ? status : 200,
        ),
    );
  });
test("quote acknowledgment must match booking/vendor/status", async () => {
  for (const response of [
    { ...result(), quote: quote({ bookingId: paymentId }) },
    { ...result(), booking: booking({ status: "CONFIRMED" }) },
  ])
    await mocked(
      async (store) => {
        await assert.rejects(
          store
            .dispatch(
              vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
                ...selected,
                confirmed: true,
                body: input,
              }),
            )
            .unwrap(),
        );
      },
      async (r) => json(r.method === "POST" ? response : result().booking),
    );
});
test("logout during quote reconciliation cannot repopulate a new session", async () => {
  let release;
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      const req = store.dispatch(
        vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
          ...selected,
          confirmed: true,
          body: input,
        }),
      );
      await ready;
      store.dispatch(clearSession("expired"));
      release(json(result().booking));
      await req;
      assert.equal(Object.keys(store.getState().api.queries).length, 0);
      assert.equal(Object.keys(store.getState().api.mutations).length, 0);
    },
    (r) => {
      if (r.method === "POST") return Promise.resolve(json(result(), 201));
      started();
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
test("quote real IDs, eligibility, confirmation and DTO fail before HTTP", async () => {
  await mocked(async (store) => {
    for (const change of [
      { confirmed: false },
      { bookingId: "fixture" },
      { body: { ...input, depositAmount: 1000 } },
      { role: "CUSTOMER" },
      { sessionId: "old" },
    ])
      await assert.rejects(
        store
          .dispatch(
            vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
              ...selected,
              confirmed: true,
              body: input,
              ...change,
            }),
          )
          .unwrap(),
      );
    await store.dispatch(
      vendorBookingsApi.util.upsertQueryData(
        "getVendorBooking",
        selected,
        booking({ status: "QUOTED" }),
      ),
    );
    await assert.rejects(
      store
        .dispatch(
          vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
            ...selected,
            confirmed: true,
            body: input,
          }),
        )
        .unwrap(),
    );
  });
});
test("concurrent quote sends share booking flight", async () => {
  let release;
  let started;
  let writes = 0;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      const first = store.dispatch(
        vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
          ...selected,
          confirmed: true,
          body: input,
        }),
      );
      await ready;
      await assert.rejects(
        store
          .dispatch(
            vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
              ...selected,
              confirmed: true,
              body: input,
            }),
          )
          .unwrap(),
      );
      release(json(result(), 201));
      await first.unwrap();
      assert.equal(writes, 1);
    },
    (r) => {
      if (r.method === "POST") {
        writes++;
        started();
        return new Promise((r) => {
          release = r;
        });
      }
      return Promise.resolve(json(result().booking));
    },
  );
});
test("booking quote review preserves identity, terms, prices, expiry and blocked Customer acceptance", () => {
  const q = bookingQuoteSchema.parse(quote());
  assert.equal(
    bookingDetailSchema.safeParse(
      booking({ quotes: [quote({ bookingId: paymentId })] }),
    ).success,
    false,
  );
  const html = renderToStaticMarkup(
    React.createElement(BookingQuoteReview, { bookingId, quotes: [q], customer: true }),
  );
  for (const s of [
    quoteId,
    "Actual supplied terms",
    "Currency unavailable 110.00",
    "PENDING",
    "2099-11-01",
    "Accept quote unavailable",
    "disabled",
  ])
    assert.ok(html.includes(s), s);
  assert.ok(!html.includes("15%"));
  assert.ok(!html.includes("$"));
});
test("live RequestQuoteForm uses existing UI without preview commission or fake menu selections", async () => {
  await mocked(async (store) => {
    const html = renderToStaticMarkup(
      React.createElement(
        Provider,
        { store },
        React.createElement(RequestQuoteForm, {
          scope: selected,
          booking: booking(),
          disabled: false,
        }),
      ),
    );
    for (const s of [
      "FLAT_FEE",
      "PER_PERSON",
      "DEPOSIT_ONLY",
      "PREPAID_IN_FULL",
      "Expiry",
      "Terms",
      "Add charge",
      "Review and send quote",
    ])
      assert.ok(html.includes(s), s);
    assert.ok(!html.includes("15%"));
    assert.ok(!html.includes("Burger"));
  });
});
test("active staff cannot use owner financial reads or quote mutation, even with VENDOR in roles", async () => {
  await mocked(async (store) => {
    store.dispatch(
      identityVerified({
        id: ownerId,
        roles: ["VENDOR", "VENDOR_STAFF"],
        role: "VENDOR_STAFF",
        name: "Staff",
        email: "staff@example.invalid",
      }),
    );
    await seedVendorHome(store);
    const staff = { ...scope, role: "VENDOR_STAFF" };
    await assert.rejects(
      store.dispatch(ep("getVendorFinancialSummary").initiate(staff)).unwrap(),
    );
    await assert.rejects(
      store
        .dispatch(
          vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
            ...selected,
            role: "VENDOR_STAFF",
            confirmed: true,
            body: input,
          }),
        )
        .unwrap(),
    );
    assert.ok(
      renderToStaticMarkup(
        React.createElement(
          Provider,
          { store },
          React.createElement(VendorFinancialPanel),
        ),
      ).includes("active Vendor role"),
    );
  });
});
for (const action of [
  clearSession("expired"),
  sessionRestored({
    sessionId: "replacement",
    accessToken: "new",
    refreshToken: "new",
    user: null,
  }),
])
  test(`late financial read discarded on ${action.type}`, async () => {
    let release;
    let started;
    const ready = new Promise((r) => {
      started = r;
    });
    await mocked(
      async (store) => {
        const req = store.dispatch(
          ep("getVendorTransaction").initiate({ ...scope, paymentId }),
        );
        await ready;
        store.dispatch(action);
        release(json(transaction()));
        await req;
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
test("Earnings live financial panel renders loading, counts and empty transactions with retry", async () => {
  let status = 200;
  await mocked(
    async (store) => {
      const render = () =>
        renderToStaticMarkup(
          React.createElement(
            Provider,
            { store },
            React.createElement(VendorFinancialPanel),
          ),
        );
      assert.ok(render().includes("Loading financial history"));
      await store.dispatch(ep("getVendorFinancialSummary").initiate(scope)).unwrap();
      await store.dispatch(ep("getVendorTransactions").initiate(listArg)).unwrap();
      assert.ok(render().includes("No transactions"));
      status = 403;
      await assert.rejects(
        store
          .dispatch(
            ep("getVendorTransactions").initiate(listArg, { forceRefetch: true }),
          )
          .unwrap(),
      );
      assert.ok(render().includes("Retry"));
      assert.ok(!render().includes("No transactions"));
    },
    async (r) =>
      json(
        new globalThis.URL(r.url).pathname.endsWith("/summary")
          ? counts
          : status === 200
            ? paged([])
            : { message: "Forbidden" },
        status,
      ),
  );
});
