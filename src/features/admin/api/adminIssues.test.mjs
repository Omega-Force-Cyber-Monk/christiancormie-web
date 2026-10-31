import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate } from "node:timers/promises";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { baseApi } from "../../../services/api/baseApi.ts";
import { adminApi } from "./admin.api.ts";
import { adminIssuesApi as api, adminIssueAllowed } from "./adminIssues.api.ts";
import {
  identityVerified,
  clearSession,
  sessionStarted,
  activeRoleSelected,
} from "../../auth/store/auth.slice.ts";
import {
  adminTestStore,
  json,
  bookingDto,
  bookingsResponse,
  paymentsResponse,
} from "../utils/admin.test-fixtures.mjs";
import {
  IssueFacts,
  IssueMessages,
  IssueDecisions,
  AdminBookingIssues,
} from "../components/bookings/BookingMessageModal.tsx";
import { AdminFinancialOperations } from "../components/AdminFinancialOperations.tsx";
import { issueDecisionState, payoutState } from "../utils/adminFinancialSafety.ts";
const adminId = "11111111-1111-4111-8111-111111111111",
  bookingId = "22222222-2222-4222-8222-222222222222",
  issueId = "33333333-3333-4333-8333-333333333333",
  messageId = "44444444-4444-4444-8444-444444444444",
  paymentId = "55555555-5555-4555-8555-555555555555";
const date = "2026-10-30T10:00:00.000Z";
const scope = { sessionId: "admin-test", userId: adminId, role: "ADMIN", bookingId };
const selected = { ...scope, issueId };
const issue = (overrides = {}) => ({
  id: issueId,
  bookingId,
  status: "OPEN",
  message: "Actual issue description",
  resolutionDecision: null,
  resolutionNote: null,
  resolvedById: null,
  resolvedAt: null,
  createdAt: date,
  ...overrides,
});
const msg = (overrides = {}) => ({
  id: messageId,
  senderUserId: adminId,
  senderRole: "ADMIN",
  senderName: "Actual Admin",
  message: "Actual response",
  createdAt: date,
  ...overrides,
});
const list = (i = issue()) => ({
  items: [{ ...i, messagesCount: 1, lastMessage: msg(), messages: [msg()] }],
});
const thread = (i = issue()) => ({ issue: i, messages: [msg()] });
const booking = () =>
  bookingDto({
    id: bookingId,
    status: "IN_PROGRESS",
    payment: { ...bookingDto().payment, id: paymentId },
  });
test("invalid refresh clears Admin issue caches and unverified roles cannot read", async (t) => {
  const x = setup(t, () => json({}, 401));
  const result = await x.get();
  assert.equal(result.data, undefined);
  assert.deepEqual(x.store.getState().api.queries, {});
  assert.equal(adminIssueAllowed(x.store.getState(), scope), false);
});
for (const failure of [400, 403, 404, 409, 500, "network"])
  test(`${failure}: issue reads never become empty success and explicit retry recovers`, async (t) => {
    let fail = true;
    const x = setup(t, (req) => {
      if (fail) {
        if (failure === "network") throw Error("offline");
        return json({ message: "Unavailable" }, failure);
      }
      return json(req.url.endsWith("messages") ? thread() : list());
    });
    const a = x.get(),
      b = x.thread();
    assert.ok((await a).error);
    assert.ok((await b).error);
    fail = false;
    assert.ok((await a.refetch()).data);
    assert.ok((await b.refetch()).data);
  });
function setup(t, handler = () => json({ message: "Unexpected" }, 500)) {
  const store = adminTestStore();
  store.dispatch(
    identityVerified({
      id: adminId,
      name: "Actual Admin",
      email: "admin@example.invalid",
      role: "ADMIN",
      roles: ["ADMIN", "CUSTOMER"],
    }),
  );
  const original = globalThis.fetch,
    calls = [];
  globalThis.fetch = async (req) => {
    calls.push(req);
    return handler(req);
  };
  t.after(() => {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  });
  return {
    store,
    calls,
    get: () => store.dispatch(api.endpoints.getAdminBookingIssues.initiate(scope)),
    thread: () =>
      store.dispatch(api.endpoints.getAdminIssueMessages.initiate(selected)),
    send: (overrides = {}) =>
      store.dispatch(
        api.endpoints.sendAdminIssueMessage.initiate({
          ...selected,
          body: { message: " Actual response " },
          confirmed: true,
          ...overrides,
        }),
      ),
    seed: async (i = issue()) => {
      await store.dispatch(
        api.util.upsertQueryData("getAdminBookingIssues", scope, list(i)),
      );
      await store.dispatch(
        api.util.upsertQueryData("getAdminIssueMessages", selected, thread(i)),
      );
    },
    settle: async () => {
      for (let n = 0; n < 5; n++) {
        await setImmediate();
        await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      }
    },
  };
}
test("Admin list/thread use real UUIDs, actual envelopes and server sender identities", async (t) => {
  const x = setup(t, (req) => {
    assert.equal(req.headers.get("authorization"), "Bearer test-access");
    return json(req.url.endsWith("messages") ? thread() : list());
  });
  assert.equal((await x.get()).data.items[0].bookingId, bookingId);
  assert.equal((await x.thread()).data.messages[0].senderName, "Actual Admin");
  assert.deepEqual(
    x.calls.map((r) => new URL(r.url).pathname),
    [
      `/api/v1/bookings/${bookingId}/issues`,
      `/api/v1/bookings/${bookingId}/issues/${issueId}/messages`,
    ],
  );
});
test("confirmed Admin message posts only trimmed DTO and accepts actual matching Admin acknowledgement", async (t) => {
  const x = setup(t, async (req) => {
    assert.equal(req.method, "POST");
    assert.deepEqual(await req.json(), { message: "Actual response" });
    return json({ message: "Sent", item: msg() }, 201);
  });
  await x.seed();
  assert.equal((await x.send()).data.item.id, messageId);
  assert.equal(x.calls.length, 1);
});
for (const status of ["RESOLVED", "DISMISSED"])
  test(`${status}: history remains readable and messages are blocked`, async (t) => {
    const x = setup(t, (req) =>
      json(
        req.url.endsWith("messages")
          ? thread(issue({ status }))
          : list(issue({ status })),
      ),
    );
    await Promise.all([x.get(), x.thread()]);
    assert.ok((await x.send()).error);
    assert.equal(x.calls.filter((r) => r.method === "POST").length, 0);
  });
for (const body of [
  { message: "" },
  { message: " ", extra: true },
  { message: "a".repeat(2001) },
  { message: 17 },
  { message: "valid", extra: true },
])
  test("invalid message DTO never calls backend", async (t) => {
    const x = setup(t);
    await x.seed();
    assert.ok((await x.send({ body })).error);
    assert.equal(x.calls.length, 0);
  });
test("confirmation, real IDs and verified active Admin role are mandatory", async (t) => {
  const x = setup(t);
  await x.seed();
  for (const override of [
    { confirmed: false },
    { bookingId: "BK-DISPLAY" },
    { issueId: "fake" },
    { sessionId: "old" },
    { role: "CUSTOMER" },
    { userId: messageId },
  ])
    assert.ok((await x.send(override)).error);
  x.store.dispatch(activeRoleSelected("CUSTOMER"));
  assert.ok((await x.get()).error);
  assert.equal(x.calls.length, 0);
});
for (const response of [
  { items: [{ ...list().items[0], bookingId: messageId }] },
  { items: [...list().items, ...list().items] },
  { items: [{ ...list().items[0], status: "PAID" }] },
  { items: [{ ...list().items[0], messages: [msg(), msg()] }] },
])
  test("mismatched/duplicate issue identities or invalid statuses are rejected", async (t) => {
    const x = setup(t, () => json(response));
    assert.ok((await x.get()).error);
  });
for (const response of [
  thread(issue({ bookingId: messageId })),
  thread(issue({ id: messageId })),
  { ...thread(), messages: [msg(), msg()] },
  { items: [] },
])
  test("thread must match booking/issue UUID and actual thread envelope", async (t) => {
    const x = setup(t, () => json(response));
    assert.ok((await x.thread()).error);
  });
for (const change of [
  { senderRole: "CUSTOMER" },
  { senderUserId: messageId },
  { message: "Wrong text" },
  { id: "local-id" },
])
  test("send acknowledgement rejects incorrect sender, text and fake identity", async (t) => {
    const x = setup(t, () => json({ message: "Sent", item: msg(change) }));
    await x.seed();
    assert.ok((await x.send()).error);
  });
test("concurrent Admin issue messages are blocked across the booking flight", async (t) => {
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  t.after(() => release());
  const x = setup(t, async () => {
    await gate;
    return json({ message: "Sent", item: msg() });
  });
  await x.seed();
  const first = x.send();
  await setImmediate();
  assert.ok((await x.send()).error);
  assert.equal(x.calls.length, 1);
  release();
  assert.ok((await first).data);
});
for (const status of [400, 403, 404, 409, 503, "network"])
  test(`${status}: send failure remains recoverable without local message success`, async (t) => {
    let failed = true;
    const x = setup(t, () => {
      if (failed) {
        if (status === "network") throw Error("offline");
        return json({ message: "Unavailable" }, status);
      }
      return json({ message: "Sent", item: msg() });
    });
    await x.seed();
    assert.ok((await x.send()).error);
    assert.equal(x.calls.length, 1);
    failed = false;
    await x.seed();
    assert.ok((await x.send()).data);
    assert.equal(x.calls.length, 2);
  });
for (const transition of ["logout", "account", "role"])
  test(`${transition}: late Admin messages cannot refresh or populate new-session caches`, async (t) => {
    let release;
    const gate = new Promise((r) => {
      release = r;
    });
    t.after(() => release());
    const x = setup(t, async () => {
      await gate;
      return json({ message: "Sent", item: msg() });
    });
    await x.seed();
    const pending = x.send();
    await setImmediate();
    if (transition === "logout") x.store.dispatch(clearSession("expired"));
    else if (transition === "account")
      x.store.dispatch(
        sessionStarted({ accessToken: "new", refreshToken: "new-refresh" }),
      );
    else x.store.dispatch(activeRoleSelected("CUSTOMER"));
    release();
    assert.equal((await pending).data, undefined);
    await x.settle();
    assert.deepEqual(x.store.getState().api.queries, {});
  });
test("401 uses shared refresh/retry for Admin issue reads", async (t) => {
  let attempts = 0;
  const x = setup(t, (req) => {
    if (req.url.endsWith("auth/refresh"))
      return json({ accessToken: "rotated", refreshToken: "new-refresh" });
    if (++attempts === 1) return json({}, 401);
    assert.equal(req.headers.get("authorization"), "Bearer rotated");
    return json(list());
  });
  assert.ok((await x.get()).data);
  assert.equal(attempts, 2);
});
test("confirmed message refreshes subscribed Admin issues/bookings/payments/dashboard caches, never money-moving endpoints", async (t) => {
  const x = setup(t, (req) => {
    const path = new URL(req.url).pathname;
    if (req.method === "POST") return json({ message: "Sent", item: msg() });
    if (path.endsWith("messages")) return json(thread());
    if (path.endsWith("issues")) return json(list());
    if (path.endsWith("bookings-management")) return json(bookingsResponse());
    if (path.endsWith("payments-management")) return json(paymentsResponse());
    return json({});
  });
  await x.seed();
  await Promise.all([
    x.get(),
    x.thread(),
    x.store.dispatch(adminApi.endpoints.getAdminBookingsManagement.initiate()),
    x.store.dispatch(adminApi.endpoints.getAdminPaymentsManagement.initiate()),
    x.store.dispatch(adminApi.endpoints.getAdminDashboard.initiate()),
  ]);
  const before = x.calls.length;
  assert.ok((await x.send()).data);
  await x.settle();
  assert.ok(x.calls.length >= before + 6);
  assert.ok(
    x.calls.every(
      (r) =>
        r.method === "GET" ||
        new URL(r.url).pathname ===
          `/api/v1/bookings/${bookingId}/issues/${issueId}/messages`,
    ),
  );
});
test("Admin issue UI renders real statuses, chronological sender details and resolution notes without fabricated resolution", () => {
  const msgs = [
    msg({ senderRole: "CUSTOMER", senderName: "Actual Customer", message: "First" }),
    msg({
      id: paymentId,
      senderRole: "VENDOR",
      senderName: "Actual Vendor",
      message: "Second",
      createdAt: "2026-10-30T11:00:00.000Z",
    }),
  ];
  const html = renderToStaticMarkup(
    h(IssueMessages, { thread: { issue: issue(), messages: msgs } }),
  );
  assert.ok(html.indexOf("First") < html.indexOf("Second"));
  assert.match(html, /Actual Customer|Actual Vendor/);
  assert.match(html, /Status: OPEN/);
  assert.doesNotMatch(html, /Issue resolved|Conversation ID/);
  const resolved = renderToStaticMarkup(
    h(IssueFacts, {
      issue: issue({
        status: "RESOLVED",
        resolutionDecision: "FULL_REFUND",
        resolutionNote: "Actual decision note",
        resolvedAt: date,
        resolvedById: adminId,
      }),
    }),
  );
  assert.match(resolved, /Actual decision note/);
  assert.match(resolved, /FULL_REFUND/);
});
test("Admin issue loading, empty, access denied and retry presentation never uses fixture issues", async (t) => {
  const x = setup(t, () => json({ message: "Denied" }, 403));
  const render = () =>
    renderToStaticMarkup(
      h(
        Provider,
        { store: x.store },
        h(AdminBookingIssues, { scope, booking: booking() }),
      ),
    );
  assert.match(render(), /Loading booking issues/);
  await x.get();
  assert.match(render(), /Retry/);
  assert.doesNotMatch(render(), /No booking issues/);
  await x.store.dispatch(
    api.util.upsertQueryData("getAdminBookingIssues", scope, { items: [] }),
  );
  assert.match(render(), /No booking issues/);
});
for (const status of [
  "PENDING",
  "FAILED",
  "ON_HOLD",
  "APPROVED",
  "CANCELLED",
  "REFUNDED",
])
  test(`${status}: payout readiness remains disabled and preserves returned state/currency`, () => {
    const p = {
      ...paymentsResponse().payoutRequests[0],
      id: paymentId,
      vendorId: adminId,
      status,
      amount: 125.12345,
      currency: "CAD",
    };
    const state = payoutState(p);
    assert.equal(state.enabled, false);
    assert.equal(state.retryCandidate, status === "FAILED");
    assert.equal(
      state.status,
      { ON_HOLD: "PROCESSING", APPROVED: "PAID" }[status] ?? status,
    );
    const html = renderToStaticMarkup(h(AdminFinancialOperations, { payouts: [p] }));
    assert.match(html, /disabled=""/);
    assert.match(html, /CAD 125.12345/);
    assert.doesNotMatch(html, /Reject payout|Hold payout/);
  });
test("both issue financial decisions are read-only even with succeeded payment; invalid identities/closed issue block eligibility", () => {
  for (const decision of ["RELEASE_PAYOUT", "FULL_REFUND"]) {
    const state = issueDecisionState(issue(), booking(), decision);
    assert.equal(state.enabled, false);
    assert.ok(state.reasons.some((r) => r.includes("explicit approval")));
    assert.ok(
      issueDecisionState(
        issue({ bookingId: messageId, status: "RESOLVED" }),
        booking(),
        decision,
      ).reasons.some((r) => r.includes("mismatched")),
    );
  }
  const html = renderToStaticMarkup(
    h(IssueDecisions, { issue: issue(), booking: booking() }),
  );
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
  assert.match(html, /provider settlement/);
  assert.doesNotMatch(html, /onClick|payment successful/);
});
