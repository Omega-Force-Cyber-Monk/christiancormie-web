import assert from "node:assert/strict";
import test from "node:test";
import { URL, URLSearchParams } from "node:url";
import { setImmediate } from "node:timers/promises";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../services/api/baseApi.ts";
import { notificationsApi as api, notificationsAllowed } from "./notifications.api.ts";
import { notificationListSchema } from "./notifications.schema.ts";
import { notificationTarget, notificationBookingId } from "./notificationNavigation.ts";
import { NotificationBell, NotificationItems } from "./NotificationBell.tsx";
import { NavbarActions } from "../../layouts/DashboardLayout/TopNavbar/NavbarActions.tsx";
import DiscoverLayout from "../customer/components/discover/DiscoverLayout.tsx";
import VendorHomeLayout from "../vendor/components/home/VendorHomeLayout.tsx";
import {
  activeRoleSelected,
  clearSession,
  sessionStarted,
} from "../auth/store/auth.slice.ts";
import {
  memberStore,
  viewerId,
  memberId,
  json,
} from "../social/utils/member.test-fixtures.mjs";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const entity = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const date = "2026-10-30T10:00:00.000Z";
const scope = { sessionId: "member-test", userId: viewerId, role: "CUSTOMER" };
const filters = { unreadOnly: false, limit: 20, offset: 0 };
const dto = (overrides = {}) => ({
  id,
  userId: viewerId,
  actorUserId: null,
  type: "BOOKING",
  title: "Booking update",
  message: "Actual server notice",
  foodTruckId: null,
  bookingId: entity,
  postId: null,
  conversationId: null,
  actionUrl: "bitedrop://admin/payments",
  metadata: { entityType: "BOOKING", entityId: entity, bookingId: entity },
  isRead: false,
  readAt: null,
  createdAt: date,
  foodTruck: null,
  booking: { id: entity, bookingNumber: "BD-ACTUAL", status: "PENDING" },
  post: null,
  ...overrides,
});
function setup(t, handler, role = "CUSTOMER", verified = true) {
  const store = memberStore(role, verified);
  const original = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (req) => {
    requests.push(req);
    return handler(req);
  };
  t.after(() => {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  });
  const scoped = { ...scope, role };
  return {
    store,
    requests,
    scoped,
    list: (f = filters) =>
      store.dispatch(
        api.endpoints.getNotifications.initiate({ ...scoped, filters: f }),
      ),
    count: () =>
      store.dispatch(api.endpoints.getNotificationUnreadCount.initiate(scoped)),
    read: () =>
      store.dispatch(
        api.endpoints.readNotification.initiate({ ...scoped, notificationId: id }),
      ),
    all: () => store.dispatch(api.endpoints.readAllNotifications.initiate(scoped)),
    settle: async () => {
      for (let i = 0; i < 5; i++) {
        await setImmediate();
        await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      }
    },
  };
}
const render = (store, Component, props = {}, path = "/discover") =>
  renderToStaticMarkup(
    h(
      Provider,
      { store },
      h(MemoryRouter, { initialEntries: [path] }, h(Component, props)),
    ),
  );

for (const role of ["CUSTOMER", "VENDOR"])
  test(`${role}: all four exact notification contracts use authenticated shared API`, async (t) => {
    const x = setup(
      t,
      (req) => {
        assert.equal(req.headers.get("authorization"), "Bearer test-access");
        if (req.method === "PATCH")
          return json(
            req.url.endsWith("read-all")
              ? { updatedCount: 1 }
              : dto({ isRead: true, readAt: date }),
          );
        return json(req.url.endsWith("unread-count") ? { unreadCount: 6 } : [dto()]);
      },
      role,
    );
    assert.equal((await x.list()).data[0].id, id);
    assert.equal((await x.count()).data.unreadCount, 6);
    assert.equal((await x.read()).data.isRead, true);
    await x.settle();
    assert.equal((await x.all()).data.updatedCount, 1);
    await x.settle();
    const writes = x.requests.filter((r) => r.method === "PATCH");
    assert.equal(writes.length, 2);
    assert.ok(writes.every((r) => r.body === null));
    assert.equal(new URL(writes[0].url).pathname, `/api/v1/notifications/${id}/read`);
  });
test("plain array, supported pagination/filter parameters and empty pages preserve server order", async (t) => {
  const x = setup(t, (req) => {
    const url = new URL(req.url);
    assert.equal(url.searchParams.get("limit"), "50");
    assert.equal(url.searchParams.get("offset"), "100");
    assert.equal(url.searchParams.get("unreadOnly"), "true");
    return json([]);
  });
  assert.deepEqual(
    (await x.list({ unreadOnly: true, limit: 50, offset: 100 })).data,
    [],
  );
});

test("notification list preserves backend order, titles and actual timestamps", async (t) => {
  const first = dto({ id: memberId, createdAt: "2026-10-30T11:00:00.000Z" });
  const x = setup(t, () => json([first, dto()]));
  const result = await x.list();
  assert.deepEqual(
    result.data.map((n) => n.id),
    [memberId, id],
  );
  assert.equal(result.data[0].createdAt, first.createdAt);
});

for (const failure of [403, 404, 503, "network"])
  test(`list/count ${failure} is never an empty successful result and explicit retry recovers`, async (t) => {
    let failed = true;
    const x = setup(t, (req) => {
      if (failed) {
        if (failure === "network") throw Error("offline");
        return json({ message: "Unavailable" }, failure);
      }
      return json(req.url.endsWith("unread-count") ? { unreadCount: 0 } : []);
    });
    const list = x.list(),
      count = x.count();
    assert.ok((await list).error);
    assert.ok((await count).error);
    assert.equal(
      api.endpoints.getNotifications.select({ ...scope, filters })(x.store.getState())
        .data,
      undefined,
    );
    failed = false;
    assert.deepEqual((await list.refetch()).data, []);
    assert.equal((await count.refetch()).data.unreadCount, 0);
  });

test("read-all success refreshes list and count from server; failed read-all never clears them locally", async (t) => {
  let read = false;
  let fail = true;
  const x = setup(t, (req) => {
    if (req.method === "PATCH") {
      if (fail) return json({ message: "Unavailable" }, 503);
      read = true;
      return json({ updatedCount: 17 });
    }
    return json(
      req.url.endsWith("unread-count")
        ? { unreadCount: read ? 0 : 17 }
        : [dto({ isRead: read, readAt: read ? date : null })],
    );
  });
  await Promise.all([x.list(), x.count()]);
  assert.ok((await x.all()).error);
  await x.settle();
  assert.equal(
    api.endpoints.getNotificationUnreadCount.select(scope)(x.store.getState()).data
      .unreadCount,
    17,
  );
  fail = false;
  assert.equal((await x.all()).data.updatedCount, 17);
  await x.settle();
  assert.equal(
    api.endpoints.getNotificationUnreadCount.select(scope)(x.store.getState()).data
      .unreadCount,
    0,
  );
  assert.equal(
    api.endpoints.getNotifications.select({ ...scope, filters })(x.store.getState())
      .data[0].isRead,
    true,
  );
});
for (const bad of [
  { limit: 51 },
  { limit: 0 },
  { offset: -1 },
  { offset: 0.5 },
  { unreadOnly: "true" },
  { extra: "unsupported" },
])
  test(`invalid filters ${JSON.stringify(bad)} never make requests`, async (t) => {
    const x = setup(t, () => {
      throw Error("Unexpected HTTP");
    });
    assert.ok((await x.list({ ...filters, ...bad })).error);
    assert.equal(x.requests.length, 0);
  });
for (const value of [
  { items: [dto()] },
  [dto(), dto()],
  [dto({ userId: memberId })],
  [dto({ id: "fixture" })],
  [dto({ createdAt: "yesterday" })],
])
  test("invalid envelope, identity, date or duplicate IDs reject without fallback", async (t) => {
    const x = setup(t, () => json(value));
    assert.ok((await x.list()).error);
  });
test("unread-only response rejects read records and schema keeps list relations", async (t) => {
  const x = setup(t, () => json([dto({ isRead: true, readAt: date })]));
  assert.ok((await x.list({ ...filters, unreadOnly: true })).error);
  assert.equal(
    notificationListSchema.parse([dto()])[0].booking.bookingNumber,
    "BD-ACTUAL",
  );
});
test("confirmed writes synchronize all active list filters and shared unread query without optimistic decrement", async (t) => {
  let read = false;
  const x = setup(t, (req) => {
    if (req.method === "PATCH") {
      read = true;
      return json(dto({ isRead: true, readAt: date }));
    }
    const u = new URL(req.url);
    if (u.pathname.endsWith("unread-count")) return json({ unreadCount: read ? 0 : 9 });
    return json(
      u.searchParams.get("unreadOnly") === "true" && read
        ? []
        : [dto({ isRead: read, readAt: read ? date : null })],
    );
  });
  const a = x.list(),
    b = x.list({ ...filters, unreadOnly: true }),
    c = x.count();
  await Promise.all([a, b, c]);
  assert.equal(
    api.endpoints.getNotificationUnreadCount.select(x.scoped)(x.store.getState()).data
      .unreadCount,
    9,
  );
  assert.equal((await x.read()).data.isRead, true);
  await x.settle();
  assert.equal(
    api.endpoints.getNotificationUnreadCount.select(x.scoped)(x.store.getState()).data
      .unreadCount,
    0,
  );
  assert.deepEqual(
    api.endpoints.getNotifications.select({
      ...x.scoped,
      filters: { ...filters, unreadOnly: true },
    })(x.store.getState()).data,
    [],
  );
  assert.ok(
    api.endpoints.getNotifications.select({ ...x.scoped, filters })(x.store.getState())
      .data[0].isRead,
  );
});
for (const failure of [403, 404, 500, "network"])
  test(`${failure}: failed writes stay failures, refetch uncertainty and preserve unread truth`, async (t) => {
    const x = setup(t, (req) => {
      if (req.method === "PATCH") {
        if (failure === "network") throw Error("offline");
        return json({ message: "private secret stack" }, failure);
      }
      return json(req.url.endsWith("unread-count") ? { unreadCount: 9 } : [dto()]);
    });
    await Promise.all([x.list(), x.count()]);
    assert.ok((await x.read()).error);
    await x.settle();
    assert.equal(
      api.endpoints.getNotificationUnreadCount.select(x.scoped)(x.store.getState()).data
        .unreadCount,
      9,
    );
    assert.equal(
      api.endpoints.getNotifications.select({ ...x.scoped, filters })(
        x.store.getState(),
      ).data[0].isRead,
      false,
    );
    assert.ok(x.requests.filter((r) => r.method === "GET").length >= 4);
  });
test("individual/read-all share a per-session write lock, preventing overlapping duplicate clicks", async (t) => {
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  t.after(() => release());
  const x = setup(t, async () => {
    await gate;
    return json(dto({ isRead: true, readAt: date }));
  });
  const first = x.read();
  await setImmediate();
  assert.ok((await x.read()).error);
  assert.ok((await x.all()).error);
  assert.equal(x.requests.length, 1);
  release();
  assert.ok((await first).data);
});
for (const bad of [
  dto({ id: entity, isRead: true }),
  dto({ userId: memberId, isRead: true }),
  dto(),
  { message: "OK" },
])
  test("mark-read validates server ID, owner and actual read result", async (t) => {
    const x = setup(t, () => json(bad));
    assert.ok((await x.read()).error);
  });
test("read-all uses updatedCount and rejects guessed response envelopes", async (t) => {
  const x = setup(t, () => json({ count: 3 }));
  assert.ok((await x.all()).error);
});
for (const transition of ["logout", "role", "account"])
  test(`${transition}: late responses cannot enter replacement cache`, async (t) => {
    let release;
    const gate = new Promise((r) => {
      release = r;
    });
    t.after(() => release());
    const x = setup(t, async () => {
      await gate;
      return json([dto()]);
    });
    const req = x.list();
    await setImmediate();
    if (transition === "logout") x.store.dispatch(clearSession("expired"));
    else if (transition === "role") x.store.dispatch(activeRoleSelected("VENDOR"));
    else
      x.store.dispatch(
        sessionStarted({ accessToken: "new-token", refreshToken: "new-refresh" }),
      );
    release();
    assert.equal((await req).data, undefined);
    await x.settle();
    assert.deepEqual(x.store.getState().api.queries, {});
  });
test("unverified or unsupported roles/stale scope/invalid notification IDs fail before HTTP", async (t) => {
  const x = setup(t, () => {
    throw Error("Unexpected HTTP");
  });
  for (const s of [
    { ...scope, role: "ADMIN" },
    { ...scope, role: "VENDOR_STAFF" },
    { ...scope, sessionId: "stale" },
    { ...scope, userId: memberId },
  ])
    assert.ok(
      (await x.store.dispatch(api.endpoints.getNotificationUnreadCount.initiate(s)))
        .error,
    );
  assert.ok(
    (
      await x.store.dispatch(
        api.endpoints.readNotification.initiate({ ...scope, notificationId: "fake" }),
      )
    ).error,
  );
  assert.equal(x.requests.length, 0);
  assert.equal(
    notificationsAllowed(memberStore("CUSTOMER", false).getState(), scope),
    false,
  );
});
test("401 refresh uses established retry and rotated bearer token", async (t) => {
  let reads = 0;
  const x = setup(t, (req) => {
    if (new URL(req.url).pathname.endsWith("/auth/refresh"))
      return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
    if (++reads === 1) return json({ message: "Expired" }, 401);
    assert.equal(req.headers.get("authorization"), "Bearer rotated");
    return json({ unreadCount: 2 });
  });
  assert.equal((await x.count()).data.unreadCount, 2);
  assert.equal(reads, 2);
});
test("definitive invalid session clears notifications rather than presenting empty success", async (t) => {
  const x = setup(t, () => json({ message: "Expired" }, 401));
  assert.equal((await x.count()).data, undefined);
  assert.deepEqual(x.store.getState().api.queries, {});
});
for (const role of ["CUSTOMER", "VENDOR"])
  test(`${role}: safe targets select only current-role booking and message routes`, () => {
    const prefix =
      role === "CUSTOMER" ? "/dashboard/customer/orders" : "/dashboard/vendor/orders";
    assert.equal(notificationTarget(dto(), role).to, `${prefix}?booking=${entity}`);
    const n = dto({
      bookingId: null,
      conversationId: entity,
      metadata: { entityType: "CONVERSATION", entityId: entity },
    });
    assert.equal(
      notificationTarget(n, role).to,
      `${role === "CUSTOMER" ? "/message" : "/dashboard/vendor/messages"}?conversation=${entity}`,
    );
  });
test("Customer Community/food-truck/issue mappings use known web targets and real IDs", () => {
  assert.equal(
    notificationTarget(
      dto({ metadata: { entityType: "COMMUNITY_REQUEST", entityId: entity } }),
      "CUSTOMER",
    ).to,
    `/community#${entity}`,
  );
  assert.equal(
    notificationTarget(
      dto({
        metadata: { entityType: "BOOKING_ISSUE", entityId: id, bookingId: entity },
      }),
      "CUSTOMER",
    ).to,
    `/dashboard/customer/orders?booking=${entity}`,
  );
  assert.equal(
    notificationTarget(
      dto({
        foodTruckId: entity,
        foodTruck: { id: entity, slug: "actual-truck" },
        metadata: { entityType: "FOOD_TRUCK", entityId: entity },
      }),
      "CUSTOMER",
    ).to,
    "/profile/actual-truck",
  );
  assert.equal(notificationBookingId(new URLSearchParams(`booking=${entity}`)), entity);
  assert.equal(notificationBookingId(new URLSearchParams("booking=fixture")), null);
});
for (const metadata of [
  null,
  {},
  { entityType: "BOOKING", entityId: "fake" },
  { entityType: "BOOKING", entityId: entity, bookingId: id },
  { entityType: "ADMIN", entityId: entity },
  { entityType: "PAYMENT", entityId: entity },
  { entityType: "FOOD_TRUCK", entityId: entity, foodTruckSlug: "../../admin" },
  { entityType: "FOOD_TRUCK", entityId: entity, foodTruckSlug: "me" },
])
  test("unsafe or unsupported metadata/mobile URL has safe fallback", () => {
    assert.equal(notificationTarget(dto({ metadata }), "CUSTOMER"), null);
  });
test("Vendor and non-member roles cannot navigate to Customer or Admin targets", () => {
  for (const role of ["VENDOR", "ADMIN", "VENDOR_STAFF", ""])
    for (const entityType of ["COMMUNITY_REQUEST", "FOOD_TRUCK", "BOOKING_ISSUE"])
      assert.equal(
        notificationTarget(
          dto({
            metadata: { entityType, entityId: entity, foodTruckSlug: "actual-truck" },
          }),
          role,
        ),
        null,
      );
});
test("list UI renders real read state, safe detail fallback and disabled duplicate actions", () => {
  const markup = renderToStaticMarkup(
    h(NotificationItems, {
      items: [
        dto(),
        dto({
          id: memberId,
          isRead: true,
          metadata: null,
          title: "<script>attack</script>",
        }),
      ],
      role: "CUSTOMER",
      pending: true,
      onRead() {},
      onOpen() {},
    }),
  );
  assert.match(markup, /Actual server notice/);
  assert.match(markup, /Unread/);
  assert.match(markup, /Read/);
  assert.match(markup, /disabled=""/);
  assert.match(markup, /no available link/);
  assert.doesNotMatch(markup, /<script>|bitedrop:|admin\/payments/);
  assert.match(
    renderToStaticMarkup(
      h(NotificationItems, {
        items: [],
        role: "VENDOR",
        pending: false,
        onRead() {},
        onOpen() {},
      }),
    ),
    /No notifications/,
  );
});
for (const role of ["CUSTOMER", "VENDOR"])
  test(`${role}: shared bell/navbar use server count, not fixtures; isolation hides another role's cache`, async (t) => {
    const x = setup(t, () => json({ unreadCount: 12 }), role);
    await x.count();
    for (const Component of [
      NotificationBell,
      NavbarActions,
      role === "CUSTOMER" ? DiscoverLayout : VendorHomeLayout,
    ]) {
      const html = render(x.store, Component);
      assert.match(html, /Notifications, 12 unread/);
      assert.doesNotMatch(html, /sample count|Notifications, not connected/);
    }
    x.store.dispatch(activeRoleSelected(role === "CUSTOMER" ? "VENDOR" : "CUSTOMER"));
    assert.doesNotMatch(render(x.store, NotificationBell), /12 unread/);
  });
test("unverified bell is disabled and never displays cached unread count", () => {
  assert.match(
    render(memberStore("CUSTOMER", false), NotificationBell),
    /Notifications require a verified Customer or Vendor session/,
  );
});
