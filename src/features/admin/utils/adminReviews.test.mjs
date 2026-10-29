import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { adminApi } from "../api/admin.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { adminListQuery } from "./adminList.ts";
import { toAdminReview, reviewCategory } from "./adminModeration.ts";
import AdminReviewsPage from "../pages/AdminReviewsModerationPage.tsx";
import {
  adminTestStore,
  json,
  renderAdmin,
  reviewDto,
  reviewsResponse,
} from "./admin.test-fixtures.mjs";

test("review IDs, businessName, report and text/rating moderation indicators survive mapping", () => {
  const row = toAdminReview(reviewDto());
  assert.equal(row.id, reviewDto().id);
  assert.equal(row.displayId, "R-ABCD");
  assert.equal(row.reported, true);
  assert.equal(row.vendorName, "Reviewed Vendor");
  assert.equal(toAdminReview(reviewDto({ isReported: false })).reported, false);
  assert.equal(
    toAdminReview(reviewDto({ contentHidden: true, visibleContent: null })).content,
    "Review text hidden",
  );
  assert.equal(
    toAdminReview(reviewDto({ vendor: null, customer: null })).vendorName,
    "N/A",
  );
  assert.equal(reviewCategory("Reported only"), "REPORTED");
  assert.equal(reviewCategory("Check in"), undefined);
});

test("reported-only search/paging sends server-supported filters", async () => {
  const store = adminTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    assert.equal(url.pathname, "/api/v1/admin/reviews-management");
    assert.equal(url.searchParams.get("category"), "REPORTED");
    assert.equal(url.searchParams.get("search"), "truck");
    assert.equal(url.searchParams.get("offset"), "10");
    return json(reviewsResponse());
  };
  const request = store.dispatch(
    adminApi.endpoints.getAdminReviewsManagement.initiate(
      adminListQuery(2, 10, {
        search: "truck",
        category: reviewCategory("Reported only"),
      }),
    ),
  );
  try {
    await request.unwrap();
  } finally {
    request.unsubscribe();
    globalThis.fetch = original;
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("review rendering uses actual identifiers, names, active report flags and hidden-content status", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminReviewsManagement",
        adminListQuery(1, 10, {}),
        reviewsResponse([
          reviewDto(),
          reviewDto({
            id: "hidden",
            reviewId: "R-HIDE",
            contentHidden: true,
            visibleContent: null,
            ratingVisible: false,
          }),
        ]),
      ),
    );
    const html = renderAdmin(store, AdminReviewsPage);
    assert.match(html, /R-ABCD/);
    assert.match(html, /Reviewed Vendor/);
    assert.match(html, /Actual feedback/);
    assert.match(html, /Review text hidden/);
    assert.match(html, /Rating hidden/);
    assert.doesNotMatch(html, /Page 1 of/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});
