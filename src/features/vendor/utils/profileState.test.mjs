import { memberStore } from "../../social/utils/member.test-fixtures.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { File } from "node:buffer";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import {
  profileFixture,
  profileGallery,
  profileReviews,
  profileCuisineOptions,
} from "../data/profile.data.ts";
import {
  vendorProfileSchema,
  vendorMenuItemSchema,
} from "../schemas/profile.schema.ts";
import {
  initialVendorProfileState,
  vendorProfileReducer,
  parseVendorProfileTab,
  nextProfileGalleryId,
  formatProfileTime,
  profileHoursSummary,
  formatMenuPrice,
  validateProfilePhoto,
} from "./profileState.ts";
import { VendorProfileSummary } from "../components/profile/VendorProfileSummary.tsx";
import { itemDto } from "./truckMenu.test-fixtures.mjs";
import { VendorProfileMenu } from "../components/profile/VendorProfileMenu.tsx";
import {
  VendorProfileGallery,
  VendorProfileReviews,
} from "../components/profile/VendorProfileContent.tsx";
import { VendorProfileEditor } from "../components/profile/VendorProfileEditor.tsx";
import { VendorMenuItemForm } from "../components/profile/VendorMenuItemDialog.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { navigationItems } from "../../../config/navigation/navigation.config.ts";
const noop = () => {};
const reduce = vendorProfileReducer;
const itemValues = (overrides = {}) => ({
  name: "Veggie taco",
  price: "4.99",
  description: "Fresh vegetables",
  ...overrides,
});

test("menu is the safe default tab; all three source profile views are addressable", () => {
  assert.equal(parseVendorProfileTab(null), "menu");
  assert.equal(parseVendorProfileTab("gallery"), "gallery");
  assert.equal(parseVendorProfileTab("reviews"), "reviews");
  for (const value of ["", "unknown", "ADMIN", "Gallery"])
    assert.equal(parseVendorProfileTab(value), "menu");
});
test("edit/back retains a separate unsaved draft, and save commits only the local profile", () => {
  let state = initialVendorProfileState();
  state = reduce(state, { type: "edit-profile", open: true });
  const draft = {
    ...state.draft,
    name: "Local Taco",
    location: "Market Street",
    cuisines: ["tacos", "vegan"],
  };
  state = reduce(state, { type: "profile-draft", values: draft });
  draft.cuisines.push("bbq");
  state = reduce(state, { type: "edit-profile", open: false });
  assert.equal(state.values.name, "Taco Paradise");
  assert.equal(state.draft.name, "Local Taco");
  assert.deepEqual(state.draft.cuisines, ["tacos", "vegan"]);
  state = reduce(state, { type: "edit-profile", open: true });
  state = reduce(state, { type: "save-profile", values: state.draft });
  assert.equal(state.editing, false);
  assert.equal(state.values.name, "Local Taco");
  assert.equal(state.values.location, "Market Street");
  assert.match(state.status, /account profile has not been changed/);
  assert.equal(initialVendorProfileState().values.name, "Taco Paradise");
});
test("profile photo selection validates, survives Back, and is committed only when profile saves", () => {
  let state = initialVendorProfileState();
  const original = state.photo;
  const image = new File(["demo"], "profile.png", { type: "image/png" });
  state = reduce(state, { type: "draft-photo", source: image });
  assert.equal(state.photo, original);
  assert.equal(state.draftPhoto, image);
  state = reduce(state, { type: "edit-profile", open: false });
  state = reduce(state, { type: "save-profile", values: state.draft });
  assert.equal(state.photo, image);
  const bad = new File(["svg"], "bad.svg", { type: "image/svg+xml" });
  assert.equal(reduce(state, { type: "draft-photo", source: bad }), state);
  assert.ok(
    validateProfilePhoto(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    ),
  );
  assert.ok(validateProfilePhoto(new File(["bad"], "bad.html", { type: "image/png" })));
});
test("profile validation handles required fields, 50-character name cap, cuisines, capacity and handle normalization", () => {
  const values = initialVendorProfileState().values;
  assert.equal(vendorProfileSchema.safeParse(values).success, true);
  assert.equal(
    vendorProfileSchema.parse({ ...values, handle: " @local.taco " }).handle,
    "local.taco",
  );
  for (const patch of [
    { name: " " },
    { name: "a".repeat(51) },
    { handle: "bad handle" },
    { location: " " },
    { capacity: "unknown" },
    { cuisines: ["unknown"] },
  ])
    assert.equal(vendorProfileSchema.safeParse({ ...values, ...patch }).success, false);
  assert.equal(
    vendorProfileSchema.safeParse({
      ...values,
      name: "a".repeat(50),
      cuisines: [],
      motto: "",
    }).success,
    true,
    "no invented cuisine or motto minimum",
  );
  const state = initialVendorProfileState();
  assert.equal(
    reduce(state, { type: "save-profile", values: { ...values, name: "" } }),
    state,
  );
});
test("enabled operating hours require valid times, closed days retain times, and overnight schedules remain possible", () => {
  const values = initialVendorProfileState().values;
  const hours = values.hours.map((h) => ({ ...h }));
  hours[0] = { ...hours[0], opens: "18:00", closes: "02:00" };
  assert.equal(vendorProfileSchema.safeParse({ ...values, hours }).success, true);
  hours[0].opens = "25:00";
  assert.equal(vendorProfileSchema.safeParse({ ...values, hours }).success, false);
  hours[0].enabled = false;
  assert.equal(vendorProfileSchema.safeParse({ ...values, hours }).success, true);
  assert.equal(
    vendorProfileSchema.safeParse({ ...values, hours: hours.slice(1) }).success,
    false,
  );
  const duplicated = values.hours.map((h) => ({ ...h, day: "Mon" }));
  assert.equal(
    vendorProfileSchema.safeParse({ ...values, hours: duplicated }).success,
    false,
  );
});
test("menu creation, editing and availability changes preserve the correct item and exact cents", () => {
  let state = initialVendorProfileState();
  assert.equal(
    state.menu.length,
    4,
    "count reflects supplied cards rather than inventing missing items",
  );
  assert.equal(state.menu[0].available, false);
  state = reduce(state, { type: "menu-dialog", dialog: "new" });
  state = reduce(state, { type: "save-menu", id: "veggie", values: itemValues() });
  assert.equal(state.menu.length, 5);
  assert.equal(state.menuDialog, null);
  assert.equal(state.menu.at(-1).priceCents, 499);
  assert.equal(state.menu.at(-1).available, true);
  assert.equal(
    reduce(state, { type: "save-menu", id: "veggie", values: itemValues() }),
    state,
    "duplicate save cannot replay after close",
  );
  state = reduce(state, { type: "toggle-menu", id: "veggie" });
  assert.equal(state.menu.at(-1).available, false);
  state = reduce(state, { type: "menu-dialog", dialog: { id: "veggie" } });
  assert.equal(
    reduce(state, { type: "save-menu", id: "baja-1", values: itemValues() }),
    state,
    "editing cannot target another ID",
  );
  state = reduce(state, {
    type: "save-menu",
    id: "veggie",
    values: itemValues({ name: "Updated taco", price: "6.25" }),
  });
  assert.equal(state.menu.at(-1).name, "Updated taco");
  assert.equal(state.menu.at(-1).priceCents, 625);
  assert.equal(state.menu.at(-1).available, false);
  assert.equal(state.menu[0].name, "Baja Fish Taco");
  assert.equal(initialVendorProfileState().menu.length, 4);
});
test("menu validation rejects blank names, invalid amounts and descriptions beyond the source limit", () => {
  for (const patch of [
    { name: " " },
    { price: "-1" },
    { price: "1.234" },
    { price: "NaN" },
    { price: "Infinity" },
    { price: "" },
    { price: "9007199254740992" },
    { description: "x".repeat(121) },
  ])
    assert.equal(vendorMenuItemSchema.safeParse(itemValues(patch)).success, false);
  assert.equal(
    vendorMenuItemSchema.safeParse(
      itemValues({ price: "0.00", description: "x".repeat(120) }),
    ).success,
    true,
  );
  const state = reduce(initialVendorProfileState(), {
    type: "menu-dialog",
    dialog: "new",
  });
  assert.equal(
    reduce(state, {
      type: "save-menu",
      id: "bad",
      values: itemValues({ price: "-1" }),
    }),
    state,
  );
  assert.equal(
    reduce(state, {
      type: "save-menu",
      id: "bad",
      values: itemValues(),
      photo: new File(["svg"], "bad.svg", { type: "image/svg+xml" }),
    }),
    state,
  );
});
test("cancel closes the item modal without changing fixtures; confirmed deletion reaches a working empty state", () => {
  let state = initialVendorProfileState();
  state = reduce(state, { type: "menu-dialog", dialog: "new" });
  state = reduce(state, { type: "menu-dialog", dialog: null });
  assert.equal(state.menu.length, 4);
  for (const item of [...state.menu])
    state = reduce(state, { type: "delete-menu", id: item.id });
  assert.equal(state.menu.length, 0);
  const html = renderToStaticMarkup(
    h(VendorProfileMenu, {
      items: [],
      onAdd: noop,
      onEdit: noop,
      onDelete: noop,
      onToggle: noop,
    }),
  );
  assert.match(html, /No menu items/);
  assert.match(html, /Add Item/);
  assert.equal(initialVendorProfileState().menu.length, 4);
});
test("unknown menu and gallery identifiers are safely ignored", () => {
  const state = initialVendorProfileState();
  for (const action of [
    { type: "menu-dialog", dialog: { id: "missing" } },
    { type: "delete-menu", id: "missing" },
    { type: "toggle-menu", id: "missing" },
    { type: "gallery", id: "missing" },
  ])
    assert.equal(reduce(state, action), state);
});
test("gallery opens supplied media only, retains selection, wraps navigation and closes cleanly", () => {
  const photos = profileGallery.filter((p) => p !== null);
  assert.equal(profileGallery.length, 9);
  assert.equal(photos.length, 5);
  let state = reduce(initialVendorProfileState(), {
    type: "gallery",
    id: photos[0].id,
  });
  assert.equal(state.galleryId, photos[0].id);
  assert.equal(nextProfileGalleryId(photos[0].id, -1), photos.at(-1).id);
  assert.equal(nextProfileGalleryId(photos.at(-1).id, 1), photos[0].id);
  assert.equal(nextProfileGalleryId("missing", 1), photos[0].id);
  state = reduce(state, { type: "gallery", id: null });
  assert.equal(state.galleryId, null);
  const store = memberStore("VENDOR");
  const html = renderToStaticMarkup(h(Provider, { store }, h(VendorProfileGallery)));
  assert.match(html, /Loading vendor identity/);
  assert.doesNotMatch(html, /gallery-placeholder/);
  store.dispatch(baseApi.util.resetApiState());
});
test("profile summary reproduces selected identity, stats and compact review state without changing account identity", () => {
  const state = initialVendorProfileState();
  const html = renderToStaticMarkup(
    h(VendorProfileSummary, {
      values: state.values,
      photo: state.photo,
      onEdit: noop,
      meta: { capacity: 125, followers: 12, rating: 4.85, verified: false },
    }),
  );
  for (const text of [
    "Taco Paradise",
    "Mexican Street Food",
    "Union Square, SF",
    "125 maximum guests",
    "12",
    "4.85",
    "Edit Profile",
  ])
    assert.ok(html.includes(text), text);
  const compact = renderToStaticMarkup(
    h(VendorProfileSummary, {
      values: state.values,
      photo: state.photo,
      compact: true,
      onEdit: noop,
      meta: { capacity: 125, followers: 12, rating: 4.85, verified: false },
    }),
  );
  assert.match(compact, /vendor-profile-summary--compact/);
  assert.equal(
    profileHoursSummary(state.values.hours.map((h) => ({ ...h, enabled: false }))),
    "Closed",
  );
  assert.equal(formatProfileTime("23:00"), "11:00 PM");
  assert.equal(formatProfileTime("00:15"), "12:15 AM");
  assert.equal(formatProfileTime("bad"), "Not available");
  assert.equal(formatMenuPrice(499), "$4.99");
  assert.equal(formatMenuPrice(0), "$0.00");
  assert.equal(formatMenuPrice(NaN), "Not available");
});
test("all menu controls, editor form fields, retained selections and original cuisine assets render server-free", () => {
  const state = initialVendorProfileState();
  const menu = renderToStaticMarkup(
    h(VendorProfileMenu, {
      items: state.menu.map((item, index) =>
        itemDto({
          id: `44444444-4444-4444-8444-44444444444${index}`,
          name: item.name,
          description: item.description,
          price: String(item.priceCents / 100),
          status: item.available ? "AVAILABLE" : "UNAVAILABLE",
        }),
      ),
      onAdd: noop,
      onEdit: noop,
      onDelete: noop,
      onToggle: noop,
    }),
  );
  assert.match(menu, /4 Items/);
  assert.match(menu, /Delete Baja Fish Taco/);
  assert.match(menu, /Edit Baja Fish Taco/);
  assert.equal((menu.match(/role="switch"/g) ?? []).length, 4);
  assert.equal((menu.match(/aria-checked="false"/g) ?? []).length, 1);
  const editor = renderToStaticMarkup(
    h(VendorProfileEditor, {
      draft: state.draft,
      photo: state.draftPhoto,
      onPhoto: noop,
      onDraft: noop,
      onBack: noop,
      onSave: noop,
    }),
  );
  for (const text of [
    "Edit Profile",
    "Basic Info",
    "Truck Name",
    "Handle",
    "Moto",
    "Location",
    "Operating Hours",
    "6 days open",
    "Guest Capacity",
    "Cuisine Types",
    "Change profile picture",
    'maxLength="255"',
  ]) {
    if (text === 'maxLength="255"')
      assert.match(editor, /maxLength="255"|maxlength="255"/);
    else assert.ok(editor.includes(text), text);
  }
  for (const cuisine of profileCuisineOptions)
    assert.ok(editor.includes(cuisine.label.replaceAll("&", "&amp;")), cuisine.label);
  assert.equal((editor.match(/role="switch"/g) ?? []).length, 7);
  assert.equal((editor.match(/type="time"/g) ?? []).length, 12);
});
test("add and edit menu forms expose price, photo selection, description limits and prefilled values", () => {
  const state = initialVendorProfileState();
  const add = renderToStaticMarkup(
    h(VendorMenuItemForm, { titleId: "menu-title", onClose: noop, onSave: noop }),
  );
  for (const text of [
    "Add Menu Item",
    "Photo",
    "Item name",
    "Price (major units; currency unavailable)",
    "Description",
    "Save item",
    "0 characters",
    "Permanent item deletion is unavailable",
  ])
    assert.ok(add.includes(text), text);
  const edit = renderToStaticMarkup(
    h(VendorMenuItemForm, {
      item: itemDto({
        name: state.menu[0].name,
        price: "4.99",
        description: state.menu[0].description,
      }),
      titleId: "menu-title",
      onClose: noop,
      onSave: noop,
    }),
  );
  assert.match(edit, /Edit Menu Item/);
  assert.match(edit, /value="Baja Fish Taco"/);
  assert.match(edit, /value="4.99"/);
});
test("review content waits for verified truck context instead of fixture rows", () => {
  const store = memberStore("VENDOR");
  const html = renderToStaticMarkup(h(Provider, { store }, h(VendorProfileReviews)));
  assert.match(html, /Loading truck identity/);
  assert.doesNotMatch(html, /Sarah Johnson/);
  assert.equal(profileReviews.length, 4);
  store.dispatch(baseApi.util.resetApiState());
});
function RouteTree() {
  return useRoutes(appRoutes);
}
function renderAt(role, query = "") {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-profile-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: "test-vendor",
        name: "Test Vendor",
        email: "test@example.invalid",
        roles: [role],
        role,
      }),
    );
  }
  return new Promise((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk;
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      h(
        Provider,
        { store },
        h(
          MemoryRouter,
          { initialEntries: [ROUTES.VENDOR_PROFILE + query] },
          h(RouteTree),
        ),
      ),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
test("profile retains authentication, Vendor role protection and existing UI", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_PROFILE);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    navigationItems.find((n) => n.path === ROUTES.VENDOR_PROFILE).allowedRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-profile-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/profile"/);
  assert.doesNotMatch(html, /Taco Paradise|Baja Fish Taco/);
  assert.match(html, /Loading/);
  assert.match(await renderAt("VENDOR", "?tab=gallery"), /Loading/);
  assert.match(await renderAt("VENDOR", "?tab=reviews"), /Loading/);
  assert.match(await renderAt("VENDOR", "?tab=unknown"), /Loading/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role, "?tab=gallery"), "");
  assert.equal(profileFixture.name, "Taco Paradise");
});
