import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { configureStore } from "@reduxjs/toolkit";
import { createElement as h } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter, Navigate, matchRoutes, useRoutes } from "react-router";
import { rootReducer } from "../../app/rootReducer.ts";
import { env } from "../../config/env.ts";
import { ROUTES } from "../../constants/routes.ts";
import { getNavigationForRole } from "../../config/navigation/navigation.config.ts";
import { authSessionMiddleware } from "../../features/auth/store/auth.middleware.ts";
import {
  identityVerified,
  clearSession,
  initializationFailed,
  sessionRestored,
  sessionStarted,
} from "../../features/auth/store/auth.slice.ts";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "../../features/auth/store/auth.selectors.ts";
import { baseApi } from "../../services/api/baseApi.ts";
import { AuthGuard } from "../guards/AuthGuard.tsx";
import { RoleGuard } from "../guards/RoleGuard.tsx";
import { GuestGuard } from "../guards/GuestGuard.tsx";
import { appRoutes } from "./app.routes.tsx";
import { getRoleHomeRoute } from "../utils/getRoleHomeRoute.ts";
const roles = ["CUSTOMER", "VENDOR", "VENDOR_STAFF", "ADMIN"];
const userFor = (role) => ({
  id: "route-test-user",
  name: "Route Test",
  email: "route-test@example.invalid",
  roles: [role],
  role,
});
const saved = {
  accessToken: "route-test-access",
  refreshToken: "route-test-refresh",
  sessionId: "route-test-session",
  user: null,
};
function createStore(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  if (role) {
    store.dispatch(sessionRestored(saved));
    store.dispatch(identityVerified(userFor(role)));
  }
  return store;
}
function RouteTree() {
  return useRoutes(appRoutes);
}
function renderAt(path, store) {
  return new Promise((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk;
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      h(Provider, { store }, h(MemoryRouter, { initialEntries: [path] }, h(RouteTree))),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
const customerPaths = [
  ROUTES.CUSTOMER_DISCOVER,
  ROUTES.CUSTOMER_FEED,
  ROUTES.CUSTOMER_COMMUNITY,
  ROUTES.CUSTOMER_MESSAGE,
  ROUTES.CUSTOMER_CREATE_POST,
  ROUTES.CUSTOMER_LEADERBOARD,
  ROUTES.CUSTOMER_SETTINGS,
  ROUTES.CUSTOMER_OWN_PROFILE,
  ROUTES.CUSTOMER_PUBLIC_PROFILE,
  "/profile/taco-paradise",
  ROUTES.CUSTOMER_ORDERS,
  ROUTES.CUSTOMER_DASHBOARD_REDIRECT,
];
const vendorPaths = [
  ROUTES.VENDOR_DASHBOARD,
  ROUTES.VENDOR_FEED,
  ROUTES.VENDOR_DROPS,
  ROUTES.VENDOR_ORDERS,
  ROUTES.VENDOR_CREATE_POST,
  ROUTES.VENDOR_MESSAGE,
  ROUTES.VENDOR_EARNINGS,
  ROUTES.VENDOR_PROFILE,
  ROUTES.VENDOR_LEADERBOARD,
  ROUTES.VENDOR_SETTINGS,
  ROUTES.VENDOR_PRODUCTS,
];
const adminPaths = Object.entries(ROUTES)
  .filter(([key]) => key.startsWith("ADMIN_"))
  .map(([, path]) => path);
const staffPaths = [ROUTES.VENDOR_STAFF_DASHBOARD, ROUTES.VENDOR_STAFF_TASKS];
const groups = [
  ["CUSTOMER", customerPaths],
  ["VENDOR", vendorPaths],
  ["VENDOR_STAFF", staffPaths],
  ["ADMIN", adminPaths],
];
const allPaths = groups.flatMap(([, paths]) => paths);

test("every role feature, including former review pages, has actual AuthGuard and its exact RoleGuard", () => {
  for (const [role, paths] of groups)
    for (const path of paths) {
      const matches = matchRoutes(appRoutes, path);
      assert.ok(matches, path);
      assert.ok(
        matches.some(({ route }) => route.element?.type === AuthGuard),
        path,
      );
      assert.deepEqual(
        matches.find(({ route }) => route.element?.type === RoleGuard).route.element
          .props.allowedRoles,
        [role],
        path,
      );
    }
});
test("anonymous direct loads and repeated refreshes cannot render any private role page", async () => {
  const store = createStore();
  for (const path of allPaths) {
    assert.equal(await renderAt(path, store), "", path);
    assert.equal(await renderAt(path, createStore()), "", path);
  }
  assert.equal(selectIsAuthenticated(store.getState()), false);
  assert.equal(store.getState().auth.user, null);
  assert.equal(Object.keys(store.getState().api.queries).length, 0);
});
test("obsolete review/mock environment properties and role actions cannot grant identity or route access", async () => {
  Object.assign(env, { enableMockAuth: true, enablePublicReview: true });
  try {
    const store = createStore();
    store.dispatch({ type: "auth/setMockRole", payload: "ADMIN" });
    assert.equal(store.getState().auth.user, null);
    assert.equal(selectIsAuthenticated(store.getState()), false);
    for (const path of [...customerPaths, ...vendorPaths])
      assert.equal(await renderAt(path, store), "", path);
  } finally {
    delete env.enableMockAuth;
    delete env.enablePublicReview;
  }
});
test("verified roles retain their own pages and cannot access any other role's pages", async () => {
  const landing = {
    CUSTOMER: ROUTES.CUSTOMER_DISCOVER,
    VENDOR: ROUTES.VENDOR_DASHBOARD,
    VENDOR_STAFF: ROUTES.VENDOR_STAFF_DASHBOARD,
    ADMIN: ROUTES.ADMIN_DASHBOARD,
  };
  for (const role of roles) {
    const store = createStore(role);
    assert.ok((await renderAt(landing[role], store)).includes("<main"), role);
    assert.equal(selectCurrentRole(store.getState()), role);
    for (const [other, paths] of groups)
      if (other !== role)
        for (const path of paths)
          assert.equal(await renderAt(path, store), "", `${role} -> ${path}`);
    store.dispatch(baseApi.util.resetApiState());
  }
  assert.match(await renderAt(ROUTES.UNAUTHORIZED, createStore()), /403/);
});
test("unknown roles are denied, have no navigation and resolve to the existing 403 route", async () => {
  const store = createStore("UNKNOWN");
  for (const role of ["UNKNOWN", "__proto__", "toString"])
    assert.equal(getRoleHomeRoute(role), ROUTES.UNAUTHORIZED);
  assert.deepEqual(getNavigationForRole("UNKNOWN"), []);
  for (const path of allPaths) assert.equal(await renderAt(path, store), "", path);
});
test("restored identities and token-only sessions show the canonical loader, never protected content", async () => {
  for (const role of roles) {
    const store = createStore();
    store.dispatch(sessionRestored({ ...saved, user: userFor(role), expiresAt: 1 }));
    assert.equal(selectIsAuthenticated(store.getState()), false);
    assert.equal(selectCurrentRole(store.getState()), null);
    for (const path of [getRoleHomeRoute(role), ROUTES.DASHBOARD]) {
      const html = await renderAt(path, store);
      assert.match(html, /role="status"/);
      assert.match(html, /Loading page/);
      assert.doesNotMatch(html, /<main|vendor-home-shell|discover-page/);
    }
    store.dispatch(initializationFailed({ kind: "NETWORK", message: "Offline" }));
    const error = await renderAt(getRoleHomeRoute(role), store);
    assert.match(error, /Offline/);
    assert.doesNotMatch(error, /vendor-home-shell|discover-page/);
    store.dispatch(clearSession("invalid-session"));
    assert.equal(await renderAt(getRoleHomeRoute(role), store), "");
  }
});
test("login and restoration await identity verification, then retain role home and legacy redirect behavior", async () => {
  const store = createStore();
  for (const action of [sessionStarted(saved), sessionRestored(saved)]) {
    store.dispatch(action);
    assert.equal(selectIsAuthenticated(store.getState()), false);
    assert.match(await renderAt(ROUTES.DASHBOARD, store), /Loading page/);
    store.dispatch(identityVerified(userFor("CUSTOMER")));
    assert.equal(
      getRoleHomeRoute(selectCurrentRole(store.getState())),
      ROUTES.CUSTOMER_DISCOVER,
    );
    assert.match(await renderAt(ROUTES.CUSTOMER_DISCOVER, store), /discover-page/);
    store.dispatch(clearSession("storage"));
    assert.equal(getRoleHomeRoute(selectCurrentRole(store.getState())), ROUTES.LOGIN);
  }
  const redirect = matchRoutes(appRoutes, ROUTES.CUSTOMER_DASHBOARD_REDIRECT).at(-1)
    .route.element;
  assert.equal(redirect.type, Navigate);
  assert.equal(redirect.props.to, ROUTES.CUSTOMER_DISCOVER);
  assert.equal(redirect.props.replace, true);
  assert.equal(getRoleHomeRoute("VENDOR"), ROUTES.VENDOR_DASHBOARD);
  assert.equal(getRoleHomeRoute("VENDOR_STAFF"), ROUTES.VENDOR_STAFF_DASHBOARD);
  assert.equal(getRoleHomeRoute("ADMIN"), ROUTES.ADMIN_DASHBOARD);
});
test("logout immediately removes access, sensitive queries/mutations, and previous role navigation", async () => {
  const store = createStore("CUSTOMER");
  await store.dispatch(
    baseApi.util.upsertQueryData("getCurrentUser", undefined, { id: "cached-sample" }),
  );
  assert.ok(Object.keys(store.getState().api.queries).length);
  store.dispatch(clearSession("storage"));
  assert.equal(Object.keys(store.getState().api.queries).length, 0);
  assert.equal(Object.keys(store.getState().api.mutations).length, 0);
  assert.equal(selectCurrentRole(store.getState()), null);
  for (const path of allPaths) assert.equal(await renderAt(path, store), "", path);
});
test("login, signup, legal pages and Help Center stay public; no password-reset route is invented", async () => {
  for (const path of [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.PRIVACY_POLICY,
    ROUTES.TERMS_AND_CONDITIONS,
    ROUTES.HELP_CENTER,
  ]) {
    const matches = matchRoutes(appRoutes, path);
    assert.ok(!matches.some(({ route }) => route.element?.type === AuthGuard), path);
    assert.ok((await renderAt(path, createStore())).length, path);
  }
  assert.ok(
    matchRoutes(appRoutes, ROUTES.LOGIN).some(
      ({ route }) => route.element?.type === GuestGuard,
    ),
  );
});
