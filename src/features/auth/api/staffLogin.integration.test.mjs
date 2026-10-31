import assert from "node:assert/strict";
import console from "node:console";
import test from "node:test";
import { URL } from "node:url";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, useRoutes, matchRoutes } from "react-router";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { authApi, beginStaffLogin } from "./auth.api.ts";
import { authSessionMiddleware } from "../store/auth.middleware.ts";
import {
  clearSession,
  sessionStarted,
  sessionRestored,
  identityVerified,
  activeRoleSelected,
} from "../store/auth.slice.ts";
import { initializeSession } from "../store/auth.thunks.ts";
import { selectCurrentRole, selectIsAuthenticated } from "../store/auth.selectors.ts";
import { SessionGate } from "../components/SessionGate.tsx";
import { LoginForm } from "../components/forms/LoginForm.tsx";
import { StaffLoginForm } from "../components/forms/StaffLoginForm.tsx";
import LoginPage from "../pages/LoginPage.tsx";
import { staffLoginSchema } from "../schemas/staff-login.schema.ts";
import { currentUserResponse } from "../utils/current-user.test-fixtures.mjs";
import { toAuthenticatedUser } from "../utils/authAdapters.ts";
import { normalizeApiError } from "../../../utils/errors/normalizeApiError.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { getRoleHomeRoute } from "../../../router/utils/getRoleHomeRoute.ts";
import { getNavigationForRole } from "../../../config/navigation/navigation.config.ts";
import { ROUTES } from "../../../constants/routes.ts";
import {
  vendorStaffApi,
  createVendorStaff,
  resetVendorStaffPin,
} from "../../vendor/api/vendorStaff.api.ts";
import { vendorApi } from "../../vendor/api/vendor.api.ts";
import { vendorProfileSchema } from "../../vendor/schemas/vendor.schema.ts";
import { profileDto } from "../../vendor/utils/vendor.test-fixtures.mjs";
import { socketService } from "../../../services/socket/socket.ts";

const credentials = { email: "staff@example.com", pin: "0042" };
const userId = "33333333-3333-4333-8333-333333333333";
const staffId = "44444444-4444-4444-8444-444444444444";
const vendorId = "55555555-5555-4555-8555-555555555555";
const source = (roles = ["VENDOR_STAFF"], extra = {}) => ({
  accessToken: "staff-access",
  refreshToken: "staff-refresh",
  user: {
    id: userId,
    email: credentials.email,
    displayName: "Staff",
    roles,
    staff: { id: staffId, vendorId, businessName: "Actual Vendor" },
    ...extra,
  },
});
const me = (roles = ["VENDOR_STAFF"], extra = {}) =>
  currentUserResponse({ id: userId, email: credentials.email, roles, ...extra });
const json = (body, status = 200) =>
  new globalThis.Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
const start = (store, body = credentials) =>
  beginStaffLogin(store.dispatch, store.getState, body);
function createStore(actions = []) {
  return configureStore({
    reducer: rootReducer,
    middleware: (d) =>
      d().concat(
        () => (next) => (action) => {
          actions.push(action);
          return next(action);
        },
        authSessionMiddleware,
        baseApi.middleware,
      ),
  });
}
async function withNetwork(respond, run) {
  const original = globalThis.fetch;
  const actions = [];
  const store = createStore(actions);
  const calls = [];
  globalThis.fetch = async (request) => {
    const call = {
      path: new URL(request.url).pathname,
      search: new URL(request.url).search,
      method: request.method,
      authorization: request.headers.get("authorization"),
      body: request.method === "GET" ? undefined : await request.clone().json(),
    };
    calls.push(call);
    return await respond(call, calls, request);
  };
  try {
    await run({ store, calls, actions });
  } finally {
    store.dispatch(clearSession("storage"));
    await Promise.all(store.dispatch(baseApi.util.getRunningMutationsThunk()));
    globalThis.fetch = original;
  }
}
function verify(store, roles = ["VENDOR_STAFF"]) {
  store.dispatch(
    sessionStarted({ accessToken: "staff-access", refreshToken: "staff-refresh" }),
  );
  store.dispatch(identityVerified(toAuthenticatedUser(me(roles))));
}
const markup = (store, component) =>
  renderToStaticMarkup(h(Provider, { store }, h(MemoryRouter, null, component)));
function RouteTree() {
  return useRoutes(appRoutes);
}
function routeMarkup(store, path) {
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

test("staff login sends exact public DTO with leading zeros, then waits for /users/me before any protected access", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/staff/login") ? json(source(["ADMIN"]), 201) : json(me()),
    async ({ store, calls, actions }) => {
      assert.equal(
        await start(store, {
          email: " Staff@Example.COM ",
          pin: "0042",
          password: "never-send",
          vendorId: "never-send",
        }).result,
        true,
      );
      assert.deepEqual(calls, [
        {
          path: "/api/v1/auth/staff/login",
          search: "",
          method: "POST",
          authorization: null,
          body: credentials,
        },
      ]);
      assert.equal(store.getState().auth.user, null);
      assert.equal(store.getState().auth.isIdentityVerified, false);
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(selectCurrentRole(store.getState()), null);
      assert.doesNotMatch(
        await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD),
        /Staff dashboard|Active workflows/,
      );
      await store.dispatch(initializeSession());
      assert.equal(calls[1].path, "/api/v1/users/me");
      assert.equal(calls[1].authorization, "Bearer staff-access");
      assert.equal(selectCurrentRole(store.getState()), "VENDOR_STAFF");
      assert.deepEqual(store.getState().auth.user.roles, ["VENDOR_STAFF"]);
      assert.equal(
        getRoleHomeRoute(selectCurrentRole(store.getState())),
        ROUTES.VENDOR_STAFF_DASHBOARD,
      );
      assert.doesNotMatch(JSON.stringify(actions), /"pin"|"0042"|never-send/);
      assert.doesNotMatch(JSON.stringify(store.getState()), /"pin"|"0042"/);
    },
  );
});

test("staff source user credentials/extra role hints never become profile identity or cached PINs", async () => {
  await withNetwork(
    () => json(source(["VENDOR"], { pin: "0042", passwordHash: "privatehash" }), 201),
    async ({ store, actions }) => {
      await start(store).result;
      assert.equal(store.getState().auth.user, null);
      assert.doesNotMatch(JSON.stringify(actions), /"0042"|privatehash/);
      assert.doesNotMatch(JSON.stringify(store.getState()), /"0042"|privatehash/);
    },
  );
});

test("staff PIN schema validates actual string digits and email normalization without numeric conversion", () => {
  for (const pin of ["0000", "0007", "0042", "1234", "9999"])
    assert.equal(staffLoginSchema.parse({ ...credentials, pin }).pin, pin);
  for (const pin of [
    42,
    1234,
    "",
    "42",
    "042",
    "00042",
    "abcd",
    "12 4",
    " 1234",
    "1234 ",
    "１２３４",
  ])
    assert.equal(staffLoginSchema.safeParse({ ...credentials, pin }).success, false);
  for (const email of ["", "invalid", "x@", "a b@example.com"])
    assert.equal(staffLoginSchema.safeParse({ ...credentials, email }).success, false);
});

test("invalid staff payloads and unknown/replayed handoffs never send HTTP", async () => {
  await withNetwork(
    () => {
      throw new Error("No HTTP expected");
    },
    async ({ store, calls }) => {
      for (const body of [
        { ...credentials, pin: "123" },
        { ...credentials, pin: 42 },
        { ...credentials, email: "bad" },
      ])
        await assert.rejects(start(store, body).result);
      const req = store.dispatch(
        authApi.endpoints.staffLogin.initiate({ submissionId: "not-held" }),
      );
      try {
        assert.ok((await req).error);
        assert.equal(calls.length, 0);
      } finally {
        req.reset();
      }
    },
  );
});

for (const [status, message] of [
  [401, "Invalid email or PIN"],
  [403, "This account is suspended. Please contact support."],
  [400, "Email verification is required before login."],
  [404, "Account unavailable"],
  [429, "Too Many Requests"],
  [500, "private stack 0042"],
])
  test(`staff login ${status} failure is safe, unverified, and never starts refresh or identity reads`, async () => {
    await withNetwork(
      () => json({ message }, status),
      async ({ store, calls, actions }) => {
        await assert.rejects(start(store).result, (cause) => {
          assert.equal(normalizeApiError(cause).status, status);
          assert.doesNotMatch(JSON.stringify(cause), /private stack|0042/);
          return true;
        });
        assert.equal(calls.length, 1);
        assert.equal(selectIsAuthenticated(store.getState()), false);
        assert.equal(store.getState().auth.accessToken, null);
        assert.doesNotMatch(JSON.stringify(actions), /private stack|"0042"/);
      },
    );
  });

test("failed staff login with an existing session sends no Bearer token and does not refresh/clear that session", async () => {
  await withNetwork(
    () => json({ message: "Invalid email or PIN" }, 401),
    async ({ store, calls }) => {
      verify(store, ["CUSTOMER"]);
      const before = store.getState().auth;
      await assert.rejects(start(store).result);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].authorization, null);
      assert.deepEqual(store.getState().auth, before);
    },
  );
});

test("validation arrays and structured fields redact PINs before actions/cache and only map reliable DTO fields", async () => {
  await withNetwork(
    () =>
      json(
        {
          message: [
            "PIN must be exactly 4 digits",
            "Email must be a valid email address",
            "Rejected 0042",
          ],
          errors: { pin: "PIN 0042 rejected", unrelated: "0042" },
          details: { supplied: "0042" },
        },
        400,
      ),
    async ({ store, actions }) => {
      await assert.rejects(start(store).result, (cause) => {
        const e = normalizeApiError(cause);
        assert.equal(e.validationMessages.length, 3);
        assert.match(e.fieldErrors.pin, /redacted/);
        assert.equal(e.fieldErrors.email, "Email must be a valid email address");
        assert.equal(e.fieldErrors.unrelated, undefined);
        assert.equal(e.details, undefined);
        assert.doesNotMatch(JSON.stringify(cause), /0042/);
        return true;
      });
      assert.doesNotMatch(
        JSON.stringify(actions.filter((a) => a.type.endsWith("/rejected"))),
        /0042/,
      );
    },
  );
});

test("network failure preserves safe error handling and permits explicit successful retry", async () => {
  await withNetwork(
    (_call, calls) => {
      if (calls.length === 1) throw new TypeError("offline 0042");
      return json(source(), 201);
    },
    async ({ store }) => {
      await assert.rejects(
        start(store).result,
        (e) => normalizeApiError(e).kind === "NETWORK",
      );
      assert.equal(await start(store).result, true);
      assert.equal(store.getState().auth.isIdentityVerified, false);
    },
  );
});

for (const malformed of [
  {},
  { ...source(), refreshToken: "" },
  { ...source(), user: null },
  { ...source(), user: { roles: "VENDOR_STAFF" } },
  { data: source() },
])
  test(`malformed staff auth response (${JSON.stringify(malformed)}) cannot establish a session`, async () => {
    await withNetwork(
      () => json(malformed, 201),
      async ({ store }) => {
        await assert.rejects(start(store).result);
        assert.equal(store.getState().auth.accessToken, null);
      },
    );
  });

test("verified multi-role staff membership retains full set and uses existing chooser without owner precedence", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/staff/login")
        ? json(source(), 201)
        : json(me(["CUSTOMER", "VENDOR_STAFF", "FUTURE_ROLE"])),
    async ({ store }) => {
      await start(store).result;
      await store.dispatch(initializeSession());
      assert.deepEqual(store.getState().auth.user.roles, [
        "CUSTOMER",
        "VENDOR_STAFF",
        "FUTURE_ROLE",
      ]);
      assert.equal(selectCurrentRole(store.getState()), null);
      const html = markup(store, h(SessionGate, null, "Protected"));
      assert.match(html, /Choose how to continue/);
      assert.match(html, /Continue as vendor staff/);
      assert.doesNotMatch(html, /Continue as vendor<|Protected/);
      store.dispatch(activeRoleSelected("VENDOR"));
      assert.equal(selectCurrentRole(store.getState()), null);
      store.dispatch(activeRoleSelected("VENDOR_STAFF"));
      assert.equal(selectCurrentRole(store.getState()), "VENDOR_STAFF");
    },
  );
});

test("removed staff role at /users/me never grants staff access even if source login advertised it", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/staff/login") ? json(source(), 201) : json(me(["CUSTOMER"])),
    async ({ store }) => {
      await start(store).result;
      await store.dispatch(initializeSession());
      assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
      assert.equal(await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD), "");
    },
  );
});

for (const status of [403, 404, 500])
  test(`/users/me ${status} blocks staff content and preserves retryable unverified session`, async () => {
    await withNetwork(
      (call) =>
        call.path.endsWith("/staff/login")
          ? json(source(), 201)
          : json({ message: "Identity unavailable" }, status),
      async ({ store }) => {
        await start(store).result;
        await store.dispatch(initializeSession());
        assert.equal(selectIsAuthenticated(store.getState()), false);
        assert.equal(store.getState().auth.isHydrated, false);
        assert.ok(store.getState().auth.initializationError);
        assert.doesNotMatch(
          await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD),
          /Staff dashboard|Active workflows/,
        );
        assert.equal(store.getState().auth.accessToken, "staff-access");
      },
    );
  });

test("malformed /users/me cannot verify the token response user", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/staff/login")
        ? json(source(), 201)
        : json({ id: userId, roles: ["VENDOR_STAFF"] }),
    async ({ store }) => {
      await start(store).result;
      await store.dispatch(initializeSession());
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(selectCurrentRole(store.getState()), null);
    },
  );
});

test("staff routes admit verified singleton staff, retain safe layout/navigation, and make no owner/profile/G13 dependency calls", async () => {
  await withNetwork(
    () => {
      throw new Error("Staff preview must not call APIs");
    },
    async ({ store, calls }) => {
      verify(store);
      const dashboard = await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD);
      assert.match(dashboard, /Staff dashboard/);
      assert.match(dashboard, /Staff statistics unavailable/);
      assert.match(dashboard, /Activity trend/);
      assert.match(dashboard, /Sign out/);
      assert.doesNotMatch(
        dashboard,
        />24<|>8<|\+12%|Example responsive chart|Staff Management|owner analytics/,
      );
      const tasks = await routeMarkup(store, ROUTES.VENDOR_STAFF_TASKS);
      assert.match(tasks, /Task management is unavailable/);
      assert.doesNotMatch(tasks, /Task queues are scoped|sample task/);
      assert.equal(calls.length, 0);
      assert.deepEqual(
        getNavigationForRole("VENDOR_STAFF").map((n) => n.path),
        [ROUTES.VENDOR_STAFF_DASHBOARD, ROUTES.VENDOR_STAFF_TASKS],
      );
      for (const path of [ROUTES.VENDOR_STAFF_DASHBOARD, ROUTES.VENDOR_STAFF_TASKS]) {
        const matches = matchRoutes(appRoutes, path);
        assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
        assert.deepEqual(
          matches.find(({ route }) => route.element?.type === RoleGuard).route.element
            .props.allowedRoles,
          ["VENDOR_STAFF"],
        );
      }
    },
  );
});

test("staff cannot mount owner Settings, owner analytics or Admin routes", async () => {
  await withNetwork(
    () => {
      throw new Error("Denied route must not call APIs");
    },
    async ({ store, calls }) => {
      verify(store);
      for (const path of [
        ROUTES.VENDOR_SETTINGS,
        ROUTES.VENDOR_DASHBOARD,
        ROUTES.VENDOR_EARNINGS,
        ROUTES.ADMIN_DASHBOARD,
      ])
        assert.equal(await routeMarkup(store, path), "");
      assert.equal(calls.length, 0);
    },
  );
});

test("all owner staff-management operations deny staff before HTTP even with a seeded vendor profile", async () => {
  await withNetwork(
    () => {
      throw new Error("No owner HTTP");
    },
    async ({ store, calls }) => {
      verify(store);
      await store.dispatch(
        vendorApi.util.upsertQueryData(
          "getVendorMe",
          undefined,
          vendorProfileSchema.parse(profileDto({ userId })),
        ),
      );
      const scope = {
        sessionId: store.getState().auth.sessionId,
        userId,
        role: "VENDOR_STAFF",
      };
      const read = store.dispatch(
        vendorStaffApi.endpoints.getVendorStaff.initiate(scope),
      );
      const del = store.dispatch(
        vendorStaffApi.endpoints.deleteVendorStaff.initiate({
          scope,
          staffId,
          confirmed: true,
        }),
      );
      try {
        assert.ok((await read).error);
        assert.ok((await del).error);
        await assert.rejects(createVendorStaff(store.dispatch, scope, credentials));
        await assert.rejects(
          resetVendorStaffPin(store.dispatch, scope, staffId, { pin: credentials.pin }),
        );
        assert.equal(calls.length, 0);
      } finally {
        read.unsubscribe();
        del.reset();
      }
    },
  );
});

test("persisted staff role is reverified on reload; switching role clears prior caches", async () => {
  await withNetwork(
    () => json(me(["CUSTOMER", "VENDOR_STAFF"])),
    async ({ store }) => {
      const user = toAuthenticatedUser(me());
      store.dispatch(
        sessionRestored({
          sessionId: "restored-staff",
          accessToken: "staff-access",
          refreshToken: "staff-refresh",
          user,
        }),
      );
      assert.equal(selectCurrentRole(store.getState()), null);
      assert.doesNotMatch(
        await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD),
        /Staff dashboard/,
      );
      await store.dispatch(initializeSession());
      assert.equal(selectCurrentRole(store.getState()), null);
      store.dispatch(activeRoleSelected("VENDOR_STAFF"));
      await store.dispatch(
        authApi.util.upsertQueryData(
          "getCurrentUser",
          undefined,
          me(["CUSTOMER", "VENDOR_STAFF"]),
        ),
      );
      store.dispatch(activeRoleSelected("CUSTOMER"));
      assert.equal(
        authApi.endpoints.getCurrentUser.select()(store.getState()).data,
        undefined,
      );
      assert.equal(await routeMarkup(store, ROUTES.VENDOR_STAFF_TASKS), "");
    },
  );
});

test("staff JWT refresh preserves verified identity/role and retries once", async () => {
  await withNetwork(
    (call, calls) =>
      call.path.endsWith("/auth/refresh")
        ? json({
            accessToken: "rotated-access",
            refreshToken: "rotated-refresh",
            user: source(["ADMIN"]).user,
          })
        : calls.length === 1
          ? json({ message: "Expired JWT" }, 401)
          : json(me()),
    async ({ store, calls }) => {
      verify(store);
      const before = store.getState().auth.user;
      const req = store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true }),
      );
      try {
        await req.unwrap();
        assert.equal(calls.length, 3);
        assert.equal(calls[1].path, "/api/v1/auth/refresh");
        assert.equal(calls[2].authorization, "Bearer rotated-access");
        assert.deepEqual(store.getState().auth.user, before);
        assert.equal(selectCurrentRole(store.getState()), "VENDOR_STAFF");
      } finally {
        req.unsubscribe();
      }
    },
  );
});

test("rejected refresh clears staff session and protected content", async () => {
  await withNetwork(
    () => json({ message: "Invalid or expired token" }, 401),
    async ({ store, calls }) => {
      verify(store);
      const req = store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true }),
      );
      try {
        // RTK resets this query entry during invalid-session cleanup; its outer
        // promise may settle without a payload. Check the actual security state.
        await req;
        assert.equal(calls.length, 2);
        assert.equal(store.getState().auth.accessToken, null);
        assert.equal(await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD), "");
      } finally {
        req.unsubscribe();
      }
    },
  );
});

test("staff logout revokes captured refresh token, clears caches/socket, and permits a later login", async () => {
  const originalDisconnect = socketService.disconnect;
  let disconnects = 0;
  socketService.disconnect = () => {
    disconnects++;
  };
  try {
    await withNetwork(
      (call) =>
        call.path.endsWith("/logout")
          ? json({ success: true }, 201)
          : json(source(), 201),
      async ({ store, calls }) => {
        verify(store);
        const before = disconnects;
        await store.dispatch(
          authApi.util.upsertQueryData("getCurrentUser", undefined, me()),
        );
        store.dispatch(clearSession());
        assert.equal(selectIsAuthenticated(store.getState()), false);
        assert.equal(
          authApi.endpoints.getCurrentUser.select()(store.getState()).data,
          undefined,
        );
        assert.ok(disconnects > before);
        await Promise.all(store.dispatch(baseApi.util.getRunningMutationsThunk()));
        assert.equal(calls[0].path, "/api/v1/auth/logout");
        assert.equal(calls[0].authorization, "Bearer staff-access");
        assert.deepEqual(calls[0].body, { refreshToken: "staff-refresh" });
        assert.equal(await start(store).result, true);
        assert.equal(store.getState().auth.isIdentityVerified, false);
      },
    );
  } finally {
    socketService.disconnect = originalDisconnect;
  }
});

test("concurrent staff login requests submit once and never choose a role from the response", async () => {
  let release;
  let entered;
  const ready = new Promise((r) => {
    entered = r;
  });
  await withNetwork(
    async () => {
      entered();
      return await new Promise((r) => {
        release = () => r(json(source(), 201));
      });
    },
    async ({ store, calls }) => {
      const first = start(store);
      try {
        await ready;
        await assert.rejects(start(store).result);
        assert.equal(calls.length, 1);
        release();
        assert.equal(await first.result, true);
        assert.equal(selectCurrentRole(store.getState()), null);
      } finally {
        release?.();
        await first.result.catch(() => {});
      }
    },
  );
});

for (const replacement of [
  "logout while already guest",
  "storage clear",
  "cross-tab new session",
  "new login",
  "cancel for mode switch/unmount",
])
  test(`late staff login cannot override ${replacement}`, async () => {
    let release;
    let entered;
    const ready = new Promise((r) => {
      entered = r;
    });
    await withNetwork(
      async () => {
        entered();
        return await new Promise((r) => {
          release = () => r(json(source(), 201));
        });
      },
      async ({ store }) => {
        const first = start(store);
        const settled = first.result.catch(() => false);
        try {
          await ready;
          if (replacement === "logout while already guest")
            store.dispatch(clearSession());
          else if (replacement === "storage clear")
            store.dispatch(clearSession("storage"));
          else if (replacement === "cross-tab new session")
            store.dispatch(
              sessionRestored({
                sessionId: "other-tab",
                accessToken: "other-access",
                refreshToken: "other-refresh",
                user: null,
              }),
            );
          else if (replacement === "new login")
            store.dispatch(
              sessionStarted({
                accessToken: "other-access",
                refreshToken: "other-refresh",
              }),
            );
          else first.cancel();
          const expected = store.getState().auth;
          release();
          assert.equal(await settled, false);
          assert.deepEqual(store.getState().auth, expected);
        } finally {
          release?.();
          await settled;
        }
      },
    );
  });

test("PIN and auth transport internals never enter storage or logs", async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const saved = new Map();
  const logs = [];
  const originals = Object.fromEntries(
    ["debug", "info", "warn", "error"].map((key) => [key, console[key]]),
  );
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (k) => saved.get(k) ?? null,
        setItem: (k, v) => saved.set(k, v),
        removeItem: (k) => saved.delete(k),
      },
    },
  });
  for (const key of Object.keys(originals)) console[key] = (...args) => logs.push(args);
  try {
    await withNetwork(
      (call) => (call.path.endsWith("/staff/login") ? json(source(), 201) : json(me())),
      async ({ store }) => {
        await start(store).result;
        await store.dispatch(initializeSession());
        assert.ok(saved.size > 0);
        assert.doesNotMatch(JSON.stringify([...saved.values()]), /0042|"pin"/);
        assert.doesNotMatch(JSON.stringify(logs), /0042|"pin"/);
      },
    );
  } finally {
    Object.assign(console, originals);
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    else delete globalThis.window;
  }
});

test("login mode controls preserve existing regular login while staff has an independent masked PIN form", () => {
  const store = createStore();
  try {
    const html = markup(store, h(LoginForm));
    assert.match(html, /Regular Login/);
    assert.match(html, /Staff Login/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /Password/);
    assert.match(html, /Register/);
    const staff = markup(store, h(StaffLoginForm));
    assert.match(staff, /Staff PIN/);
    assert.match(staff, /type="password"/);
    assert.match(staff, /inputMode="numeric"/);
    assert.match(staff, /maxLength="4"/);
    assert.doesNotMatch(
      staff,
      /name="password"|Show password|type="number"|value="0042"/,
    );
    const page = markup(store, h(LoginPage));
    assert.match(page, /legacy-auth-shell/);
    assert.match(page, /Bite Drop account access/);
    assert.match(page, /md:w-1\/2/);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
  }
});

test("temporary identity failure retries /users/me without resubmitting the staff PIN", async () => {
  let reads = 0;
  await withNetwork(
    (call) => {
      if (call.path.endsWith("/staff/login")) return json(source(), 201);
      reads++;
      return reads === 1 ? json({ message: "Temporary failure" }, 500) : json(me());
    },
    async ({ store, calls }) => {
      await start(store).result;
      await store.dispatch(initializeSession());
      assert.equal(selectIsAuthenticated(store.getState()), false);
      await store.dispatch(initializeSession());
      assert.equal(selectCurrentRole(store.getState()), "VENDOR_STAFF");
      assert.equal(
        calls.filter((call) => call.path.endsWith("/staff/login")).length,
        1,
      );
      assert.equal(reads, 2);
    },
  );
});

test("a new regular login wins over an earlier pending staff login without shared credential payloads", async () => {
  let release;
  let entered;
  const ready = new Promise((r) => {
    entered = r;
  });
  await withNetwork(
    async (call) => {
      if (call.path.endsWith("/staff/login")) {
        entered();
        return await new Promise((r) => {
          release = () => r(json(source(), 201));
        });
      }
      assert.deepEqual(call.body, {
        email: "customer@example.com",
        password: "test-password",
      });
      return json(
        {
          ...source(["CUSTOMER"]),
          accessToken: "regular-access",
          refreshToken: "regular-refresh",
        },
        201,
      );
    },
    async ({ store }) => {
      const staff = start(store);
      const settled = staff.result.catch(() => false);
      try {
        await ready;
        const regular = store.dispatch(
          authApi.endpoints.login.initiate({
            email: "customer@example.com",
            password: "test-password",
          }),
        );
        await regular.unwrap();
        regular.reset();
        release();
        assert.equal(await settled, false);
        assert.equal(store.getState().auth.accessToken, "regular-access");
      } finally {
        release?.();
        await settled;
      }
    },
  );
});

test("an account with verified owner and staff roles must choose explicitly; active Staff still cannot enter owner routes", async () => {
  await withNetwork(
    () => {
      throw new Error("No API needed");
    },
    async ({ store }) => {
      verify(store, ["CUSTOMER", "VENDOR", "VENDOR_STAFF"]);
      assert.equal(selectCurrentRole(store.getState()), null);
      store.dispatch(activeRoleSelected("VENDOR_STAFF"));
      assert.equal(await routeMarkup(store, ROUTES.VENDOR_SETTINGS), "");
      assert.match(
        await routeMarkup(store, ROUTES.VENDOR_STAFF_DASHBOARD),
        /Staff dashboard/,
      );
      assert.deepEqual(store.getState().auth.user.roles, [
        "CUSTOMER",
        "VENDOR",
        "VENDOR_STAFF",
      ]);
    },
  );
});

test("public staff login neither waits for an older token refresh nor lets that refresh override its new session", async () => {
  let release;
  let entered;
  const ready = new Promise((r) => {
    entered = r;
  });
  await withNetwork(
    async (call) => {
      if (call.path.endsWith("/users/me")) return json({ message: "Expired" }, 401);
      if (call.path.endsWith("/auth/refresh")) {
        entered();
        return await new Promise((r) => {
          release = () =>
            r(
              json({ accessToken: "old-rotated", refreshToken: "old-rotated-refresh" }),
            );
        });
      }
      assert.equal(call.path, "/api/v1/auth/staff/login");
      assert.equal(call.authorization, null);
      return json(source(), 201);
    },
    async ({ store }) => {
      verify(store, ["CUSTOMER"]);
      const req = store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true }),
      );
      try {
        await ready;
        assert.equal(await start(store).result, true);
        release();
        await req;
        assert.equal(store.getState().auth.accessToken, "staff-access");
        assert.equal(store.getState().auth.isIdentityVerified, false);
      } finally {
        release?.();
        req.unsubscribe();
      }
    },
  );
});

test("late failed staff authentication is silent after guest storage-clear or cancellation", async () => {
  for (const mode of ["storage clear", "cancel"]) {
    let release;
    let entered;
    const ready = new Promise((r) => {
      entered = r;
    });
    await withNetwork(
      async () => {
        entered();
        return await new Promise((r) => {
          release = () => r(json({ message: "Invalid email or PIN" }, 401));
        });
      },
      async ({ store }) => {
        const req = start(store);
        try {
          await ready;
          if (mode === "cancel") req.cancel();
          else store.dispatch(clearSession("storage"));
          release();
          assert.equal(await req.result, false);
          assert.equal(store.getState().auth.accessToken, null);
        } finally {
          release?.();
          await req.result.catch(() => {});
        }
      },
    );
  }
});
