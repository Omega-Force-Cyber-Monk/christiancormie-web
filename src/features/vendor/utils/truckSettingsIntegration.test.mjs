import test from "node:test";
import assert from "node:assert/strict";
import { URL } from "node:url";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { truckSettingsApi, ownedTruck } from "../api/truckSettings.api.ts";
import { truckSettingsPatchSchema } from "../schemas/truckSettings.schema.ts";
import { truckForm, truckProfilePatch, serverClock } from "./truckSettings.ts";
import {
  vendorTestStore,
  seedVendorHome,
  fullTruck,
  profileDto,
  ownerId,
  truckId,
  cuisineId,
  scope,
  json,
} from "./truckSettings.test-fixtures.mjs";
import VendorProfilePage from "../pages/VendorProfilePage.tsx";
import { sessionStarted } from "../../auth/store/auth.slice.ts";
const cleanup = (s) => s.dispatch(baseApi.util.resetApiState());
test("Prisma TIME dates map back to DTO HH:mm without local timezone conversion", () => {
  assert.equal(serverClock("1970-01-01T23:45:00.000Z"), "23:45");
  assert.equal(serverClock("00:00"), "00:00");
  assert.equal(serverClock(null), "");
  assert.equal(serverClock("not-a-time"), "");
  const t = fullTruck();
  const form = truckForm(t);
  const edited = {
    ...form,
    hours: form.hours.map((h) =>
      h.day === "Sun" ? { ...h, enabled: true, opens: "08:00", closes: "12:00" } : h,
    ),
  };
  assert.equal(truckProfilePatch(t, edited).operatingHours[0].openingTime, "10:00");
});
test("profile draft baseline preserves concurrently refreshed untouched name, location and hours", () => {
  const original = fullTruck();
  const baseline = truckForm(original);
  const fresh = fullTruck({
    name: "Changed elsewhere",
    currentAddress: "Updated address",
    operatingHours: [
      { dayOfWeek: 1, isClosed: false, openingTime: "11:00", closingTime: "19:00" },
    ],
  });
  const draft = { ...baseline, motto: "Edited description" };
  assert.deepEqual(truckProfilePatch(fresh, draft, baseline), {
    description: "Edited description",
  });
  const withSunday = {
    ...draft,
    hours: draft.hours.map((h) =>
      h.day === "Sun" ? { ...h, enabled: true, opens: "09:00", closes: "17:00" } : h,
    ),
  };
  assert.deepEqual(truckProfilePatch(fresh, withSunday, baseline).operatingHours[0], {
    dayOfWeek: 1,
    isClosed: false,
    openingTime: "11:00",
    closingTime: "19:00",
  });
});
test("truck form preserves actual values and maps Monday/Sunday to backend numeric day enums without fabricating missing hours", () => {
  const t = fullTruck();
  const form = truckForm(t);
  assert.equal(form.name, t.name);
  assert.equal(form.handle, t.handle);
  assert.equal(form.cuisines[0], cuisineId);
  assert.equal(form.hours[0].opens, "10:00");
  assert.equal(form.hours[6].opens, "");
  assert.deepEqual(truckProfilePatch(t, { ...form, name: "Changed Name" }), {
    name: "Changed Name",
  });
  const edited = {
    ...form,
    hours: form.hours.map((h) =>
      h.day === "Sun" ? { ...h, enabled: true, opens: "09:00", closes: "16:00" } : h,
    ),
  };
  assert.deepEqual(truckProfilePatch(t, edited).operatingHours, [
    { dayOfWeek: 1, isClosed: false, openingTime: "10:00", closingTime: "18:00" },
    { dayOfWeek: 0, isClosed: false, openingTime: "09:00", closingTime: "16:00" },
  ]);
  assert.throws(
    () => truckProfilePatch(t, { ...form, capacity: "101-200" }),
    /approved numeric/,
  );
  assert.throws(
    () => truckProfilePatch(t, { ...form, location: "New address" }),
    /coordinates/,
  );
});
test("strict profile DTO rejects ranges, guessed location, malformed cuisines and duplicate/open-invalid hours", () => {
  for (const body of [
    { maximumGuestCapacity: 200 },
    { serviceArea: { centerAddress: "City" } },
    { cuisines: [{ cuisineId: "tacos", isPrimary: true }] },
    { cuisines: [] },
    { operatingHours: [{ dayOfWeek: 1, isClosed: false }] },
    { operatingHours: [{ dayOfWeek: 7, isClosed: true }] },
    {
      operatingHours: [
        { dayOfWeek: 1, isClosed: true },
        { dayOfWeek: 1, isClosed: true },
      ],
    },
  ])
    assert.equal(truckSettingsPatchSchema.safeParse(body).success, false);
});
test("cuisine catalogue GET and owned profile PATCH preserve real UUIDs and exact fields", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck()] });
  const original = globalThis.fetch;
  const paths = [];
  globalThis.fetch = async (request) => {
    const p = new URL(request.url).pathname;
    paths.push(p);
    if (request.method === "PATCH") {
      assert.equal(p, `/api/v1/food-trucks/${truckId}/profile-settings`);
      assert.deepEqual(await request.json(), {
        name: "Saved Truck",
        cuisines: [{ cuisineId, isPrimary: true }],
      });
      return json(fullTruck({ name: "Saved Truck" }));
    }
    return json([{ id: cuisineId, name: "Actual Cuisine", slug: "actual-cuisine" }]);
  };
  const catalog = s.dispatch(
    truckSettingsApi.endpoints.getTruckCuisines.initiate(scope),
  );
  try {
    await catalog.unwrap();
    assert.equal(ownedTruck(s.getState(), scope, truckId).id, truckId);
    assert.equal(
      (
        await s
          .dispatch(
            truckSettingsApi.endpoints.saveTruckProfile.initiate({
              scope,
              truckId,
              body: { name: "Saved Truck", cuisines: [{ cuisineId, isPrimary: true }] },
            }),
          )
          .unwrap()
      ).name,
      "Saved Truck",
    );
    assert.deepEqual(paths, [
      "/api/v1/food-trucks/cuisines",
      `/api/v1/food-trucks/${truckId}/profile-settings`,
    ]);
  } finally {
    catalog.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("ownership, active role, dashboardAccess and account status gate profile mutations before HTTP", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("no");
  };
  try {
    for (const overrides of [
      { profile: profileDto({ userId: "different-user" }) },
      {
        profile: profileDto({ dashboardAccess: { allowed: false, status: "BLOCKED" } }),
      },
      { profile: profileDto({ user: { status: "SUSPENDED" } }) },
      { trucks: [] },
    ]) {
      const s = vendorTestStore();
      await seedVendorHome(s, overrides);
      assert.ok(
        (
          await s.dispatch(
            truckSettingsApi.endpoints.saveTruckProfile.initiate({
              scope,
              truckId,
              body: { name: "Do not save" },
            }),
          )
        ).error,
      );
      cleanup(s);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
for (const status of [400, 403, 404, 409, 500, "network"])
  test(`profile settings ${status} failure remains recoverable`, async () => {
    const s = vendorTestStore();
    await seedVendorHome(s, { trucks: [fullTruck()] });
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      if (status === "network") throw Error("offline");
      return json({ message: "Error" }, status);
    };
    try {
      assert.ok(
        (
          await s.dispatch(
            truckSettingsApi.endpoints.saveTruckProfile.initiate({
              scope,
              truckId,
              body: { description: "Keep draft" },
            }),
          )
        ).error,
      );
      assert.equal(s.getState().auth.user.id, ownerId);
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("pending truck save prevents duplicate writes and a replacement session cannot accept its response", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck()] });
  const original = globalThis.fetch;
  let release;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    await new Promise((r) => {
      release = r;
    });
    return json(fullTruck());
  };
  const arg = { scope, truckId, body: { description: "Save" } };
  const first = s.dispatch(truckSettingsApi.endpoints.saveTruckProfile.initiate(arg));
  try {
    while (!release) await new Promise((r) => setImmediate(r));
    assert.ok(
      (await s.dispatch(truckSettingsApi.endpoints.saveTruckProfile.initiate(arg)))
        .error,
    );
    assert.equal(calls, 1);
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
test("vendor page renders real singleton identity and blocks arbitrary selection for multiple trucks", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck()] });
  const render = () =>
    renderToStaticMarkup(
      h(Provider, { store: s }, h(MemoryRouter, null, h(VendorProfilePage))),
    );
  try {
    const html = render();
    assert.match(html, /Actual Food Truck/);
    assert.match(html, /125 maximum guests/);
    assert.doesNotMatch(html, /Taco Paradise|1,240|#12|20% off|Credit Accepted/);
    await seedVendorHome(s, { trucks: [fullTruck(), fullTruck({ id: cuisineId })] });
    assert.match(render(), /Choose the owned food truck/);
  } finally {
    cleanup(s);
  }
});
