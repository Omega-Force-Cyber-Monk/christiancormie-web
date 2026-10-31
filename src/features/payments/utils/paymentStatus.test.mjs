import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PAYMENT_STATUS_LABELS, paymentStatusLabel } from "./paymentStatus.ts";
import { financialAmount, formatFinancialAmount } from "./financialValues.ts";
import { CommunityOffersView } from "../../customer/components/community/CommunityOffersView.tsx";
import { CommunityTrackView } from "../../customer/components/community/CommunityTrackView.tsx";
import {
  initialCommunityState,
  communityReducer,
} from "../../customer/utils/communityState.ts";
import { communityQuotes } from "../../customer/data/community-requests.data.ts";
import { VendorEarningsOverview } from "../../vendor/components/earnings/VendorEarningsOverview.tsx";
import { initialVendorEarningsState } from "../../vendor/utils/earningsState.ts";
import { RequestOrderDetails } from "../../vendor/components/requests/RequestOrderDetails.tsx";
import { vendorOrders } from "../../vendor/utils/requestsState.ts";
const noop = () => {};

const labels = [
  ["PENDING", "Payment request recorded; not paid"],
  ["PROCESSING", "Payment processing; not yet confirmed"],
  ["SUCCEEDED", "Payment confirmed by the backend"],
  ["FAILED", "Payment failed"],
  ["PARTIALLY_REFUNDED", "Payment partially refunded"],
  ["REFUNDED", "Payment refunded"],
  ["CANCELLED", "Payment cancelled"],
];
for (const [status, expected] of labels)
  test(`reviewed Payment.status ${status} retains its distinct meaning`, () => {
    assert.equal(paymentStatusLabel(status), expected);
  });
test("unknown/missing/booking/payout/provider states and truthy objects cannot imply payment success", () => {
  assert.equal(Object.keys(PAYMENT_STATUS_LABELS).length, 7);
  for (const value of [
    null,
    undefined,
    "",
    true,
    false,
    1,
    "success",
    "succeeded",
    "CONFIRMED",
    "PAYMENT_PENDING",
    "PAID",
    "requires_payment_method",
    "__proto__",
    "constructor",
    { status: "SUCCEEDED" },
    {
      toString() {
        throw new Error("Do not coerce");
      },
    },
  ])
    assert.equal(paymentStatusLabel(value), "Payment status unavailable");
});
test("payment status is independent from booking, payout, refund, secret and timestamps", () => {
  const record = {
    status: "PROCESSING",
    amount: "240.00",
    currency: "USD",
    paidAt: null,
    booking: { status: "CONFIRMED" },
    commission: null,
    payout: { status: "PAID" },
    refunds: [{ status: "REFUNDED" }],
  };
  assert.equal(
    paymentStatusLabel(record.status),
    "Payment processing; not yet confirmed",
  );
  assert.equal(
    formatFinancialAmount(financialAmount(record.amount, record.currency, "major")),
    "USD 240.00",
  );
  assert.equal(
    formatFinancialAmount(
      financialAmount(record.commission?.commissionAmount, record.currency, "major"),
    ),
    "Not available",
  );
  assert.equal(record.paidAt, null);
  assert.doesNotMatch(
    paymentStatusLabel(record.status),
    /payout|refunded|Payment confirmed/,
  );
});
test("reviewed raw payment money preserves returned currency/scale and nullable related amounts without total inference", () => {
  const records = [
    {
      status: "PARTIALLY_REFUNDED",
      amount: "9999999999.99",
      currency: "USD",
      commission: null,
      payout: null,
    },
    {
      status: "REFUNDED",
      amount: "10.20",
      currency: "EUR",
      commission: { commissionAmount: "0.00" },
      payout: null,
    },
    {
      status: "PENDING",
      amount: "12.30",
      currency: "",
      commission: null,
      payout: null,
    },
  ];
  assert.deepEqual(
    records.map((r) =>
      formatFinancialAmount(financialAmount(r.amount, r.currency, "major")),
    ),
    ["USD 9,999,999,999.99", "EUR 10.20", "Currency unavailable 12.30"],
  );
  assert.equal(
    formatFinancialAmount(
      financialAmount(records[0].payout?.amount, records[0].currency, "major"),
    ),
    "Not available",
  );
  assert.equal(
    formatFinancialAmount(
      financialAmount(
        records[1].commission.commissionAmount,
        records[1].currency,
        "major",
      ),
    ),
    "EUR 0.00",
  );
});

for (const payment of [false, true])
  test(`legacy quote/payment view (${payment}) remains an explicit local preview without payment or refund promises`, () => {
    const post = initialCommunityState.posts.find((p) => p.id === "my-request-2");
    const html = renderToStaticMarkup(
      h(CommunityOffersView, {
        post,
        payment,
        selectedQuoteId: null,
        onBack: noop,
        onPayment: noop,
        onConfirm: noop,
        onIgnore: noop,
      }),
    );
    assert.match(html, /sample offers/);
    assert.match(html, /Live payment and refund terms are unavailable/);
    assert.match(html, /No payment or refund terms are agreed here/);
    assert.doesNotMatch(
      html,
      /non-refundable|Booking confirmed!|Payment successful|clientSecret|paymentId=/,
    );
    if (payment) {
      assert.match(html, /Payment preview/);
      assert.match(html, /Complete preview/);
      assert.match(html, /No money will move/);
    } else assert.match(html, /Review sample quote/);
  });

test("local preview completion retains only existing fixture identities, not a payment record or secret", () => {
  const post = initialCommunityState.posts.find((p) => p.id === "my-request-2");
  const state = communityReducer(initialCommunityState, {
    type: "navigate",
    screen: "payment",
    postId: post.id,
    quoteId: communityQuotes[0].id,
  });
  const completed = communityReducer(state, {
    type: "confirm-booking",
    postId: post.id,
    quoteId: communityQuotes[0].id,
  });
  assert.deepEqual(
    completed.posts.map((p) => p.id),
    state.posts.map((p) => p.id),
  );
  assert.equal(
    completed.posts.find((p) => p.id === post.id).acceptedQuoteId,
    communityQuotes[0].id,
  );
  assert.doesNotMatch(
    JSON.stringify(completed),
    /clientSecret|paymentId|stripePaymentIntentId|SUCCEEDED/,
  );
});

test("sample tracking never presents a local completion as an unqualified payment release", () => {
  const post = {
    ...initialCommunityState.posts.find((p) => p.id === "my-request-2"),
    acceptedQuoteId: communityQuotes[0].id,
    status: "Completed",
  };
  const html = renderToStaticMarkup(
    h(CommunityTrackView, { post, onBack: noop, onApprove: noop, onIssue: noop }),
  );
  assert.match(html, /Sample Booking Timeline/);
  assert.match(
    html,
    /Payment released<!-- --> \(sample only\)|Payment released \(sample only\)/,
  );
  assert.match(html, /No payment has been collected or released/);
});

test("Vendor fixture transactions and bank defaults are clearly separate from server Connect status", () => {
  const state = initialVendorEarningsState();
  const html = renderToStaticMarkup(
    h(VendorEarningsOverview, {
      methods: state.methods,
      defaultMethodId: state.defaultMethodId,
      onAdd: noop,
      onDefault: noop,
    }),
  );
  assert.match(html, /Recent Transactions \(sample\)/);
  assert.match(html, /No confirmed payment or payout records are loaded/);
  assert.match(html, /sample entries are not connected accounts/);
  assert.doesNotMatch(
    html,
    /Stripe Connect-ready|clientSecret|Payment confirmed by the backend/,
  );
});

test("Vendor order timeline remains a labeled sample rather than authenticated financial status", () => {
  const html = renderToStaticMarkup(
    h(RequestOrderDetails, {
      order: vendorOrders[0],
      onBack: noop,
      onLocation: noop,
      onMessage: noop,
      onCall: noop,
    }),
  );
  assert.match(html, /Sample Booking Timeline/);
  assert.match(html, /Sample booking and payment timeline/);
  assert.doesNotMatch(html, /clientSecret|paymentId=/);
});
