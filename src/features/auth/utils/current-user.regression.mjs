import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { configureStore } from "@reduxjs/toolkit";

// Included by npm test's production SSR bundler with a test-only API base.
// All HTTP requests are stubbed; no server, browser or network is used.
import { authApi } from "../api/auth.api.ts";
import { currentUserResponseSchema } from "../schemas/current-user.schema.ts";
import { authReducer, sessionRestored, clearSession } from "../store/auth.slice.ts";
import { authSessionMiddleware } from "../store/auth.middleware.ts";
import { selectCurrentRole, selectIsAuthenticated } from "../store/auth.selectors.ts";
import { initializeSession } from "../store/auth.thunks.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { toAuthenticatedUser } from "./authAdapters.ts";
import {
  currentUserResponse,
  currentUserProfile,
} from "./current-user.test-fixtures.mjs";

function createTestStore(restore = true) {
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  if (restore)
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "test-session",
        user: null,
      }),
    );
  return store;
}

const json = (body, status = 200) =>
  new globalThis.Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function withRequests(respond, run, restore = true) {
  const original = globalThis.fetch;
  const requests = [];
  const store = createTestStore(restore);
  globalThis.fetch = async (request) => {
    requests.push(request);
    return respond(request, requests);
  };
  try {
    await run(store, requests);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}

test("the complete nullable response and unknown data survive validation", () => {
  const payload = currentUserResponse({
    profile: currentUserProfile({ displayName: "Name", extraProfileField: "kept" }),
    settings: {
      id: "settings",
      userId: "test-user",
      language: "en",
      timezone: "UTC",
      distanceUnit: "KM",
      locationPermissionGranted: false,
      pushPermissionGranted: true,
      marketingConsent: false,
      createdAt: "date",
      updatedAt: "date",
    },
    notificationPreference: {
      id: "preferences",
      userId: "test-user",
      nearbyDropAlerts: true,
      followedTruckUpdates: false,
      favoriteTruckAlerts: true,
      promotionAlerts: false,
      bookingAlerts: true,
      paymentAlerts: true,
      messageAlerts: true,
      rewardAlerts: false,
      checkInAlerts: false,
      marketingAlerts: false,
    },
    vendor: { unknownVendorField: [1, 2] },
    interestCuisines: [{ unknownCuisineField: true }],
    extraField: "kept",
  });
  assert.deepEqual(currentUserResponseSchema.parse(payload), payload);
  assert.ok(currentUserResponseSchema.safeParse(currentUserResponse()).success);
});

test("display name, full name, partial name and email fallbacks are safe", () => {
  for (const [profile, name] of [
    [
      currentUserProfile({
        displayName: " Display ",
        firstName: "First",
        lastName: "Last",
      }),
      "Display",
    ],
    [
      currentUserProfile({
        displayName: " ",
        firstName: " First ",
        lastName: " Last ",
      }),
      "First Last",
    ],
    [currentUserProfile({ firstName: "First" }), "First"],
    [currentUserProfile({ lastName: "Last" }), "Last"],
    [currentUserProfile(), "test@example.com"],
    [null, "test@example.com"],
  ])
    assert.equal(toAuthenticatedUser(currentUserResponse({ profile })).name, name);
  assert.equal(
    toAuthenticatedUser(
      currentUserResponse({
        profile: currentUserProfile({
          avatarUrl: "https://example.invalid/avatar.png",
        }),
      }),
    ).avatarUrl,
    "https://example.invalid/avatar.png",
  );
  assert.equal(toAuthenticatedUser(currentUserResponse()).avatarUrl, null);
});

test("all supported roles normalize without defaults or invented precedence", () => {
  for (const role of ["ADMIN", "CUSTOMER", "VENDOR", "VENDOR_STAFF"]) {
    assert.equal(
      toAuthenticatedUser(currentUserResponse({ roles: [role] })).role,
      role,
    );
  }
  for (const roles of [[], ["UNKNOWN"]]) {
    assert.throws(
      () => toAuthenticatedUser(currentUserResponse({ roles })),
      /dashboard role/,
    );
  }
  for (const roles of [
    ["CUSTOMER", "VENDOR"],
    ["VENDOR", "VENDOR_STAFF"],
  ]) {
    const user = toAuthenticatedUser(currentUserResponse({ roles }));
    assert.deepEqual(user.roles, roles);
    assert.equal(user.role, null);
  }
  assert.equal(
    toAuthenticatedUser(currentUserResponse({ roles: ["ADMIN", "ADMIN"] })).role,
    "ADMIN",
  );
  assert.equal(
    toAuthenticatedUser(currentUserResponse({ roles: ["UNKNOWN", "VENDOR"] })).role,
    "VENDOR",
  );
  const missingRoles = currentUserResponse();
  delete missingRoles.roles;
  assert.equal(currentUserResponseSchema.safeParse(missingRoles).success, false);
});

test("current-user requests append users/me to the configured base and retain bearer headers", async () => {
  await withRequests(
    () => json(currentUserResponse()),
    async (store, requests) => {
      const request = store.dispatch(authApi.endpoints.getCurrentUser.initiate());
      try {
        const response = await request.unwrap();
        assert.equal(requests.length, 1);
        assert.equal(new URL(requests[0].url).pathname, "/api/v1/users/me");
        assert.equal(requests[0].method, "GET");
        assert.equal(requests[0].headers.get("authorization"), "Bearer test-access");
        assert.equal(requests[0].headers.get("accept"), "application/json");
        assert.deepEqual(response, currentUserResponse());
        assert.deepEqual(
          authApi.endpoints.getCurrentUser.select()(store.getState()).data.roles,
          ["ADMIN"],
        );
      } finally {
        request.unsubscribe();
      }
    },
  );
});

test("login persists unverified tokens and initialization verifies users/me", async () => {
  await withRequests(
    (request) => {
      const path = new URL(request.url).pathname;
      if (path.endsWith("/auth/login"))
        return json({
          accessToken: "login-access",
          refreshToken: "login-refresh",
          user: {
            id: "test-user",
            email: "test@example.com",
            displayName: "Old name",
            roles: ["ADMIN"],
          },
        });
      assert.equal(path, "/api/v1/users/me");
      return json(
        currentUserResponse({
          roles: ["CUSTOMER"],
          profile: currentUserProfile({ displayName: "Verified name" }),
        }),
      );
    },
    async (store, requests) => {
      await store
        .dispatch(
          authApi.endpoints.login.initiate({
            email: "test@example.com",
            password: "test-password",
          }),
        )
        .unwrap();
      assert.equal(store.getState().auth.accessToken, "login-access");
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(selectCurrentRole(store.getState()), null);
      await store.dispatch(initializeSession());
      assert.equal(selectIsAuthenticated(store.getState()), true);
      assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
      assert.equal(store.getState().auth.user.name, "Verified name");
      assert.equal(requests.length, 2);
      assert.ok(
        requests.every(
          (request) => !new URL(request.url).pathname.endsWith("/auth/me"),
        ),
      );
    },
    false,
  );
});

test("temporary network and server failures retain retryable, unverified credentials", async () => {
  for (const respond of [
    () => {
      throw new Error("Offline");
    },
    () => json({ message: "Temporary failure" }, 503),
  ]) {
    await withRequests(respond, async (store) => {
      await store.dispatch(initializeSession());
      assert.equal(store.getState().auth.accessToken, "test-access");
      assert.equal(store.getState().auth.refreshToken, "test-refresh");
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.ok(store.getState().auth.initializationError);
    });
  }
});

test("definitive 401 follows the existing invalid-session policy with one refresh attempt", async () => {
  await withRequests(
    () => json({ message: "Unauthorized" }, 401),
    async (store, requests) => {
      await store.dispatch(initializeSession());
      assert.equal(store.getState().auth.accessToken, null);
      assert.equal(store.getState().auth.isHydrated, true);
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(
        requests.filter((request) =>
          new URL(request.url).pathname.endsWith("/auth/refresh"),
        ).length,
        1,
      );
      assert.equal(requests.length, 2);
    },
  );
});

test("refresh retries users/me with rotated tokens and then verifies the new identity", async () => {
  let meRequests = 0;
  await withRequests(
    (request) => {
      const path = new URL(request.url).pathname;
      if (path.endsWith("/auth/refresh"))
        return json({ accessToken: "rotated-access", refreshToken: "rotated-refresh" });
      assert.equal(path, "/api/v1/users/me");
      if (++meRequests === 1) return json({}, 401);
      assert.equal(request.headers.get("authorization"), "Bearer rotated-access");
      return json(currentUserResponse({ roles: ["VENDOR"] }));
    },
    async (store, requests) => {
      await store.dispatch(initializeSession());
      assert.equal(store.getState().auth.accessToken, "rotated-access");
      assert.equal(selectCurrentRole(store.getState()), "VENDOR");
      assert.equal(requests.length, 3);
    },
  );
});

test("unknown roles retain credentials but never grant dashboard access", async () => {
  for (const roles of [[], ["UNKNOWN"]]) {
    await withRequests(
      () => json(currentUserResponse({ roles })),
      async (store) => {
        await store.dispatch(initializeSession());
        assert.equal(store.getState().auth.accessToken, "test-access");
        assert.equal(selectIsAuthenticated(store.getState()), false);
        assert.equal(selectCurrentRole(store.getState()), null);
        assert.match(
          store.getState().auth.initializationError.message,
          /dashboard role/,
        );
        assert.deepEqual(
          authApi.endpoints.getCurrentUser.select()(store.getState()).data.roles,
          roles,
        );
      },
    );
  }
});

test("an invalid response does not verify a persisted role or discard credentials", async () => {
  await withRequests(
    () => json({ displayName: "Wrong contract" }),
    async (store) => {
      await store.dispatch(initializeSession());
      assert.equal(store.getState().auth.accessToken, "test-access");
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.ok(store.getState().auth.initializationError);
    },
  );
});

test("a current-user result after logout cannot resurrect the previous identity", async () => {
  let respond;
  const ready = new Promise((resolve) => {
    respond = resolve;
  });
  await withRequests(
    async () => {
      respond();
      return new Promise((resolve) => {
        respond = () => resolve(json(currentUserResponse()));
      });
    },
    async (store) => {
      const initialization = store.dispatch(initializeSession());
      await ready;
      store.dispatch(clearSession("storage"));
      respond();
      await initialization;
      assert.equal(store.getState().auth.user, null);
      assert.equal(selectIsAuthenticated(store.getState()), false);
    },
  );
});
