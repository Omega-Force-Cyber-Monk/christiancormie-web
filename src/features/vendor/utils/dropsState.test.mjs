import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import { initialDropsState, dropsReducer } from "./dropsState.ts";
import {
  countPromoWords,
  dropPromoSchema,
  dropDurationSchema,
} from "../schemas/drops.schema.ts";
import { formatDropDuration } from "../data/drops.data.ts";
import { DropDurationPicker } from "../components/drops/DropDurationPicker.tsx";
import { DropsMap } from "../components/drops/DropsMap.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { ROUTES } from "../../../constants/routes.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";

const promoValues = {
  name: " Taco Tuesday ",
  message: " 15% off all tacos today! ",
  hasDuration: true,
  hours: 3,
  minutes: 15,
};

test("preset duration and all-day selections preserve their represented meaning", () => {
  let state = initialDropsState();
  assert.equal(formatDropDuration(state.duration), "2 hours");
  for (const hours of [1, 2, 4]) {
    state = dropsReducer(state, {
      type: "duration",
      duration: { kind: "preset", hours },
    });
    assert.equal(state.duration.hours, hours);
  }
  state = dropsReducer(state, { type: "duration", duration: { kind: "all-day" } });
  assert.equal(formatDropDuration(state.duration), "All day");
  assert.equal("hours" in state.duration, false);
});

test("custom-duration cancel leaves saved selection intact, while Set commits validated hours and minutes", () => {
  const original = initialDropsState();
  const opened = dropsReducer(original, {
    type: "overlay",
    overlay: { kind: "duration" },
  });
  const cancelled = dropsReducer(opened, { type: "overlay", overlay: null });
  assert.deepEqual(cancelled.duration, original.duration);
  const set = dropsReducer(opened, {
    type: "custom-duration",
    value: { hours: 3, minutes: 30 },
  });
  assert.equal(set.overlay, null);
  assert.equal(formatDropDuration(set.duration), "3h 30m");
  assert.equal(
    dropsReducer(set, { type: "custom-duration", value: { hours: 7, minutes: 30 } }),
    set,
  );
  assert.equal(dropDurationSchema.safeParse({ hours: 3, minutes: 10 }).success, false);
});

test("promo validation requires text and enforces exactly the SVG's 25-word maximum", () => {
  assert.equal(countPromoWords("  hello\nthere\tfriend  "), 3);
  assert.equal(countPromoWords("  \n "), 0);
  assert.equal(dropPromoSchema.safeParse({ ...promoValues, name: " " }).success, false);
  assert.equal(
    dropPromoSchema.safeParse({ ...promoValues, message: " " }).success,
    false,
  );
  assert.equal(
    dropPromoSchema.safeParse({
      ...promoValues,
      message: Array(25).fill("word").join(" "),
    }).success,
    true,
  );
  assert.equal(
    dropPromoSchema.safeParse({
      ...promoValues,
      message: Array(26).fill("word").join(" "),
    }).success,
    false,
  );
});

test("optional promo duration validates only while enabled", () => {
  assert.equal(dropPromoSchema.safeParse({ ...promoValues, hours: 0 }).success, false);
  assert.equal(
    dropPromoSchema.safeParse({ ...promoValues, hasDuration: false, hours: 0 }).success,
    true,
  );
  const state = dropsReducer(initialDropsState(), {
    type: "save-promo",
    id: "no-duration",
    editing: false,
    values: { ...promoValues, hasDuration: false },
  });
  assert.equal(state.promos.at(-1).duration, null);
});

test("new promos are local, normalized, uniquely identified and duplicate submissions are ignored", () => {
  const original = initialDropsState();
  const action = {
    type: "save-promo",
    id: "new-promo",
    editing: false,
    values: promoValues,
  };
  const state = dropsReducer(original, action);
  assert.equal(state.promos.length, 3);
  assert.equal(state.promos[2].name, "Taco Tuesday");
  assert.equal(state.promos[2].message, "15% off all tacos today!");
  assert.deepEqual(state.promos[2].duration, { hours: 3, minutes: 15 });
  assert.equal(dropsReducer(state, action), state);
  assert.equal(original.promos.length, 2);
});

test("promo editing and cancel preserve the correct selected promo and independent enable state", () => {
  const original = initialDropsState();
  let state = dropsReducer(original, {
    type: "overlay",
    overlay: { kind: "promo", id: "snacks" },
  });
  assert.equal(state.overlay.id, "snacks");
  state = dropsReducer(state, { type: "overlay", overlay: null });
  assert.deepEqual(state.promos, original.promos);
  state = dropsReducer(state, {
    type: "save-promo",
    id: "snacks",
    editing: true,
    values: promoValues,
  });
  assert.equal(state.promos[1].name, "Taco Tuesday");
  assert.equal(state.promos[1].enabled, false);
  assert.equal(state.promos[0], original.promos[0]);
  assert.equal(
    dropsReducer(state, {
      type: "save-promo",
      id: "absent",
      editing: true,
      values: promoValues,
    }),
    state,
  );
});

test("promo toggles and confirmed deletion affect only the selected item and support the empty state", () => {
  const original = initialDropsState();
  let state = dropsReducer(original, { type: "toggle-promo", id: "snacks" });
  assert.equal(state.promos[1].enabled, true);
  assert.equal(state.promos[0].enabled, true);
  state = dropsReducer(state, { type: "delete-promo", id: "lunch-special" });
  assert.deepEqual(
    state.promos.map((item) => item.id),
    ["snacks"],
  );
  state = dropsReducer(state, { type: "delete-promo", id: "snacks" });
  assert.deepEqual(state.promos, []);
  assert.equal(original.promos.length, 2);
});

test("Go Live snapshots enabled promos and duration locally; later edits do not silently change that snapshot", () => {
  const original = initialDropsState();
  let state = dropsReducer(original, { type: "go-live" });
  assert.equal(state.online, true);
  assert.deepEqual(
    state.live.promos.map((item) => item.id),
    ["lunch-special"],
  );
  assert.equal(formatDropDuration(state.live.duration), "2 hours");
  state = dropsReducer(state, { type: "duration", duration: { kind: "all-day" } });
  state = dropsReducer(state, { type: "toggle-promo", id: "snacks" });
  assert.equal(formatDropDuration(state.live.duration), "2 hours");
  assert.equal(state.live.promos.length, 1);
  state = dropsReducer(state, { type: "go-live" });
  assert.equal(formatDropDuration(state.live.duration), "All day");
  assert.equal(state.live.promos.length, 2);
  assert.equal(original.live, null);
});

test("ending the local preview retains saved promos and duration; availability changes are local", () => {
  let state = initialDropsState();
  state = dropsReducer(state, { type: "availability", online: false });
  assert.equal(state.online, false);
  state = dropsReducer(state, { type: "go-live" });
  const saved = state.promos;
  state = dropsReducer(state, { type: "end-drop" });
  assert.equal(state.live, null);
  assert.equal(state.online, false);
  assert.equal(state.promos, saved);
  assert.equal(formatDropDuration(state.duration), "2 hours");
  assert.match(state.status, /No real drop was changed/);
});

test("duration picker and map expose accessible selections without a server or location calls", () => {
  const html = renderToStaticMarkup(
    h(DropDurationPicker, { value: { hours: 3, minutes: 0 }, onChange() {} }),
  );
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 2);
  assert.equal((html.match(/<button /g) ?? []).length, 12);
  assert.match(html, /3h/);
  const map = renderToStaticMarkup(h(DropsMap, { online: true, onAvailability() {} }));
  assert.match(map, /Local availability preview/);
  assert.match(map, /4th &amp; Mission St, San Francisco/);
  assert.match(map, /Sample map of San Francisco/);
});

test("drops retains authentication, Vendor role protection and existing UI", () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_DROPS);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
});

function createStore(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-drops-test",
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
  return store;
}
function RouteTree() {
  return useRoutes(appRoutes);
}
function renderAt(role) {
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
        { store: createStore(role) },
        h(MemoryRouter, { initialEntries: [ROUTES.VENDOR_DROPS] }, h(RouteTree)),
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
test("verified Vendor Drops renders its single shared shell, presets and promo actions server-free", async () => {
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-drops-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  for (const label of [
    "Drop Duration",
    "Custom",
    "New Promo",
    "Lunch Special",
    "Snacks",
    "Go Live Now",
    "End Drop",
  ])
    assert.ok(html.includes(label), label);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/drops"/);
  assert.match(html, /aria-label="Enable Lunch Special"/);
  assert.doesNotMatch(html, /Hello Taco!/);
});

test("anonymous visitors and other roles cannot access drops", async () => {
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role), "");
});
