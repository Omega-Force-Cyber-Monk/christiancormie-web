import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { URL } from "node:url";
import { adminApi } from "../api/admin.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { toAdminUser } from "./adminUsers.ts";
import { adminListQuery, adminPage } from "./adminList.ts";
import { DataTablePagination } from "../../../components/data-display/DataTable/DataTablePagination.tsx";
import AdminUsersPage from "../pages/AdminUsersPage.tsx";
import {
  adminTestStore,
  json,
  renderAdmin,
  userDto,
  usersResponse,
} from "./admin.test-fixtures.mjs";

test("users adapter retains UUID and display ID, actual activity/loyalty and backend action permissions", () => {
  const row = toAdminUser(userDto());
  assert.equal(row.id, userDto().id);
  assert.equal(row.userDisplayId, "U-ABCD");
  assert.deepEqual(row.activity, { bookings: 7, referrals: 3 });
  assert.deepEqual(row.loyalty, {
    availablePoints: 123,
    lifetimePoints: 456,
    redeemedPoints: 333,
  });
  assert.deepEqual(row.actions, { canSuspend: true, canRetrieve: false });
  assert.equal(
    toAdminUser(userDto({ canSuspend: undefined })).actions.canSuspend,
    false,
  );
});

test("server users search/status and offsets find records outside the original first 20", async () => {
  const store = adminTestStore();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    calls.push(url);
    assert.equal(url.pathname, "/api/v1/admin/users-management");
    assert.equal(request.headers.get("authorization"), "Bearer test-access");
    return json(usersResponse([userDto({ name: "Outside original page" })]));
  };
  try {
    const args = adminListQuery(3, 10, { search: " Outside ", status: "ACTIVE" });
    const request = store.dispatch(
      adminApi.endpoints.getAdminUsersManagement.initiate(args),
    );
    try {
      assert.equal((await request.unwrap()).users[0].name, "Outside original page");
    } finally {
      request.unsubscribe();
    }
    assert.equal(calls[0].searchParams.get("search"), "Outside");
    assert.equal(calls[0].searchParams.get("status"), "ACTIVE");
    assert.equal(calls[0].searchParams.get("limit"), "11");
    assert.equal(calls[0].searchParams.get("offset"), "20");
    const rows = Array.from({ length: 11 }, (_, id) => ({ id }));
    assert.deepEqual(adminPage(rows, 10), {
      rows: rows.slice(0, 10),
      hasNextPage: true,
    });
    assert.equal(adminPage([], 10).hasNextPage, false);
  } finally {
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("unknown-total pagination never fabricates last-page metadata in either existing visual variant", () => {
  for (const variant of ["default", "contrast"]) {
    const html = renderToStaticMarkup(
      createElement(DataTablePagination, {
        variant,
        page: 3,
        pageSize: 10,
        hasNextPage: true,
        showPageNumbers: true,
        showResultRange: true,
        onPageChange() {},
        onPageSizeChange() {},
      }),
    );
    assert.match(html, /Page 3/);
    assert.doesNotMatch(html, /of \d|Showing|Last page|aria-label="Page \d/);
  }
});

test("users render backend-shaped rows, null contacts, permission-disabled actions and honest pagination", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminUsersManagement",
        adminListQuery(1, 10, {}),
        usersResponse([userDto({ canSuspend: false })]),
      ),
    );
    const html = renderAdmin(store, AdminUsersPage);
    assert.match(html, /U-ABCD/);
    assert.match(html, /7 bookings, 3 referrals/);
    assert.match(html, /123/);
    assert.match(html, /disabled=""[^>]*>Suspend/);
    assert.doesNotMatch(html, /Page 1 of/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("users keep loading, empty, error and retry states", async () => {
  const store = adminTestStore();
  const original = globalThis.fetch;
  try {
    assert.match(renderAdmin(store, AdminUsersPage), /animate-pulse/);
    globalThis.fetch = async () => json({ message: "private db error" }, 503);
    const request = store.dispatch(
      adminApi.endpoints.getAdminUsersManagement.initiate(adminListQuery(1, 10, {})),
    );
    await request;
    assert.match(renderAdmin(store, AdminUsersPage), /Retry/);
    assert.doesNotMatch(renderAdmin(store, AdminUsersPage), /private db/);
    globalThis.fetch = async () => json(usersResponse([]));
    await request.refetch().unwrap();
    assert.match(renderAdmin(store, AdminUsersPage), /No users found/);
    request.unsubscribe();
  } finally {
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("suspend/retrieve use UUID paths and refetch subscribed management data", async () => {
  const store = adminTestStore();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    calls.push([request.method, new URL(request.url).pathname]);
    return json(
      request.method === "GET"
        ? usersResponse()
        : {
            id: userDto().id,
            status: request.url.endsWith("/suspend") ? "SUSPENDED" : "ACTIVE",
          },
    );
  };
  const subscription = store.dispatch(
    adminApi.endpoints.getAdminUsersManagement.initiate(adminListQuery(1, 10, {})),
  );
  try {
    await subscription.unwrap();
    for (const endpoint of ["suspendAdminUser", "retrieveAdminUser"]) {
      await store
        .dispatch(adminApi.endpoints[endpoint].initiate(userDto().id))
        .unwrap();
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    }
    assert.ok(
      calls.some(
        ([method, path]) =>
          method === "PATCH" && path === `/api/v1/admin/users/${userDto().id}/suspend`,
      ),
    );
    assert.ok(
      calls.some(
        ([method, path]) =>
          method === "PATCH" && path === `/api/v1/admin/users/${userDto().id}/retrieve`,
      ),
    );
    assert.equal(calls.filter(([method]) => method === "GET").length, 3);
  } finally {
    subscription.unsubscribe();
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});
