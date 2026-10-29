import assert from "node:assert/strict";
import test from "node:test";
import { baseApi } from "../../../services/api/baseApi.ts";
import { adminListQuery } from "./adminList.ts";
import { toAdminPost, communityCategories } from "./adminModeration.ts";
import AdminCommunityPage from "../pages/AdminCommunityPage.tsx";
import {
  adminTestStore,
  renderAdmin,
  postDto,
  communityResponse,
} from "./admin.test-fixtures.mjs";

test("community IDs, report flags and exact category enums match backend presenters", () => {
  const raw = postDto();
  const row = toAdminPost(raw);
  assert.equal(row.id, raw.id);
  assert.equal(row.displayId, "P-ABCD");
  assert.equal(row.reported, true);
  assert.equal(toAdminPost(postDto({ isReported: false })).reported, false);
  assert.equal(communityCategories["Need a truck"], "NEED_TRUCK");
  assert.equal(communityCategories["Hiring / jobs"], "HIRING_JOBS");
  assert.deepEqual(
    adminListQuery(2, 10, {
      category: communityCategories["For sale"],
      search: "bike",
    }),
    { limit: 11, offset: 10, category: "FOR_SALE", search: "bike" },
  );
});

test("community renders actual display ID and report flag with nullable authors and content", async () => {
  const store = adminTestStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData(
        "getAdminCommunityManagement",
        adminListQuery(1, 10, {}),
        communityResponse([
          postDto(),
          postDto({ id: "nullable", postId: "P-NULL", author: null, content: null }),
        ]),
      ),
    );
    const html = renderAdmin(store, AdminCommunityPage);
    assert.match(html, /P-ABCD/);
    assert.match(html, /Actual post content/);
    assert.match(html, /Reported/);
    assert.match(html, /P-NULL/);
    assert.doesNotMatch(html, /Page 1 of/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});
