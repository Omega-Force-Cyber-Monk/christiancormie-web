import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { truckMenuApi } from "../api/truckMenu.api.ts";
import {
  menuEditorSchema,
  setupMenuSchema,
  updateItemSchema,
} from "../schemas/truckMenu.schema.ts";
import { vendorTrucksSchema } from "../schemas/vendor.schema.ts";
import { menuItemBody, menuPrice } from "./truckMenu.ts";
import { ManagedVendorMenu } from "../components/profile/ManagedVendorMenu.tsx";
import { VendorMenuItemForm } from "../components/profile/VendorMenuItemDialog.tsx";
import {
  vendorTestStore,
  seedVendorHome,
  fullTruck,
  scope,
  json,
} from "./truckSettings.test-fixtures.mjs";
import {
  menuId,
  categoryId,
  itemId,
  itemDto,
  categoryDto,
  menuDto,
  itemBody,
  truckId,
} from "./truckMenu.test-fixtures.mjs";
import { sessionStarted } from "../../auth/store/auth.slice.ts";
const cleanup = (s) => s.dispatch(baseApi.util.resetApiState());
test("menu hierarchy read retains actual Decimal prices and validates truck/menu/category/item associations", () => {
  const d = vendorTrucksSchema.parse([fullTruck({ menus: [menuDto()] })]);
  assert.equal(d[0].menus[0].categories[0].items[0].price, "19.99");
  assert.equal(
    vendorTrucksSchema.safeParse([
      fullTruck({ menus: [menuDto({ foodTruckId: menuId })] }),
    ]).success,
    false,
  );
});
test("menu form sends exact major-unit price and dietary flags without cents or fake category constants", () => {
  const values = menuEditorSchema.parse({
    name: "Backend Item",
    description: "Long description".repeat(20),
    price: "19.99",
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: true,
    categoryId,
    menuName: "",
    categoryName: "",
  });
  assert.equal(menuItemBody(values).price, 19.99);
  assert.equal(menuItemBody({ ...values, price: "0" }).price, 0);
  assert.equal(menuPrice("19.99"), "19.99 (currency unavailable)");
  assert.equal(menuPrice("0"), "0.00 (currency unavailable)");
  assert.equal(menuPrice("9999999999.99"), "9,999,999,999.99 (currency unavailable)");
  for (const price of ["-1", "1.001", "10000000000.00", "1e3", "not-price"])
    assert.equal(menuEditorSchema.safeParse({ ...values, price }).success, false);
  assert.equal(updateItemSchema.safeParse({ isAvailable: false }).success, false);
  assert.equal(updateItemSchema.safeParse({ status: "SOLD_OUT" }).success, true);
});
test("basic menu setup creates one user-named menu with its required category and first item", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck({ menus: [] })] });
  const original = globalThis.fetch;
  const body = {
    name: "Actual Menu",
    categories: [{ name: "Actual Category", items: [itemBody] }],
  };
  globalThis.fetch = async (request) => {
    assert.equal(request.method, "POST");
    assert.equal(
      new URL(request.url).pathname,
      `/api/v1/food-trucks/${truckId}/menus/basic`,
    );
    assert.deepEqual(await request.json(), body);
    return json(menuDto());
  };
  try {
    assert.equal(
      (
        await s
          .dispatch(
            truckMenuApi.endpoints.setupTruckMenu.initiate({ scope, truckId, body }),
          )
          .unwrap()
      ).id,
      menuId,
    );
    assert.equal(
      setupMenuSchema.safeParse({ name: "Menu", categories: [] }).success,
      false,
    );
    assert.equal(
      setupMenuSchema.safeParse({
        name: "Menu",
        categories: [{ name: "Category", items: [] }],
      }).success,
      false,
    );
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("existing menu prevents second setup and wrong category/item IDs are rejected before HTTP", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck({ menus: [menuDto()] })] });
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("must not call");
  };
  try {
    assert.ok(
      (
        await s.dispatch(
          truckMenuApi.endpoints.setupTruckMenu.initiate({
            scope,
            truckId,
            body: {
              name: "Duplicate",
              categories: [{ name: "Category", items: [itemBody] }],
            },
          }),
        )
      ).error,
    );
    assert.ok(
      (
        await s.dispatch(
          truckMenuApi.endpoints.createTruckMenuItem.initiate({
            scope,
            truckId,
            categoryId: "fixture-category",
            body: itemBody,
          }),
        )
      ).error,
    );
    assert.ok(
      (
        await s.dispatch(
          truckMenuApi.endpoints.updateTruckMenuItem.initiate({
            scope,
            truckId,
            itemId: menuId,
            body: { status: "UNAVAILABLE" },
          }),
        )
      ).error,
    );
    assert.equal(calls, 0);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
for (const action of ["category", "item", "edit", "availability"])
  test(`${action} uses verified hierarchy UUIDs and only supported DTO fields`, async () => {
    const s = vendorTestStore();
    await seedVendorHome(s, { trucks: [fullTruck({ menus: [menuDto()] })] });
    const original = globalThis.fetch;
    const endpoint =
      action === "category"
        ? "createTruckMenuCategory"
        : action === "item"
          ? "createTruckMenuItem"
          : "updateTruckMenuItem";
    const body =
      action === "category"
        ? { name: "New Category" }
        : action === "availability"
          ? { status: "UNAVAILABLE" }
          : itemBody;
    globalThis.fetch = async (request) => {
      const expected =
        action === "category"
          ? `/api/v1/food-trucks/${truckId}/menus/${menuId}/categories`
          : action === "item"
            ? `/api/v1/food-trucks/${truckId}/menu-categories/${categoryId}/items`
            : `/api/v1/food-trucks/${truckId}/menu-items/${itemId}`;
      assert.equal(new URL(request.url).pathname, expected);
      assert.equal(
        request.method,
        action === "category" || action === "item" ? "POST" : "PATCH",
      );
      assert.deepEqual(await request.json(), body);
      return json(
        action === "category"
          ? categoryDto()
          : itemDto(action === "availability" ? { status: "UNAVAILABLE" } : {}),
      );
    };
    try {
      const r = await s
        .dispatch(
          truckMenuApi.endpoints[endpoint].initiate({
            scope,
            truckId,
            menuId,
            categoryId,
            itemId,
            body,
          }),
        )
        .unwrap();
      assert.equal(r.id, action === "category" ? categoryId : itemId);
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
for (const status of [400, 403, 404, 409, 500, "network"])
  test(`menu ${status} failure does not remove or fake a saved item`, async () => {
    const s = vendorTestStore();
    await seedVendorHome(s, { trucks: [fullTruck({ menus: [menuDto()] })] });
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
            truckMenuApi.endpoints.updateTruckMenuItem.initiate({
              scope,
              truckId,
              itemId,
              body: itemBody,
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
test("duplicate item operations and replacement sessions cannot corrupt menu state", async () => {
  const s = vendorTestStore();
  await seedVendorHome(s, { trucks: [fullTruck({ menus: [menuDto()] })] });
  const original = globalThis.fetch;
  let release;
  globalThis.fetch = async () => {
    await new Promise((r) => {
      release = r;
    });
    return json(itemDto());
  };
  const arg = { scope, truckId, itemId, body: itemBody };
  const first = s.dispatch(truckMenuApi.endpoints.updateTruckMenuItem.initiate(arg));
  try {
    for (let i = 0; i < 100 && !release; i++) await new Promise((r) => setImmediate(r));
    assert.ok(release);
    assert.ok(
      (await s.dispatch(truckMenuApi.endpoints.updateTruckMenuItem.initiate(arg)))
        .error,
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
test("managed menu preserves real rows, explicit unavailable deletion, dietary fields and no fixture menu IDs", async () => {
  const s = vendorTestStore();
  const truck = fullTruck({ menus: [menuDto()] });
  await seedVendorHome(s, { trucks: [truck] });
  try {
    const html = renderToStaticMarkup(
      h(
        Provider,
        { store: s },
        h(MemoryRouter, null, h(ManagedVendorMenu, { truck, scope })),
      ),
    );
    assert.match(html, /Backend Menu Item/);
    assert.match(html, /19.99 \(currency unavailable\)/);
    assert.match(html, /Delete Backend Menu Item \(unavailable\)/);
    assert.match(html, /Refresh menu hierarchy/);
    assert.doesNotMatch(html, /Baja Fish Taco|\$19.99/);
    const form = renderToStaticMarkup(
      h(VendorMenuItemForm, {
        titleId: "item",
        item: itemDto(),
        categories: [categoryDto()],
        onClose() {},
        onSave() {},
      }),
    );
    assert.match(form, /value="19.99"/);
    assert.match(form, /Vegetarian/);
    assert.match(form, /no cents conversion/);
    assert.match(form, /Permanent item deletion is unavailable/);
    assert.doesNotMatch(form, /maxLength="120"|Price \(USD\)/);
  } finally {
    cleanup(s);
  }
});
