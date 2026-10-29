import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import { URL } from "node:url";
import { authApi } from "../api/auth.api.ts";
import { authSessionMiddleware } from "./auth.middleware.ts";
import {
  authReducer,
  clearSession,
  identityVerified,
  sessionStarted,
} from "./auth.slice.ts";
import { selectCurrentRole, selectIsAuthenticated } from "./auth.selectors.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { socketService } from "../../../services/socket/socket.ts";
import { STORAGE_KEYS } from "../../../constants/storage.ts";
import { currentUserResponse } from "../utils/current-user.test-fixtures.mjs";
import { initializeSession } from "./auth.thunks.ts";

const user = {
  id: "test-user",
  name: "Test",
  email: "test@example.invalid",
  role: "CUSTOMER",
  roles: ["CUSTOMER"],
};
const tokens = { accessToken: "test-access", refreshToken: "test-refresh" };
const json = (body, status = 201) =>
  new globalThis.Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
function start(store, credentials = tokens) {
  store.dispatch(sessionStarted(credentials));
  store.dispatch(identityVerified(user));
}
const settle = async (store) => {
  await Promise.all(store.dispatch(baseApi.util.getRunningMutationsThunk()));
};
async function withSession(respond, run) {
  const originalFetch = globalThis.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const disconnect = socketService.disconnect;
  const saved = new Map();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key) => saved.get(key) ?? null,
        setItem: (key, value) => saved.set(key, value),
        removeItem: (key) => saved.delete(key),
      },
    },
  });
  let disconnects = 0;
  socketService.disconnect = () => {
    disconnects++;
  };
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  const calls = [];
  globalThis.fetch = async (request) => {
    const call = {
      path: new URL(request.url).pathname,
      method: request.method,
      authorization: request.headers.get("authorization"),
      body: request.method === "GET" ? undefined : await request.clone().json(),
    };
    calls.push(call);
    return respond(call, calls);
  };
  try {
    start(store);
    await run({ store, calls, saved, disconnects: () => disconnects });
    await settle(store);
  } finally {
    store.dispatch(clearSession("storage"));
    globalThis.fetch = originalFetch;
    socketService.disconnect = disconnect;
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
  }
}
function assertLoggedOut(store, saved) {
  const state = store.getState();
  assert.equal(state.auth.user, null);
  assert.equal(state.auth.accessToken, null);
  assert.equal(state.auth.refreshToken, null);
  assert.equal(state.auth.sessionId, null);
  assert.equal(state.auth.isIdentityVerified, false);
  assert.equal(state.auth.isHydrated, true);
  assert.equal(selectIsAuthenticated(state), false);
  assert.equal(selectCurrentRole(state), null);
  assert.equal(saved.has(STORAGE_KEYS.AUTH_SESSION), false);
  assert.equal(saved.has(STORAGE_KEYS.AUTH_TOKEN), false);
  assert.equal(saved.has(STORAGE_KEYS.REFRESH_TOKEN), false);
  assert.deepEqual(state.api.queries, {});
  assert.deepEqual(state.api.mutations, {});
}

test("manual logout revokes the captured refresh token, immediately clears storage/cache/socket, and does not cache credentials", async () => {
  let release;
  await withSession(
    () =>
      new Promise((resolve) => {
        release = () => resolve(json({ success: true }));
      }),
    async ({ store, calls, saved, disconnects }) => {
      await store.dispatch(
        baseApi.util.upsertQueryData(
          "getCurrentUser",
          undefined,
          currentUserResponse(),
        ),
      );
      saved.set(STORAGE_KEYS.AUTH_TOKEN, "legacy-access");
      saved.set(STORAGE_KEYS.REFRESH_TOKEN, "legacy-refresh");
      const before = disconnects();
      const action = clearSession();
      assert.equal(store.dispatch(action), action);
      assertLoggedOut(store, saved);
      assert.equal(disconnects(), before + 1);
      // Await the mocked HTTP boundary, with no sleeps, servers or real network.
      await new Promise((resolve) => globalThis.setImmediate(resolve));
      assert.deepEqual(calls, [
        {
          path: "/api/v1/auth/logout",
          method: "POST",
          authorization: "Bearer test-access",
          body: { refreshToken: "test-refresh" },
        },
      ]);
      release();
      await settle(store);
      assertLoggedOut(store, saved);
      assert.equal(disconnects(), before + 1);
    },
  );
});

for (const [name, response] of [
  ["backend failure", () => json({ message: "private internal error" }, 500)],
  [
    "network failure",
    () => {
      throw new Error("Offline");
    },
  ],
  [
    "expired access token",
    () => json({ message: "Invalid or expired access token" }, 401),
  ],
  [
    "refresh token belongs to a different account",
    () => json({ message: "Refresh token does not belong to this user" }, 403),
  ],
  ["malformed success response", () => json({ success: false })],
]) {
  test(`${name} still completes logout and never refreshes or retries`, async () => {
    await withSession(response, async ({ store, calls, saved }) => {
      store.dispatch(clearSession());
      assertLoggedOut(store, saved);
      await settle(store);
      assertLoggedOut(store, saved);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].path, "/api/v1/auth/logout");
    });
  });
}

for (const refreshToken of ["invalid-refresh-token", "expired-refresh-token"]) {
  test(`backend's idempotent success for ${refreshToken} completes local logout`, async () => {
    await withSession(
      () => json({ success: true }),
      async ({ store, calls, saved }) => {
        start(store, { ...tokens, refreshToken });
        store.dispatch(clearSession());
        await settle(store);
        assert.equal(calls[0].body.refreshToken, refreshToken);
        assertLoggedOut(store, saved);
      },
    );
  });
}

test("concurrent logout controls send one revocation; repeated and tokenless logout remain local", async () => {
  let release;
  await withSession(
    () =>
      new Promise((resolve) => {
        release = () => resolve(json({ success: true }));
      }),
    async ({ store, calls, saved }) => {
      await Promise.all([
        Promise.resolve().then(() => store.dispatch(clearSession())),
        Promise.resolve().then(() => store.dispatch(clearSession())),
        Promise.resolve().then(() => store.dispatch(clearSession())),
      ]);
      await new Promise((resolve) => globalThis.setImmediate(resolve));
      assert.equal(calls.length, 1);
      assertLoggedOut(store, saved);
      release();
      await settle(store);
      store.dispatch(clearSession());
      await settle(store);
      assert.equal(calls.length, 1);
    },
  );
});

for (const status of [201, 401, 500]) {
  test(`a delayed logout ${status} response cannot clear a newer login, storage, identity or cache`, async () => {
    let release;
    let started;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    await withSession(
      (call) => {
        if (call.path.endsWith("/logout")) {
          started();
          return new Promise((resolve) => {
            release = () =>
              resolve(
                json(
                  status === 201 ? { success: true } : { message: "Failure" },
                  status,
                ),
              );
          });
        }
        if (call.path.endsWith("/login"))
          return json({
            accessToken: "new-access",
            refreshToken: "new-refresh",
            user: {
              id: user.id,
              email: user.email,
              displayName: user.name,
              roles: user.roles,
            },
          });
        return json(currentUserResponse({ roles: ["CUSTOMER"] }));
      },
      async ({ store, calls, saved, disconnects }) => {
        store.dispatch(clearSession());
        await ready;
        await store
          .dispatch(
            authApi.endpoints.login.initiate({
              email: user.email,
              password: "test-password",
            }),
          )
          .unwrap();
        await store.dispatch(initializeSession());
        const state = store.getState();
        const storage = saved.get(STORAGE_KEYS.AUTH_SESSION);
        const count = disconnects();
        release();
        await settle(store);
        assert.equal(store.getState().auth, state.auth);
        assert.deepEqual(store.getState().api.queries, state.api.queries);
        assert.equal(saved.get(STORAGE_KEYS.AUTH_SESSION), storage);
        assert.equal(disconnects(), count);
        assert.equal(selectIsAuthenticated(store.getState()), true);
        assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
        assert.equal(calls.filter((call) => call.path.endsWith("/logout")).length, 1);
        assert.equal(calls[0].authorization, "Bearer test-access");
        assert.equal(calls.filter((call) => call.path.endsWith("/refresh")).length, 0);
      },
    );
  });
}

test("captured logout credentials are not replaced by current-store authorization", async () => {
  await withSession(
    () => json({ success: true }),
    async ({ store, calls }) => {
      await store
        .dispatch(
          authApi.endpoints.logout.initiate(
            { accessToken: "captured-access", refreshToken: "captured-refresh" },
            { track: false },
          ),
        )
        .unwrap();
      assert.equal(calls[0].authorization, "Bearer captured-access");
      assert.deepEqual(calls[0].body, { refreshToken: "captured-refresh" });
      assert.equal(selectIsAuthenticated(store.getState()), true);
    },
  );
});

test("storage synchronization and definitive invalidation never initiate remote logout", async () => {
  await withSession(
    () => {
      throw new Error("Unexpected HTTP");
    },
    async ({ store, calls, saved }) => {
      for (const reason of ["storage", "invalid-session"]) {
        start(store);
        store.dispatch(clearSession(reason));
        assertLoggedOut(store, saved);
      }
      await settle(store);
      assert.deepEqual(calls, []);
    },
  );
});

test("logout 401 using an older snapshot cannot refresh or clear a currently authenticated session", async () => {
  await withSession(
    () => json({ message: "Invalid or expired access token" }, 401),
    async ({ store, calls }) => {
      const state = store.getState().auth;
      await assert.rejects(
        store
          .dispatch(
            authApi.endpoints.logout.initiate(
              {
                accessToken: "old-captured-access",
                refreshToken: "old-captured-refresh",
              },
              { track: false },
            ),
          )
          .unwrap(),
      );
      assert.equal(calls.length, 1);
      assert.equal(calls[0].authorization, "Bearer old-captured-access");
      assert.equal(store.getState().auth, state);
    },
  );
});

test("logout proceeds while refresh is pending and a delayed refresh cannot restore the signed-out session", async () => {
  let releaseRefresh;
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  await withSession(
    (call) => {
      if (call.path.endsWith("/refresh")) {
        started();
        return new Promise((resolve) => {
          releaseRefresh = () =>
            resolve(
              json({ accessToken: "rotated-access", refreshToken: "rotated-refresh" }),
            );
        });
      }
      if (call.path.endsWith("/logout")) return json({ success: true });
      return json({}, 401);
    },
    async ({ store, calls, saved }) => {
      const request = store.dispatch(authApi.endpoints.getCurrentUser.initiate());
      await ready;
      store.dispatch(clearSession());
      await settle(store);
      assertLoggedOut(store, saved);
      assert.equal(calls.filter((call) => call.path.endsWith("/logout")).length, 1);
      assert.deepEqual(calls.find((call) => call.path.endsWith("/logout")).body, {
        refreshToken: tokens.refreshToken,
      });
      releaseRefresh();
      await request;
      request.unsubscribe();
      assertLoggedOut(store, saved);
      assert.equal(calls.filter((call) => call.path.endsWith("/refresh")).length, 1);
    },
  );
});
