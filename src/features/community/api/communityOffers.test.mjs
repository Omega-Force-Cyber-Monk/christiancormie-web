import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import {
  communityStore,
  viewerId,
  memberId,
  postId,
  otherId,
  postDto,
  json,
} from "../utils/community.test-fixtures.mjs";
import { communityApi } from "./community.api.ts";
import { communityOffersApi } from "./communityOffers.api.ts";
import { communityPostSchema } from "../schemas/community.schema.ts";
import {
  communityOfferSchema,
  offerDecisionAllowed,
} from "../schemas/communityOffers.schema.ts";
import { CommunityOffersView } from "../../customer/components/community/CommunityOffersView.tsx";
import { CustomerCommunityOfferCard } from "../components/CustomerCommunityOffers.tsx";
import { CommunityReadCard } from "../../customer/components/community/CommunityReadCard.tsx";
import { bookingsApi } from "../../customer/api/bookings.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import {
  activeRoleSelected,
  clearSession,
  sessionRestored,
} from "../../auth/store/auth.slice.ts";

const offerId = "88888888-8888-4888-8888-888888888888";
const bookingId = "99999999-9999-4999-8999-999999999999";
const scope = { sessionId: "member-test", userId: viewerId, role: "CUSTOMER" };
const request = { ...scope, postId };
const decision = { ...request, offerId, action: "accept", confirmed: true };
const post = (overrides = {}) =>
  communityPostSchema.parse(
    postDto({
      category: "NEED_TRUCK",
      author: {
        id: viewerId,
        displayName: "Organizer",
        avatarUrl: null,
        roles: ["CUSTOMER"],
        vendor: null,
      },
      viewer: { isOwner: true, isIgnored: false, isInterested: false },
      ...overrides,
    }),
  );
const offer = (overrides = {}) => ({
  id: offerId,
  communityRequestId: postId,
  vendorId: memberId,
  foodTruckId: otherId,
  status: "PENDING",
  expiresAt: null,
  createdAt: "2026-10-29T10:00:00Z",
  message: "Actual quote message",
  noteToClient: null,
  pricingModel: "FLAT_FEE",
  selectedMenuItems: ["Actual menu request"],
  quotedAmount: "1200.50",
  baseServiceFee: "1000.00",
  transportFee: "100.00",
  serviceFee: "50.00",
  taxAmount: "50.50",
  discountAmount: "0.00",
  depositAmount: "300.00",
  balanceDueAtEvent: "900.50",
  vendor: { id: memberId, businessName: "Actual vendor", isVerified: true },
  foodTruck: { id: otherId, name: "Actual truck" },
  communityRequest: { id: postId, createdById: viewerId, status: "OPEN" },
  ...overrides,
});
const accepted = (overrides = {}) => ({
  offer: offer({
    status: "ACCEPTED",
    communityRequest: { id: postId, createdById: viewerId, status: "OPEN" },
  }),
  booking: {
    id: bookingId,
    bookingNumber: "BD-ACTUAL-001",
    customerId: viewerId,
    vendorId: memberId,
    foodTruckId: otherId,
    vendorOfferId: offerId,
    communityRequestId: postId,
    status: "PAYMENT_PENDING",
    bookingType: "EVENT",
    eventType: "CORPORATE_EVENT",
    eventName: "Actual event",
    eventDescription: null,
    startsAt: "2026-12-20T13:00:00Z",
    endsAt: "2026-12-20T16:00:00Z",
    guestCount: 30,
    address: "Actual address",
    specialInstructions: null,
    createdAt: "2026-10-29T10:01:00Z",
    vendor: { id: memberId, businessName: "Actual vendor" },
    foodTruck: { id: otherId, vendorId: memberId, name: "Actual truck" },
    ...overrides,
  },
});
async function seed(store, p = post(), items = [offer()]) {
  await store.dispatch(
    communityApi.util.upsertQueryData("getCommunityPost", request, {
      message: "Post",
      post: p,
    }),
  );
  await store.dispatch(
    communityOffersApi.util.upsertQueryData("getCustomerCommunityOffers", request, {
      message: "Quotes retrieved successfully",
      items: items.map((o) => communityOfferSchema.parse(o)),
    }),
  );
}
async function mocked(
  run,
  handler = () => {
    throw new Error("Unexpected HTTP");
  },
) {
  const store = communityStore();
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await run(store);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
const offersEndpoint = communityOffersApi.endpoints.getCustomerCommunityOffers;
const decideEndpoint = communityOffersApi.endpoints.decideCommunityOffer;
test("offer GET uses real post UUID, bearer auth, exact envelope and server ordering", async () => {
  const items = [offer({ id: bookingId, quotedAmount: "9999.00" }), offer()];
  await mocked(
    async (store) => {
      await seed(store);
      const result = await store
        .dispatch(offersEndpoint.initiate(request, { forceRefetch: true }))
        .unwrap();
      assert.deepEqual(
        result.items.map((o) => o.id),
        [bookingId, offerId],
      );
      assert.equal(result.items[1].quotedAmount, "1200.50");
    },
    async (r) => {
      assert.equal(
        new globalThis.URL(r.url).pathname,
        `/api/v1/community/posts/${postId}/offers`,
      );
      assert.equal(new globalThis.URL(r.url).search, "");
      assert.equal(r.method, "GET");
      assert.equal(r.headers.get("authorization"), "Bearer test-access");
      return json({ message: "Quotes retrieved successfully", items });
    },
  );
});
test("offer reads require a verified Customer-owned NEED_TRUCK post", async () => {
  await mocked(async (store) => {
    for (const p of [
      post({ category: "COMMUNITY" }),
      post({ viewer: { isOwner: false, isIgnored: false, isInterested: false } }),
    ]) {
      await seed(store, p);
      await assert.rejects(
        store
          .dispatch(offersEndpoint.initiate(request, { forceRefetch: true }))
          .unwrap(),
      );
    }
    await seed(store);
    store.dispatch(activeRoleSelected("VENDOR"));
    await assert.rejects(store.dispatch(offersEndpoint.initiate(request)).unwrap());
  });
});
test("pending offer list is discarded after role replacement", async () => {
  let release;
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      await seed(store);
      const pending = store.dispatch(
        offersEndpoint.initiate(request, { forceRefetch: true }),
      );
      await ready;
      store.dispatch(activeRoleSelected("VENDOR"));
      release(json({ message: "Quotes", items: [offer()] }));
      await pending;
      assert.equal(offersEndpoint.select(request)(store.getState()).data, undefined);
    },
    () => {
      started();
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
for (const action of ["accept", "reject"])
  test(`${action}: confirmed PATCH only, no booking POST/payment request; caches invalidated`, async () => {
    let calls = 0;
    await mocked(
      async (store) => {
        await seed(store);
        await store.dispatch(
          bookingsApi.util.upsertQueryData("getCustomerBookings", scope, []),
        );
        const result = await store
          .dispatch(decideEndpoint.initiate({ ...decision, action }))
          .unwrap();
        if (action === "accept") {
          assert.equal(result.booking.id, bookingId);
          assert.equal(result.booking.status, "PAYMENT_PENDING");
        } else assert.equal(result.status, "REJECTED");
        assert.equal(calls, 1);
        assert.equal(
          offersEndpoint.select(request)(store.getState()).isUninitialized,
          true,
        );
        assert.equal(
          communityApi.endpoints.getCommunityPost.select(request)(store.getState())
            .isUninitialized,
          true,
        );
        assert.equal(
          bookingsApi.endpoints.getCustomerBookings.select(scope)(store.getState())
            .isUninitialized,
          true,
        );
      },
      async (r) => {
        calls++;
        assert.equal(r.method, "PATCH");
        assert.equal(
          new globalThis.URL(r.url).pathname,
          `/api/v1/community/offers/${offerId}/${action}`,
        );
        assert.equal(await r.text(), "");
        return json(action === "accept" ? accepted() : offer({ status: "REJECTED" }));
      },
    );
  });
for (const response of [
  accepted({ customerId: memberId }),
  accepted({ vendorOfferId: otherId }),
  accepted({ communityRequestId: otherId }),
  accepted({ foodTruckId: postId }),
  { ...accepted(), offer: offer({ status: "PENDING" }) },
]) {
  test(`reject mismatched acceptance identity ${JSON.stringify(response).slice(-90)}`, async () => {
    await mocked(
      async (store) => {
        await seed(store);
        await assert.rejects(
          store.dispatch(decideEndpoint.initiate(decision)).unwrap(),
        );
      },
      async () => json(response),
    );
  });
}
for (const bad of [
  offer({ id: "fixture" }),
  offer({ communityRequestId: otherId }),
  offer({ communityRequest: { id: postId, createdById: memberId, status: "OPEN" } }),
  offer({ quotedAmount: "$1200" }),
]) {
  test("list rejects fixture IDs, foreign ownership/requests and malformed Decimal", async () => {
    await mocked(
      async (store) => {
        await seed(store);
        await assert.rejects(
          store
            .dispatch(offersEndpoint.initiate(request, { forceRefetch: true }))
            .unwrap(),
        );
      },
      async () => json({ message: "Quotes", items: [bad] }),
    );
  });
}
for (const status of [400, 403, 404, 409, 500])
  test(`HTTP ${status} remains an error, never local offer/booking success`, async () => {
    await mocked(
      async (store) => {
        await seed(store);
        await assert.rejects(
          store.dispatch(decideEndpoint.initiate(decision)).unwrap(),
          (e) => e.status === status,
        );
      },
      async () =>
        json(
          {
            message:
              status === 400 ? "Offer has expired" : "Offer is no longer available",
          },
          status,
        ),
    );
  });
test("network failure remains a write error and invalidates uncertain cached state", async () => {
  await mocked(
    async (store) => {
      await seed(store);
      await assert.rejects(store.dispatch(decideEndpoint.initiate(decision)).unwrap());
      assert.equal(offersEndpoint.select(request)(store.getState()).data, undefined);
    },
    async () => {
      throw new TypeError("offline");
    },
  );
});
test("invalid/unconfirmed IDs, non-owner, closed/expired requests and expired/nonpending offers cannot write", async () => {
  await mocked(async (store) => {
    await seed(store);
    for (const change of [
      { confirmed: false },
      { offerId: "fixture" },
      { postId: "fixture" },
      { role: "VENDOR" },
      { sessionId: "stale" },
      { action: "pay" },
    ])
      await assert.rejects(
        store.dispatch(decideEndpoint.initiate({ ...decision, ...change })).unwrap(),
      );
    for (const p of [
      post({ status: "MATCHED" }),
      post({ expiresAt: "2020-01-01T00:00:00Z" }),
      post({ viewer: { isOwner: false, isIgnored: false, isInterested: false } }),
    ]) {
      await seed(store, p);
      await assert.rejects(store.dispatch(decideEndpoint.initiate(decision)).unwrap());
    }
    for (const o of [
      offer({ expiresAt: "2020-01-01T00:00:00Z" }),
      offer({ status: "ACCEPTED" }),
    ]) {
      await seed(store, post(), [o]);
      await assert.rejects(store.dispatch(decideEndpoint.initiate(decision)).unwrap());
    }
  });
});
test("concurrent accept/reject requests for the same post send one write", async () => {
  let release;
  let calls = 0;
  await mocked(
    async (store) => {
      await seed(store);
      const first = store.dispatch(decideEndpoint.initiate(decision));
      const second = store.dispatch(
        decideEndpoint.initiate({ ...decision, action: "reject" }),
      );
      await assert.rejects(second.unwrap());
      release(json(accepted()));
      await first.unwrap();
      assert.equal(calls, 1);
    },
    () => {
      calls++;
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
for (const action of [
  activeRoleSelected("VENDOR"),
  clearSession("expired"),
  sessionRestored({
    sessionId: "new",
    accessToken: "new",
    refreshToken: "new",
    user: null,
  }),
])
  test(`pending acceptance discarded on ${action.type}`, async () => {
    let release;
    let started;
    const ready = new Promise((r) => {
      started = r;
    });
    await mocked(
      async (store) => {
        await seed(store);
        const pending = store.dispatch(decideEndpoint.initiate(decision));
        await ready;
        store.dispatch(action);
        release(json(accepted()));
        await pending;
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
test("offer card uses actual fields/precision without fake currency, rating, age or payment success", () => {
  const o = communityOfferSchema.parse(offer());
  const html = renderToStaticMarkup(
    React.createElement(CustomerCommunityOfferCard, {
      offer: o,
      disabled: true,
      onAccept() {},
      onReject() {},
    }),
  );
  for (const text of [
    "Actual vendor",
    "Actual truck",
    "Actual quote message",
    "PENDING",
    "Currency unavailable 1,200.50",
    "Actual menu request",
    "disabled",
  ])
    assert.ok(html.includes(text), text);
  for (const text of ["$", "4.7", "1 day ago", "Payment confirmed", "Sample"])
    assert.ok(!html.includes(text), text);
  assert.equal(offerDecisionAllowed(post(), viewerId, o), true);
});
test("existing My Posts offer control can open real offers and preview controls stay disabled", () => {
  const enabled = renderToStaticMarkup(
    React.createElement(CommunityReadCard, {
      post: post(),
      mine: true,
      onDetails() {},
      onImage() {},
      onOffers() {},
    }),
  );
  const button = enabled.match(/<button[^>]*>View offers<\/button>/)?.[0];
  assert.ok(button);
  assert.ok(!button.includes(' disabled="'));
  const disabled = renderToStaticMarkup(
    React.createElement(CommunityReadCard, {
      post: post(),
      mine: true,
      onDetails() {},
      onImage() {},
    }),
  );
  assert.match(disabled, /<button[^>]*disabled[^>]*>View offers<\/button>/);
});
test("live existing offer presentation renders empty, loading, denied and retry states", async () => {
  await mocked(
    async (store) => {
      const render = () =>
        renderToStaticMarkup(
          React.createElement(
            Provider,
            { store },
            React.createElement(
              MemoryRouter,
              null,
              React.createElement(CommunityOffersView, {
                scope: request,
                post: post(),
                onBack() {},
              }),
            ),
          ),
        );
      assert.ok(render().includes("Loading offers"));
      await seed(store, post(), []);
      assert.ok(render().includes("No offers yet"));
      await assert.rejects(
        store
          .dispatch(offersEndpoint.initiate(request, { forceRefetch: true }))
          .unwrap(),
      );
      const denied = render();
      assert.ok(denied.includes('role="alert"'));
      assert.ok(denied.includes("Retry"));
      assert.ok(!denied.includes("No offers yet"));
    },
    async () => json({ message: "Forbidden" }, 403),
  );
});
