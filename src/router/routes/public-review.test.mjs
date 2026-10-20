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
import { getNavigationForRole } from "../../config/navigation/navigation.config.ts";
import { ROUTES } from "../../constants/routes.ts";
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
import { initializeSession } from "../../features/auth/store/auth.thunks.ts";
import { baseApi } from "../../services/api/baseApi.ts";
import { socketService } from "../../services/socket/socket.ts";
import { AuthGuard } from "../guards/AuthGuard.tsx";
import { CustomerReviewGuard } from "../guards/CustomerReviewGuard.tsx";
import { RoleGuard } from "../guards/RoleGuard.tsx";
import { appRoutes } from "./app.routes.tsx";
import { getRoleHomeRoute } from "../utils/getRoleHomeRoute.ts";

const reviewPaths = [
  ROUTES.CUSTOMER_DISCOVER,
  ROUTES.CUSTOMER_FEED,
  ROUTES.CUSTOMER_COMMUNITY,
  ROUTES.CUSTOMER_MESSAGE,
];
const pageMarkers = [
  "discover-page",
  "customer-feed-page",
  "customer-community-page",
  "customer-message-page",
];

function createStore(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "review-test-access",
        refreshToken: "review-test-refresh",
        sessionId: "review-test-session",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: "review-test-user",
        name: "Test",
        email: "test@example.invalid",
        role,
      }),
    );
  }
  return store;
}

function RouteTree() {
  return useRoutes(appRoutes);
}

// Stream React's server renderer to memory, without mounting a DOM or starting a server.
function renderAt(path, store) {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    let html = "";
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
        onError(error) {
          reject(error);
        },
      },
    );
  });
}

async function withReview(enabled, run) {
  const previous = env.enablePublicReview;
  env.enablePublicReview = enabled;
  try {
    await run();
  } finally {
    env.enablePublicReview = previous;
  }
}

test("public review is opt-in when its build-time variable is absent", () => {
  assert.equal(env.enablePublicReview, false);
});

test("customer login and restored sessions resolve home only after verification, including login after logout", async () => {
  await withReview(false, async () => {
    const store = createStore();
    const user = {
      id: "customer-home-test",
      name: "Test",
      email: "test@example.invalid",
      role: "CUSTOMER",
    };
    const tokens = {
      accessToken: "home-test-access",
      refreshToken: "home-test-refresh",
      sessionId: "home-test-session",
      user,
    };
    for (const action of [
      sessionStarted(tokens),
      sessionRestored(tokens),
      sessionStarted(tokens),
    ]) {
      store.dispatch(action);
      assert.equal(selectCurrentRole(store.getState()), null);
      assert.equal(selectIsAuthenticated(store.getState()), false);
      const pending = await renderAt(ROUTES.DASHBOARD, store);
      assert.ok(pending.includes('role="status"'));
      store.dispatch(identityVerified(user));
      assert.equal(
        getRoleHomeRoute(selectCurrentRole(store.getState())),
        ROUTES.CUSTOMER_DISCOVER,
      );
      assert.ok(
        (await renderAt(ROUTES.CUSTOMER_DISCOVER, store)).includes(
          'class="discover-page"',
        ),
      );
      store.dispatch(clearSession());
      assert.equal(getRoleHomeRoute(selectCurrentRole(store.getState())), ROUTES.LOGIN);
    }
  });
});

test("other role home destinations remain unchanged", () => {
  assert.equal(getRoleHomeRoute("ADMIN"), ROUTES.ADMIN_DASHBOARD);
  assert.equal(getRoleHomeRoute("VENDOR"), ROUTES.VENDOR_DASHBOARD);
  assert.equal(getRoleHomeRoute("VENDOR_STAFF"), ROUTES.VENDOR_STAFF_DASHBOARD);
});

test("the obsolete customer URL replaces history with Discover; Discover has one canonical leaf and no redirect loop", () => {
  assert.equal(ROUTES.CUSTOMER_DASHBOARD, ROUTES.CUSTOMER_DISCOVER);
  const legacyMatches = matchRoutes(appRoutes, ROUTES.CUSTOMER_DASHBOARD_REDIRECT);
  const redirect = legacyMatches.at(-1).route.element;
  assert.equal(redirect.type, Navigate);
  assert.equal(redirect.props.replace, true);
  assert.equal(redirect.props.to, ROUTES.CUSTOMER_DISCOVER);
  const canonical = matchRoutes(appRoutes, redirect.props.to);
  assert.notEqual(canonical.at(-1).route.element.type, Navigate);
  assert.equal(canonical.at(-1).route.path, ROUTES.CUSTOMER_DISCOVER);
  function countDiscover(routes) {
    return routes.reduce(
      (total, route) =>
        total +
        Number(route.path === ROUTES.CUSTOMER_DISCOVER) +
        countDiscover(route.children ?? []),
      0,
    );
  }
  assert.equal(countDiscover(appRoutes), 1);
});

test("customer sidebar matches the updated navigation order and keeps Discover active", async () => {
  const navigation = getNavigationForRole("CUSTOMER");
  assert.deepEqual(
    navigation.map((item) => item.label),
    ["Message", "Community", "Feed", "Discover", "Orders"],
  );
  assert.equal(navigation[3].path, ROUTES.CUSTOMER_DISCOVER);
  await withReview(true, async () => {
    const store = createStore();
    const html = await renderAt(ROUTES.CUSTOMER_DISCOVER, store);
    const sidebar = html.match(
      /<nav aria-label="Discover navigation"[\s\S]*?<\/nav>/,
    )?.[0];
    assert.ok(sidebar);
    assert.match(sidebar, /aria-current="page"[^>]*href="\/discover"/);
    assert.doesNotMatch(sidebar, />Showers<|>Drizzles</);
    assert.match(sidebar, /disabled=""[^>]*title="No active session to sign out"/);
    const labels = [
      "Discover",
      "Feed",
      "Community",
      "Message",
      "Profile",
      "Create post",
      "Leaderboard",
      "Settings",
      "Sign out",
    ];
    let previous = -1;
    for (const label of labels) {
      const position = sidebar.indexOf(`>${label}<`);
      assert.ok(position > previous, `${label} must retain its sidebar order`);
      previous = position;
    }
    const signedIn = await renderAt(ROUTES.CUSTOMER_DISCOVER, createStore("CUSTOMER"));
    assert.match(
      signedIn,
      /<button[^>]*title="Sign out"[^>]*>[\s\S]*?Sign out<\/button>/,
    );
    assert.doesNotMatch(signedIn, /disabled=""[^>]*title="Sign out"/);
  });
});

test("only the four review paths use the opt-in guard; profile and dashboards keep existing guards", () => {
  for (const path of reviewPaths) {
    assert.ok(
      matchRoutes(appRoutes, path).some(
        ({ route }) => route.element?.type === CustomerReviewGuard,
      ),
    );
  }
  for (const path of [
    "/profile/taco-paradise",
    ROUTES.CUSTOMER_DASHBOARD_REDIRECT,
    ROUTES.CUSTOMER_ORDERS,
    ROUTES.ADMIN_DASHBOARD,
    ROUTES.ADMIN_USERS,
    ROUTES.VENDOR_DASHBOARD,
    ROUTES.VENDOR_STAFF_DASHBOARD,
  ]) {
    const matches = matchRoutes(appRoutes, path);
    assert.ok(
      matches.some(({ route }) => route.element?.type === AuthGuard),
      path,
    );
    assert.ok(
      matches.some(({ route }) => route.element?.type === RoleGuard),
      path,
    );
    assert.equal(
      matches.some(({ route }) => route.element?.type === CustomerReviewGuard),
      false,
      path,
    );
  }
});

test("anonymous direct loads, repeated loads and navigation between all four pages render static fixtures without granting identity or making API/socket calls", async () => {
  await withReview(true, async () => {
    const store = createStore();
    const before = store.getState().auth;
    const fetch = globalThis.fetch;
    const connect = socketService.connect;
    let requests = 0;
    let connections = 0;
    globalThis.fetch = () => {
      requests++;
      throw new Error("Unexpected protected request");
    };
    socketService.connect = () => {
      connections++;
      throw new Error("Unexpected socket connection");
    };
    try {
      await store.dispatch(initializeSession());
      for (let pass = 0; pass < 2; pass++) {
        for (const [index, path] of reviewPaths.entries()) {
          const html = await renderAt(path, store);
          assert.ok(html.includes(`class="${pageMarkers[index]}"`), path);
          for (const target of reviewPaths)
            assert.ok(html.includes(`href="${target}"`));
        }
      }
      assert.equal(requests, 0);
      assert.equal(connections, 0);
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(selectCurrentRole(store.getState()), null);
      assert.deepEqual(store.getState().auth, before);
      assert.deepEqual(Object.keys(store.getState()[baseApi.reducerPath].queries), []);
      assert.deepEqual(
        Object.keys(store.getState()[baseApi.reducerPath].mutations),
        [],
      );
    } finally {
      globalThis.fetch = fetch;
      socketService.connect = connect;
      store.dispatch(baseApi.util.resetApiState());
    }
  });
});

test("disabling review restores protection on every review route", async () => {
  await withReview(false, async () => {
    const store = createStore();
    for (const [index, path] of reviewPaths.entries()) {
      assert.equal(
        (await renderAt(path, store)).includes(`class="${pageMarkers[index]}"`),
        false,
      );
    }
  });
});

test("anonymous profile and dashboard visits remain blocked while review is enabled", async () => {
  await withReview(true, async () => {
    const store = createStore();
    for (const path of [
      ROUTES.CUSTOMER_SETTINGS,
      ROUTES.CUSTOMER_LEADERBOARD,
      ROUTES.CUSTOMER_CREATE_POST,
      "/profile/taco-paradise",
      ROUTES.CUSTOMER_DASHBOARD_REDIRECT,
      ROUTES.ADMIN_DASHBOARD,
      ROUTES.VENDOR_DASHBOARD,
      ROUTES.VENDOR_STAFF_DASHBOARD,
    ]) {
      assert.equal(await renderAt(path, store), "");
    }
  });
});

test("verified customers keep access with review either on or off; other authenticated roles cannot use the public exception", async () => {
  for (const enabled of [true, false]) {
    await withReview(enabled, async () => {
      const customer = createStore("CUSTOMER");
      for (const [index, path] of reviewPaths.entries())
        assert.ok(
          (await renderAt(path, customer)).includes(`class="${pageMarkers[index]}"`),
        );
      assert.ok(
        (await renderAt(ROUTES.CUSTOMER_CREATE_POST, customer)).includes(
          'class="create-post-page"',
        ),
      );
      assert.ok(
        (await renderAt(ROUTES.CUSTOMER_LEADERBOARD, customer)).includes(
          'class="customer-leaderboard-page"',
        ),
      );
      assert.ok(
        (await renderAt(ROUTES.CUSTOMER_SETTINGS, customer)).includes(
          'class="customer-settings-page"',
        ),
      );
      for (const role of ["ADMIN", "VENDOR", "VENDOR_STAFF"]) {
        const store = createStore(role);
        for (const path of [
          ...reviewPaths,
          ROUTES.CUSTOMER_CREATE_POST,
          ROUTES.CUSTOMER_LEADERBOARD,
          ROUTES.CUSTOMER_SETTINGS,
        ])
          assert.equal(await renderAt(path, store), "");
        assert.equal(selectCurrentRole(store.getState()), role);
      }
    });
  }
});

test("persisted identities still wait for verification or show their session error", async () => {
  await withReview(true, async () => {
    const store = createStore();
    store.dispatch(
      sessionRestored({
        accessToken: "unverified-test-access",
        refreshToken: "unverified-test-refresh",
        sessionId: "unverified-test-session",
        user: {
          id: "unverified",
          name: "Test",
          email: "test@example.invalid",
          role: "CUSTOMER",
        },
      }),
    );
    const html = await renderAt(ROUTES.CUSTOMER_DISCOVER, store);
    assert.equal(html.includes('class="discover-page"'), false);
    assert.equal(selectCurrentRole(store.getState()), null);
    assert.equal(selectIsAuthenticated(store.getState()), false);
    store.dispatch(
      initializationFailed({
        kind: "NETWORK",
        message: "Session verification unavailable",
      }),
    );
    const failed = await renderAt(ROUTES.CUSTOMER_DISCOVER, store);
    assert.ok(failed.includes("Session verification unavailable"));
    assert.equal(failed.includes('class="discover-page"'), false);
  });
});
