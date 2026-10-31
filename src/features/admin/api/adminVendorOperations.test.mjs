import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate } from "node:timers/promises";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { baseApi } from "../../../services/api/baseApi.ts";
import { adminApi } from "./admin.api.ts";
import {
  adminVendorOperationsApi as api,
  documentKey,
  matchingDocuments,
} from "./adminVendorOperations.api.ts";
import {
  identityVerified,
  activeRoleSelected,
  sessionStarted,
  clearSession,
} from "../../auth/store/auth.slice.ts";
import {
  adminTestStore,
  json,
  vendorDto,
  vendorsResponse,
  renderAdmin,
  communityResponse,
  reviewsResponse,
} from "../utils/admin.test-fixtures.mjs";
import { adminListQuery } from "../utils/adminList.ts";
import { toAdminVendor } from "../utils/adminVendors.ts";
import {
  VendorAccountOperations,
  VerificationDocumentOperations,
} from "../components/vendors/VendorOperations.tsx";
import AdminCommunityPage from "../pages/AdminCommunityPage.tsx";
import AdminReviewsModerationPage from "../pages/AdminReviewsModerationPage.tsx";
import AdminSettingsPage from "../pages/AdminSettingsPage.tsx";
const adminId = "11111111-1111-4111-8111-111111111111",
  vendorId = "22222222-2222-4222-8222-222222222222",
  requestId = "33333333-3333-4333-8333-333333333333",
  otherId = "44444444-4444-4444-8444-444444444444";
const date = "2026-10-30T10:00:00.000Z",
  url = "https://example.invalid/license.pdf";
const scope = { sessionId: "admin-test", userId: adminId, role: "ADMIN" };
const doc = (overrides = {}) => ({
  type: "BUSINESS_LICENSE",
  url,
  status: "PENDING",
  ...overrides,
});
const request = (overrides = {}) => ({
  id: requestId,
  vendorId,
  status: "PENDING",
  documents: [doc()],
  createdAt: date,
  vendor: {
    id: vendorId,
    businessName: "Actual Vendor",
    status: "APPROVED",
    isVerified: false,
  },
  ...overrides,
});
const vendor = (status = "APPROVED") =>
  vendorDto({
    id: vendorId,
    status,
    verificationRequests: [request()],
    documents: [doc()],
  });
function setup(t, handler = () => json({}, 500)) {
  const store = adminTestStore();
  store.dispatch(
    identityVerified({
      id: adminId,
      name: "Admin",
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
    get: (offset = 0) =>
      store.dispatch(
        api.endpoints.getAdminVerificationRequests.initiate({ ...scope, offset }),
      ),
    change: (overrides = {}) =>
      store.dispatch(
        api.endpoints.changeAdminVendorStatus.initiate({
          ...scope,
          vendorId,
          action: "suspend",
          confirmed: true,
          ...overrides,
        }),
      ),
    update: (overrides = {}) =>
      store.dispatch(
        api.endpoints.updateAdminVerificationDocument.initiate({
          ...scope,
          vendorId,
          requestId,
          documentKey: "BUSINESS_LICENSE",
          expectedDocumentUrl: url,
          body: { status: "APPROVED" },
          confirmed: true,
          ...overrides,
        }),
      ),
    seed: async (status = "APPROVED", r = request()) => {
      await store.dispatch(
        adminApi.util.upsertQueryData(
          "getAdminVendorsManagement",
          undefined,
          vendorsResponse([vendor(status)]),
        ),
      );
      await store.dispatch(
        api.util.upsertQueryData(
          "getAdminVerificationRequests",
          { ...scope, offset: 0 },
          [r],
        ),
      );
    },
    settle: async () => {
      for (let i = 0; i < 5; i++) {
        await setImmediate();
        await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      }
    },
  };
}
test("verification GET uses actual array, JWT and supported offset/limit only", async (t) => {
  const x = setup(t, (req) => {
    const u = new URL(req.url);
    assert.equal(u.pathname, "/api/v1/admin/verification-requests");
    assert.equal(u.searchParams.get("offset"), "100");
    assert.equal(u.searchParams.get("limit"), "100");
    assert.equal(req.headers.get("authorization"), "Bearer test-access");
    return json([request()]);
  });
  assert.equal((await x.get(100)).data[0].vendorId, vendorId);
});
for (const action of ["suspend", "retrieve"])
  test(`${action}: exact PATCH/no body and matching backend status`, async (t) => {
    const expected = action === "suspend" ? "SUSPENDED" : "APPROVED";
    const x = setup(t, (req) => {
      assert.equal(
        new URL(req.url).pathname,
        `/api/v1/admin/vendors/${vendorId}/${action}`,
      );
      assert.equal(req.method, "PATCH");
      assert.equal(req.body, null);
      return json({ id: vendorId, status: expected });
    });
    await x.seed(action === "suspend" ? "APPROVED" : "SUSPENDED");
    assert.equal((await x.change({ action })).data.status, expected);
  });
test("known suspended account is required for restore; pending approval is never silently approved", async (t) => {
  const x = setup(t);
  for (const status of ["APPROVED", "PENDING_APPROVAL", "ONBOARDING", "REJECTED"]) {
    await x.seed(status);
    assert.ok((await x.change({ action: "retrieve" })).error);
  }
  assert.equal(x.calls.length, 0);
});
for (const override of [
  { vendorId: "V-123" },
  { confirmed: false },
  { role: "CUSTOMER" },
  { sessionId: "old" },
  { action: "approve" },
])
  test("invalid identities, role, confirmation and invented action fail before HTTP", async (t) => {
    const x = setup(t);
    await x.seed();
    assert.ok((await x.change(override)).error);
    assert.equal(x.calls.length, 0);
  });
for (const result of [
  { id: otherId, status: "SUSPENDED" },
  { id: vendorId, status: "APPROVED" },
  {},
])
  test("incorrect vendor response never confirms status mutation", async (t) => {
    const x = setup(t, () => json(result));
    await x.seed();
    assert.ok((await x.change()).error);
  });
test("document update targets unique actual alias and sends only exact status/reason DTO", async (t) => {
  const x = setup(t, async (req) => {
    assert.equal(
      new URL(req.url).pathname,
      `/api/v1/admin/verification-requests/${requestId}/documents/BUSINESS_LICENSE`,
    );
    assert.deepEqual(await req.json(), {
      status: "REJECTED",
      rejectionReason: "Document is incomplete",
    });
    return json(
      request({
        documents: [
          doc({ status: "REJECTED", rejectionReason: "Document is incomplete" }),
        ],
      }),
    );
  });
  await x.seed();
  assert.equal(
    (
      await x.update({
        body: { status: "REJECTED", rejectionReason: "Document is incomplete" },
      })
    ).data.documents[0].status,
    "REJECTED",
  );
});
test("document key binding follows backend id/type/name/label rules and rejects ambiguity", () => {
  assert.equal(documentKey(doc(), [doc()]), "BUSINESS_LICENSE");
  assert.equal(documentKey(doc(), [doc(), doc()]), null);
  assert.equal(
    matchingDocuments(
      [doc({ id: "Specific-ID" }), doc({ label: "specific-id" })],
      "Specific-ID",
    ).length,
    2,
  );
  assert.equal(
    documentKey({ title: "Invented title" }, [{ title: "Invented title" }]),
    null,
  );
});
test("adapter binds current latest request UUID and unique key; no generated identities", () => {
  const v = toAdminVendor(vendor());
  assert.deepEqual(v.documents[0].verification, {
    vendorId,
    requestId,
    documentKey: "BUSINESS_LICENSE",
  });
  assert.equal(toAdminVendor(vendorDto()).documents[0].verification, undefined);
  const bad = vendor();
  bad.verificationRequests[0].documents = [doc(), doc()];
  assert.equal(toAdminVendor(bad).documents[0].verification, undefined);
});
for (const override of [
  { requestId: otherId },
  { vendorId: otherId },
  { documentKey: "missing" },
  { documentKey: "../admin" },
  { expectedDocumentUrl: "https://example.invalid/changed.pdf" },
  { confirmed: false },
  { body: { status: "PAID" } },
  { body: { status: "APPROVED", extra: true } },
  { body: { status: "REJECTED", rejectionReason: "x".repeat(1001) } },
])
  test("document identity/URL/DTO mismatch never mutates", async (t) => {
    const x = setup(t);
    await x.seed();
    assert.ok((await x.update(override)).error);
    assert.equal(x.calls.length, 0);
  });
for (const r of [
  request({ documents: [doc(), doc()] }),
  request({ vendorId: otherId, vendor: { ...request().vendor, id: otherId } }),
])
  test("ambiguous or foreign cached request cannot authorize document write", async (t) => {
    const x = setup(t);
    await x.seed("APPROVED", r);
    assert.ok((await x.update()).error);
    assert.equal(x.calls.length, 0);
  });
for (const r of [
  request({ id: otherId }),
  request({ documents: [doc({ status: "PENDING" })] }),
  request({
    documents: [
      doc({ status: "APPROVED", url: "https://example.invalid/changed.pdf" }),
    ],
  }),
])
  test("document acknowledgement must match request/vendor/status/file identity", async (t) => {
    const x = setup(t, () => json(r));
    await x.seed();
    assert.ok((await x.update()).error);
  });
for (const status of [400, 403, 404, 409, 500, "network"])
  test(`${status}: mutation remains failed, revalidates and permits explicit recovery`, async (t) => {
    let fail = true;
    const x = setup(t, () => {
      if (fail) {
        if (status === "network") throw Error("offline");
        return json({ message: "Unavailable" }, status);
      }
      return json({ id: vendorId, status: "SUSPENDED" });
    });
    await x.seed();
    assert.ok((await x.change()).error);
    fail = false;
    await x.seed();
    assert.ok((await x.change()).data);
    assert.equal(x.calls.length, 2);
  });
test("vendor and document writes share duplicate-submission protection", async (t) => {
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  t.after(() => release());
  const x = setup(t, async () => {
    await gate;
    return json({ id: vendorId, status: "SUSPENDED" });
  });
  await x.seed();
  const first = x.change();
  await setImmediate();
  assert.ok((await x.change()).error);
  assert.ok((await x.update()).error);
  assert.equal(x.calls.length, 1);
  release();
  assert.ok((await first).data);
});
for (const transition of ["logout", "account", "role"])
  test(`${transition}: late response cannot enter replacement caches or report success`, async (t) => {
    let release;
    const gate = new Promise((r) => {
      release = r;
    });
    t.after(() => release());
    const x = setup(t, async () => {
      await gate;
      return json({ id: vendorId, status: "SUSPENDED" });
    });
    await x.seed();
    const first = x.change();
    await setImmediate();
    if (transition === "logout") x.store.dispatch(clearSession("expired"));
    else if (transition === "account")
      x.store.dispatch(
        sessionStarted({ accessToken: "new", refreshToken: "new-refresh" }),
      );
    else x.store.dispatch(activeRoleSelected("CUSTOMER"));
    release();
    assert.equal((await first).data, undefined);
    await x.settle();
    assert.deepEqual(x.store.getState().api.queries, {});
  });
test("shared 401 refresh/retry preserves validated Admin scope", async (t) => {
  let n = 0;
  const x = setup(t, (req) => {
    if (req.url.endsWith("auth/refresh"))
      return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
    if (++n === 1) return json({}, 401);
    assert.equal(req.headers.get("authorization"), "Bearer rotated");
    return json([request()]);
  });
  assert.ok((await x.get()).data);
  assert.equal(n, 2);
});
test("confirmed mutations refresh Admin vendors/requests/dashboard and domain tags", async (t) => {
  const x = setup(t, (req) => {
    if (req.method === "PATCH") return json({ id: vendorId, status: "SUSPENDED" });
    return json(
      req.url.includes("verification-requests")
        ? [request()]
        : vendorsResponse([vendor("SUSPENDED")]),
    );
  });
  await x.seed();
  await x.get();
  await x.store.dispatch(adminApi.endpoints.getAdminVendorsManagement.initiate());
  const before = x.calls.length;
  assert.ok((await x.change()).data);
  await x.settle();
  assert.ok(x.calls.length >= before + 3);
  assert.ok(
    x.calls.every(
      (r) =>
        r.method === "GET" ||
        new URL(r.url).pathname === `/api/v1/admin/vendors/${vendorId}/suspend`,
    ),
  );
});
test("existing vendor controls are role/status gated and do not invent platform approval/badge meaning", async (t) => {
  const x = setup(t);
  const render = (Component) =>
    renderToStaticMarkup(
      h(
        Provider,
        { store: x.store },
        h(Component, {
          vendor: toAdminVendor(vendor()),
          document: toAdminVendor(vendor()).documents[0],
        }),
      ),
    );
  assert.match(render(VendorAccountOperations), /Suspend Account/);
  assert.match(render(VendorAccountOperations), /Approve vendor unavailable/);
  assert.match(render(VerificationDocumentOperations), /Loading verification records/);
  x.store.dispatch(activeRoleSelected("CUSTOMER"));
  assert.match(render(VendorAccountOperations), /verified Admin session/);
  assert.doesNotMatch(render(VerificationDocumentOperations), />Approve</);
});
test("read-only Community/Reviews/Settings remain existing screens without speculative mutations", async (t) => {
  const x = setup(t);
  await x.store.dispatch(
    adminApi.util.upsertQueryData(
      "getAdminCommunityManagement",
      adminListQuery(1, 10, {}),
      communityResponse(),
    ),
  );
  await x.store.dispatch(
    adminApi.util.upsertQueryData(
      "getAdminReviewsManagement",
      adminListQuery(1, 10, {}),
      reviewsResponse(),
    ),
  );
  assert.match(renderAdmin(x.store, AdminCommunityPage), /Actual post content/);
  assert.match(renderAdmin(x.store, AdminReviewsModerationPage), /Actual feedback/);
  for (const page of [
    AdminCommunityPage,
    AdminReviewsModerationPage,
    AdminSettingsPage,
  ])
    assert.doesNotMatch(
      renderAdmin(x.store, page),
      /Delete comment|Remove review|Save settings|Mark.*resolved/,
    );
  assert.match(renderAdmin(x.store, AdminSettingsPage), /Read-only settings overview/);
  assert.equal(x.calls.length, 0);
});

test("document confirmed write refreshes its read cache without changing overall verification or badge", async (t) => {
  let approved = false;
  const x = setup(t, (req) => {
    const r = request({
      documents: [doc({ status: approved ? "APPROVED" : "PENDING" })],
    });
    if (req.method === "PATCH") {
      approved = true;
      return json(request({ documents: [doc({ status: "APPROVED" })] }));
    }
    return json([r]);
  });
  await x.get();
  const result = await x.update();
  assert.equal(result.data.status, "PENDING");
  assert.equal(result.data.vendor.isVerified, false);
  await x.settle();
  assert.equal(
    api.endpoints.getAdminVerificationRequests.select({ ...scope, offset: 0 })(
      x.store.getState(),
    ).data[0].documents[0].status,
    "APPROVED",
  );
});
for (const result of [
  { items: [request()] },
  [request({ vendor: { ...request().vendor, id: otherId } })],
  [request(), request()],
])
  test("verification list rejects wrapper, mismatched vendor and duplicate request IDs", async (t) => {
    const x = setup(t, () => json(result));
    assert.ok((await x.get()).error);
  });
test("definitive invalid session clears verification data and never becomes empty success", async (t) => {
  const x = setup(t, () => json({}, 401));
  assert.equal((await x.get()).data, undefined);
  assert.deepEqual(x.store.getState().api.queries, {});
});
for (const failure of [403, 404, 503, "network"])
  test(`verification ${failure} remains an error with explicit retry`, async (t) => {
    let failed = true;
    const x = setup(t, () => {
      if (failed) {
        if (failure === "network") throw Error("offline");
        return json({ message: "Unavailable" }, failure);
      }
      return json([]);
    });
    const q = x.get();
    assert.ok((await q).error);
    failed = false;
    assert.deepEqual((await q.refetch()).data, []);
  });
