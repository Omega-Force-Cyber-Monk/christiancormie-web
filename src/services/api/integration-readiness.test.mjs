import assert from "node:assert/strict";
import test from "node:test";
import { configureStore } from "@reduxjs/toolkit";
import { URL } from "node:url";
import { rootReducer } from "../../app/rootReducer.ts";
import { authSessionMiddleware } from "../../features/auth/store/auth.middleware.ts";
import {
  sessionRestored,
  identityVerified,
  clearSession,
} from "../../features/auth/store/auth.slice.ts";
import { authApi } from "../../features/auth/api/auth.api.ts";
import { currentUserResponse } from "../../features/auth/utils/current-user.test-fixtures.mjs";
import { socketService } from "../socket/socket.ts";
import { baseApi } from "./baseApi.ts";
import { authBaseQuery } from "./authBaseQuery.ts";
const user = {
  id: "test-user",
  name: "Test",
  email: "test@example.invalid",
  role: "CUSTOMER",
  roles: ["CUSTOMER", "VENDOR"],
};
function createStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(authSessionMiddleware, baseApi.middleware),
  });
  store.dispatch(
    sessionRestored({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      sessionId: "integration-readiness-test",
      user: null,
    }),
  );
  store.dispatch(identityVerified(user));
  return store;
}
const json = (data, status = 200) =>
  new globalThis.Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
test("same-session role or identity changes clear cached data and sockets; same identity verification retains its cache", async () => {
  const disconnect = socketService.disconnect;
  let disconnected = 0;
  socketService.disconnect = () => {
    disconnected++;
  };
  const store = createStore();
  try {
    await store.dispatch(
      baseApi.util.upsertQueryData("getCurrentUser", undefined, currentUserResponse()),
    );
    assert.ok(Object.keys(store.getState().api.queries).length);
    const count = disconnected;
    store.dispatch(identityVerified({ ...user, name: "Updated name" }));
    assert.ok(Object.keys(store.getState().api.queries).length);
    assert.equal(disconnected, count);
    store.dispatch(identityVerified({ ...user, role: "VENDOR" }));
    assert.equal(Object.keys(store.getState().api.queries).length, 0);
    assert.equal(disconnected, count + 1);
    await store.dispatch(
      baseApi.util.upsertQueryData("getCurrentUser", undefined, currentUserResponse()),
    );
    store.dispatch(identityVerified({ ...user, id: "another-user", role: "VENDOR" }));
    assert.equal(Object.keys(store.getState().api.queries).length, 0);
    assert.equal(disconnected, count + 2);
    store.dispatch(clearSession("storage"));
    assert.equal(disconnected, count + 3);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    socketService.disconnect = disconnect;
  }
});
test("concurrent 401s share one refresh and retry the existing users/me endpoint with rotated auth headers", async () => {
  const store = createStore();
  const fetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    const path = new URL(request.url).pathname;
    const bearer = request.headers.get("authorization");
    calls.push({ path, bearer });
    assert.equal(request.headers.get("accept"), "application/json");
    if (path.endsWith("/auth/refresh"))
      return json({ accessToken: "rotated-access", refreshToken: "rotated-refresh" });
    assert.ok(path.endsWith("/users/me"));
    return bearer === "Bearer test-access"
      ? json({}, 401)
      : json(currentUserResponse());
  };
  try {
    const controller = new globalThis.AbortController();
    const api = {
      dispatch: store.dispatch,
      getState: store.getState,
      endpoint: "getCurrentUser",
      type: "query",
      forced: true,
      signal: controller.signal,
      abort: () => controller.abort(),
      extra: undefined,
    };
    const results = await Promise.all([
      authBaseQuery("/users/me", api, {}),
      authBaseQuery("/users/me", api, {}),
    ]);
    assert.ok(results.every((result) => result.data?.id));
    assert.equal(calls.filter((call) => call.path.endsWith("/auth/refresh")).length, 1);
    assert.equal(
      calls.filter((call) => call.bearer === "Bearer rotated-access").length,
      2,
    );
    assert.equal(store.getState().auth.accessToken, "rotated-access");
    assert.ok(authApi.endpoints.getCurrentUser);
  } finally {
    globalThis.fetch = fetch;
    store.dispatch(clearSession("storage"));
  }
});
test("a repeated 401 retries once and never recursively refreshes", async () => {
  const store = createStore();
  const fetch = globalThis.fetch;
  let refreshes = 0;
  let reads = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).pathname.endsWith("/auth/refresh")) {
      refreshes++;
      return json({ accessToken: "rotated-access", refreshToken: "rotated-refresh" });
    }
    reads++;
    return json({}, 401);
  };
  try {
    const controller = new globalThis.AbortController();
    const result = await authBaseQuery(
      "/users/me",
      {
        dispatch: store.dispatch,
        getState: store.getState,
        endpoint: "getCurrentUser",
        type: "query",
        signal: controller.signal,
        abort: () => controller.abort(),
      },
      {},
    );
    assert.equal(result.error.status, 401);
    assert.equal(refreshes, 1);
    assert.equal(reads, 2);
  } finally {
    globalThis.fetch = fetch;
    store.dispatch(clearSession("storage"));
  }
});
