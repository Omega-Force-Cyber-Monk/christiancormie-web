import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { adminApi } from "../api/admin.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { toAdminVendor, toAdminTruckRequest, documentUrl } from "./adminVendors.ts";
import { adminListQuery } from "./adminList.ts";
import AdminVendorsPage from "../pages/AdminVendorsPage.tsx";
import {
  adminTestStore,
  json,
  renderAdmin,
  vendorDto,
  vendorsResponse,
  truckRequestDto,
} from "./admin.test-fixtures.mjs";

test("vendor adapters retain actual contact, cuisine, documents, menu, counts and original detail data", () => {
  const raw = vendorDto();
  const row = toAdminVendor(raw);
  assert.equal(row.source, raw);
  for (const field of [
    "email",
    "phone",
    "cuisine",
    "description",
    "priceRange",
    "serviceArea",
    "totalBookings",
  ])
    assert.equal(row[field], raw[field]);
  assert.deepEqual(row.menuItems, ["Taco", "Burrito"]);
  assert.equal(row.documents.length, 1);
  assert.equal(row.documents[0].url, "https://example.invalid/document.pdf");
  assert.equal(row.documents[0].status, "N/A");
  assert.equal(row.documents[0].source, raw.documents[0]);
  assert.equal(row.revenueGenerated, "$2,345.67");
  assert.equal(documentUrl("javascript:alert(1)"), undefined);
  assert.equal(
    toAdminVendor(vendorDto({ documents: null, menuItems: null, email: null }))
      .documents.length,
    0,
  );
});

test("raw truck-request DTO maps nullable requester, real UUID, dates, notes and actual city/state", () => {
  const row = toAdminTruckRequest(truckRequestDto());
  assert.equal(row.reqCode, truckRequestDto().id);
  assert.equal(row.submitter.name, "Actual Requester");
  assert.equal(row.location, "Austin, TX");
  assert.equal(row.description, "Please add this local truck");
  assert.notEqual(row.submittedDate, "Recently");
  const missing = toAdminTruckRequest(
    truckRequestDto({
      requestedBy: null,
      city: null,
      state: null,
      notes: null,
      status: "DISMISSED",
    }),
  );
  assert.equal(missing.status, "dismissed");
  assert.equal(missing.submitter.name, "N/A");
  assert.equal(missing.phone, undefined);
});

test("dedicated request query and communication patch use actual endpoints, preserve notes, and refetch both caches", async () => {
  const store = adminTestStore();
  const original = globalThis.fetch;
  const calls = [];
  let status = "PENDING";
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    const body = request.method === "PATCH" ? await request.clone().json() : undefined;
    calls.push({
      path: url.pathname,
      method: request.method,
      body,
      params: url.searchParams,
    });
    if (request.method === "PATCH") {
      status = body.status;
      return json(truckRequestDto({ status }));
    }
    return json(
      url.pathname.endsWith("/vendors-management")
        ? vendorsResponse()
        : url.searchParams.get("status") === status
          ? [truckRequestDto({ status })]
          : [],
    );
  };
  const vendors = store.dispatch(
    adminApi.endpoints.getAdminVendorsManagement.initiate(adminListQuery(1, 10, {})),
  );
  const args = adminListQuery(2, 10, { search: "Truck", status: "COMMUNICATED" });
  const requests = store.dispatch(
    adminApi.endpoints.getAdminTruckRequests.initiate(args),
  );
  try {
    await Promise.all([vendors.unwrap(), requests.unwrap()]);
    await store
      .dispatch(
        adminApi.endpoints.updateTruckRequestStatus.initiate({
          requestId: truckRequestDto().id,
          status: "COMMUNICATED",
        }),
      )
      .unwrap();
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    const patch = calls.find((call) => call.method === "PATCH");
    assert.equal(
      patch.path,
      `/api/v1/admin/vendors/truck-requests/${truckRequestDto().id}`,
    );
    assert.deepEqual(patch.body, { status: "COMMUNICATED" });
    assert.equal(
      calls.filter((call) => call.path.endsWith("/vendors-management")).length,
      2,
    );
    assert.equal(
      calls.filter((call) => call.path === "/api/v1/admin/vendors/truck-requests")
        .length,
      2,
    );
    assert.equal(calls[1].params.get("status"), "COMMUNICATED");
    assert.equal(calls[1].params.get("offset"), "10");
    assert.deepEqual(await requests.unwrap(), []);
    assert.equal(
      adminApi.endpoints.getAdminTruckRequests.select(args)(store.getState()).data[0]
        .notes,
      truckRequestDto().notes,
    );
    assert.equal(
      adminApi.endpoints.getAdminTruckRequests.select(args)(store.getState()).data[0]
        .status,
      "COMMUNICATED",
    );
  } finally {
    vendors.unsubscribe();
    requests.unsubscribe();
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("vendor list renders the real cuisine and counts without requiring generatedAt or nested truckRequests", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminVendorsManagement",
        adminListQuery(1, 10, {}),
        vendorsResponse(),
      ),
    );
    const html = renderAdmin(store, AdminVendorsPage);
    assert.match(html, /Real Vendor/);
    assert.match(html, /Tacos/);
    assert.match(html, /Truck Requests \(7\)/);
    assert.doesNotMatch(html, /Page 1 of/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});
