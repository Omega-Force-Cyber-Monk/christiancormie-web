import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { File } from "node:buffer";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { truckAssetsApi } from "../api/truckAssets.api.ts";
import { galleryImageBodySchema } from "../schemas/truckAssets.schema.ts";
import { persistTruckAsset } from "./persistTruckAsset.ts";
import { ManagedTruckGallery } from "../components/profile/ManagedTruckGallery.tsx";
import {
  vendorTestStore,
  seedVendorHome,
  fullTruck,
  truckId,
  cuisineId,
  scope,
  json,
} from "./truckSettings.test-fixtures.mjs";
import { sessionStarted } from "../../auth/store/auth.slice.ts";
const asset = {
  url: "https://example.invalid/upload.png",
  publicId: "remote-public-id",
  width: 100,
  height: 100,
  format: "png",
  resourceType: "image",
  originalFilename: "image.png",
};
const image = {
  id: cuisineId,
  foodTruckId: truckId,
  imageUrl: asset.url,
  altText: "Actual image",
  sortOrder: 0,
};
const cleanup = (s) => s.dispatch(baseApi.util.resetApiState());
const file = () => new File(["actual-image-bytes"], "image.png", { type: "image/png" });
test("vendor upload uses actual multipart file endpoint and provider response", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck()] });
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).pathname, "/api/v1/vendors/me/onboarding/upload");
    assert.equal(request.method, "POST");
    const f = await request.formData();
    assert.deepEqual([...f.keys()], ["file"]);
    assert.equal(f.get("file").name, "image.png");
    assert.equal(await f.get("file").text(), "actual-image-bytes");
    return json(asset);
  };
  try {
    assert.deepEqual(
      await s
        .dispatch(
          truckAssetsApi.endpoints.uploadTruckAsset.initiate({
            scope,
            truckId,
            file: file(),
          }),
        )
        .unwrap(),
      asset,
    );
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("gallery add requires remote URL and exact metadata; uploaded file alone is not a gallery record", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck()] });
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    calls.push(request.method);
    assert.equal(
      new URL(request.url).pathname,
      `/api/v1/food-trucks/${truckId}/images`,
    );
    assert.deepEqual(await request.json(), {
      imageUrl: asset.url,
      altText: "Actual image",
      sortOrder: 0,
    });
    return json(image);
  };
  try {
    assert.equal(
      (
        await s
          .dispatch(
            truckAssetsApi.endpoints.addTruckImage.initiate({
              scope,
              truckId,
              body: { imageUrl: asset.url, altText: "Actual image", sortOrder: 0 },
            }),
          )
          .unwrap()
      ).id,
      cuisineId,
    );
    assert.deepEqual(calls, ["POST"]);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
  for (const body of [
    { imageUrl: "blob:local" },
    { imageUrl: "javascript:bad" },
    { imageUrl: asset.url, category: "TRUCK" },
    { imageUrl: asset.url, sortOrder: -1 },
  ])
    assert.equal(galleryImageBodySchema.safeParse(body).success, false);
});
for (const kind of ["updateTruckImage", "deleteTruckImage"])
  test(`${kind} uses owned image UUID and validates returned association`, async () => {
    const s = vendorTestStore();
    await seedVendorHome(s, { trucks: [fullTruck({ images: [image] })] });
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      assert.equal(
        new URL(request.url).pathname,
        `/api/v1/food-trucks/${truckId}/images/${cuisineId}`,
      );
      assert.equal(request.method, kind === "updateTruckImage" ? "PATCH" : "DELETE");
      if (kind === "updateTruckImage")
        assert.deepEqual(await request.json(), { altText: "Updated", sortOrder: 2 });
      return json({
        ...image,
        ...(kind === "updateTruckImage" ? { altText: "Updated", sortOrder: 2 } : {}),
      });
    };
    try {
      const r = await s
        .dispatch(
          truckAssetsApi.endpoints[kind].initiate({
            scope,
            truckId,
            imageId: cuisineId,
            ...(kind === "updateTruckImage"
              ? { body: { altText: "Updated", sortOrder: 2 } }
              : {}),
          }),
        )
        .unwrap();
      assert.equal(r.id, cuisineId);
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("confirmed upload is reused when metadata save fails and is explicitly retried", async () => {
  let uploads = 0;
  let persisted = 0;
  let remembered;
  let allow = false;
  const options = {
    upload: async () => {
      uploads++;
      return asset;
    },
    remember: (r) => {
      remembered = r;
    },
    persist: async (r) => {
      assert.equal(r.url, asset.url);
      persisted++;
      if (!allow) throw Error("metadata failed");
      return image;
    },
    isCurrent: () => true,
  };
  await assert.rejects(persistTruckAsset(options), /metadata failed/);
  assert.equal(remembered, asset);
  assert.equal(uploads, 1);
  assert.equal(persisted, 1);
  allow = true;
  assert.equal(
    (await persistTruckAsset({ ...options, uploaded: remembered })).id,
    cuisineId,
  );
  assert.equal(uploads, 1);
  assert.equal(persisted, 2);
});
test("session change after upload prevents metadata writes and does not expose the new account to old uploads", async () => {
  let writes = 0;
  await assert.rejects(
    persistTruckAsset({
      upload: async () => asset,
      remember: () => {
        throw Error("must not remember");
      },
      persist: async () => {
        writes++;
      },
      isCurrent: () => false,
    }),
    /session changed/,
  );
  assert.equal(writes, 0);
});
for (const status of [400, 403, 404, 409, 500, "network"])
  test(`gallery ${status} mutation error is recoverable and keeps cached records`, async () => {
    const s = vendorTestStore();
    await seedVendorHome(s, { trucks: [fullTruck({ images: [image] })] });
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (status === "network") throw Error("offline");
      return json({}, status);
    };
    try {
      assert.ok(
        (
          await s.dispatch(
            truckAssetsApi.endpoints.deleteTruckImage.initiate({
              scope,
              truckId,
              imageId: cuisineId,
            }),
          )
        ).error,
      );
      assert.equal(calls, 1);
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("duplicate image operations are locked and delayed responses cannot populate a new session", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck({ images: [image] })] });
  const original = globalThis.fetch;
  let release;
  globalThis.fetch = async () => {
    await new Promise((r) => {
      release = r;
    });
    return json(image);
  };
  const arg = { scope, truckId, imageId: cuisineId };
  const first = s.dispatch(truckAssetsApi.endpoints.deleteTruckImage.initiate(arg));
  try {
    for (let i = 0; i < 100 && !release; i++) await new Promise((r) => setImmediate(r));
    assert.ok(release);
    assert.ok(
      (await s.dispatch(truckAssetsApi.endpoints.deleteTruckImage.initiate(arg))).error,
    );
    s.dispatch(sessionStarted({ accessToken: "new", refreshToken: "new-refresh" }));
    release();
    await first;
    assert.deepEqual(s.getState().api.queries, {});
  } finally {
    release?.();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("gallery renders only actual persisted records, safe URLs and explicit empty state", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck({ images: [image] })] });
  const render = (truck) =>
    renderToStaticMarkup(
      h(
        Provider,
        { store: s },
        h(MemoryRouter, null, h(ManagedTruckGallery, { truck, scope })),
      ),
    );
  try {
    const html = render(fullTruck({ images: [image] }));
    assert.match(html, /Actual image/);
    assert.match(html, /Add image/);
    assert.match(html, /Edit metadata/);
    assert.match(html, /Delete image/);
    assert.doesNotMatch(html, /profile-2-pasta|blob:/);
    assert.match(render(fullTruck({ images: [] })), /No truck images/);
  } finally {
    cleanup(s);
  }
});
