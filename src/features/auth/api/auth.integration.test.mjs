import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router";
import { authApi } from "./auth.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import {
  authReducer,
  sessionRestored,
  sessionStarted,
  identityVerified,
  activeRoleSelected,
  clearSession,
} from "../store/auth.slice.ts";
import { authSessionMiddleware } from "../store/auth.middleware.ts";
import { selectCurrentRole, selectIsAuthenticated } from "../store/auth.selectors.ts";
import { initializeSession } from "../store/auth.thunks.ts";
import { currentUserResponse } from "../utils/current-user.test-fixtures.mjs";
import { toAuthenticatedUser } from "../utils/authAdapters.ts";
import { normalizeAuthError } from "../utils/authErrors.ts";
import {
  signupSchema,
  toCustomerRegistration,
  toVendorRegistration,
} from "../schemas/signup.schema.ts";
import { SessionGate } from "../components/SessionGate.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { SignupForm } from "../components/forms/SignupForm.tsx";
import { EmailVerificationForm } from "../components/forms/EmailVerificationForm.tsx";
import { storedSessionSchema } from "../schemas/session.schema.ts";

const customer = {
  name: "Test Customer",
  email: "test@example.invalid",
  password: "TestPassword123!",
  dateOfBirth: "1998-05-20",
};
const vendor = {
  email: customer.email,
  password: customer.password,
  phone: "+12025550191",
  businessName: "Test Truck",
  displayName: "Test Vendor",
};
const pending = {
  success: true,
  status: "PENDING",
  message: "Registration successful. Verify the 6-digit code sent to your email.",
  email: customer.email,
};
const authResponse = (roles = ["CUSTOMER"]) => ({
  accessToken: "new-access",
  refreshToken: "new-refresh",
  user: { id: "test-user", email: customer.email, displayName: "Test", roles },
});
const json = (data, status = 201) =>
  new globalThis.Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
function createStore() {
  return configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
}
function restore(store, user = null) {
  store.dispatch(
    sessionRestored({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      sessionId: "old-session",
      user,
    }),
  );
}
async function withNetwork(respond, run) {
  const original = globalThis.fetch;
  const calls = [];
  const store = createStore();
  globalThis.fetch = async (request) => {
    const call = {
      path: new URL(request.url).pathname,
      method: request.method,
      body: request.method === "GET" ? undefined : await request.clone().json(),
      authorization: request.headers.get("authorization"),
    };
    calls.push(call);
    return respond(call, calls);
  };
  try {
    await run(store, calls);
  } finally {
    store.dispatch(baseApi.util.resetApiState());
    globalThis.fetch = original;
  }
}
const mutate = (store, endpoint, body) =>
  store.dispatch(authApi.endpoints[endpoint].initiate(body)).unwrap();
function markup(store, component) {
  return renderToStaticMarkup(
    createElement(Provider, { store }, createElement(MemoryRouter, null, component)),
  );
}

for (const [endpoint, body, path] of [
  ["registerCustomer", customer, "/auth/register/customer"],
  ["registerVendor", vendor, "/auth/register/vendor"],
]) {
  test(`${endpoint} submits its exact DTO and keeps pending verification unauthenticated`, async () => {
    await withNetwork(
      () => json(pending),
      async (store, calls) => {
        assert.deepEqual(await mutate(store, endpoint, body), pending);
        assert.deepEqual(calls, [
          { path: `/api/v1${path}`, method: "POST", body, authorization: null },
        ]);
        assert.equal(store.getState().auth.accessToken, null);
        assert.equal(selectIsAuthenticated(store.getState()), false);
        assert.equal(selectCurrentRole(store.getState()), null);
      },
    );
  });
}

test("form adapters omit UI-only fields and customer phone; vendor maps the real name without placeholders", () => {
  const values = {
    ...customer,
    accountType: "CUSTOMER",
    businessName: "",
    phone: "",
    confirmPassword: customer.password,
  };
  assert.deepEqual(toCustomerRegistration(signupSchema.parse(values)), customer);
  const vendorValues = {
    ...values,
    accountType: "VENDOR",
    phone: vendor.phone,
    businessName: vendor.businessName,
    name: vendor.displayName,
    dateOfBirth: "",
  };
  assert.deepEqual(toVendorRegistration(signupSchema.parse(vendorValues)), vendor);
  assert.equal(
    signupSchema.safeParse({ ...values, dateOfBirth: "2026-02-30" }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...vendorValues, phone: "N/A" }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...values, confirmPassword: "different" }).success,
    false,
  );
});

test("incorrect registration DTOs never reach HTTP", async () => {
  await withNetwork(
    () => {
      throw new Error("Unexpected HTTP");
    },
    async (store, calls) => {
      for (const [endpoint, body] of [
        ["registerCustomer", { ...customer, phone: vendor.phone }],
        ["registerCustomer", { ...customer, dateOfBirth: undefined }],
        ["registerCustomer", { ...customer, password: "x" }],
        ["registerCustomer", { ...customer, name: "x".repeat(151) }],
        ["registerVendor", { ...vendor, name: "Unsupported" }],
        ["registerVendor", { ...vendor, phone: "N/A" }],
        ["registerVendor", { ...vendor, address_Pickup_Location: "N/A" }],
        ["registerVendor", { ...vendor, businessName: "x".repeat(256) }],
        ["verifyEmail", { email: customer.email, code: "123" }],
      ])
        await assert.rejects(
          mutate(store, endpoint, body),
          (error) => error.status === 400,
        );
      assert.equal(calls.length, 0);
    },
  );
});

test("successful verification stores only tokens until current-user bootstrap verifies identity", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/verify-email")
        ? json(authResponse())
        : json(currentUserResponse({ roles: ["CUSTOMER"] })),
    async (store, calls) => {
      await mutate(store, "verifyEmail", { email: customer.email, code: "012345" });
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(store.getState().auth.user, null);
      assert.equal(store.getState().auth.accessToken, "new-access");
      await store.dispatch(initializeSession());
      assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
      assert.deepEqual(calls[0].body, { email: customer.email, code: "012345" });
      assert.equal(calls[1].authorization, "Bearer new-access");
    },
  );
});

for (const message of [
  "Incorrect verification code. Please check the 6-digit code and try again.",
  "Verification code has expired. Please request a new code.",
]) {
  test(`${message} remains retryable and resend does not authenticate`, async () => {
    let attempts = 0;
    await withNetwork(
      (call) =>
        call.path.endsWith("/resend-verification-code")
          ? json(pending)
          : ++attempts === 1
            ? json({ message }, 400)
            : json(authResponse()),
      async (store, calls) => {
        await assert.rejects(
          mutate(store, "verifyEmail", { email: customer.email, code: "000000" }),
          (error) => normalizeAuthError(error).message === message,
        );
        assert.equal(store.getState().auth.accessToken, null);
        await mutate(store, "resendVerificationCode", { email: customer.email });
        assert.equal(selectIsAuthenticated(store.getState()), false);
        assert.deepEqual(calls[1].body, { email: customer.email });
        await mutate(store, "verifyEmail", { email: customer.email, code: "123456" });
        assert.equal(store.getState().auth.accessToken, "new-access");
      },
    );
  });
}

test("public auth 401s never refresh or clear an existing session; failures remain recoverable", async () => {
  await withNetwork(
    () => json({ message: "Unauthorized" }, 401),
    async (store, calls) => {
      restore(store);
      for (const [endpoint, body] of [
        ["registerCustomer", customer],
        ["registerVendor", vendor],
        ["verifyEmail", { email: customer.email, code: "123456" }],
        ["resendVerificationCode", { email: customer.email }],
        ["login", { email: customer.email, password: customer.password }],
      ]) {
        await assert.rejects(mutate(store, endpoint, body));
      }
      assert.equal(calls.length, 5);
      assert.ok(calls.every((call) => call.authorization === null));
      assert.equal(store.getState().auth.refreshToken, "old-refresh");
    },
  );
});

test("malformed registration and verification success bodies cannot establish a session", async () => {
  await withNetwork(
    () => json({ success: true, data: authResponse() }),
    async (store) => {
      await assert.rejects(mutate(store, "registerCustomer", customer));
      await assert.rejects(
        mutate(store, "verifyEmail", { email: customer.email, code: "123456" }),
      );
      assert.equal(store.getState().auth.accessToken, null);
    },
  );
});

test("duplicate email and Nest DTO validation remain inline auth errors", async () => {
  for (const status of [409, 400, 429, 500]) {
    await withNetwork(
      () =>
        json(
          {
            message:
              status === 400
                ? [
                    "phone must be a valid phone number",
                    "displayName must be shorter than or equal to 150 characters",
                  ]
                : "An account already exists with this email",
          },
          status,
        ),
      async (store) => {
        await assert.rejects(mutate(store, "registerVendor", vendor), (error) => {
          const normalized = normalizeAuthError(error);
          assert.equal(normalized.status, status);
          if (status === 400) {
            assert.match(normalized.fieldErrors.phone, /phone/);
            assert.match(normalized.fieldErrors.name, /displayName/);
          }
          return true;
        });
        assert.equal(store.getState().auth.accessToken, null);
      },
    );
  }
});

for (const roles of [
  ["CUSTOMER"],
  ["ADMIN"],
  ["VENDOR_STAFF"],
  ["CUSTOMER", "VENDOR"],
  ["VENDOR", "CUSTOMER"],
]) {
  test(`login and bootstrap for ${roles.join("+")} preserve roles and require explicit multi-role choice`, async () => {
    await withNetwork(
      (call) =>
        call.path.endsWith("/login")
          ? json(authResponse(roles))
          : json(currentUserResponse({ roles })),
      async (store) => {
        await mutate(store, "login", {
          email: customer.email,
          password: customer.password,
        });
        assert.equal(selectCurrentRole(store.getState()), null);
        await store.dispatch(initializeSession());
        assert.deepEqual(store.getState().auth.user.roles, roles);
        assert.equal(selectIsAuthenticated(store.getState()), true);
        assert.equal(
          selectCurrentRole(store.getState()),
          roles.length === 1 ? roles[0] : null,
        );
        if (roles.length > 1) {
          const html = markup(
            store,
            createElement(SessionGate, null, "protected-content"),
          );
          assert.match(html, /Choose how to continue/);
          assert.doesNotMatch(html, /protected-content/);
          store.dispatch(activeRoleSelected("ADMIN"));
          assert.equal(selectCurrentRole(store.getState()), null);
          store.dispatch(activeRoleSelected("VENDOR"));
          assert.equal(selectCurrentRole(store.getState()), "VENDOR");
          assert.equal(Object.keys(store.getState().api.queries).length, 0);
          assert.deepEqual(store.getState().auth.user.roles, roles);
        }
      },
    );
  });
}

test("stored active-role hints never authorize or select a role before revalidation", async () => {
  const user = toAuthenticatedUser(
    currentUserResponse({ roles: ["CUSTOMER", "VENDOR"] }),
  );
  await withNetwork(
    () => json(currentUserResponse({ roles: ["CUSTOMER"] })),
    async (store) => {
      restore(store, { ...user, role: "VENDOR" });
      store.dispatch(activeRoleSelected("VENDOR"));
      assert.equal(selectCurrentRole(store.getState()), null);
      await store.dispatch(initializeSession());
      assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
      store.dispatch(activeRoleSelected("VENDOR"));
      assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
    },
  );
  const legacy = storedSessionSchema.parse({
    accessToken: "a",
    refreshToken: "r",
    sessionId: "s",
    user: { id: "u", name: "Name", email: customer.email, role: "VENDOR" },
  });
  assert.deepEqual(legacy.user.roles, []);
});

test("refresh accepts the actual nested backend auth user without replacing verified identity or role", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/refresh")
        ? json(authResponse(["CUSTOMER", "VENDOR"]))
        : call.authorization === "Bearer old-access"
          ? json({}, 401)
          : json(currentUserResponse({ roles: ["CUSTOMER", "VENDOR"] })),
    async (store, calls) => {
      restore(store);
      store.dispatch(
        identityVerified(
          toAuthenticatedUser(currentUserResponse({ roles: ["CUSTOMER", "VENDOR"] })),
        ),
      );
      store.dispatch(activeRoleSelected("VENDOR"));
      const user = store.getState().auth.user;
      const request = store.dispatch(authApi.endpoints.getCurrentUser.initiate());
      try {
        await request.unwrap();
      } finally {
        request.unsubscribe();
      }
      assert.equal(store.getState().auth.user, user);
      assert.equal(selectCurrentRole(store.getState()), "VENDOR");
      assert.deepEqual(calls[1].body, { refreshToken: "old-refresh" });
      assert.equal(calls.length, 3);
    },
  );
});

test("role guards reject another verified role and allow only the active role", () => {
  const store = createStore();
  restore(store);
  store.dispatch(
    identityVerified(
      toAuthenticatedUser(currentUserResponse({ roles: ["CUSTOMER", "VENDOR"] })),
    ),
  );
  const guarded = createElement(
    Routes,
    null,
    createElement(
      Route,
      { element: createElement(RoleGuard, { allowedRoles: ["VENDOR"] }) },
      createElement(Route, {
        path: "/",
        element: createElement("p", null, "vendor-protected"),
      }),
    ),
  );
  assert.equal(markup(store, guarded), "");
  store.dispatch(activeRoleSelected("CUSTOMER"));
  assert.equal(markup(store, guarded), "");
  assert.equal(selectCurrentRole(store.getState()), "CUSTOMER");
  store.dispatch(activeRoleSelected("VENDOR"));
  assert.match(markup(store, guarded), /vendor-protected/);
  store.dispatch(clearSession("storage"));
  assert.equal(selectCurrentRole(store.getState()), null);
});

test("signup retains existing form classes and exposes approved additions; verification can resume with an email", () => {
  const store = createStore();
  const signup = markup(store, createElement(SignupForm));
  assert.match(signup, /legacy-auth-form/);
  assert.match(signup, /Account type/);
  assert.match(signup, /Date of Birth/);
  assert.doesNotMatch(signup, /N\/A/);
  const verify = markup(
    store,
    createElement(EmailVerificationForm, { email: customer.email, onBack() {} }),
  );
  assert.match(verify, /one-time-code/);
  assert.match(verify, /Resend verification code/);
});

for (const endpoint of ["login", "verifyEmail"]) {
  test(`a delayed ${endpoint} success cannot replace a newer login`, async () => {
    let release;
    let started;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    await withNetwork(
      () => {
        started();
        return new Promise((resolve) => {
          release = () => resolve(json(authResponse()));
        });
      },
      async (store) => {
        restore(store);
        const request = mutate(
          store,
          endpoint,
          endpoint === "login"
            ? { email: customer.email, password: customer.password }
            : { email: customer.email, code: "123456" },
        );
        await ready;
        store.dispatch(
          sessionStarted({
            accessToken: "other-access",
            refreshToken: "other-refresh",
          }),
        );
        release();
        await request.catch(() => {});
        assert.equal(store.getState().auth.accessToken, "other-access");
        assert.equal(store.getState().auth.user, null);
      },
    );
  });
}

test("backend refresh during bootstrap still requires users/me and then explicit role choice", async () => {
  await withNetwork(
    (call) =>
      call.path.endsWith("/refresh")
        ? json(authResponse(["CUSTOMER", "VENDOR"]))
        : call.authorization === "Bearer old-access"
          ? json({}, 401)
          : json(currentUserResponse({ roles: ["CUSTOMER", "VENDOR"] })),
    async (store, calls) => {
      restore(store);
      await store.dispatch(initializeSession());
      assert.equal(store.getState().auth.isIdentityVerified, true);
      assert.equal(selectCurrentRole(store.getState()), null);
      assert.deepEqual(store.getState().auth.user.roles, ["CUSTOMER", "VENDOR"]);
      assert.equal(calls.length, 3);
    },
  );
});

for (const replacement of ["logout", "new login"]) {
  test(`a refresh completing after ${replacement} cannot revive old credentials`, async () => {
    let release;
    let started;
    const ready = new Promise((resolve) => {
      started = resolve;
    });
    await withNetwork(
      (call) => {
        if (call.path.endsWith("/refresh")) {
          started();
          return new Promise((resolve) => {
            release = () => resolve(json(authResponse()));
          });
        }
        return json({}, 401);
      },
      async (store) => {
        restore(store);
        const initialization = store.dispatch(initializeSession());
        await ready;
        if (replacement === "logout") store.dispatch(clearSession("storage"));
        else
          store.dispatch(
            sessionStarted({
              accessToken: "other-access",
              refreshToken: "other-refresh",
            }),
          );
        release();
        await initialization;
        assert.equal(
          store.getState().auth.accessToken,
          replacement === "logout" ? null : "other-access",
        );
        assert.equal(store.getState().auth.user, null);
        assert.equal(selectIsAuthenticated(store.getState()), false);
      },
    );
  });
}

test("bootstrap for an older login cannot verify a replacement session", async () => {
  let release;
  let started;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  await withNetwork(
    () => {
      started();
      return new Promise((resolve) => {
        release = () => resolve(json(currentUserResponse()));
      });
    },
    async (store) => {
      restore(store);
      const initialization = store.dispatch(initializeSession());
      await ready;
      store.dispatch(
        sessionStarted({ accessToken: "other-access", refreshToken: "other-refresh" }),
      );
      release();
      await initialization;
      assert.equal(store.getState().auth.accessToken, "other-access");
      assert.equal(selectIsAuthenticated(store.getState()), false);
      assert.equal(store.getState().auth.user, null);
    },
  );
});
