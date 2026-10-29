import assert from "node:assert/strict";
import test from "node:test";
import { URL, URLSearchParams } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { communityApi, communityScope } from "../api/community.api.ts";
import {
  communityPostSchema,
  communityListSchema,
  communityDetailSchema,
  communityQuerySchema,
} from "../schemas/community.schema.ts";
import {
  categoryValues,
  readCommunityFilters,
  communityFilterParams,
  communityPresentation,
  uniqueCommunityPosts,
  nextCommunityOffset,
} from "./communityAdapters.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import {
  clearSession,
  sessionRestored,
  identityVerified,
  activeRoleSelected,
} from "../../auth/store/auth.slice.ts";
import CustomerCommunityPage from "../../customer/pages/CustomerCommunityPage.tsx";
import { CommunityReadCard } from "../../customer/components/community/CommunityReadCard.tsx";
import { CommunityReadStates } from "../../customer/components/community/CommunityReadStates.tsx";
import { CommunityLocationView } from "../../customer/components/community/CommunityLocationView.tsx";
import {
  communityStore,
  otherId,
  postId,
  postDto,
  listDto,
  json,
} from "./community.test-fixtures.mjs";
const cleanup = (store) => store.dispatch(baseApi.util.resetApiState());
const argFor = (store, filters) => ({
  ...communityScope(store.getState()),
  ...(filters ? { filters } : {}),
});
const render = (store, path = "/community") =>
  renderToStaticMarkup(
    h(
      Provider,
      { store },
      h(MemoryRouter, { initialEntries: [path] }, h(CustomerCommunityPage)),
    ),
  );

for (const [name, path] of [
  ["getCommunityPosts", "/community/posts"],
  ["getMyCommunityPosts", "/community/posts/mine"],
])
  test(`${name} sends exact authenticated GET, enum and limit/offset with correct list envelope`, async () => {
    const store = communityStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      const url = new URL(request.url);
      assert.equal(request.method, "GET");
      assert.equal(url.pathname, `/api/v1${path}`);
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      assert.deepEqual(Object.fromEntries(url.searchParams), {
        category: "FOR_SALE",
        limit: "20",
        offset: "0",
      });
      return json(listDto({ items: [postDto({ category: "FOR_SALE" })] }));
    };
    const req = store.dispatch(
      communityApi.endpoints[name].initiate(argFor(store, { category: "FOR_SALE" })),
    );
    try {
      const result = await req.unwrap();
      assert.equal(result.pages[0].items[0].id, postId);
      assert.equal(result.pages[0].pagination.total, 1);
    } finally {
      req.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("detail uses selected UUID and actual message/post envelope, stripping unreviewed fields", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).pathname, `/api/v1/community/posts/${postId}`);
    assert.equal(request.method, "GET");
    return json({
      message: "Community post retrieved successfully",
      post: postDto({ internalSecret: "hidden" }),
    });
  };
  const req = store.dispatch(
    communityApi.endpoints.getCommunityPost.initiate({ ...argFor(store), postId }),
  );
  try {
    const result = await req.unwrap();
    assert.equal(result.post.id, postId);
    assert.equal(result.post.internalSecret, undefined);
    assert.equal(result.post.createdById, undefined);
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("read schemas distinguish envelopes, UUIDs and real enums", () => {
  assert.equal(communityListSchema.safeParse(listDto()).success, true);
  assert.equal(
    communityDetailSchema.safeParse({ message: "ok", post: postDto() }).success,
    true,
  );
  for (const dto of [{ data: listDto() }, { message: "ok", post: postDto() }])
    assert.equal(communityListSchema.safeParse(dto).success, false);
  for (const patch of [
    { id: "sample-post" },
    { category: "Need a truck" },
    { status: "Ongoing" },
    { createdAt: "today" },
  ])
    assert.equal(communityPostSchema.safeParse(postDto(patch)).success, false);
});
test("all six UI categories map explicitly to verified enums", () => {
  assert.deepEqual(Object.values(categoryValues), [
    "COMMUNITY",
    "NEED_TRUCK",
    "VENDOR_CALLOUT",
    "FOR_SALE",
    "HIRING_JOBS",
    "COMMUNITY_HELP",
  ]);
  for (const [label, value] of Object.entries(categoryValues))
    assert.equal(
      readCommunityFilters(new URLSearchParams({ category: label })).category,
      value,
    );
  assert.equal(
    readCommunityFilters(new URLSearchParams({ category: "invalid" })).category,
    undefined,
  );
  assert.equal(
    readCommunityFilters(new URLSearchParams({ view: "my-requests" })).mine,
    true,
  );
  assert.equal(
    readCommunityFilters(new URLSearchParams({ view: "my-posts" })).mine,
    true,
  );
});
test("tab/category/reset filters discard pagination and unsupported geographic/search parameters", () => {
  const params = new URLSearchParams(
    "view=my-posts&category=For+sale&offset=40&page=3&city=Imaginary&search=test&latitude=42&longitude=50&radiusKm=10",
  );
  assert.equal(
    communityFilterParams(params, "category", "Callout").toString(),
    "view=my-posts&category=Callout",
  );
  assert.equal(communityFilterParams(params, "view", "all").get("offset"), null);
  assert.equal(communityFilterParams(params).toString(), "view=my-posts");
});
test("query DTO preserves coordinate-pair, radius and Requests constraints; rejects invented filters", () => {
  assert.equal(
    communityQuerySchema.safeParse({
      latitude: 0,
      longitude: 0,
      radiusKm: 500,
      limit: 100,
      offset: 100000,
    }).success,
    true,
  );
  assert.equal(
    communityQuerySchema.safeParse({ tab: "REQUESTS", category: "NEED_TRUCK" }).success,
    true,
  );
  for (const query of [
    { city: "City" },
    { search: "food" },
    { status: "OPEN" },
    { latitude: 10 },
    { longitude: 0 },
    { radiusKm: 10 },
    { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: 181 },
    { radiusKm: 501 },
    { limit: 101 },
    { offset: -1 },
    { tab: "REQUESTS", category: "COMMUNITY" },
  ])
    assert.equal(
      communityQuerySchema.safeParse(query).success,
      false,
      JSON.stringify(query),
    );
});
test("pagination uses returned offset, reconciles repeated UUIDs and stops on an empty last page", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  const offsets = [];
  globalThis.fetch = async (request) => {
    const offset = Number(new URL(request.url).searchParams.get("offset"));
    offsets.push(offset);
    return json(
      offset === 0
        ? listDto({ pagination: { total: 4, limit: 20, offset: 0, nextOffset: 1 } })
        : offset === 1
          ? listDto({
              items: [
                postDto({ title: "Updated server post" }),
                postDto({ id: otherId }),
              ],
              pagination: { total: 4, limit: 20, offset: 1, nextOffset: 3 },
            })
          : listDto({
              items: [],
              pagination: { total: 3, limit: 20, offset: 3, nextOffset: null },
            }),
    );
  };
  const arg = argFor(store);
  const req = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  try {
    await req.unwrap();
    const next = store.dispatch(
      communityApi.endpoints.getCommunityPosts.initiate(arg, { direction: "forward" }),
    );
    const result = await next.unwrap();
    const posts = uniqueCommunityPosts(result.pages);
    assert.equal(posts.length, 2);
    assert.equal(posts[0].title, "Updated server post");
    next.unsubscribe();
    const last = store.dispatch(
      communityApi.endpoints.getCommunityPosts.initiate(arg, { direction: "forward" }),
    );
    const done = await last.unwrap();
    assert.equal(nextCommunityOffset(done.pages.at(-1), 3), undefined);
    assert.equal(uniqueCommunityPosts(done.pages).length, 2);
    last.unsubscribe();
    assert.deepEqual(offsets, [0, 1, 3]);
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("nonadvancing, empty or out-of-range nextOffset cannot loop", () => {
  for (const nextOffset of [0, 100001, null])
    assert.equal(
      nextCommunityOffset(
        communityListSchema.parse(
          listDto({ pagination: { total: 100, limit: 20, offset: 0, nextOffset } }),
        ),
        0,
      ),
      undefined,
    );
  assert.equal(
    nextCommunityOffset(
      communityListSchema.parse(
        listDto({
          items: [],
          pagination: { total: 10, limit: 20, offset: 0, nextOffset: 1 },
        }),
      ),
      0,
    ),
    undefined,
  );
});
test("filter/tab changes use new first pages; unsubscribed pagination is discarded on return", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    const u = new URL(request.url);
    calls.push([
      u.pathname,
      u.searchParams.get("category"),
      u.searchParams.get("offset"),
    ]);
    return json(listDto());
  };
  try {
    for (const [endpoint, category] of [
      ["getCommunityPosts", "COMMUNITY"],
      ["getCommunityPosts", "FOR_SALE"],
      ["getMyCommunityPosts", "FOR_SALE"],
      ["getCommunityPosts", "COMMUNITY"],
    ]) {
      const req = store.dispatch(
        communityApi.endpoints[endpoint].initiate(argFor(store, { category })),
      );
      await req.unwrap();
      req.unsubscribe();
      await delay(10);
    }
    assert.equal(calls.length, 4);
    assert.ok(calls.every((c) => c[2] === "0"));
    assert.equal(calls[2][0], "/api/v1/community/posts/mine");
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("missing author/media/location/counts stay unavailable; zero stays zero; unsafe URLs are not rendered", () => {
  const post = communityPostSchema.parse(
    postDto({ author: null, media: null, counts: null }),
  );
  const view = communityPresentation(post);
  assert.equal(view.author, "Author unavailable");
  assert.equal(view.avatar, "");
  assert.deepEqual(view.media, []);
  const zero = communityPostSchema.parse(postDto());
  const card = renderToStaticMarkup(
    h(CommunityReadCard, { post: zero, onDetails() {}, onImage() {} }),
  );
  assert.ok(card.includes("0 comments"));
  assert.ok(card.includes("Location unavailable"));
  assert.ok(!card.includes("Anthony"));
  const missing = renderToStaticMarkup(
    h(CommunityReadCard, { post, onDetails() {}, onImage() {} }),
  );
  assert.ok(missing.includes("Unavailable comments"));
  const unsafe = communityPresentation(
    communityPostSchema.parse(
      postDto({
        author: { ...postDto().author, avatarUrl: "javascript:bad" },
        media: [{ id: otherId, mediaType: "IMAGE", mediaUrl: "data:text/html,bad" }],
      }),
    ),
  );
  assert.equal(unsafe.avatar, "");
  assert.equal(unsafe.media.length, 0);
});
test("real event dates, Decimal budgets, media, flags and zero interest counts are preserved", () => {
  const post = communityPostSchema.parse(
    postDto({
      category: "NEED_TRUCK",
      eventDate: "2027-01-02T00:00:00.000Z",
      budgetMin: "500.50",
      budgetMax: "800.00",
      address: "Actual venue",
      media: [
        {
          id: otherId,
          mediaType: "IMAGE",
          mediaUrl: "https://example.invalid/photo.jpg",
        },
      ],
      viewer: { isOwner: true, isIgnored: false, isInterested: false },
    }),
  );
  const view = communityPresentation(post);
  assert.equal(view.eventDate, "2027-01-02");
  assert.equal(view.budget, "500.50 – 800.00 (currency unavailable)");
  assert.equal(view.media[0].url, "https://example.invalid/photo.jpg");
  assert.equal(post.viewer.isOwner, true);
  assert.equal(post.counts.interestedVendors, 0);
});
for (const status of [400, 403, 404, 500])
  test(`detail ${status} remains an error, never mock content`, async () => {
    const store = communityStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      json(
        { message: status === 500 ? "private server stack" : "Unavailable" },
        status,
      );
    const req = store.dispatch(
      communityApi.endpoints.getCommunityPost.initiate({ ...argFor(store), postId }),
    );
    try {
      await assert.rejects(req.unwrap(), (error) => error.status === status);
      const html = renderToStaticMarkup(
        h(CommunityReadStates, {
          detail: true,
          loading: false,
          fetching: false,
          error: { status, data: { message: "private server stack" } },
          empty: true,
          onRetry() {},
        }),
      );
      assert.ok(html.includes("Retry"));
      if (status === 403 || status === 404)
        assert.ok(html.includes("private, missing, deleted"));
      if (status === 500) assert.ok(!html.includes("private server stack"));
    } finally {
      req.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("unverified, wrong role, stale user/session and invalid UUID cannot issue HTTP", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json(listDto());
  };
  try {
    for (const mode of ["unverified", "ADMIN", "stale-user", "stale-session", "uuid"]) {
      const store = communityStore(mode === "ADMIN" ? "ADMIN" : "CUSTOMER");
      let scope = argFor(store);
      if (mode === "unverified")
        store.dispatch(
          sessionRestored({
            accessToken: "test-access",
            refreshToken: "test-refresh",
            sessionId: scope.sessionId,
            user: null,
          }),
        );
      if (mode === "stale-user") scope = { ...scope, userId: otherId };
      if (mode === "stale-session") scope = { ...scope, sessionId: "old" };
      const req = store.dispatch(
        mode === "uuid"
          ? communityApi.endpoints.getCommunityPost.initiate({
              ...scope,
              postId: "display-label",
            })
          : communityApi.endpoints.getCommunityPosts.initiate(scope),
      );
      await assert.rejects(req.unwrap());
      req.unsubscribe();
      cleanup(store);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("query rejects malformed contracts and mismatched detail/offset without invented data", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  try {
    for (const [endpoint, body] of [
      ["getCommunityPosts", { data: [] }],
      [
        "getCommunityPosts",
        listDto({ pagination: { total: 1, limit: 20, offset: 40, nextOffset: null } }),
      ],
      ["getCommunityPost", { message: "ok", post: postDto({ id: otherId }) }],
    ]) {
      globalThis.fetch = async () => json(body);
      const req = store.dispatch(
        communityApi.endpoints[endpoint].initiate(
          { ...argFor(store), ...(endpoint === "getCommunityPost" ? { postId } : {}) },
          { forceRefetch: true },
        ),
      );
      await assert.rejects(req.unwrap());
      req.unsubscribe();
      cleanup(store);
    }
  } finally {
    globalThis.fetch = original;
  }
});
test("network/background failure retains valid pages; explicit retry uses server response", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let fail = false;
  globalThis.fetch = async () => {
    if (fail) throw new TypeError("Network offline");
    return json(listDto());
  };
  const arg = argFor(store);
  const req = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  try {
    await req.unwrap();
    fail = true;
    const refresh = store.dispatch(
      communityApi.endpoints.getCommunityPosts.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(refresh.unwrap());
    refresh.unsubscribe();
    let selected = communityApi.endpoints.getCommunityPosts.select(arg)(
      store.getState(),
    );
    assert.equal(selected.data.pages[0].items[0].id, postId);
    assert.ok(selected.error);
    fail = false;
    const retry = store.dispatch(
      communityApi.endpoints.getCommunityPosts.initiate(arg, { forceRefetch: true }),
    );
    await retry.unwrap();
    retry.unsubscribe();
    selected = communityApi.endpoints.getCommunityPosts.select(arg)(store.getState());
    assert.equal(selected.error, undefined);
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("Community tags refetch list/details and logout resets identity-sensitive caches", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (request) => {
    calls++;
    return json(
      new URL(request.url).pathname.endsWith(postId)
        ? { message: "ok", post: postDto() }
        : listDto(),
    );
  };
  const arg = argFor(store);
  const req = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  const detail = store.dispatch(
    communityApi.endpoints.getCommunityPost.initiate({ ...arg, postId }),
  );
  try {
    await Promise.all([req.unwrap(), detail.unwrap()]);
    store.dispatch(
      baseApi.util.invalidateTags([{ type: "CommunityPost", id: postId }]),
    );
    await store
      .dispatch(baseApi.util.getRunningQueriesThunk())
      .reduce((p, r) => p.then(() => r), Promise.resolve());
    assert.equal(calls, 4);
    store.dispatch(clearSession("storage"));
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(arg)(store.getState()).data,
      undefined,
    );
    assert.equal(
      communityApi.endpoints.getCommunityPost.select({ ...arg, postId })(
        store.getState(),
      ).data,
      undefined,
    );
  } finally {
    req.unsubscribe();
    detail.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("delayed old response after account replacement never populates the new session", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let release;
  let started;
  const began = new Promise((r) => {
    started = r;
  });
  globalThis.fetch = async () => {
    started();
    return new Promise((r) => {
      release = () => r(json(listDto()));
    });
  };
  const oldArg = argFor(store);
  const req = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(oldArg));
  try {
    await began;
    store.dispatch(
      sessionRestored({
        accessToken: "new-access",
        refreshToken: "new-refresh",
        sessionId: "replacement-session",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: otherId,
        name: "Other account",
        email: "other@example.invalid",
        roles: ["CUSTOMER"],
        role: "CUSTOMER",
      }),
    );
    release();
    await req;
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(oldArg)(store.getState()).data,
      undefined,
    );
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(argFor(store))(store.getState())
        .data,
      undefined,
    );
    assert.ok(!render(store).includes("Actual Community meetup"));
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("role replacement clears Community caches without weakening route/session gating", async () => {
  const store = communityStore();
  const actor = store.getState().auth.user;
  store.dispatch(identityVerified({ ...actor, roles: ["CUSTOMER", "VENDOR"] }));
  const original = globalThis.fetch;
  globalThis.fetch = async () => json(listDto());
  const arg = argFor(store);
  const req = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  try {
    await req.unwrap();
    store.dispatch(activeRoleSelected("VENDOR"));
    assert.equal(
      communityApi.endpoints.getCommunityPosts.select(arg)(store.getState()).data,
      undefined,
    );
    assert.ok(render(store).includes("verified Customer session"));
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("UI renders loading/refresh/empty/filter/mine/error states with retry and no fixture fallback", () => {
  for (const [props, text] of [
    [{ loading: true }, "Loading Community posts"],
    [{ fetching: true, empty: false }, "Refreshing Community"],
    [{ empty: true }, "No Community posts yet"],
    [{ empty: true, mine: true }, "You have no Community posts"],
    [{ empty: true, filtered: true }, "match this category"],
    [{ error: { status: "FETCH_ERROR", error: "offline" } }, "Retry"],
  ]) {
    const html = renderToStaticMarkup(
      h(CommunityReadStates, {
        loading: false,
        fetching: false,
        empty: false,
        onRetry() {},
        ...props,
      }),
    );
    assert.ok(html.includes(text), text);
  }
  const store = communityStore();
  try {
    const html = render(store);
    assert.ok(html.includes("All Posts"));
    assert.ok(html.includes("My Posts"));
    assert.ok(html.includes("Geographic filtering unavailable"));
    for (const fake of [
      "fiesta-meetup",
      "San Antonio",
      "Anthony R.",
      "birthday-truck-request",
    ])
      assert.ok(!html.includes(fake));
  } finally {
    cleanup(store);
  }
});
test("real cards retain styling, show only verified allowed edit actions and disable mutations", () => {
  const post = communityPostSchema.parse(
    postDto({
      allowedActions: {
        canEdit: true,
        canDelete: false,
        canQuote: false,
        canSendInterest: false,
      },
    }),
  );
  const html = renderToStaticMarkup(
    h(CommunityReadCard, { post, detail: true, onDetails() {}, onImage() {} }),
  );
  assert.ok(html.includes("community-card--social"));
  assert.ok(html.includes("Edit post"));
  assert.ok(!html.includes("Delete post"));
  assert.ok(!html.includes("Send quote"));
  assert.ok(html.includes("disabled"));
  assert.ok(!html.includes("Liked locally"));
});
test("location illustration cannot apply city, radius or artwork pin as coordinates", () => {
  const html = renderToStaticMarkup(
    h(CommunityLocationView, {
      unavailable: true,
      value: { city: "", radius: "Any", pin: { x: 0, y: 0 } },
      onApply() {},
      onBack() {},
    }),
  );
  assert.ok(html.includes("No real location or map coordinates"));
  assert.ok(html.includes("verified latitude and longitude"));
  assert.ok(html.includes("disabled"));
  assert.ok(!html.includes('class="community-map-pin"'));
});

test("page consumes real cached All/My Posts, including non-request mine posts, without local fixture filtering", async () => {
  const store = communityStore();
  const arg = argFor(store, { limit: 20 });
  try {
    for (const name of ["getCommunityPosts", "getMyCommunityPosts"]) {
      await store.dispatch(
        communityApi.util.upsertQueryData(name, arg, {
          pages: [communityListSchema.parse(listDto())],
          pageParams: [0],
        }),
      );
    }
    for (const path of ["/community", "/community?view=my-posts"]) {
      const html = render(store, path);
      assert.ok(html.includes("Actual Community meetup"));
      assert.ok(html.includes(postId));
      assert.ok(html.includes("Actual Community author"));
      assert.ok(html.includes("1 matching posts"));
      assert.ok(!html.includes("San Antonio"));
    }
  } finally {
    cleanup(store);
  }
});

test("definitive list permission failure hides cached cards while a temporary failure preserves them", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let status = 200;
  globalThis.fetch = async () =>
    status === 200 ? json(listDto()) : json({ message: "Unavailable" }, status);
  const arg = argFor(store, { limit: 20 });
  const req = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  try {
    await req.unwrap();
    status = 500;
    const temporary = store.dispatch(
      communityApi.endpoints.getCommunityPosts.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(temporary.unwrap());
    temporary.unsubscribe();
    assert.ok(render(store).includes("Actual Community meetup"));
    status = 403;
    const forbidden = store.dispatch(
      communityApi.endpoints.getCommunityPosts.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(forbidden.unwrap());
    forbidden.unsubscribe();
    const html = render(store);
    assert.ok(!html.includes("Actual Community meetup"));
    assert.ok(html.includes("private, missing, deleted"));
    assert.ok(!html.includes("1 matching posts"));
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
