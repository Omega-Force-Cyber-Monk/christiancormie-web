import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { Provider } from "react-redux";
import { renderToStaticMarkup } from "react-dom/server";
import {
  memberStore,
  viewerId,
  truckId,
  postId,
  memberId,
  json,
} from "../../social/utils/member.test-fixtures.mjs";
import { baseApi } from "../../../services/api/baseApi.ts";
import { bookingsApi } from "./bookings.api.ts";
import { bookingIssuesApi } from "./bookingIssues.api.ts";
import { bookingDetailSchema } from "../schemas/booking.schema.ts";
import {
  canCreateBookingIssue,
  issueMessageInputSchema,
} from "../schemas/bookingIssues.schema.ts";
import {
  CustomerBookingIssues,
  BookingIssueHistory,
  BookingIssueMessages,
} from "../components/orders/CustomerBookingIssues.tsx";
import { BookingTimeline } from "../pages/CustomerOrdersPage.tsx";
import {
  clearSession,
  activeRoleSelected,
  sessionRestored,
} from "../../auth/store/auth.slice.ts";

const issueId = "88888888-8888-4888-8888-888888888888";
const messageId = "99999999-9999-4999-8999-999999999999";
const scope = {
  sessionId: "member-test",
  userId: viewerId,
  role: "CUSTOMER",
  bookingId: postId,
};
const selected = { ...scope, issueId };
const text = "Actual issue description";
const issue = (o = {}) => ({
  id: issueId,
  bookingId: postId,
  status: "OPEN",
  message: text,
  resolutionDecision: null,
  resolutionNote: null,
  resolvedById: null,
  createdAt: "2026-10-29T12:00:00Z",
  resolvedAt: null,
  ...o,
});
const message = (o = {}) => ({
  id: messageId,
  senderUserId: viewerId,
  senderRole: "CUSTOMER",
  senderName: "Actual customer",
  message: text,
  createdAt: "2026-10-29T12:00:00Z",
  ...o,
});
const history = (items = [issue()]) => ({
  items: items.map((i) => ({
    ...i,
    messagesCount: 1,
    lastMessage: message(),
    messages: [message()],
  })),
});
const thread = (o = {}) => ({ issue: issue(), messages: [message()], ...o });
const booking = (o = {}) =>
  bookingDetailSchema.parse({
    id: postId,
    bookingNumber: "BD-ACTUAL-001",
    customerId: viewerId,
    vendorId: truckId,
    foodTruckId: truckId,
    status: "CONFIRMED",
    bookingType: "EVENT",
    eventType: "OTHER",
    eventName: "Actual event",
    eventDescription: null,
    startsAt: "2026-10-28T12:00:00Z",
    endsAt: null,
    guestCount: 10,
    address: "Actual address",
    specialInstructions: null,
    createdAt: "2026-10-20T12:00:00Z",
    completionRequestedAt: "2026-10-29T11:00:00Z",
    completionApprovedAt: null,
    completedAt: null,
    paymentReleasedAt: null,
    vendor: { id: truckId, businessName: "Actual vendor" },
    foodTruck: { id: truckId, vendorId: truckId, name: "Actual truck" },
    ...o,
  });
const create = { ...scope, body: { message: `  ${text}  ` }, confirmed: true };
const send = { ...selected, body: { message: `  ${text}  ` } };
const ep = (name) => bookingIssuesApi.endpoints[name];
async function seed(store, b = booking(), h = history(), t = thread()) {
  await store.dispatch(
    bookingsApi.util.upsertQueryData("getCustomerBooking", scope, b),
  );
  await store.dispatch(
    bookingIssuesApi.util.upsertQueryData("getBookingIssues", scope, h),
  );
  await store.dispatch(
    bookingIssuesApi.util.upsertQueryData("getBookingIssueMessages", selected, t),
  );
}
async function mocked(
  run,
  handler = () => {
    throw new Error("Unexpected HTTP");
  },
) {
  const store = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await run(store);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
for (const [name, arg, response, path, method] of [
  ["getBookingIssues", scope, history(), `/bookings/${postId}/issues`, "GET"],
  [
    "getBookingIssueMessages",
    selected,
    thread(),
    `/bookings/${postId}/issues/${issueId}/messages`,
    "GET",
  ],
  [
    "createBookingIssue",
    create,
    { message: "Issue submitted successfully", issue: issue() },
    `/bookings/${postId}/issues`,
    "POST",
  ],
  [
    "sendBookingIssueMessage",
    send,
    { message: "Message sent successfully", item: message() },
    `/bookings/${postId}/issues/${issueId}/messages`,
    "POST",
  ],
]) {
  test(`${name}: exact real-ID contract, credentials and only supported body`, async () => {
    let calls = 0;
    await mocked(
      async (store) => {
        await seed(
          store,
          booking(),
          name === "createBookingIssue" ? history([]) : history(),
        );
        const result = await store
          .dispatch(ep(name).initiate(arg, { forceRefetch: true }))
          .unwrap();
        assert.deepEqual(result, response);
        assert.equal(calls, 1);
        if (method === "POST") {
          assert.equal(
            ep("getBookingIssues").select(scope)(store.getState()).data,
            undefined,
          );
          assert.equal(
            bookingsApi.endpoints.getCustomerBooking.select(scope)(store.getState())
              .data,
            undefined,
          );
          assert.equal(
            ep("getBookingIssueMessages").select(selected)(store.getState()).data,
            undefined,
          );
        }
      },
      async (r) => {
        calls++;
        assert.equal(new globalThis.URL(r.url).pathname, `/api/v1${path}`);
        assert.equal(r.method, method);
        assert.equal(r.headers.get("authorization"), "Bearer test-access");
        if (method === "POST") assert.deepEqual(await r.json(), { message: text });
        return json(response, method === "POST" ? 201 : 200);
      },
    );
  });
  for (const status of [400, 403, 404, 409, 500])
    test(`${name}: HTTP ${status} remains an error`, async () => {
      await mocked(
        async (store) => {
          await seed(
            store,
            booking(),
            name === "createBookingIssue" ? history([]) : history(),
          );
          await assert.rejects(
            store.dispatch(ep(name).initiate(arg, { forceRefetch: true })).unwrap(),
            (e) => e.status === status,
          );
        },
        async () => json({ message: "The operation is unavailable" }, status),
      );
    });
}
test("input trims, rejects whitespace/overlong/unsupported body fields", () => {
  assert.deepEqual(issueMessageInputSchema.parse({ message: "  actual  " }), {
    message: "actual",
  });
  for (const body of [
    { message: " " },
    { message: "x".repeat(2001) },
    { message: 42 },
    { message: "a", status: "RESOLVED" },
  ])
    assert.equal(issueMessageInputSchema.safeParse(body).success, false);
});
test("completion eligibility uses request, completedAt, status and open issue records", async () => {
  for (const b of [
    booking({ completionRequestedAt: null }),
    booking({ completedAt: "2026-10-29T12:00:00Z" }),
    booking({ status: "COMPLETED" }),
  ]) {
    assert.equal(canCreateBookingIssue(b, history([])), false);
    await mocked(async (store) => {
      await seed(store, b, history([]));
      await assert.rejects(
        store.dispatch(ep("createBookingIssue").initiate(create)).unwrap(),
      );
    });
  }
  assert.equal(canCreateBookingIssue(booking(), history()), false);
  assert.equal(
    canCreateBookingIssue(booking(), history([issue({ status: "RESOLVED" })])),
    true,
  );
});
test("existing open issue, missing confirmation and invalid drafts cannot create", async () => {
  await mocked(async (store) => {
    await seed(store);
    await assert.rejects(
      store.dispatch(ep("createBookingIssue").initiate(create)).unwrap(),
    );
    await seed(store, booking(), history([]));
    for (const arg of [
      { ...create, confirmed: false },
      { ...create, body: { message: " " } },
      { ...create, body: { message: "x".repeat(2001) } },
    ])
      await assert.rejects(
        store.dispatch(ep("createBookingIssue").initiate(arg)).unwrap(),
      );
  });
});
for (const [name, arg, response] of [
  ["getBookingIssues", scope, history([issue({ bookingId: truckId })])],
  ["getBookingIssueMessages", selected, thread({ issue: issue({ id: truckId }) })],
  [
    "getBookingIssueMessages",
    selected,
    thread({ issue: issue({ bookingId: truckId }) }),
  ],
  [
    "createBookingIssue",
    create,
    { message: "Created", issue: issue({ bookingId: truckId }) },
  ],
  [
    "createBookingIssue",
    create,
    { message: "Created", issue: issue({ id: "fixture" }) },
  ],
  [
    "sendBookingIssueMessage",
    send,
    { message: "Sent", item: message({ senderUserId: memberId }) },
  ],
  [
    "sendBookingIssueMessage",
    send,
    { message: "Sent", item: message({ senderRole: "ADMIN" }) },
  ],
])
  test(`${name}: rejects foreign or malformed response identity`, async () => {
    await mocked(
      async (store) => {
        await seed(
          store,
          booking(),
          name === "createBookingIssue" ? history([]) : history(),
        );
        await assert.rejects(
          store.dispatch(ep(name).initiate(arg, { forceRefetch: true })).unwrap(),
        );
      },
      async () => json(response),
    );
  });
test("ownership, role, stale session and fixture booking/issue IDs fail before HTTP", async () => {
  await mocked(async (store) => {
    await seed(store, booking({ customerId: memberId }));
    await assert.rejects(
      store
        .dispatch(ep("getBookingIssues").initiate(scope, { forceRefetch: true }))
        .unwrap(),
    );
    await seed(store);
    for (const arg of [
      { ...selected, issueId: "fixture" },
      { ...selected, bookingId: "fixture" },
      { ...selected, role: "VENDOR" },
      { ...selected, sessionId: "old" },
      { ...selected, issueId: truckId },
    ])
      await assert.rejects(
        store
          .dispatch(ep("getBookingIssueMessages").initiate(arg, { forceRefetch: true }))
          .unwrap(),
      );
  });
});
test("resolved thread and resolved current history both block sending", async () => {
  for (const [h, t] of [
    [history(), thread({ issue: issue({ status: "RESOLVED" }) })],
    [history([issue({ status: "DISMISSED" })]), thread()],
  ])
    await mocked(async (store) => {
      await seed(store, booking(), h, t);
      await assert.rejects(
        store.dispatch(ep("sendBookingIssueMessage").initiate(send)).unwrap(),
      );
    });
});
test("concurrent issue creation sends one POST and never approves completion or invokes payments", async () => {
  let release;
  let started;
  let calls = 0;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      await seed(store, booking(), history([]));
      const first = store.dispatch(ep("createBookingIssue").initiate(create));
      await ready;
      await assert.rejects(
        store.dispatch(ep("createBookingIssue").initiate(create)).unwrap(),
      );
      release(json({ message: "Created", issue: issue() }, 201));
      await first.unwrap();
      assert.equal(calls, 1);
    },
    (r) => {
      calls++;
      assert.equal(
        new globalThis.URL(r.url).pathname,
        `/api/v1/bookings/${postId}/issues`,
      );
      started();
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
test("concurrent message sends do not duplicate delivery", async () => {
  let release;
  let started;
  let calls = 0;
  const ready = new Promise((r) => {
    started = r;
  });
  await mocked(
    async (store) => {
      await seed(store);
      const first = store.dispatch(ep("sendBookingIssueMessage").initiate(send));
      await ready;
      await assert.rejects(
        store.dispatch(ep("sendBookingIssueMessage").initiate(send)).unwrap(),
      );
      release(json({ message: "Sent", item: message() }, 201));
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
test("network failure preserves caller draft and supports retry after refreshing server state", async () => {
  let count = 0;
  await mocked(
    async (store) => {
      await seed(store);
      await assert.rejects(
        store.dispatch(ep("sendBookingIssueMessage").initiate(send)).unwrap(),
      );
      assert.equal(send.body.message, `  ${text}  `);
      await seed(store);
      assert.equal(
        (await store.dispatch(ep("sendBookingIssueMessage").initiate(send)).unwrap())
          .item.id,
        messageId,
      );
    },
    async () => {
      if (!count++) throw new TypeError("offline");
      return json({ message: "Sent", item: message() }, 201);
    },
  );
});
test("expired 401 session uses existing refresh and clears issue access when refresh is rejected", async () => {
  const paths = [];
  await mocked(
    async (store) => {
      await seed(store);
      await store.dispatch(
        ep("getBookingIssues").initiate(scope, { forceRefetch: true }),
      );
      assert.equal(store.getState().auth.user, null);
      assert.equal(
        ep("getBookingIssues").select(scope)(store.getState()).data,
        undefined,
      );
      assert.ok(paths.some((p) => p.endsWith("/auth/refresh")));
    },
    async (r) => {
      paths.push(new globalThis.URL(r.url).pathname);
      return json({ message: "Unauthorized" }, 401);
    },
  );
});
test("confirmed write refetches subscribed issue/thread/detail/tracking without false ownership denials", async () => {
  const paths = [];
  const tracking = {
    bookingId: postId,
    bookingNumber: "BD-ACTUAL-001",
    roleView: "CUSTOMER",
    currentStep: "REQUEST_PENDING",
    completion: {
      requestedAt: booking().completionRequestedAt,
      approvedAt: null,
      paymentReleasedAt: null,
      hasOpenIssue: true,
    },
    steps: [],
  };
  await mocked(
    async (store) => {
      await seed(store);
      await store.dispatch(
        bookingsApi.util.upsertQueryData("getCustomerBookingTracking", scope, tracking),
      );
      const requests = [
        store.dispatch(bookingsApi.endpoints.getCustomerBooking.initiate(scope)),
        store.dispatch(
          bookingsApi.endpoints.getCustomerBookingTracking.initiate(scope),
        ),
        store.dispatch(ep("getBookingIssues").initiate(scope)),
        store.dispatch(ep("getBookingIssueMessages").initiate(selected)),
      ];
      await Promise.all(requests);
      await store.dispatch(ep("sendBookingIssueMessage").initiate(send)).unwrap();
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      for (const result of [
        bookingsApi.endpoints.getCustomerBooking.select(scope)(store.getState()),
        bookingsApi.endpoints.getCustomerBookingTracking.select(scope)(
          store.getState(),
        ),
        ep("getBookingIssues").select(scope)(store.getState()),
        ep("getBookingIssueMessages").select(selected)(store.getState()),
      ])
        assert.equal(result.error, undefined);
      for (const suffix of [`/${postId}`, "/tracking", "/issues", "/messages"])
        assert.ok(
          paths.some((p) => p.endsWith(suffix)),
          suffix,
        );
      requests.forEach((r) => r.unsubscribe());
    },
    async (r) => {
      const path = new globalThis.URL(r.url).pathname;
      paths.push(path);
      if (r.method === "POST") return json({ message: "Sent", item: message() }, 201);
      if (path.endsWith("/messages")) return json(thread());
      if (path.endsWith("/issues")) return json(history());
      if (path.endsWith("/tracking")) return json(tracking);
      return json(booking());
    },
  );
});
for (const action of [
  clearSession("expired"),
  activeRoleSelected("VENDOR"),
  sessionRestored({
    sessionId: "new",
    accessToken: "new",
    refreshToken: "new",
    user: null,
  }),
])
  test(`late issue write discarded after ${action.type}`, async () => {
    let release;
    let started;
    const ready = new Promise((r) => {
      started = r;
    });
    await mocked(
      async (store) => {
        await seed(store, booking(), history([]));
        const pending = store.dispatch(ep("createBookingIssue").initiate(create));
        await ready;
        store.dispatch(action);
        release(json({ message: "Created", issue: issue() }, 201));
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
test("history and closed thread show actual records, sender/status, resolution, and nullable timestamps", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(BookingIssueHistory, {
        issues: history([
          issue({
            status: "RESOLVED",
            resolutionDecision: "FULL_REFUND",
            resolutionNote: "Actual admin note",
          }),
        ]),
        selected: issueId,
        onSelect() {},
      }),
      React.createElement(BookingIssueMessages, {
        thread: thread({ issue: issue({ status: "RESOLVED" }) }),
      }),
    ),
  );
  for (const s of [
    issueId,
    text,
    "RESOLVED",
    "Actual admin note",
    "Actual customer",
    "messaging is unavailable",
  ])
    assert.ok(html.includes(s), s);
  assert.ok(!html.includes("Payment refunded"));
  assert.ok(!html.includes("Approve completion"));
  const empty = renderToStaticMarkup(
    React.createElement(BookingIssueHistory, {
      issues: history([]),
      selected: null,
      onSelect() {},
    }),
  );
  assert.ok(empty.includes("No booking issues"));
});
test("issue panel renders real booking identity and disabled create controls without completion request", async () => {
  await mocked(async (store) => {
    const b = booking({ completionRequestedAt: null });
    await seed(store, b, history([]));
    const html = renderToStaticMarkup(
      React.createElement(
        Provider,
        { store },
        React.createElement(CustomerBookingIssues, {
          scope,
          booking: b,
          disabled: false,
        }),
      ),
    );
    assert.ok(html.includes(b.id));
    assert.ok(html.includes(b.bookingNumber));
    assert.ok(html.includes("No booking issues"));
    assert.match(html, /<button[^>]*disabled=""[^>]*>Report issue<\/button>/);
    assert.ok(!html.includes("Approve (preview)"));
  });
});
test("issue panel distinguishes loading, denied stale history and successful retry", async () => {
  let status = 403;
  await mocked(
    async (store) => {
      const render = () =>
        renderToStaticMarkup(
          React.createElement(
            Provider,
            { store },
            React.createElement(CustomerBookingIssues, {
              scope,
              booking: booking(),
              disabled: false,
            }),
          ),
        );
      assert.ok(render().includes("Loading booking issues"));
      await seed(store);
      assert.ok(render().includes(text));
      await assert.rejects(
        store
          .dispatch(ep("getBookingIssues").initiate(scope, { forceRefetch: true }))
          .unwrap(),
      );
      const denied = render();
      assert.ok(denied.includes("Retry"));
      assert.ok(!denied.includes(text));
      assert.ok(!denied.includes("No booking issues"));
      status = 200;
      await store
        .dispatch(ep("getBookingIssues").initiate(scope, { forceRefetch: true }))
        .unwrap();
      assert.ok(render().includes(text));
    },
    async () => json(status === 200 ? history() : { message: "Access denied" }, status),
  );
});
test("tracking displays real completion dates without financial mutation controls", () => {
  const date = "2026-10-29T11:00:00Z";
  const html = renderToStaticMarkup(
    React.createElement(BookingTimeline, {
      tracking: {
        bookingId: postId,
        bookingNumber: "BD-ACTUAL-001",
        roleView: "CUSTOMER",
        currentStep: "REQUEST_PENDING",
        completion: {
          requestedAt: date,
          approvedAt: null,
          paymentReleasedAt: null,
          hasOpenIssue: true,
        },
        steps: [],
      },
    }),
  );
  assert.ok(html.includes(date));
  assert.ok(html.includes("Not approved"));
  assert.ok(html.includes("open issue"));
  assert.ok(!html.includes("<button"));
});
