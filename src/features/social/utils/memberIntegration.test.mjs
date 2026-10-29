import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { clearSession, sessionStarted } from "../../auth/store/auth.slice.ts";
import { socialProfileApi } from "../api/socialProfile.api.ts";
import {
  leaderboardsApi,
  truckRankingsSchema,
  foodieRankingsSchema,
} from "../../leaderboards/api/leaderboards.api.ts";
import {
  rewardsApi,
  rewardSummarySchema,
  rewardRulesSchema,
} from "../../rewards/api/rewards.api.ts";
import {
  memberProfileSchema,
  memberPostsSchema,
} from "../schemas/socialProfile.schema.ts";
import { isMemberIdentifier, memberProfilePath } from "./profileIdentity.ts";
import {
  truckRankingRows,
  foodieRankingRows,
} from "../../leaderboards/utils/rankingAdapters.ts";
import { nextTierProgress } from "../../rewards/utils/rewardProgress.ts";
import { MemberFollowButton } from "../components/MemberFollowButton.tsx";
import { SocialPostsGallery } from "../components/SocialPostsGallery.tsx";
import { RewardsPanel } from "../../rewards/components/RewardsPanel.tsx";
import CustomerProfilePage from "../../customer/pages/CustomerProfilePage.tsx";
import CustomerLeaderboardPage from "../../customer/pages/CustomerLeaderboardPage.tsx";
import VendorLeaderboardPage from "../../vendor/pages/VendorLeaderboardPage.tsx";
import {
  VendorProfileGallery,
  VendorProfileReviews,
} from "../../vendor/components/profile/VendorProfileContent.tsx";
import {
  vendorTestStore,
  seedVendorHome,
  ownerId,
} from "../../vendor/utils/vendor.test-fixtures.mjs";
import { discoveryApi } from "../../customer/api/discovery.api.ts";
import { reviewsDto } from "../../customer/utils/discovery.test-fixtures.mjs";
import {
  viewerId,
  memberId,
  postId,
  memberDto,
  postsDto,
  connectionsDto,
  truckRankDto,
  foodieDto,
  rewardsDto,
  rulesDto,
  memberStore,
  json,
  seedMember,
  seedRankings,
} from "./member.test-fixtures.mjs";
const cleanup = (store) => store.dispatch(baseApi.util.resetApiState());
const render = (store, Component, props = {}, path = "/") =>
  renderToStaticMarkup(
    h(
      Provider,
      { store },
      h(MemoryRouter, { initialEntries: [path] }, h(Component, props)),
    ),
  );
function renderProfile(store, path) {
  return renderToStaticMarkup(
    h(
      Provider,
      { store },
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          Routes,
          null,
          h(Route, { path: "/profile/:id", element: h(CustomerProfilePage) }),
        ),
      ),
    ),
  );
}
for (const [api, endpoint, arg, path, response] of [
  [
    socialProfileApi,
    "getMemberProfile",
    memberId,
    `/social/profiles/${memberId}`,
    memberDto(),
  ],
  [
    socialProfileApi,
    "getMemberPosts",
    { userId: memberId, tab: "posts", cursor: postId },
    `/social/profiles/${memberId}/posts`,
    postsDto(),
  ],
  [
    socialProfileApi,
    "getMemberPosts",
    { userId: memberId, tab: "tagged" },
    `/social/profiles/${memberId}/tagged-posts`,
    postsDto(),
  ],
  [
    socialProfileApi,
    "getMemberConnections",
    { userId: memberId, direction: "followers", limit: 20, offset: 0 },
    `/social/profiles/${memberId}/followers`,
    connectionsDto,
  ],
  [
    socialProfileApi,
    "getMemberConnections",
    {
      userId: memberId,
      direction: "following",
      limit: 20,
      offset: 20,
      type: "VENDOR",
      search: "Real",
    },
    `/social/profiles/${memberId}/following`,
    { ...connectionsDto, offset: 20, nextOffset: null },
  ],
  [
    leaderboardsApi,
    "getTruckRankings",
    {
      category: "top-rated",
      marketId: memberId,
      period: "WEEKLY",
      limit: 20,
      offset: 20,
    },
    "/leaderboards/top-rated",
    truckRankDto(),
  ],
  [
    leaderboardsApi,
    "getTruckRankings",
    { category: "most-booked", limit: 20, offset: 0 },
    "/leaderboards/most-booked",
    truckRankDto(),
  ],
  [
    leaderboardsApi,
    "getFoodieRankings",
    { limit: 20, offset: 20 },
    "/leaderboards/foodie-points",
    foodieDto,
  ],
  [
    rewardsApi,
    "getMyRewardSummary",
    undefined,
    "/rewards/me/profile-summary",
    rewardsDto(),
  ],
  [rewardsApi, "getRewardRules", undefined, "/rewards/rules", rulesDto],
])
  test(`${endpoint} ${path}: verified contract and query`, async () => {
    const store = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      const url = new URL(request.url);
      assert.equal(url.pathname, `/api/v1${path}`);
      assert.equal(request.method, "GET");
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      if (arg && typeof arg === "object") {
        for (const [key, value] of Object.entries(arg))
          if (!["userId", "tab", "direction", "category"].includes(key))
            assert.equal(url.searchParams.get(key), String(value));
      }
      return json(response);
    };
    const request = store.dispatch(api.endpoints[endpoint].initiate(arg));
    try {
      assert.ok(await request.unwrap());
    } finally {
      request.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("UUID member identity, verified me and public slug stay separate", async () => {
  assert.equal(isMemberIdentifier("me"), true);
  assert.equal(isMemberIdentifier(memberId), true);
  assert.equal(isMemberIdentifier("actual-seafood"), false);
  assert.equal(isMemberIdentifier("alex-rivera"), false);
  assert.equal(memberProfilePath(memberId), `/profile/${memberId}`);
  const store = memberStore();
  await seedMember(store);
  let html = renderProfile(store, "/profile/me");
  assert.match(html, /Actual Member/);
  assert.match(html, new RegExp(`href="/profile/${viewerId}"`));
  assert.match(html, /140/);
  assert.doesNotMatch(html, /Alex Rivera|2450/);
  await seedMember(store, memberId);
  html = renderProfile(store, `/profile/${memberId}`);
  assert.match(html, /Actual Member/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, />Follow<\/button>/);
  assert.doesNotMatch(html, /Tier Badges/);
  assert.match(
    renderProfile(store, "/profile/actual-seafood"),
    /Loading truck profile/,
  );
  cleanup(store);
});
test("real authored/tagged posts and empty gallery do not fall back to photos", async () => {
  const store = memberStore();
  await store.dispatch(
    socialProfileApi.util.upsertQueryData(
      "getMemberPosts",
      { userId: memberId, tab: "posts" },
      memberPostsSchema.parse(postsDto()),
    ),
  );
  let html = render(store, SocialPostsGallery, { userId: memberId, tab: "posts" });
  assert.match(html, new RegExp(`data-post-id="${postId}"`));
  assert.match(html, /Actual post content/);
  assert.doesNotMatch(html, /placeholder-/);
  await store.dispatch(
    socialProfileApi.util.upsertQueryData(
      "getMemberPosts",
      { userId: memberId, tab: "tagged" },
      { items: [], nextCursor: null },
    ),
  );
  html = render(store, SocialPostsGallery, { userId: memberId, tab: "tagged" });
  assert.match(html, /No tagged posts/);
  cleanup(store);
});
test("post cursors and follower offsets are preserved without local totals", () => {
  const parsed = memberPostsSchema.parse(postsDto({ nextCursor: postId }));
  assert.equal(parsed.nextCursor, postId);
  assert.equal(connectionsDto.total, 22);
  assert.equal(connectionsDto.nextOffset, 20);
  assert.equal(connectionsDto.items.length, 1);
});
for (const following of [true, false])
  test(`member follow ${following}: exact bodyless UUID contract`, async () => {
    const store = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      assert.equal(
        new URL(request.url).pathname,
        `/api/v1/social/profiles/${memberId}/follow`,
      );
      assert.equal(request.method, following ? "POST" : "DELETE");
      assert.equal(await request.text(), "");
      return json(
        following
          ? { id: postId, followerUserId: viewerId, followedUserId: memberId }
          : { unfollowed: false },
      );
    };
    const req = store.dispatch(
      socialProfileApi.endpoints.setMemberFollow.initiate({
        userId: memberId,
        following,
      }),
    );
    try {
      assert.deepEqual(await req.unwrap(), { userId: memberId, following });
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
for (const [role, verified, target] of [
  ["CUSTOMER", false, memberId],
  ["ADMIN", true, memberId],
  [null, true, memberId],
  ["CUSTOMER", true, viewerId],
  ["CUSTOMER", true, "truck-slug"],
])
  test(`follow rejects ineligible actor or target ${role}/${verified}/${target}`, async () => {
    const store = memberStore(role, verified);
    const original = globalThis.fetch;
    globalThis.fetch = async () => assert.fail("ineligible request");
    const req = store.dispatch(
      socialProfileApi.endpoints.setMemberFollow.initiate({
        userId: target,
        following: true,
      }),
    );
    try {
      await assert.rejects(req.unwrap());
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
for (const status of [400, 401, 403, 404, 409, 500, "network"])
  test(`follow failure ${status} leaves no false confirmation`, async () => {
    const store = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      if (status === "network") throw new TypeError("offline");
      return json({ message: "unavailable" }, status);
    };
    const req = store.dispatch(
      socialProfileApi.endpoints.setMemberFollow.initiate({
        userId: memberId,
        following: true,
      }),
    );
    try {
      await assert.rejects(req.unwrap());
      assert.equal(req.arg.originalArgs.userId, memberId);
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("duplicate/opposite requests cannot race; a new session aborts old confirmations", async () => {
  const store = memberStore();
  const original = globalThis.fetch;
  let resolve;
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    return new Promise((r) => {
      resolve = r;
    });
  };
  const first = store.dispatch(
    socialProfileApi.endpoints.setMemberFollow.initiate({
      userId: memberId,
      following: true,
    }),
  );
  try {
    await new Promise((r) => setImmediate(r));
    const second = store.dispatch(
      socialProfileApi.endpoints.setMemberFollow.initiate({
        userId: memberId,
        following: false,
      }),
    );
    await assert.rejects(second.unwrap());
    assert.equal(calls, 1);
    store.dispatch(
      sessionStarted({
        accessToken: "replacement",
        refreshToken: "replacement-refresh",
      }),
    );
    resolve(json({ id: postId, followerUserId: viewerId, followedUserId: memberId }));
    await assert.rejects(first.unwrap());
    await new Promise((r) => setImmediate(r));
    assert.equal(Object.keys(store.getState().api.mutations).length, 0);
    second.reset();
  } finally {
    first.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("follow success invalidates active profiles and returns authoritative counts/state", async () => {
  const store = memberStore();
  const original = globalThis.fetch;
  let followed = false;
  globalThis.fetch = async (request) => {
    if (request.method === "POST") {
      followed = true;
      return json({ id: postId, followerUserId: viewerId, followedUserId: memberId });
    }
    return json(
      memberDto(memberId, { isFollowing: followed, followerCount: followed ? 8 : 7 }),
    );
  };
  const query = store.dispatch(
    socialProfileApi.endpoints.getMemberProfile.initiate(memberId),
  );
  try {
    await query.unwrap();
    const req = store.dispatch(
      socialProfileApi.endpoints.setMemberFollow.initiate({
        userId: memberId,
        following: true,
      }),
    );
    await req.unwrap();
    await store
      .dispatch(
        socialProfileApi.endpoints.getMemberProfile.initiate(memberId, {
          forceRefetch: true,
        }),
      )
      .unwrap();
    const data = socialProfileApi.endpoints.getMemberProfile.select(memberId)(
      store.getState(),
    ).data;
    assert.equal(data.isFollowing, true);
    assert.equal(data.followerCount, 8);
    assert.match(
      render(store, MemberFollowButton, {
        userId: memberId,
        isFollowing: data.isFollowing,
      }),
      /Unfollow/,
    );
    req.reset();
  } finally {
    query.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
for (const status of [403, 404, 503, "network"])
  test(`profile ${status} is unavailable and retry recovers`, async () => {
    const store = memberStore();
    const original = globalThis.fetch;
    let fail = true;
    globalThis.fetch = async () => {
      if (fail) {
        if (status === "network") throw new TypeError("offline");
        return json({ message: "profile inaccessible" }, status);
      }
      return json(memberDto());
    };
    const req = store.dispatch(
      socialProfileApi.endpoints.getMemberProfile.initiate(memberId),
    );
    try {
      await assert.rejects(req.unwrap());
      assert.match(
        renderProfile(store, `/profile/${memberId}`),
        /Member profile unavailable/,
      );
      fail = false;
      await req.refetch().unwrap();
      assert.match(renderProfile(store, `/profile/${memberId}`), /Actual Member/);
    } finally {
      req.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("truck ranks, original/previous rank, score and different metrics are backend-provided", () => {
  const dto = truckRankingsSchema.parse(truckRankDto());
  const top = truckRankingRows(dto, "top-rated")[0];
  const booked = truckRankingRows(dto, "most-booked")[0];
  assert.equal(top.rank, 5);
  assert.equal(top.originalRank, 8);
  assert.equal(top.previousRank, 9);
  assert.equal(top.score, "71.25");
  assert.equal(top.metric, "12 reviews");
  assert.equal(booked.metric, "34 bookings");
  assert.equal(top.rating, "4.25");
  assert.equal(foodieRankingRows(foodieRankingsSchema.parse(foodieDto))[0].rank, 21);
  const unknown = truckRankingRows(
    truckRankingsSchema.parse(
      truckRankDto({
        entries: [
          {
            ...dto.entries[0],
            rank: null,
            originalRank: null,
            previousRank: null,
            foodTruck: null,
            score: null,
          },
        ],
      }),
    ),
    "top-rated",
  )[0];
  assert.equal(unknown.rank, null);
  assert.equal(unknown.name, "Truck unavailable");
});
test("customer/vendor leaderboards reuse exact cache keys with independent layouts", async () => {
  const store = memberStore();
  await seedRankings(store, "top-rated");
  let html = render(store, CustomerLeaderboardPage);
  assert.match(html, /Ranked Truck/);
  assert.match(html, /Rank <\/span>5/);
  assert.doesNotMatch(html, /0.5 mi|sample rankings/);
  cleanup(store);
  const vendor = memberStore("VENDOR");
  await seedRankings(vendor, "most-booked");
  html = render(vendor, VendorLeaderboardPage, {}, "/?tab=most-booked");
  assert.match(html, /vendor-ranking/);
  assert.match(html, /34 bookings/);
  assert.equal(
    Object.keys(vendor.getState().api.queries).filter((key) =>
      key.startsWith("getTruckRankings"),
    ).length,
    1,
  );
  cleanup(vendor);
});
test("foodie points offset stays server rank 21 and nextOffset controls end", async () => {
  const store = memberStore();
  await seedRankings(store, "most-points", 20);
  const html = render(
    store,
    CustomerLeaderboardPage,
    {},
    "/?category=most-points&offset=20",
  );
  assert.match(html, /Ranked Member/);
  assert.match(html, /8400 Points/);
  assert.match(html, /Rank <\/span>21/);
  assert.doesNotMatch(html, /Rank <\/span>1</);
  cleanup(store);
});
test("next tier progress uses lifetime points and returned next threshold rather than final progress", () => {
  const data = rewardSummarySchema.parse(rewardsDto());
  assert.deepEqual(nextTierProgress(data.loyalty), {
    max: 2000,
    value: 900,
    label: "Progress to Drop Hunter",
  });
  assert.equal(data.loyalty.progress.percentage, 9);
  assert.equal(data.loyalty.availablePoints, 140);
  assert.equal(data.loyalty.redeemedPoints, 760);
  const max = nextTierProgress({ ...data.loyalty, nextTier: null });
  assert.equal(max.label, "Maximum tier reached");
  assert.equal(max.value, max.max);
  assert.equal(rewardRulesSchema.parse(rulesDto)[0].pointsRequired, null);
});
test("rewards render actual tiers, points rules/activity and maximum/empty states", async () => {
  const store = memberStore();
  await seedMember(store);
  let html = render(store, RewardsPanel);
  for (const text of [
    "900",
    "140",
    "760",
    "Actual reward rule",
    "Actual Review reward",
    'value="900"',
    'max="2000"',
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /2450|500 points for each/);
  const data = rewardsDto();
  await store.dispatch(
    rewardsApi.util.upsertQueryData(
      "getMyRewardSummary",
      undefined,
      rewardsDto({ loyalty: { ...data.loyalty, nextTier: null }, recentActivity: [] }),
    ),
  );
  html = render(store, RewardsPanel);
  assert.match(html, /Maximum tier reached/);
  assert.match(html, /No reward activity yet/);
  cleanup(store);
});
test("rewards identity mismatch and malformed envelopes fail safely", async () => {
  const store = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) =>
    json(
      new URL(request.url).pathname.endsWith("profile-summary")
        ? rewardsDto({ profile: { ...rewardsDto().profile, id: memberId } })
        : { data: truckRankDto() },
    );
  try {
    for (const [api, endpoint, arg] of [
      [rewardsApi, "getMyRewardSummary", undefined],
      [
        leaderboardsApi,
        "getTruckRankings",
        { category: "top-rated", limit: 20, offset: 0 },
      ],
    ]) {
      const req = store.dispatch(api.endpoints[endpoint].initiate(arg));
      await assert.rejects(req.unwrap());
      req.unsubscribe();
    }
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("vendor profile social content uses owner UUID and existing T05 truck review slug", async () => {
  const store = vendorTestStore();
  await seedVendorHome(store);
  await store.dispatch(
    socialProfileApi.util.upsertQueryData(
      "getMemberPosts",
      { userId: ownerId, tab: "posts" },
      postsDto(),
    ),
  );
  await store.dispatch(
    discoveryApi.util.upsertQueryData(
      "getTruckReviews",
      { slug: "actual-food-truck" },
      reviewsDto,
    ),
  );
  assert.match(render(store, VendorProfileGallery), /Actual post content/);
  assert.match(render(store, VendorProfileReviews), /Real review content/);
  assert.equal(
    socialProfileApi.endpoints.getMemberPosts.select({ userId: ownerId, tab: "posts" })(
      store.getState(),
    ).data.items[0].id,
    postId,
  );
  cleanup(store);
});
test("logout clears member, rankings and rewards data", async () => {
  const store = memberStore();
  await seedMember(store);
  await seedRankings(store);
  store.dispatch(clearSession("storage"));
  assert.equal(Object.keys(store.getState().api.queries).length, 0);
  assert.equal(Object.keys(store.getState().api.mutations).length, 0);
});
test("runtime profile schema excludes backend internal fields", () => {
  const dto = memberProfileSchema.parse({ ...memberDto(), passwordHash: "internal" });
  assert.equal(dto.passwordHash, undefined);
  assert.equal(dto.isFollowing, false);
});

for (const [api, endpoint, arg, component, path] of [
  [
    leaderboardsApi,
    "getTruckRankings",
    { category: "top-rated", limit: 20, offset: 0 },
    CustomerLeaderboardPage,
    "/",
  ],
  [rewardsApi, "getMyRewardSummary", undefined, RewardsPanel, "/"],
])
  test(`${endpoint} missing resource has retry and no fixture fallback`, async () => {
    const store = memberStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () => json({ message: "not found" }, 404);
    const req = store.dispatch(api.endpoints[endpoint].initiate(arg));
    try {
      await assert.rejects(req.unwrap());
      const html = render(store, component, {}, path);
      assert.match(html, /Try again|Retry/);
      assert.doesNotMatch(html, /Burger Bliss|2450|Lionel Messi/);
    } finally {
      req.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("vendor role and unverified identity never request customer reward data", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => assert.fail("reward HTTP for ineligible actor");
  try {
    for (const store of [memberStore("VENDOR"), memberStore("CUSTOMER", false)]) {
      const req = store.dispatch(rewardsApi.endpoints.getMyRewardSummary.initiate());
      await assert.rejects(req.unwrap());
      req.unsubscribe();
      cleanup(store);
    }
  } finally {
    globalThis.fetch = original;
  }
});
test("profile, connection and post queries provide the intended invalidation tags", async () => {
  const store = memberStore();
  await seedMember(store, memberId);
  for (const direction of ["followers", "following"])
    await store.dispatch(
      socialProfileApi.util.upsertQueryData(
        "getMemberConnections",
        { userId: memberId, direction, limit: 20, offset: 0 },
        connectionsDto,
      ),
    );
  const selected = socialProfileApi.util.selectInvalidatedBy(store.getState(), [
    "MemberProfile",
    "MemberFollowers",
    "MemberFollowing",
    "MemberPosts",
  ]);
  assert.equal(selected.length, 5);
  cleanup(store);
});
