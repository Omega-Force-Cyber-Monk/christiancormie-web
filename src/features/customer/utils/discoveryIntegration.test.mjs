import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate, setTimeout } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { discoveryApi } from "../api/discovery.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { clearSession, sessionStarted } from "../../auth/store/auth.slice.ts";
import {
  discoveryListSchema,
  truckProfileSchema,
  reviewsSchema,
  promotionsSchema,
} from "../schemas/discovery.schema.ts";
import {
  discoveryQuery,
  toDiscoveryCard,
  validCoordinates,
  safeImage,
} from "./discoveryAdapters.ts";
import CustomerDiscoverPage from "../pages/CustomerDiscoverPage.tsx";
import { DiscoverProfileView } from "../components/discover/DiscoverProfileView.tsx";
import { ProfileSummary } from "../components/profile/ProfileSummary.tsx";
import { ProfileTabs } from "../components/profile/ProfileTabs.tsx";
import { ProfileReviews } from "../components/profile/ProfileReviews.tsx";
import { TruckSocialActions } from "../components/discover/TruckSocialActions.tsx";
import {
  truckId,
  cuisineId,
  reviewId,
  cuisineDto,
  discoveryDto,
  profileDto,
  reviewsDto,
  promotionDto,
  favoritesDto,
  customerTestStore,
  json,
} from "./discovery.test-fixtures.mjs";
const noop = () => {};
const render = (store, component, props = {}) =>
  renderToStaticMarkup(
    h(Provider, { store }, h(MemoryRouter, null, h(component, props))),
  );
const cleanup = (store) => store.dispatch(baseApi.util.resetApiState());
for (const [endpoint, arg, path, body] of [
  [
    "getTrendingTrucks",
    { search: "fish", cuisineId, minRating: 4, limit: 20 },
    "/discovery/trending",
    discoveryDto(),
  ],
  [
    "getNearbyTrucks",
    { latitude: 0, longitude: 0, radiusKm: 10, limit: 20 },
    "/discovery/nearby",
    discoveryDto(),
  ],
  ["getDiscoveryCuisines", undefined, "/food-trucks/cuisines", [cuisineDto]],
  [
    "getTruckProfile",
    "actual-seafood",
    "/food-trucks/profile/actual-seafood",
    profileDto(),
  ],
  [
    "getTruckReviews",
    { slug: "actual-seafood", cursor: reviewId },
    "/food-trucks/profile/actual-seafood/reviews",
    reviewsDto,
  ],
  ["getTruckPromotions", truckId, `/promotions/food-trucks/${truckId}`, [promotionDto]],
  ["getDiscoveryFavorites", undefined, "/social/favorites", favoritesDto],
])
  test(`${endpoint}: exact backend envelope, path, query and credentials`, async () => {
    const store = customerTestStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      const url = new URL(request.url);
      assert.equal(url.pathname, `/api/v1${path}`);
      assert.equal(request.method, "GET");
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      if (arg && typeof arg === "object")
        for (const [key, value] of Object.entries(arg))
          if (key !== "slug") assert.equal(url.searchParams.get(key), String(value));
      if (endpoint === "getTruckPromotions")
        assert.equal(url.searchParams.get("activeOnly"), "true");
      return json(body);
    };
    const request = store.dispatch(discoveryApi.endpoints[endpoint].initiate(arg));
    try {
      assert.ok(await request.unwrap());
    } finally {
      request.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("request adapter uses server keys and preserves zero coordinates without guessed location", () => {
  assert.equal(validCoordinates(null), false);
  assert.equal(validCoordinates({ latitude: 0, longitude: 0 }), true);
  assert.equal(validCoordinates({ latitude: 91, longitude: 0 }), false);
  assert.equal(validCoordinates({ latitude: NaN, longitude: 0 }), false);
  assert.deepEqual(
    discoveryQuery(
      " fish ",
      { cuisines: [cuisineId], distance: 3, minimumRating: 4 },
      20,
    ),
    { search: "fish", cuisineId, minRating: 4, limit: 20 },
  );
  assert.deepEqual(
    discoveryQuery("", { cuisines: [], distance: null, minimumRating: null }, 100),
    { limit: 100 },
  );
});
test("nullable rating and km conversion stay distinct from zero, IDs stay separate", () => {
  const card = toDiscoveryCard(discoveryListSchema.parse(discoveryDto()).foodTrucks[0]);
  assert.equal(card.id, truckId);
  assert.equal(card.slug, "actual-seafood");
  assert.equal(card.distance, 1);
  assert.equal(card.rating, null);
  assert.equal(card.stars, null);
  assert.equal(card.online, false);
  const zero = toDiscoveryCard(
    discoveryDto({ rating: 0, distanceKm: 0 }).foodTrucks[0],
  );
  assert.equal(zero.rating, 0);
  assert.equal(zero.distance, 0);
  assert.equal(
    toDiscoveryCard(discoveryDto({ distanceKm: null }).foodTrucks[0]).distance,
    null,
  );
});
test("selected schemas retain real menus/gallery/Decimal values and strip unreviewed fields", () => {
  const dto = truckProfileSchema.parse({
    ...profileDto(),
    secret: "private",
    vendor: { isVerified: false, passwordHash: "private" },
  });
  assert.equal(dto.menus[0].categories[0].items[0].price, "18.90");
  assert.equal(dto.images[0].id, reviewId);
  assert.equal(dto.secret, undefined);
  assert.equal(dto.vendor.passwordHash, undefined);
  assert.equal(reviewsSchema.parse(reviewsDto).items[0].vendorResponse, "Thank you");
  assert.equal(promotionsSchema.parse([promotionDto])[0].value, "15.00");
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "https://user:secret@example.invalid/a",
    "/not-a-provider",
  ])
    assert.equal(safeImage(url), "");
});
for (const kind of ["favorite", "follow"])
  for (const enabled of [true, false])
    test(`${kind} ${enabled}: UUID mutation and confirmed state only`, async () => {
      const store = customerTestStore();
      const original = globalThis.fetch;
      globalThis.fetch = async (request) => {
        assert.equal(
          new URL(request.url).pathname,
          `/api/v1/social/food-trucks/${truckId}/${kind}`,
        );
        assert.equal(request.method, enabled ? "POST" : "DELETE");
        assert.equal(await request.text(), "");
        return json(
          enabled
            ? { id: reviewId, foodTruckId: truckId }
            : { [kind === "follow" ? "unfollowed" : "unfavorited"]: false },
        );
      };
      const request = store.dispatch(
        discoveryApi.endpoints.setTruckRelationship.initiate({
          foodTruckId: truckId,
          kind,
          enabled,
        }),
      );
      try {
        assert.deepEqual(await request.unwrap(), {
          foodTruckId: truckId,
          kind,
          enabled,
        });
      } finally {
        request.reset();
        cleanup(store);
        globalThis.fetch = original;
      }
    });
for (const args of [{ verified: false }, { role: "VENDOR" }, { role: null }])
  test(`unverified or inactive customer role cannot mutate: ${JSON.stringify(args)}`, async () => {
    const store = customerTestStore(args);
    const original = globalThis.fetch;
    globalThis.fetch = async () => assert.fail("unauthorized HTTP");
    const request = store.dispatch(
      discoveryApi.endpoints.setTruckRelationship.initiate({
        foodTruckId: truckId,
        kind: "favorite",
        enabled: true,
      }),
    );
    try {
      await assert.rejects(request.unwrap(), (e) => e.status === 403);
    } finally {
      request.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("slug cannot be submitted as mutation UUID; missing/invalid coordinates do not call HTTP", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => assert.fail("invalid identity/location HTTP");
  try {
    for (const [endpoint, arg] of [
      [
        "setTruckRelationship",
        { foodTruckId: "actual-seafood", kind: "follow", enabled: true },
      ],
      ["getNearbyTrucks", { latitude: 999, longitude: 0, limit: 20, radiusKm: 10 }],
      ["getTruckPromotions", "actual-seafood"],
    ]) {
      const req = store.dispatch(discoveryApi.endpoints[endpoint].initiate(arg));
      await assert.rejects(req.unwrap());
    }
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
for (const status of [403, 404, 500, "network"])
  test(`failed action ${status} has no success or invalidation`, async () => {
    const store = customerTestStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      if (status === "network") throw new TypeError("offline");
      return json({ message: "request failed" }, status);
    };
    const request = store.dispatch(
      discoveryApi.endpoints.setTruckRelationship.initiate(
        { foodTruckId: truckId, kind: "favorite", enabled: true },
        { fixedCacheKey: "failed" },
      ),
    );
    try {
      await assert.rejects(request.unwrap());
      assert.equal(
        discoveryApi.endpoints.setTruckRelationship.select("failed")(store.getState())
          .data,
        undefined,
      );
    } finally {
      request.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("concurrent opposite actions share a per-store lock without duplicate HTTP", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  let resolve;
  let count = 0;
  globalThis.fetch = () => {
    count++;
    return new Promise((r) => {
      resolve = r;
    });
  };
  const first = store.dispatch(
    discoveryApi.endpoints.setTruckRelationship.initiate({
      foodTruckId: truckId,
      kind: "follow",
      enabled: true,
    }),
  );
  try {
    await new Promise((r) => setImmediate(r));
    const second = store.dispatch(
      discoveryApi.endpoints.setTruckRelationship.initiate({
        foodTruckId: truckId,
        kind: "follow",
        enabled: false,
      }),
    );
    await assert.rejects(second.unwrap(), (e) => e.status === "CUSTOM_ERROR");
    assert.equal(count, 1);
    resolve(json({ id: reviewId, foodTruckId: truckId }));
    await first.unwrap();
    second.reset();
  } finally {
    first.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("new session during pending social response cannot confirm old state", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  let resolve;
  globalThis.fetch = () =>
    new Promise((r) => {
      resolve = r;
    });
  const request = store.dispatch(
    discoveryApi.endpoints.setTruckRelationship.initiate({
      foodTruckId: truckId,
      kind: "favorite",
      enabled: true,
    }),
  );
  try {
    await new Promise((r) => setImmediate(r));
    store.dispatch(
      sessionStarted({
        accessToken: "replacement",
        refreshToken: "replacement-refresh",
      }),
    );
    resolve(json({ id: reviewId, foodTruckId: truckId }));
    await assert.rejects(
      request.unwrap(),
      (e) => e.status === "CUSTOM_ERROR" || e.name === "AbortError",
    );
    await new Promise((r) => setImmediate(r));
    assert.equal(Object.keys(store.getState().api.mutations).length, 0);
  } finally {
    request.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("successful mutation invalidates discovery, profile, favorites and follow tags", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  let lists = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).pathname.endsWith("/trending")) {
      lists++;
      return json(discoveryDto());
    }
    return json({ id: reviewId, foodTruckId: truckId });
  };
  const query = store.dispatch(
    discoveryApi.endpoints.getTrendingTrucks.initiate({ limit: 20 }),
  );
  try {
    await query.unwrap();
    const mutation = store.dispatch(
      discoveryApi.endpoints.setTruckRelationship.initiate({
        foodTruckId: truckId,
        kind: "follow",
        enabled: true,
      }),
    );
    await mutation.unwrap();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(lists, 2);
    assert.equal(
      discoveryApi.util.selectInvalidatedBy(store.getState(), ["Discovery"]).length,
      1,
    );
    mutation.reset();
  } finally {
    query.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("discovery initial loading, missing location and real empty state have no demo controls/pins", async () => {
  const store = customerTestStore();
  let html = render(store, CustomerDiscoverPage);
  assert.match(html, /Loading food trucks/);
  assert.match(html, /Share location/);
  assert.match(html, /Use my location/);
  assert.doesNotMatch(
    html,
    /San Francisco|Local preview controls|Suggested For You|truck-pin/,
  );
  await store.dispatch(
    discoveryApi.util.upsertQueryData(
      "getTrendingTrucks",
      { limit: 20 },
      { meta: { count: 0 }, foodTrucks: [] },
    ),
  );
  await store.dispatch(
    discoveryApi.util.upsertQueryData("getDiscoveryFavorites", undefined, {
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      items: [],
    }),
  );
  html = render(store, CustomerDiscoverPage);
  assert.match(html, /No trending trucks found/);
  assert.match(html, /No saved or followed trucks/);
  cleanup(store);
});
test("combined favorites never fabricates saved state or follow state", async () => {
  const store = customerTestStore();
  await store.dispatch(
    discoveryApi.util.upsertQueryData("getDiscoveryFavorites", undefined, favoritesDto),
  );
  const html = render(store, CustomerDiscoverPage);
  assert.match(html, /Saved or followed trucks/);
  assert.match(html, /current saved state unavailable/);
  assert.doesNotMatch(html, /aria-pressed="true"/);
  assert.match(
    render(store, TruckSocialActions, { foodTruckId: truckId, kind: "follow" }),
    /Current state unavailable/,
  );
  cleanup(store);
});
test("profile summary, gallery, menu and reviews retain original presentation with real content", () => {
  const store = customerTestStore();
  const profile = truckProfileSchema.parse(profileDto());
  const summary = render(store, ProfileSummary, {
    profile,
    onPreview: noop,
    onReviews: noop,
  });
  assert.match(summary, /Actual Seafood/);
  assert.match(summary, /Up to 0 guests/);
  assert.doesNotMatch(summary, /Credit Accepted|Taco Paradise|Sample/);
  for (const active of ["menu", "gallery", "reviews"]) {
    const html = render(store, ProfileTabs, {
      profile,
      active,
      onChange: noop,
      onImage: noop,
      reviews: h(ProfileReviews, { reviews: reviewsDto.items }),
    });
    assert.match(html, /Actual fish plate/);
    assert.match(html, /18.90 \(currency unavailable\)/);
    assert.match(html, /Fresh catch/);
    assert.match(html, /Real review content/);
    assert.match(html, /SOLD_OUT/);
  }
  cleanup(store);
});
test("profile initial loading and populated promotion/review states are backend-driven", async () => {
  const store = customerTestStore();
  assert.match(
    render(store, DiscoverProfileView, { slug: "actual-seafood", onBack: noop }),
    /Loading truck profile/,
  );
  for (const [endpoint, arg, data] of [
    ["getTruckProfile", "actual-seafood", truckProfileSchema.parse(profileDto())],
    ["getTruckReviews", { slug: "actual-seafood", cursor: undefined }, reviewsDto],
    ["getTruckPromotions", truckId, [promotionDto]],
  ])
    await store.dispatch(discoveryApi.util.upsertQueryData(endpoint, arg, data));
  const html = render(store, DiscoverProfileView, {
    slug: "actual-seafood",
    onBack: noop,
  });
  assert.match(html, /Lunch offer/);
  assert.match(html, /Followers only/);
  assert.match(html, /15.00%/);
  assert.match(html, /Real review content/);
  assert.doesNotMatch(html, /20% off|sample profile/);
  cleanup(store);
});
for (const status of [404, 403, 503, "network"])
  test(`query ${status} retains failure and supports explicit retry`, async () => {
    const store = customerTestStore();
    const original = globalThis.fetch;
    let fail = true;
    globalThis.fetch = async () => {
      if (fail) {
        if (status === "network") throw new TypeError("offline");
        return json({ message: "unavailable" }, status);
      }
      return json(profileDto());
    };
    const request = store.dispatch(
      discoveryApi.endpoints.getTruckProfile.initiate("actual-seafood"),
    );
    try {
      await assert.rejects(request.unwrap());
      assert.match(
        render(store, DiscoverProfileView, { slug: "actual-seafood", onBack: noop }),
        /Profile unavailable/,
      );
      fail = false;
      await request.refetch().unwrap();
      assert.match(
        render(store, DiscoverProfileView, { slug: "actual-seafood", onBack: noop }),
        /Actual Seafood/,
      );
    } finally {
      request.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("malformed discovery envelope is an error rather than mock/empty data", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ data: discoveryDto() });
  const request = store.dispatch(
    discoveryApi.endpoints.getTrendingTrucks.initiate({ limit: 20 }),
  );
  try {
    await assert.rejects(request.unwrap(), (e) => e.status === "CUSTOM_ERROR");
  } finally {
    request.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("logout removes all customer queries and confirmed relationship cache", async () => {
  const store = customerTestStore();
  await store.dispatch(
    discoveryApi.util.upsertQueryData(
      "getTruckProfile",
      "actual-seafood",
      truckProfileSchema.parse(profileDto()),
    ),
  );
  store.dispatch(clearSession("storage"));
  assert.equal(Object.keys(store.getState().api.queries).length, 0);
  assert.equal(Object.keys(store.getState().api.mutations).length, 0);
});

test("confirmed favorite/follow state is shared by all matching views and resets on logout", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json({ id: reviewId, foodTruckId: truckId });
  try {
    for (const kind of ["favorite", "follow"]) {
      const key = `customer-test:${truckId}:${kind}`;
      const req = store.dispatch(
        discoveryApi.endpoints.setTruckRelationship.initiate(
          { foodTruckId: truckId, kind, enabled: true },
          { fixedCacheKey: key },
        ),
      );
      await req.unwrap();
      assert.match(
        render(store, TruckSocialActions, { foodTruckId: truckId, kind }),
        /aria-pressed="true"/,
      );
      if (kind === "favorite")
        assert.match(
          render(store, TruckSocialActions, {
            foodTruckId: truckId,
            kind,
            compact: true,
          }),
          /Unsave truck/,
        );
    }
    store.dispatch(clearSession("storage"));
    assert.equal(Object.keys(store.getState().api.mutations).length, 0);
    assert.match(
      render(store, TruckSocialActions, { foodTruckId: truckId, kind: "follow" }),
      /Verified customer session required/,
    );
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("empty reviews, menus, gallery and promotions are explicit instead of demo fallback", async () => {
  const store = customerTestStore();
  for (const [endpoint, arg, data] of [
    [
      "getTruckProfile",
      "actual-seafood",
      truckProfileSchema.parse(profileDto({ images: [], menus: [] })),
    ],
    [
      "getTruckReviews",
      { slug: "actual-seafood" },
      {
        items: [],
        nextCursor: null,
        summary: { averageRating: null, totalReviews: 0 },
      },
    ],
    ["getTruckPromotions", truckId, []],
  ])
    await store.dispatch(discoveryApi.util.upsertQueryData(endpoint, arg, data));
  const html = render(store, DiscoverProfileView, {
    slug: "actual-seafood",
    onBack: noop,
  });
  for (const text of [
    "No reviews yet",
    "No menu items available",
    "No gallery images available",
    "No available promotions",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Baja|sample gallery|20% off/);
  cleanup(store);
});
test("failed mutation does not refetch or invalidate an unrelated confirmed discovery response", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  let reads = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).pathname.endsWith("/trending")) {
      reads++;
      return json(discoveryDto());
    }
    return json({ message: "Forbidden" }, 403);
  };
  const req = store.dispatch(
    discoveryApi.endpoints.getTrendingTrucks.initiate({ limit: 20 }),
  );
  try {
    await req.unwrap();
    const action = store.dispatch(
      discoveryApi.endpoints.setTruckRelationship.initiate({
        foodTruckId: truckId,
        kind: "favorite",
        enabled: true,
      }),
    );
    await assert.rejects(action.unwrap());
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(reads, 1);
    assert.equal(
      discoveryApi.endpoints.getTrendingTrucks.select({ limit: 20 })(store.getState())
        .data.foodTrucks[0].id,
      truckId,
    );
    action.reset();
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("public discovery still uses the established single refresh and retry path", async () => {
  const store = customerTestStore();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    const path = new URL(request.url).pathname;
    calls.push(path);
    if (path.endsWith("/refresh")) {
      assert.deepEqual(await request.json(), { refreshToken: "test-refresh" });
      return json({ accessToken: "new-access", refreshToken: "new-refresh" });
    }
    if (calls.length === 1) return json({ message: "Unauthorized" }, 401);
    assert.equal(request.headers.get("authorization"), "Bearer new-access");
    return json(discoveryDto());
  };
  const req = store.dispatch(
    discoveryApi.endpoints.getTrendingTrucks.initiate({ limit: 20 }),
  );
  try {
    await req.unwrap();
    assert.deepEqual(calls, [
      "/api/v1/discovery/trending",
      "/api/v1/auth/refresh",
      "/api/v1/discovery/trending",
    ]);
    assert.equal(store.getState().auth.user.role, "CUSTOMER");
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});

test("absence from the complete combined list reliably establishes unsaved and unfollowed", async () => {
  const store = customerTestStore();
  await store.dispatch(
    discoveryApi.util.upsertQueryData("getDiscoveryFavorites", undefined, {
      totalCount: 0,
      openCount: 0,
      closedCount: 0,
      items: [],
    }),
  );
  for (const kind of ["favorite", "follow"]) {
    const html = render(store, TruckSocialActions, { foodTruckId: truckId, kind });
    assert.match(html, /aria-pressed="false"/);
    assert.doesNotMatch(html, /Current state unavailable/);
  }
  cleanup(store);
});
