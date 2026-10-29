import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { baseApi } from "../../../services/api/baseApi.ts";
import { communityApi, communityScope } from "../api/community.api.ts";
import {
  communityDetailSchema,
  communityPostSchema,
} from "../schemas/community.schema.ts";
import {
  communityCommentsSchema,
  communityInterestsSchema,
  communityReportReasons,
  communityInteractionInputSchema,
} from "../schemas/communityInteractions.schema.ts";
import {
  communityReplyLabel,
  communityInteractionAllowed,
  uniqueCommunityRows,
} from "./communityInteractions.ts";
import {
  CommunityCommentRows,
  CommunityCommentsPanel,
} from "../components/CommunityCommentsDialog.tsx";
import {
  CommunityInterestRows,
  ConnectedCommunityInterests,
} from "../components/ConnectedCommunityInterests.tsx";
import { CommunityPostInteractions } from "../components/CommunityPostInteractions.tsx";
import { vendorApi } from "../../vendor/api/vendor.api.ts";
import { profileDto } from "../../vendor/utils/vendor.test-fixtures.mjs";
import {
  identityVerified,
  sessionRestored,
  activeRoleSelected,
  clearSession,
} from "../../auth/store/auth.slice.ts";
import {
  communityStore as baseStore,
  postId,
  viewerId,
  memberId,
  otherId,
  postDto,
  listDto,
  json,
} from "./community.test-fixtures.mjs";
const commentId = "77777777-7777-4777-8777-777777777777";
const replyId = "88888888-8888-4888-8888-888888888888";
const clean = (store) => store.dispatch(baseApi.util.resetApiState());
const storeFor = (role = "CUSTOMER", verified = true) => {
  const store = baseStore(role, verified);
  if (verified)
    store.dispatch(identityVerified({ ...store.getState().auth.user, roles: [role] }));
  return store;
};
const scope = (store) => communityScope(store.getState());
const view = (store, Component, props) =>
  renderToStaticMarkup(h(Provider, { store }, h(Component, props)));
const comment = (overrides = {}) => ({
  id: commentId,
  parentCommentId: null,
  content: "Actual Community comment",
  createdAt: "2026-10-29T10:00:00.000Z",
  user: { id: memberId, profile: { displayName: "Actual commenter", avatarUrl: null } },
  ...overrides,
});
const comments = (overrides = {}) => ({
  message: "Comments retrieved successfully",
  items: [comment()],
  pagination: { total: 1, limit: 20, offset: 0, nextOffset: null },
  ...overrides,
});
const interest = (overrides = {}) => ({
  id: commentId,
  message: "We serve actual tacos",
  createdAt: "2026-10-29T10:00:00.000Z",
  user: {
    id: memberId,
    profile: null,
    vendor: {
      id: otherId,
      businessName: "Actual interested business",
      logoUrl: null,
      isVerified: true,
    },
  },
  ...overrides,
});
const interests = (overrides = {}) => ({
  message: "Vendor interests retrieved successfully",
  items: [interest()],
  total: 1,
  ...overrides,
});
const callout = (owner = false, overrides = {}) =>
  postDto({
    category: "VENDOR_CALLOUT",
    author: { ...postDto().author, id: owner ? viewerId : memberId },
    viewer: { isOwner: owner, isIgnored: false, isInterested: false },
    allowedActions: {
      canEdit: owner,
      canDelete: owner,
      canQuote: false,
      canSendInterest: !owner,
    },
    allowPublicComments: true,
    ...overrides,
  });
async function seed(store, post = postDto()) {
  await store.dispatch(
    communityApi.util.upsertQueryData(
      "getCommunityPost",
      { ...scope(store), postId },
      communityDetailSchema.parse({ message: "ok", post }),
    ),
  );
}
async function vendor(store) {
  await store.dispatch(
    vendorApi.util.upsertQueryData(
      "getVendorMe",
      undefined,
      profileDto({ userId: viewerId }),
    ),
  );
}
async function act(store, action) {
  const req = store.dispatch(
    communityApi.endpoints.communityInteraction.initiate({
      ...scope(store),
      postId,
      action,
    }),
  );
  try {
    return await req.unwrap();
  } finally {
    req.reset();
  }
}
function response(action) {
  if (action.kind === "comment")
    return {
      message: "Comment added successfully",
      comment: {
        ...comment({
          content: action.content,
          parentCommentId: action.parentCommentId ?? null,
          user: { id: viewerId, profile: null },
        }),
        communityRequestId: postId,
        userId: viewerId,
        deletedAt: null,
      },
    };
  if (action.kind === "react")
    return {
      message: "Reaction saved successfully",
      reaction: {
        id: commentId,
        communityRequestId: postId,
        userId: viewerId,
        reaction: "LIKE",
      },
    };
  if (action.kind === "report")
    return {
      message: "Report submitted successfully",
      report: {
        id: commentId,
        postId,
        reason: action.reason,
        status: "PENDING",
        createdAt: "2026-10-29T10:00:00.000Z",
      },
    };
  return { message: "Confirmed action" };
}

test("Community comments GET uses exact JWT/limit/offset and its flat envelope", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  globalThis.fetch = async (req) => {
    const url = new URL(req.url);
    assert.equal(req.method, "GET");
    assert.equal(url.pathname, `/api/v1/community/posts/${postId}/comments`);
    assert.equal(req.headers.get("authorization"), "Bearer test-access");
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      limit: "20",
      offset: "0",
    });
    return json(comments());
  };
  const req = store.dispatch(
    communityApi.endpoints.getCommunityComments.initiate({ ...scope(store), postId }),
  );
  try {
    const result = await req.unwrap();
    assert.equal(result.pages[0].items[0].user.id, memberId);
    assert.equal(result.pages[0].pagination.total, 1);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("Community interest GET uses organizer UUID, real envelope and no invented truck fields", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store, callout(true));
  globalThis.fetch = async (req) => {
    const u = new URL(req.url);
    assert.equal(u.pathname, `/api/v1/community/posts/${postId}/interests`);
    assert.deepEqual(Object.fromEntries(u.searchParams), { limit: "20", offset: "0" });
    return json(interests());
  };
  const req = store.dispatch(
    communityApi.endpoints.getCommunityInterests.initiate({ ...scope(store), postId }),
  );
  try {
    const result = await req.unwrap();
    assert.equal(result.pages[0].total, 1);
    assert.equal(result.pages[0].pagination, undefined);
    assert.equal(result.pages[0].items[0].user.vendor.id, otherId);
    assert.equal(result.pages[0].items[0].foodTruckId, undefined);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
for (const [action, suffix, method, body] of [
  [
    { kind: "comment", content: "Real comment" },
    "comments",
    "POST",
    { content: "Real comment" },
  ],
  [
    { kind: "comment", content: "Real reply", parentCommentId: replyId },
    "comments",
    "POST",
    { content: "Real reply", parentCommentId: replyId },
  ],
  [{ kind: "react" }, "reactions", "POST", { reaction: "LIKE" }],
  [
    { kind: "report", reason: "SPAM_OR_IRRELEVANT" },
    "reports",
    "POST",
    { reason: "SPAM_OR_IRRELEVANT" },
  ],
  [{ kind: "ignore" }, "ignore", "POST", null],
  [{ kind: "restore" }, "ignore", "DELETE", null],
  [
    { kind: "interest", message: "Actual introduction" },
    "interests",
    "POST",
    { message: "Actual introduction" },
  ],
  [{ kind: "withdraw" }, "interests/me", "DELETE", null],
])
  test(`${action.kind}${action.parentCommentId ? " reply" : ""} uses verified method/path/body/response`, async () => {
    const isVendor = ["interest", "withdraw"].includes(action.kind);
    const store = storeFor(isVendor ? "VENDOR" : "CUSTOMER");
    const original = globalThis.fetch;
    await seed(
      store,
      isVendor
        ? callout(false, {
            viewer: {
              isOwner: false,
              isIgnored: false,
              isInterested: action.kind === "withdraw",
            },
          })
        : postDto(),
    );
    if (isVendor) await vendor(store);
    globalThis.fetch = async (req) => {
      assert.equal(
        new URL(req.url).pathname,
        `/api/v1/community/posts/${postId}/${suffix}`,
      );
      assert.equal(req.method, method);
      assert.equal(req.headers.get("authorization"), "Bearer test-access");
      assert.deepEqual(body ? await req.json() : await req.text(), body ?? "");
      return json(response(action));
    };
    try {
      const result = await act(store, action);
      assert.ok(result.message);
      if (action.kind === "react") assert.equal(result.reaction.reaction, "LIKE");
    } finally {
      clean(store);
      globalThis.fetch = original;
    }
  });
test("comment DTO trims content, validates actual parent UUID and rejects unknown fields", () => {
  assert.deepEqual(
    communityInteractionInputSchema.parse({ kind: "comment", content: "  Hello  " }),
    { kind: "comment", content: "Hello" },
  );
  for (const action of [
    { kind: "comment", content: " " },
    { kind: "comment", content: "x".repeat(2001) },
    { kind: "comment", content: "Hi", parentCommentId: "mock-comment" },
    { kind: "comment", content: "Hi", postId },
    { kind: "interest", message: " " },
    { kind: "react", reaction: "UNLIKE" },
    { kind: "report", reason: "OTHER" },
  ])
    assert.equal(communityInteractionInputSchema.safeParse(action).success, false);
});
test("all five report reasons map to actual backend enum values without guessed reasons", () => {
  assert.deepEqual(Object.values(communityReportReasons), [
    "SPAM_OR_IRRELEVANT",
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "SCAM_OR_FRAUD",
    "NOT_FOOD_TRUCK_RELATED",
  ]);
  for (const reason of Object.values(communityReportReasons))
    assert.equal(
      communityInteractionInputSchema.safeParse({ kind: "report", reason }).success,
      true,
    );
});
test("comment pagination follows returned nextOffset and deduplicates UUIDs including replies", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  const offsets = [];
  globalThis.fetch = async (req) => {
    const offset = Number(new URL(req.url).searchParams.get("offset"));
    offsets.push(offset);
    return json(
      offset === 0
        ? comments({ pagination: { total: 3, limit: 20, offset: 0, nextOffset: 1 } })
        : comments({
            items: [
              comment({ content: "Updated server comment" }),
              comment({ id: replyId, parentCommentId: commentId }),
            ],
            pagination: { total: 3, limit: 20, offset: 1, nextOffset: null },
          }),
    );
  };
  const arg = { ...scope(store), postId };
  const first = store.dispatch(
    communityApi.endpoints.getCommunityComments.initiate(arg),
  );
  try {
    await first.unwrap();
    const next = store.dispatch(
      communityApi.endpoints.getCommunityComments.initiate(arg, {
        direction: "forward",
      }),
    );
    const result = await next.unwrap();
    next.unsubscribe();
    const rows = uniqueCommunityRows(result.pages);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].content, "Updated server comment");
    assert.equal(rows[1].parentCommentId, commentId);
    assert.deepEqual(offsets, [0, 1]);
  } finally {
    first.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("flat comments preserve actual parent/grandparent links and missing-page context, not fabricated nesting", () => {
  const root = comment();
  const reply = comment({ id: replyId, parentCommentId: commentId });
  const grandchild = comment({ id: otherId, parentCommentId: replyId });
  assert.equal(communityReplyLabel(root, [root, reply, grandchild]), "");
  assert.equal(
    communityReplyLabel(grandchild, [root, reply, grandchild]),
    "Reply to Actual commenter",
  );
  assert.equal(
    communityReplyLabel(reply, []),
    "Reply to a comment outside the loaded results",
  );
  const html = renderToStaticMarkup(
    h(CommunityCommentRows, { rows: [root, reply, grandchild], onReply() {} }),
  );
  assert.equal((html.match(/<article/g) ?? []).length, 3);
  assert.ok(html.includes("Reply to Actual commenter"));
  assert.ok(!html.includes("sample"));
});
test("interests pagination derives offset only from requested offset, row count and returned total", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store, callout(true));
  const offsets = [];
  globalThis.fetch = async (req) => {
    const offset = Number(new URL(req.url).searchParams.get("offset"));
    offsets.push(offset);
    return json(
      offset === 0
        ? interests({ total: 2 })
        : interests({ items: [interest({ id: replyId })], total: 2 }),
    );
  };
  const arg = { ...scope(store), postId };
  const first = store.dispatch(
    communityApi.endpoints.getCommunityInterests.initiate(arg),
  );
  try {
    await first.unwrap();
    const second = store.dispatch(
      communityApi.endpoints.getCommunityInterests.initiate(arg, {
        direction: "forward",
      }),
    );
    const data = await second.unwrap();
    second.unsubscribe();
    assert.deepEqual(offsets, [0, 1]);
    assert.equal(uniqueCommunityRows(data.pages).length, 2);
  } finally {
    first.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("reactions are idempotent upserts, never an invented toggle or local increment", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let writes = 0;
  globalThis.fetch = async (req) => {
    if (req.method === "POST") {
      writes++;
      return json(response({ kind: "react" }));
    }
    return json(
      listDto({
        items: [
          postDto({
            counts: { comments: 1, reactions: 9, offers: 0, interestedVendors: 0 },
          }),
        ],
      }),
    );
  };
  const arg = { ...scope(store), filters: { limit: 20 } };
  const list = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  try {
    await list.unwrap();
    const one = await act(store, { kind: "react" });
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    const two = await act(store, { kind: "react" });
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    assert.equal(one.reaction.id, two.reaction.id);
    assert.equal(writes, 2);
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(arg)(store.getState()).data
        .pages[0].items[0].counts.reactions,
      9,
    );
    assert.equal(two.isLiked, undefined);
  } finally {
    list.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("reports, ignore and interests enforce owners, role, category, expiry and actual allowedActions", () => {
  const own = communityPostSchema.parse(callout(true));
  const other = communityPostSchema.parse(callout(false));
  for (const kind of ["report", "ignore", "interest", "withdraw"])
    assert.equal(
      communityInteractionAllowed(own, viewerId, "VENDOR", true, kind),
      false,
    );
  assert.equal(
    communityInteractionAllowed(other, viewerId, "CUSTOMER", true, "interest"),
    false,
  );
  assert.equal(
    communityInteractionAllowed(other, viewerId, "VENDOR", true, "interest"),
    true,
  );
  for (const patch of [
    { status: "CLOSED" },
    { expiresAt: "2000-01-01T00:00:00Z" },
    { category: "COMMUNITY" },
    {
      allowedActions: {
        canEdit: false,
        canDelete: false,
        canQuote: false,
        canSendInterest: false,
      },
    },
    { viewer: { isOwner: false, isIgnored: false, isInterested: true } },
  ])
    assert.equal(
      communityInteractionAllowed(
        { ...other, ...patch },
        viewerId,
        "VENDOR",
        true,
        "interest",
      ),
      false,
    );
  assert.equal(
    communityInteractionAllowed(
      {
        ...other,
        status: "CLOSED",
        viewer: { isOwner: false, isIgnored: false, isInterested: true },
      },
      viewerId,
      "VENDOR",
      true,
      "withdraw",
    ),
    true,
  );
  assert.equal(
    communityInteractionAllowed(
      { ...other, author: null, viewer: null },
      viewerId,
      "CUSTOMER",
      true,
      "report",
    ),
    false,
  );
});
test("comments/reactions follow backend visibility policy without guessed OPEN/publisher restrictions", () => {
  const closed = communityPostSchema.parse(
    postDto({ status: "CLOSED", allowPublicComments: true }),
  );
  assert.equal(
    communityInteractionAllowed(closed, viewerId, "CUSTOMER", false, "comment"),
    true,
  );
  assert.equal(
    communityInteractionAllowed(closed, viewerId, "CUSTOMER", false, "react"),
    true,
  );
  assert.equal(
    communityInteractionAllowed(
      { ...closed, allowPublicComments: false },
      viewerId,
      "CUSTOMER",
      false,
      "comment",
    ),
    false,
  );
});
test("organizer interest lists reject other owners/wrong categories before network", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json(interests());
  };
  try {
    for (const post of [
      callout(false),
      postDto({
        author: { ...postDto().author, id: viewerId },
        viewer: { isOwner: true, isIgnored: false, isInterested: false },
      }),
    ]) {
      await seed(store, post);
      const req = store.dispatch(
        communityApi.endpoints.getCommunityInterests.initiate(
          { ...scope(store), postId },
          { forceRefetch: true },
        ),
      );
      await assert.rejects(req.unwrap(), (e) => e.status === 403);
      req.unsubscribe();
    }
    assert.equal(calls, 0);
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
test("vendor interest requires actual onboarding data while read-only comments remain usable", async () => {
  const store = storeFor("VENDOR");
  const original = globalThis.fetch;
  await seed(store, callout());
  let writes = 0;
  globalThis.fetch = async () => {
    writes++;
    return json(response({ kind: "comment", content: "Visible comment" }));
  };
  try {
    await assert.rejects(
      act(store, { kind: "interest", message: "Introduction" }),
      (e) => e.status === 403,
    );
    assert.equal(writes, 0);
    await act(store, { kind: "comment", content: "Visible comment" });
    assert.equal(writes, 1);
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
for (const status of [400, 403, 404, 409, 500])
  test(`interaction ${status} stays a sanitized failure, preserving retry ability`, async () => {
    const store = storeFor();
    const original = globalThis.fetch;
    await seed(store);
    globalThis.fetch = async () =>
      json(
        {
          message: status === 409 ? "You have already reported this post" : "Rejected",
        },
        status,
      );
    try {
      await assert.rejects(
        act(store, { kind: "report", reason: "SCAM_OR_FRAUD" }),
        (e) => e.status === status,
      );
      assert.equal(store.getState().auth.isIdentityVerified, true);
    } finally {
      clean(store);
      globalThis.fetch = original;
    }
  });
test("malformed/mismatched comment, reaction and report association never confirms success", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store);
  try {
    for (const [action, body] of [
      [
        { kind: "comment", content: "Hi" },
        {
          ...response({ kind: "comment", content: "Hi" }),
          comment: {
            ...response({ kind: "comment", content: "Hi" }).comment,
            communityRequestId: otherId,
          },
        },
      ],
      [
        { kind: "react" },
        {
          ...response({ kind: "react" }),
          reaction: { ...response({ kind: "react" }).reaction, userId: otherId },
        },
      ],
      [
        { kind: "report", reason: "HARASSMENT" },
        {
          ...response({ kind: "report", reason: "HARASSMENT" }),
          report: {
            ...response({ kind: "report", reason: "HARASSMENT" }).report,
            postId: otherId,
          },
        },
      ],
    ]) {
      globalThis.fetch = async () => json(body);
      await assert.rejects(act(store, action), (e) => e.status === "CUSTOM_ERROR");
    }
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
test("successful hide/restore refreshes actual viewer state; reporting does not hide a post", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let ignored = false;
  globalThis.fetch = async (req) => {
    const u = new URL(req.url);
    if (req.method !== "GET") {
      if (u.pathname.endsWith("/reports"))
        return json(response({ kind: "report", reason: "HARASSMENT" }));
      if (u.pathname.endsWith("/ignore")) ignored = req.method === "POST";
      return json(response({ kind: "ignore" }));
    }
    return json(listDto({ items: ignored ? [] : [postDto()] }));
  };
  const arg = { ...scope(store), filters: { limit: 20 } };
  const list = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  try {
    await list.unwrap();
    await act(store, { kind: "report", reason: "HARASSMENT" });
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(arg)(store.getState()).data
        .pages[0].items.length,
      1,
    );
    await act(store, { kind: "ignore" });
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(arg)(store.getState()).data
        .pages[0].items.length,
      0,
    );
    await act(store, { kind: "restore" });
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(arg)(store.getState()).data
        .pages[0].items.length,
      1,
    );
  } finally {
    list.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("comment success invalidates matching comments and actual post counts without unrelated domains", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store);
  let reads = 0;
  globalThis.fetch = async (req) => {
    if (req.method === "POST")
      return json(response({ kind: "comment", content: "Confirmed" }));
    reads++;
    return json(comments());
  };
  const arg = { ...scope(store), postId };
  const req = store.dispatch(communityApi.endpoints.getCommunityComments.initiate(arg));
  try {
    await req.unwrap();
    await act(store, { kind: "comment", content: "Confirmed" });
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    assert.equal(reads, 2);
    const unrelated = baseApi.util.selectInvalidatedBy(store.getState(), [
      "Rewards",
      "SocialFeed",
    ]);
    assert.equal(unrelated.length, 0);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("opposite visibility requests share a lock and duplicate actions issue one request", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store);
  let begin;
  let release;
  const started = new Promise((r) => {
    begin = r;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    begin();
    return new Promise((r) => {
      release = () => r(json({ message: "Hidden" }));
    });
  };
  const first = act(store, { kind: "ignore" });
  try {
    await started;
    await assert.rejects(
      act(store, { kind: "restore" }),
      (e) => e.status === "CUSTOM_ERROR",
    );
    release();
    await first;
    assert.equal(calls, 1);
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
test("interest and withdrawal share their own conflict lock", async () => {
  const store = storeFor("VENDOR");
  const original = globalThis.fetch;
  await vendor(store);
  await seed(
    store,
    callout(false, {
      viewer: { isOwner: false, isIgnored: false, isInterested: true },
    }),
  );
  let begin;
  let release;
  const started = new Promise((r) => {
    begin = r;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    begin();
    return new Promise((r) => {
      release = () => r(json({ message: "Withdrawn" }));
    });
  };
  const first = act(store, { kind: "withdraw" });
  try {
    await started;
    await assert.rejects(
      act(store, { kind: "withdraw" }),
      (e) => e.status === "CUSTOM_ERROR",
    );
    release();
    await first;
    assert.equal(calls, 1);
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
for (const change of ["logout", "new-user", "role"])
  test(`pending interaction cannot update ${change} replacement context`, async () => {
    const store = storeFor();
    const original = globalThis.fetch;
    await seed(store);
    let begin;
    let release;
    const started = new Promise((r) => {
      begin = r;
    });
    globalThis.fetch = async () => {
      begin();
      return new Promise((r) => {
        release = () => r(json(response({ kind: "react" })));
      });
    };
    const first = act(store, { kind: "react" });
    try {
      await started;
      if (change === "logout") store.dispatch(clearSession("storage"));
      else if (change === "new-user") {
        store.dispatch(
          sessionRestored({
            sessionId: "new-session",
            accessToken: "new-access",
            refreshToken: "new-refresh",
            user: null,
          }),
        );
        store.dispatch(
          identityVerified({
            id: otherId,
            name: "New user",
            email: "new@example.invalid",
            roles: ["CUSTOMER"],
            role: "CUSTOMER",
          }),
        );
      } else {
        store.dispatch(
          identityVerified({
            ...store.getState().auth.user,
            roles: ["CUSTOMER", "VENDOR"],
          }),
        );
        store.dispatch(activeRoleSelected("VENDOR"));
      }
      release();
      await assert.rejects(first);
      assert.equal(Object.keys(store.getState().api.queries).length, 0);
    } finally {
      clean(store);
      globalThis.fetch = original;
    }
  });
test("comments reject malformed envelopes and preserve zero rather than invent counts", () => {
  assert.equal(
    communityCommentsSchema.parse(
      comments({
        items: [],
        pagination: { total: 0, limit: 20, offset: 0, nextOffset: null },
      }),
    ).pagination.total,
    0,
  );
  assert.equal(
    communityCommentsSchema.safeParse({ comments: [], totalCount: 0 }).success,
    false,
  );
  assert.equal(
    communityInterestsSchema.safeParse({ items: [], pagination: { total: 0 } }).success,
    false,
  );
});
test("real interest rows show actual identities/messages with unavailable metrics and disabled invitations", () => {
  const rows = communityInterestsSchema.parse(interests()).items;
  const html = renderToStaticMarkup(h(CommunityInterestRows, { rows, onProfile() {} }));
  assert.ok(html.includes("Actual interested business"));
  assert.ok(html.includes("We serve actual tacos"));
  assert.ok(html.includes("Cuisine, rating and distance unavailable"));
  assert.ok(html.includes("disabled"));
  assert.ok(!html.includes("Invited locally"));
});
test("comments and interest panels expose empty/loading/retry states with cached backend-shaped data", async () => {
  const store = storeFor();
  const p = communityPostSchema.parse(callout(true));
  const arg = { ...scope(store), postId };
  try {
    await seed(store, p);
    const loading = view(store, CommunityCommentsPanel, { post: p });
    assert.ok(loading.includes("Loading Community posts"));
    await store.dispatch(
      communityApi.util.upsertQueryData("getCommunityComments", arg, {
        pages: [
          communityCommentsSchema.parse(
            comments({
              items: [],
              pagination: { total: 0, limit: 20, offset: 0, nextOffset: null },
            }),
          ),
        ],
        pageParams: [0],
      }),
    );
    const empty = view(store, CommunityCommentsPanel, { post: p });
    assert.ok(empty.includes("No comments yet"));
    assert.ok(empty.includes("0 comments in total"));
    await store.dispatch(
      communityApi.util.upsertQueryData("getCommunityInterests", arg, {
        pages: [communityInterestsSchema.parse(interests({ items: [], total: 0 }))],
        pageParams: [0],
      }),
    );
    const noInterests = view(store, ConnectedCommunityInterests, {
      post: p,
      onBack() {},
    });
    assert.ok(noInterests.includes("No interested vendors yet"));
    assert.ok(noInterests.includes("0 interested vendors"));
  } finally {
    clean(store);
  }
});
test("interactive card controls retain real counts, omit toggle ownership and keep unsupported actions separate", () => {
  const store = storeFor();
  try {
    const p = communityPostSchema.parse(
      postDto({
        counts: { comments: 0, reactions: 0, offers: 0, interestedVendors: 0 },
      }),
    );
    const html = view(store, CommunityPostInteractions, { post: p });
    assert.ok(html.includes("Save LIKE reaction"));
    assert.ok(html.includes("0 comments"));
    assert.ok(!html.includes("Unlike"));
    assert.ok(!html.includes("aria-pressed"));
    assert.ok(html.includes("Post actions"));
    assert.ok(!html.includes("Send quote"));
  } finally {
    clean(store);
  }
});

test("temporary comment refresh failure preserves rows, but a definitive access denial hides cached content/counts", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  const p = communityPostSchema.parse(postDto());
  let status = 200;
  globalThis.fetch = async () =>
    status === 200
      ? json(comments())
      : json({ message: status === 500 ? "internal secret stack" : "Private" }, status);
  const arg = { ...scope(store), postId };
  const req = store.dispatch(communityApi.endpoints.getCommunityComments.initiate(arg));
  try {
    await req.unwrap();
    status = 500;
    let refresh = store.dispatch(
      communityApi.endpoints.getCommunityComments.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(refresh.unwrap());
    refresh.unsubscribe();
    let html = view(store, CommunityCommentsPanel, { post: p });
    assert.ok(html.includes("Actual Community comment"));
    assert.ok(html.includes("Retry"));
    assert.ok(!html.includes("internal secret stack"));
    status = 403;
    refresh = store.dispatch(
      communityApi.endpoints.getCommunityComments.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(refresh.unwrap());
    refresh.unsubscribe();
    html = view(store, CommunityCommentsPanel, { post: p });
    assert.ok(!html.includes("Actual Community comment"));
    assert.ok(!html.includes("1 comments in total"));
    assert.ok(html.includes("private, missing, deleted"));
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("expired interaction JWT refreshes and retries once through the existing base query", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store);
  let writes = 0;
  let refreshes = 0;
  globalThis.fetch = async (req) => {
    if (new URL(req.url).pathname.endsWith("/auth/refresh")) {
      refreshes++;
      return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
    }
    writes++;
    return req.headers.get("authorization") === "Bearer test-access"
      ? json({ message: "Expired access token" }, 401)
      : json(response({ kind: "react" }));
  };
  try {
    await act(store, { kind: "react" });
    assert.equal(writes, 2);
    assert.equal(refreshes, 1);
    assert.equal(store.getState().auth.isIdentityVerified, true);
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
test("network comment failure sends once, retains no invented comment and supports authoritative read retry", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(store);
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError("offline");
  };
  try {
    await assert.rejects(
      act(store, { kind: "comment", content: "Retained draft" }),
      (e) => e.status === "FETCH_ERROR",
    );
    assert.equal(calls, 1);
    assert.equal(
      communityApi.endpoints.getCommunityComments.select({ ...scope(store), postId })(
        store.getState(),
      ).data,
      undefined,
    );
  } finally {
    clean(store);
    globalThis.fetch = original;
  }
});
test("unverified, unsupported role, stale scope and malformed UUID issue no requests", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json(comments());
  };
  try {
    for (const mode of ["unverified", "ADMIN", "stale", "uuid"]) {
      const store = storeFor(
        mode === "ADMIN" ? "ADMIN" : "CUSTOMER",
        mode !== "unverified",
      );
      const arg = { ...scope(store), postId };
      if (mode === "stale") arg.sessionId = "old";
      if (mode === "uuid") arg.postId = "fixture-label";
      const req = store.dispatch(
        communityApi.endpoints.getCommunityComments.initiate(arg),
      );
      await assert.rejects(req.unwrap());
      req.unsubscribe();
      const mutation = store.dispatch(
        communityApi.endpoints.communityInteraction.initiate({
          ...arg,
          action: { kind: "react" },
        }),
      );
      await assert.rejects(mutation.unwrap());
      mutation.reset();
      clean(store);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("organizer can read expired callout interests, while stale non-organizer requests receive the real 403", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  await seed(
    store,
    callout(true, { status: "EXPIRED", expiresAt: "2000-01-01T00:00:00.000Z" }),
  );
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ message: "Only the organizer can view interest messages" }, 403);
  };
  const req = store.dispatch(
    communityApi.endpoints.getCommunityInterests.initiate({ ...scope(store), postId }),
  );
  try {
    await assert.rejects(req.unwrap(), (e) => e.status === 403);
    assert.equal(calls, 1);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("empty final comments and interest pages terminate safely", async () => {
  for (const endpoint of ["getCommunityComments", "getCommunityInterests"]) {
    const store = storeFor();
    const original = globalThis.fetch;
    await seed(store, callout(true));
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return json(
        endpoint === "getCommunityComments"
          ? comments({
              items: [],
              pagination: { total: 0, limit: 20, offset: 0, nextOffset: null },
            })
          : interests({ items: [], total: 0 }),
      );
    };
    const arg = { ...scope(store), postId };
    const req = store.dispatch(communityApi.endpoints[endpoint].initiate(arg));
    try {
      await req.unwrap();
      const next = store.dispatch(
        communityApi.endpoints[endpoint].initiate(arg, { direction: "forward" }),
      );
      await next.unwrap();
      next.unsubscribe();
      assert.equal(calls, 1);
    } finally {
      req.unsubscribe();
      clean(store);
      globalThis.fetch = original;
    }
  }
});
