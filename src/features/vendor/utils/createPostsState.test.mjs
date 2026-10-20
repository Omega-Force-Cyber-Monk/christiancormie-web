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
  getVendorPostCategory,
  vendorPostCategories,
  truckMenuOptions,
} from "../data/create-posts.data.ts";
import {
  generalPostSchema,
  truckPostSchema,
  emptyTruckPost,
  isRealEventDate,
  parsePostBudget,
} from "../schemas/create-posts.schema.ts";
import {
  appendPostFiles,
  postFilesError,
  initialVendorCreatePostState,
  vendorCreatePostReducer,
} from "./createPostsState.ts";
import { VendorPostCategoryPicker } from "../components/create-posts/VendorPostCategoryPicker.tsx";
import { VendorCommunityPostForm } from "../components/create-posts/VendorCommunityPostForm.tsx";
import { VendorTruckRequestForm } from "../components/create-posts/VendorTruckRequestForm.tsx";
import { VendorPostReview } from "../components/create-posts/VendorPostReview.tsx";
import { VendorPostAttachments } from "../components/create-posts/VendorPostAttachments.tsx";
import { FileDropzone } from "../../../components/forms/FileUpload/FileDropzone.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { navigationItems } from "../../../config/navigation/navigation.config.ts";

const noop = () => {};
const general = (category = "community") => ({
  category,
  title: category === "sale" ? "Grill" : "",
  description: "Local event details",
});
const truck = () => ({
  eventType: "Birthday Party",
  date: "2025-07-18",
  time: "11:00",
  location: "Golden Gate Park",
  guests: "50",
  budget: "$500-800",
  description: "Vegetarian options please.",
  menus: ["Tacos", "Vegetarian"],
});
const attachment = (file, id = "file") => ({ id, file });
const image = () => new File(["sample"], "photo.jpg", { type: "image/jpeg" });
const pdf = () => new File(["sample"], "flyer.pdf", { type: "application/pdf" });
const reduce = vendorCreatePostReducer;

test("all six category cards are distinct; unknown category URLs safely resolve to the picker", () => {
  assert.equal(vendorPostCategories.length, 6);
  assert.equal(new Set(vendorPostCategories.map((c) => c.id)).size, 6);
  for (const category of vendorPostCategories)
    assert.equal(getVendorPostCategory(category.id), category);
  assert.equal(getVendorPostCategory("unknown"), undefined);
  assert.equal(getVendorPostCategory(null), undefined);
  const html = renderToStaticMarkup(h(VendorPostCategoryPicker, { onSelect: noop }));
  for (const category of vendorPostCategories)
    assert.ok(html.includes(category.title.replaceAll("&", "&amp;")), category.title);
  assert.equal((html.match(/<button /g) ?? []).length, 6);
});
for (const category of ["callout", "sale", "jobs", "help", "community"])
  test(`${category} form validates and retains its category-specific draft`, () => {
    const values = general(category);
    assert.equal(generalPostSchema.safeParse(values).success, true);
    assert.equal(
      generalPostSchema.safeParse({ ...values, description: " \n " }).success,
      false,
    );
    const html = renderToStaticMarkup(
      h(VendorCommunityPostForm, {
        category,
        heading: getVendorPostCategory(category).heading,
        draft: values,
        files: [],
        onDraft: noop,
        onBack: noop,
        onFiles: noop,
        onSubmit: noop,
      }),
    );
    for (const text of [
      "Local event details",
      "Tap to upload",
      "JPG, PNG, or PDF",
      "Post to community",
      "Nothing is published",
      "retain draft",
    ])
      assert.ok(html.includes(text), text);
    if (category === "sale") {
      assert.match(html, /Item name/);
      assert.match(html, /value="Grill"/);
    } else assert.doesNotMatch(html, /Item name/);
  });
test("sale requires an item name; other categories do not invent a title requirement", () => {
  assert.equal(
    generalPostSchema.safeParse({ ...general("sale"), title: " " }).success,
    false,
  );
  for (const category of ["community", "help", "jobs", "callout"])
    assert.equal(generalPostSchema.safeParse(general(category)).success, true);
  assert.equal(
    generalPostSchema.safeParse({ ...general(), category: "CUSTOMER" }).success,
    false,
  );
});
test("truck fields, exact dates, valid times, guest integers and known menu preferences validate", () => {
  assert.equal(truckPostSchema.safeParse(emptyTruckPost()).success, false);
  assert.equal(
    truckPostSchema.safeParse(truck()).success,
    true,
    "historical source dates are not subject to an invented future-date rule",
  );
  for (const [field, value] of [
    ["eventType", ""],
    ["date", "2025-02-29"],
    ["date", "2026-04-31"],
    ["time", "24:00"],
    ["time", "10:60"],
    ["location", " "],
    ["guests", "0"],
    ["guests", "-1"],
    ["guests", "2.5"],
    ["guests", "Infinity"],
    ["guests", "9007199254740992"],
    ["description", " "],
  ])
    assert.equal(
      truckPostSchema.safeParse({ ...truck(), [field]: value }).success,
      false,
      `${field}=${value}`,
    );
  assert.equal(isRealEventDate("2024-02-29"), true);
  assert.equal(isRealEventDate("bad-date"), false);
  assert.equal(
    truckPostSchema.safeParse({ ...truck(), menus: [] }).success,
    true,
    "preferences are optional",
  );
  assert.equal(
    truckPostSchema.safeParse({ ...truck(), menus: ["unknown"] }).success,
    false,
  );
});
test("budget parsing keeps cents and validates ranges without invented pricing policies", () => {
  assert.deepEqual(parsePostBudget("$500-800"), { low: 50000, high: 80000 });
  assert.deepEqual(parsePostBudget(" $1,200.10 - $2,500.25 "), {
    low: 120010,
    high: 250025,
  });
  assert.deepEqual(parsePostBudget("0"), { low: 0, high: 0 });
  assert.deepEqual(parsePostBudget("12.34"), { low: 1234, high: 1234 });
  for (const value of [
    "",
    "800-500",
    "-1",
    "12.345",
    "Infinity",
    "500-abc",
    "9007199254740992",
  ])
    assert.equal(parsePostBudget(value), undefined, value);
});
test("file selection accepts supported images and PDF, preserves existing files, and caps each category at five", () => {
  let n = 0;
  const first = appendPostFiles([], [image(), pdf()], () => `id-${++n}`);
  assert.equal(first.files.length, 2);
  assert.equal(postFilesError(first.files), undefined);
  const full = appendPostFiles(
    first.files,
    [image(), image(), image()],
    () => `id-${++n}`,
  );
  assert.equal(full.files.length, 5);
  assert.equal(new Set(full.files.map((f) => f.id)).size, 5);
  const rejected = appendPostFiles(full.files, [image()]);
  assert.equal(rejected.files, full.files);
  assert.match(rejected.error, /up to 5/);
  const afterRemove = full.files.slice(1);
  assert.equal(appendPostFiles(afterRemove, [pdf()]).files.length, 5);
});
test("invalid type, extension and oversized files cannot be submitted even with a forged cached error", () => {
  for (const file of [
    new File(["svg"], "image.svg", { type: "image/svg+xml" }),
    new File(["bad"], "script.html", { type: "image/jpeg" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
  ]) {
    const result = appendPostFiles([], [file]);
    assert.ok(result.files[0].error);
    assert.ok(postFilesError([{ ...result.files[0], error: undefined }]));
  }
  assert.match(
    postFilesError(Array.from({ length: 6 }, () => attachment(image()))),
    /up to 5/,
  );
});
test("draft changes and back navigation retain independent category data and attachments", () => {
  let state = initialVendorCreatePostState();
  const values = truck();
  state = reduce(state, { type: "truck-draft", values });
  values.menus.push("Pizza");
  state = reduce(state, { type: "general-draft", values: general("sale") });
  state = reduce(state, {
    type: "files",
    category: "sale",
    files: [attachment(pdf())],
  });
  state = reduce(state, { type: "general-draft", values: general("community") });
  assert.deepEqual(state.truckDraft.menus, ["Tacos", "Vegetarian"]);
  assert.equal(state.generalDrafts.sale.title, "Grill");
  assert.equal(state.generalDrafts.community.description, "Local event details");
  assert.equal(state.files.sale[0].file.name, "flyer.pdf");
  assert.equal(state.files.community, undefined);
  state = reduce(state, { type: "reset", category: "truck" });
  assert.deepEqual(state.truckDraft, emptyTruckPost());
  assert.equal(state.files.sale.length, 1);
});
test("save creates a validated local review, ignores duplicate IDs, retains an edit draft and resets only the selected form", () => {
  let state = initialVendorCreatePostState();
  const values = truck();
  state = reduce(state, {
    type: "save",
    post: { id: "truck-post", kind: "truck", values, files: [] },
  });
  values.menus.push("Pizza");
  assert.equal(state.posts.length, 1);
  assert.equal(state.success.id, "truck-post");
  assert.deepEqual(state.success.values.menus, ["Tacos", "Vegetarian"]);
  assert.equal(reduce(state, { type: "save", post: state.success }), state);
  state = reduce(state, { type: "edit" });
  assert.equal(state.success, null);
  assert.equal(state.truckDraft.location, "Golden Gate Park");
  state = reduce(state, {
    type: "save",
    post: {
      id: "sale-post",
      kind: "general",
      values: general("sale"),
      files: [attachment(pdf())],
    },
  });
  assert.equal(state.success.values.title, "Grill");
  assert.equal(state.posts.length, 2);
  state = reduce(state, { type: "reset", category: "sale" });
  assert.equal(state.success, null);
  assert.equal(state.generalDrafts.sale, undefined);
  assert.deepEqual(state.files.sale, []);
  assert.equal(state.truckDraft.location, "Golden Gate Park");
  assert.equal(state.posts.length, 2, "reset does not erase saved local copies");
  assert.equal(
    initialVendorCreatePostState().posts.length,
    0,
    "no role or cross-session persistence",
  );
});
test("invalid records and attachments never enter local saved posts", () => {
  const state = initialVendorCreatePostState();
  for (const post of [
    { id: "bad", kind: "truck", values: emptyTruckPost(), files: [] },
    {
      id: "bad",
      kind: "general",
      values: { ...general("sale"), title: "" },
      files: [],
    },
    {
      id: "bad",
      kind: "general",
      values: general(),
      files: [attachment(new File(["bad"], "script.svg", { type: "image/svg+xml" }))],
    },
    { id: "", kind: "general", values: general(), files: [] },
  ])
    assert.equal(reduce(state, { type: "save", post }), state);
});
test("truck form exposes all fields, retained selections, menus, Cancel and local-only submit language", () => {
  const html = renderToStaticMarkup(
    h(VendorTruckRequestForm, {
      draft: truck(),
      onDraft: noop,
      onBack: noop,
      onCancel: noop,
      onSubmit: noop,
    }),
  );
  for (const text of [
    "Event Type",
    "Event Date",
    "Event Time",
    "Location",
    "Expected Guests",
    "Budget Range",
    "Event Description",
    "Preferred Menu Items",
    "Cancel",
    "Post request",
    "No vendors are contacted",
  ])
    assert.ok(html.includes(text), text);
  for (const menu of truckMenuOptions) assert.ok(html.includes(menu.label), menu.label);
  assert.equal((html.match(/type="checkbox"/g) ?? []).length, 12);
  assert.equal((html.match(/checked=""/g) ?? []).length, 2);
  assert.match(html, /value="2025-07-18"/);
  assert.match(html, /value="Golden Gate Park"/);
});
test("custom upload content is optional and preserves the shared dropzone's default rendering and native hints", () => {
  const original = renderToStaticMarkup(
    h(FileDropzone, {
      onFilesSelected: noop,
      disabled: true,
      multiple: true,
      accept: "image/png",
    }),
  );
  assert.match(original, /Choose files/);
  assert.match(original, /or drag and drop/);
  assert.match(original, /disabled=""/);
  assert.match(original, /multiple=""/);
  assert.match(original, /accept="image\/png"/);
  const custom = renderToStaticMarkup(
    h(VendorPostAttachments, { files: [attachment(pdf())], onChange: noop }),
  );
  assert.match(custom, /Tap to upload/);
  assert.match(custom, /max 5/);
  assert.match(custom, /Remove flyer.pdf/);
  assert.doesNotMatch(custom, /<iframe|<object|<embed|blob:/);
});
test("saved reviews show correct truck or general content and do not claim publication", () => {
  for (const post of [
    { id: "a", kind: "truck", values: truck(), files: [] },
    { id: "b", kind: "general", values: general("sale"), files: [attachment(pdf())] },
  ]) {
    const html = renderToStaticMarkup(
      h(VendorPostReview, { post, onEdit: noop, onNew: noop }),
    );
    for (const text of [
      "saved in this preview",
      "Nothing has been published or sent",
      "Edit draft",
      "Create another post",
      'role="status"',
    ])
      assert.ok(html.includes(text), text);
    if (post.kind === "truck") {
      assert.match(html, /Golden Gate Park/);
      assert.match(html, /Vegetarian/);
    } else {
      assert.match(html, /Grill/);
      assert.match(html, /flyer.pdf/);
    }
  }
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
        sessionId: "vendor-create-post-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: "test-vendor",
        name: "Test Vendor",
        email: "test@example.invalid",
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
          { initialEntries: [ROUTES.VENDOR_CREATE_POST + query] },
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
test("Create Post retains authentication and Vendor isolation with one existing shell and active navigation", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_CREATE_POST);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    navigationItems.find((n) => n.path === ROUTES.VENDOR_CREATE_POST).allowedRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-create-post-shell/);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/create-post"/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /Need a truck/);
  assert.match(html, /Community help/);
  for (const category of vendorPostCategories) {
    const form = await renderAt("VENDOR", `?category=${category.id}`);
    assert.match(form, /<form /);
    assert.ok(form.includes(category.heading));
  }
  assert.match(
    await renderAt("VENDOR", "?category=unknown"),
    /That category is unavailable/,
  );
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role, "?category=truck"), "");
});
