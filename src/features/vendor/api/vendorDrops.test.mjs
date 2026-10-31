import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import {
  vendorTestStore,
  seedVendorHome,
  ownerId,
  profileDto,
  truckId,
  truckDto,
  json,
} from "../utils/vendor.test-fixtures.mjs";
import { baseApi } from "../../../services/api/baseApi.ts";
import { vendorApi } from "./vendor.api.ts";
import { vendorDropsApi, promotionManagementArg } from "./vendorDrops.api.ts";
import { discoveryApi } from "../../customer/api/discovery.api.ts";
import {
  durationMinutes,
  parseDropCoordinates,
  promotionInputSchema,
  dropInputSchema,
  managedPromotionsSchema,
} from "../schemas/dropsIntegration.schema.ts";
import { requestDropLocation } from "../utils/dropLocation.ts";
import { DropsMap } from "../components/drops/DropsMap.tsx";
import {
  VendorDropsWorkspace,
  ServerDropDetails,
  PromotionRows,
} from "../components/drops/VendorDropsWorkspace.tsx";
import {
  clearSession,
  identityVerified,
  sessionRestored,
} from "../../auth/store/auth.slice.ts";
const scope = {
  sessionId: "vendor-integration-test",
  userId: ownerId,
  role: "VENDOR",
  truckId,
};
const promoId = "11111111-1111-4111-8111-111111111111";
const foreignId = "22222222-2222-4222-8222-222222222222";
const loc = {
  latitude: 30.2672,
  longitude: -97.7431,
  address: "Actual selected address",
};
const input = {
  ...loc,
  durationMinutes: 120,
  title: "Actual Drop",
  message: "Actual Drop message",
};
const location = () => ({
  id: truckId,
  currentAddress: loc.address,
  latitude: loc.latitude,
  longitude: loc.longitude,
  locationUpdatedAt: "2026-10-29T12:00:00Z",
  locationValidUntil: "2026-10-29T14:00:00Z",
  operatingStatus: "CLOSED",
});
const drop = (o = {}) => ({
  id: promoId,
  foodTruckId: truckId,
  title: "Actual Drop",
  message: "Actual Drop message",
  address: loc.address,
  latitude: loc.latitude,
  longitude: loc.longitude,
  startsAt: "2026-10-29T12:00:00Z",
  endsAt: "2026-10-29T14:00:00Z",
  status: "ACTIVE",
  createdAt: "2026-10-29T12:00:00Z",
  ...o,
});
const promoInput = {
  title: "Actual promotion",
  description: "Actual description",
  type: "PERCENTAGE",
  value: 15,
  startsAt: "2026-10-29T00:00:00Z",
  endsAt: "2026-11-10T00:00:00Z",
  couponCode: "ACTUAL15",
  minimumSpend: 20,
  maximumDiscount: 10,
  isFollowerOnly: true,
  usageLimit: 15,
  isActive: false,
};
const promo = (o = {}) => ({
  id: promoId,
  foodTruckId: truckId,
  ...promoInput,
  value: "15.00",
  minimumSpend: "20.00",
  maximumDiscount: "10.00",
  ...o,
});
const ep = (name) => vendorDropsApi.endpoints[name];
async function seed(store) {
  await seedVendorHome(store);
  await store.dispatch(
    discoveryApi.util.upsertQueryData(
      "getTruckPromotions",
      promotionManagementArg(scope),
      [promo()],
    ),
  );
}
async function mocked(
  run,
  handler = () => {
    throw new Error("Unexpected HTTP");
  },
) {
  const store = vendorTestStore();
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await seed(store);
    await run(store);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
test("management reuses promotion GET with activeOnly=false and preserves inactive fields", async () => {
  await mocked(
    async (store) => {
      const r = await store
        .dispatch(
          discoveryApi.endpoints.getTruckPromotions.initiate(
            promotionManagementArg(scope),
            { forceRefetch: true },
          ),
        )
        .unwrap();
      const rows = managedPromotionsSchema.parse(r);
      assert.equal(rows[0].isActive, false);
      assert.equal(rows[0].couponCode, "ACTUAL15");
    },
    async (r) => {
      assert.equal(r.method, "GET");
      assert.equal(
        new globalThis.URL(r.url).pathname,
        `/api/v1/promotions/food-trucks/${truckId}`,
      );
      assert.deepEqual(Object.fromEntries(new globalThis.URL(r.url).searchParams), {
        activeOnly: "false",
        limit: "100",
      });
      return json([promo()]);
    },
  );
});
for (const status of [400, 403, 404, 409, 500])
  test(`management read ${status} is an error, never an empty promotion list`, async () => {
    await mocked(
      async (store) => {
        await assert.rejects(
          store
            .dispatch(
              discoveryApi.endpoints.getTruckPromotions.initiate(
                promotionManagementArg(scope),
                { forceRefetch: true },
              ),
            )
            .unwrap(),
          (e) => e.status === status,
        );
      },
      async () => json({ message: "Unavailable" }, status),
    );
  });
for (const [name, arg, path, method, body, response] of [
  [
    "setTruckOperatingStatus",
    { ...scope, confirmed: true, operatingStatus: "BUSY" },
    `/food-trucks/${truckId}/operating-status`,
    "PATCH",
    { operatingStatus: "BUSY" },
    truckDto({ operatingStatus: "BUSY" }),
  ],
  [
    "updateTruckLocation",
    { ...scope, confirmed: true, body: { ...loc, validForMinutes: 120 } },
    `/food-trucks/${truckId}/location`,
    "PATCH",
    { ...loc, validForMinutes: 120 },
    location(),
  ],
  [
    "createTruckPromotion",
    { ...scope, confirmed: true, body: promoInput },
    "/promotions",
    "POST",
    { ...promoInput, foodTruckId: truckId },
    promo(),
  ],
  [
    "updateTruckPromotion",
    {
      ...scope,
      promotionId: promoId,
      confirmed: true,
      body: { title: "Updated title", isActive: true },
    },
    `/promotions/${promoId}`,
    "PATCH",
    { title: "Updated title", isActive: true },
    promo({ title: "Updated title", isActive: true }),
  ],
]) {
  test(`${name}: exact body/path/bearer and server-confirmed response`, async () => {
    await mocked(
      async (store) => {
        const r = await store.dispatch(ep(name).initiate(arg)).unwrap();
        assert.equal(r.id, response.id);
      },
      async (r) => {
        if (r.method === "GET") return json([truckDto()]);
        assert.equal(r.method, method);
        assert.equal(new globalThis.URL(r.url).pathname, `/api/v1${path}`);
        assert.deepEqual(await r.json(), body);
        assert.equal(r.headers.get("authorization"), "Bearer test-access");
        return json(response, method === "POST" ? 201 : 200);
      },
    );
  });
  for (const status of [400, 403, 404, 409, 500])
    test(`${name}: ${status} does not create client success`, async () => {
      await mocked(
        async (store) => {
          await assert.rejects(
            store.dispatch(ep(name).initiate(arg)).unwrap(),
            (e) => e.status === status,
          );
        },
        async (r) =>
          r.method === "GET"
            ? json([truckDto()])
            : json({ message: "Operation unavailable" }, status),
      );
    });
}
test("Go Live sequences real location, operating status, Drop then truck reconciliation", async () => {
  const paths = [];
  await mocked(
    async (store) => {
      const r = await store
        .dispatch(
          ep("goLiveTruck").initiate({ ...scope, confirmed: true, body: input }),
        )
        .unwrap();
      assert.equal(r.id, promoId);
      assert.equal(r.status, "ACTIVE");
      assert.deepEqual(paths, [
        "PATCH location",
        "PATCH operating-status",
        "POST drops",
        "GET mine",
      ]);
    },
    async (r) => {
      const segment = new globalThis.URL(r.url).pathname.split("/").at(-1);
      paths.push(`${r.method} ${segment}`);
      if (segment === "location") {
        assert.deepEqual(await r.json(), { ...loc, validForMinutes: 120 });
        return json(location());
      }
      if (segment === "operating-status") {
        assert.deepEqual(await r.json(), { operatingStatus: "OPEN" });
        return json(truckDto({ operatingStatus: "OPEN" }));
      }
      if (segment === "drops") {
        assert.deepEqual(await r.json(), input);
        return json(drop(), 201);
      }
      return json([truckDto({ operatingStatus: "OPEN" })]);
    },
  );
});
for (const failing of ["location", "operating-status", "drops"])
  test(`Go Live failure at ${failing} never confirms the whole flow; earlier writes are reconciled`, async () => {
    const writes = [];
    await mocked(
      async (store) => {
        await assert.rejects(
          store
            .dispatch(
              ep("goLiveTruck").initiate({ ...scope, confirmed: true, body: input }),
            )
            .unwrap(),
        );
        assert.equal(ep("goLiveTruck").select()(store.getState()).data, undefined);
        if (failing === "location") assert.deepEqual(writes, ["location"]);
        if (failing === "operating-status")
          assert.deepEqual(writes, ["location", "operating-status"]);
      },
      async (r) => {
        if (r.method === "GET") return json([truckDto()]);
        const stage = new globalThis.URL(r.url).pathname.split("/").at(-1);
        writes.push(stage);
        if (stage === failing) return json({ message: "Failed" }, 500);
        return json(
          stage === "location"
            ? location()
            : stage === "drops"
              ? drop()
              : truckDto({ operatingStatus: "OPEN" }),
        );
      },
    );
  });
test("uncertain final Drop POST blocks another POST, even after refreshed truck reads", async () => {
  let posts = 0;
  await mocked(
    async (store) => {
      await assert.rejects(
        store
          .dispatch(
            ep("goLiveTruck").initiate({ ...scope, confirmed: true, body: input }),
          )
          .unwrap(),
      );
      await seed(store);
      await assert.rejects(
        store
          .dispatch(
            ep("goLiveTruck").initiate({ ...scope, confirmed: true, body: input }),
          )
          .unwrap(),
      );
      assert.equal(posts, 1);
    },
    async (r) => {
      const p = new globalThis.URL(r.url).pathname;
      if (r.method === "GET") return json([truckDto()]);
      if (p.endsWith("/drops")) {
        posts++;
        throw new TypeError("response lost");
      }
      return json(
        p.endsWith("/location") ? location() : truckDto({ operatingStatus: "OPEN" }),
      );
    },
  );
});
test("uncertain promotion creation blocks blind resubmission of that draft", async () => {
  let posts = 0;
  await mocked(
    async (store) => {
      await assert.rejects(
        store
          .dispatch(
            ep("createTruckPromotion").initiate({
              ...scope,
              confirmed: true,
              body: promoInput,
            }),
          )
          .unwrap(),
      );
      await seed(store);
      await assert.rejects(
        store
          .dispatch(
            ep("createTruckPromotion").initiate({
              ...scope,
              confirmed: true,
              body: promoInput,
            }),
          )
          .unwrap(),
      );
      assert.equal(posts, 1);
    },
    async (r) => {
      if (r.method === "GET") return json([truckDto()]);
      posts++;
      throw new TypeError("offline");
    },
  );
});
test("duration and coordinates reject blank/default placeholders and respect inclusive boundaries", () => {
  for (const [h, m, expected] of [
    [0, 1, 1],
    [0, 59, 59],
    [1, 0, 60],
    [23, 59, 1439],
    [24, 0, 1440],
    [24, 1, null],
    [0, 0, null],
    [1, 60, null],
    [-1, 0, null],
    [0.5, 0, null],
  ])
    assert.equal(durationMinutes(h, m), expected);
  assert.equal(parseDropCoordinates("", ""), null);
  assert.equal(parseDropCoordinates(" ", "1"), null);
  assert.equal(parseDropCoordinates("91", "0"), null);
  assert.equal(parseDropCoordinates("0", "181"), null);
  assert.deepEqual(parseDropCoordinates("0", "0"), { latitude: 0, longitude: 0 });
  assert.deepEqual(parseDropCoordinates("-90", "180"), {
    latitude: -90,
    longitude: 180,
  });
  for (const body of [
    { ...input, durationMinutes: 0 },
    { ...input, durationMinutes: 1441 },
    { ...input, latitude: NaN },
    { ...input, promoIds: [promoId] },
  ])
    assert.equal(dropInputSchema.safeParse(body).success, false);
});
test("location acquisition is explicit and validates permission, timeout, unavailable and malformed responses", async () => {
  await assert.rejects(requestDropLocation(undefined), /unavailable/);
  for (const [code, label] of [
    [1, /permission was denied/],
    [2, /unavailable/],
    [3, /timed out/],
  ])
    await assert.rejects(
      requestDropLocation({
        getCurrentPosition(_ok, fail) {
          fail({ code });
        },
      }),
      label,
    );
  await assert.rejects(
    requestDropLocation({
      getCurrentPosition(ok) {
        ok({ coords: { latitude: 100, longitude: 0, accuracy: 5 } });
      },
    }),
    /invalid/,
  );
  const r = await requestDropLocation({
    getCurrentPosition(ok, _fail, options) {
      assert.equal(options.maximumAge, 0);
      ok({ coords: { ...loc, accuracy: 8 } });
    },
  });
  assert.equal(r.latitude, loc.latitude);
  assert.equal(r.accuracy, 8);
});
test("promotion DTO supports real fields/type/date rules without invented duration or Drop attachment", () => {
  for (const type of ["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM", "CUSTOM"])
    assert.equal(promotionInputSchema.safeParse({ ...promoInput, type }).success, true);
  for (const change of [
    { type: "FLASH" },
    { value: 101 },
    { value: -1 },
    { usageLimit: 0 },
    { usageLimit: 1.5 },
    { startsAt: "2026-12-01T00:00:00Z" },
    { endsAt: "bad" },
    { couponCode: "x".repeat(101) },
    { title: "x".repeat(256) },
    { durationMinutes: 60 },
  ])
    assert.equal(
      promotionInputSchema.safeParse({ ...promoInput, ...change }).success,
      false,
    );
});
for (const active of [true, false])
  test(`promotion isActive=${active} is a confirmed update, not deletion`, async () => {
    await mocked(
      async (store) => {
        const r = await store
          .dispatch(
            ep("updateTruckPromotion").initiate({
              ...scope,
              promotionId: promoId,
              confirmed: true,
              body: { isActive: active },
            }),
          )
          .unwrap();
        assert.equal(r.isActive, active);
      },
      async (r) => {
        if (r.method === "GET") return json([truckDto()]);
        assert.equal(r.method, "PATCH");
        assert.deepEqual(await r.json(), { isActive: active });
        return json(promo({ isActive: active }));
      },
    );
  });
test("foreign promotion, invalid IDs, dates and truck/session mismatches never write", async () => {
  await mocked(async (store) => {
    for (const arg of [
      { ...scope, truckId: foreignId },
      { ...scope, truckId: "fixture" },
      { ...scope, sessionId: "old" },
      { ...scope, role: "VENDOR_STAFF" },
    ])
      await assert.rejects(
        store
          .dispatch(
            ep("updateTruckLocation").initiate({ ...arg, confirmed: true, body: loc }),
          )
          .unwrap(),
      );
    for (const arg of [
      { promotionId: foreignId, body: { isActive: true } },
      { promotionId: promoId, body: { endsAt: "2020-01-01T00:00:00Z" } },
      { promotionId: promoId, body: { value: 101 } },
    ])
      await assert.rejects(
        store
          .dispatch(
            ep("updateTruckPromotion").initiate({ ...scope, confirmed: true, ...arg }),
          )
          .unwrap(),
      );
    await assert.rejects(
      store
        .dispatch(
          ep("goLiveTruck").initiate({ ...scope, confirmed: false, body: input }),
        )
        .unwrap(),
    );
  });
});
test("staff with an owner role in their account still cannot mutate or read management promotions", async () => {
  await mocked(async (store) => {
    store.dispatch(
      identityVerified({
        id: ownerId,
        name: "Staff",
        email: "staff@example.invalid",
        roles: ["VENDOR", "VENDOR_STAFF"],
        role: "VENDOR_STAFF",
      }),
    );
    await seed(store);
    const staff = { ...scope, role: "VENDOR_STAFF" };
    await assert.rejects(
      store
        .dispatch(
          ep("goLiveTruck").initiate({ ...staff, confirmed: true, body: input }),
        )
        .unwrap(),
    );
    await assert.rejects(
      store
        .dispatch(
          discoveryApi.endpoints.getTruckPromotions.initiate(
            promotionManagementArg(staff),
            { forceRefetch: true },
          ),
        )
        .unwrap(),
    );
  });
});
test("concurrent status/location/Drop mutations share one truck flight", async () => {
  let release;
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  let writes = 0;
  await mocked(
    async (store) => {
      const first = store.dispatch(
        ep("updateTruckLocation").initiate({ ...scope, confirmed: true, body: loc }),
      );
      await ready;
      await assert.rejects(
        store
          .dispatch(
            ep("goLiveTruck").initiate({ ...scope, confirmed: true, body: input }),
          )
          .unwrap(),
      );
      release(json(location()));
      await first.unwrap();
      assert.equal(writes, 1);
    },
    (r) => {
      if (r.method === "GET") return Promise.resolve(json([truckDto()]));
      writes++;
      started();
      return new Promise((r) => {
        release = r;
      });
    },
  );
});
test("promotion writes refresh subscribed management, trucks and analytics caches", async () => {
  let enabled = false;
  const reads = [];
  await mocked(
    async (store) => {
      const requests = [
        store.dispatch(vendorApi.endpoints.getVendorMe.initiate()),
        store.dispatch(vendorApi.endpoints.getMyTrucks.initiate()),
        store.dispatch(
          discoveryApi.endpoints.getTruckPromotions.initiate(
            promotionManagementArg(scope),
          ),
        ),
      ];
      await Promise.all(requests);
      await store
        .dispatch(
          ep("updateTruckPromotion").initiate({
            ...scope,
            promotionId: promoId,
            confirmed: true,
            body: { isActive: true },
          }),
        )
        .unwrap();
      await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
      const list = discoveryApi.endpoints.getTruckPromotions.select(
        promotionManagementArg(scope),
      )(store.getState());
      assert.equal(list.error, undefined);
      assert.equal(list.data[0].isActive, true);
      assert.equal(
        vendorApi.endpoints.getVendorAnalytics.select()(store.getState()).data,
        undefined,
      );
      assert.ok(reads.some((p) => p.endsWith("/mine")));
      assert.ok(reads.some((p) => p.includes("/promotions/")));
      requests.forEach((r) => r.unsubscribe());
    },
    async (r) => {
      const p = new globalThis.URL(r.url).pathname;
      if (r.method === "PATCH") {
        enabled = true;
        return json(promo({ isActive: true }));
      }
      reads.push(p);
      return json(
        p.endsWith("/vendors/me")
          ? profileDto()
          : p.endsWith("/mine")
            ? [truckDto()]
            : [promo({ isActive: enabled })],
      );
    },
  );
});
test("foreign/malformed acknowledgments never confirm location, Drop or promotion success", async () => {
  for (const [name, arg, response] of [
    [
      "updateTruckLocation",
      { ...scope, confirmed: true, body: loc },
      { ...location(), id: foreignId },
    ],
    [
      "createTruckPromotion",
      { ...scope, confirmed: true, body: promoInput },
      promo({ foodTruckId: foreignId }),
    ],
    [
      "updateTruckPromotion",
      { ...scope, confirmed: true, promotionId: promoId, body: { isActive: true } },
      promo({ isActive: false }),
    ],
  ])
    await mocked(
      async (store) => {
        await assert.rejects(store.dispatch(ep(name).initiate(arg)).unwrap());
      },
      async (r) => (r.method === "GET" ? json([truckDto()]) : json(response)),
    );
});
for (const action of [
  clearSession("expired"),
  sessionRestored({
    sessionId: "new",
    accessToken: "new",
    refreshToken: "new",
    user: null,
  }),
])
  test(`late location response discarded after ${action.type}`, async () => {
    let release;
    let started;
    const ready = new Promise((r) => {
      started = r;
    });
    await mocked(
      async (store) => {
        const req = store.dispatch(
          ep("updateTruckLocation").initiate({ ...scope, confirmed: true, body: loc }),
        );
        await ready;
        store.dispatch(action);
        release(json(location()));
        await req;
        assert.equal(Object.keys(store.getState().api.queries).length, 0);
        assert.equal(Object.keys(store.getState().api.mutations).length, 0);
      },
      () => {
        started();
        return new Promise((r) => {
          release = r;
        });
      },
    );
  });
test("actual promotion/Drop UI never renders fake maps, deletion/stop or attachment success", () => {
  const html = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(DropsMap, {
        live: { truckName: "Actual Food Truck", status: "BUSY", address: loc.address },
      }),
      React.createElement(ServerDropDetails, { drop: drop() }),
      React.createElement(PromotionRows, {
        rows: [promo()],
        disabled: false,
        onEdit() {},
        onToggle() {},
      }),
    ),
  );
  for (const s of [
    "Actual promotion",
    promoId,
    "ACTIVE",
    "15.00%",
    "Enabled: No",
    "ACTUAL15",
    "Promotion delete unavailable",
    "not a current Drop-history feed",
  ])
    assert.ok(html.includes(s), s);
  assert.ok(!html.includes("Sample map"));
  assert.ok(!html.includes("San Francisco"));
  assert.ok(!html.includes("broadcast successfully"));
});
test("workspace renders backend status/promotions and unavailable stop control, with no synthetic live state", async () => {
  await mocked(async (store) => {
    const html = renderToStaticMarkup(
      React.createElement(
        Provider,
        { store },
        React.createElement(VendorDropsWorkspace, { scope, truck: truckDto() }),
      ),
    );
    for (const s of [
      "CLOSED",
      "Actual promotion",
      "Use my device location",
      "Latitude",
      "Longitude",
      "Go Live Now",
      "Stop / delete Drop unavailable",
    ])
      assert.ok(html.includes(s), s);
    assert.ok(!html.includes("Live preview"));
    assert.ok(!html.includes("Last confirmed Drop"));
  });
});
