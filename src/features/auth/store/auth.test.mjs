import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "../../../lib/testing/loadModule.mjs";

const auth = await loadModule("/src/features/auth/store/auth.slice.ts");
const selectors = await loadModule("/src/features/auth/store/auth.selectors.ts");
const { initializeSession } = await loadModule(
  "/src/features/auth/store/auth.thunks.ts",
);
const { authApi } = await loadModule("/src/features/auth/api/auth.api.ts");
const user = {
  id: "test-user",
  name: "Test",
  email: "test@example.com",
  role: "ADMIN",
};
const saved = {
  accessToken: "test-access",
  refreshToken: "test-refresh",
  sessionId: "test-session",
  user,
};

test("restored user/role does not grant access before identity verification", () => {
  const state = auth.authReducer(undefined, auth.sessionRestored(saved));
  assert.equal(state.isHydrated, false);
  assert.equal(selectors.selectIsAuthenticated({ auth: state }), false);
  assert.equal(selectors.selectCurrentRole({ auth: state }), null);
  const refreshed = auth.authReducer(state, auth.sessionUpdated(saved));
  assert.equal(refreshed.isHydrated, false);
  assert.equal(selectors.selectIsAuthenticated({ auth: refreshed }), false);
  const verified = auth.authReducer(
    refreshed,
    auth.identityVerified({ ...user, role: "CUSTOMER" }),
  );
  assert.equal(verified.isHydrated, true);
  assert.equal(selectors.selectIsAuthenticated({ auth: verified }), true);
  assert.equal(selectors.selectCurrentRole({ auth: verified }), "CUSTOMER");
});

test("network failure retains credentials without granting protected access", () => {
  let state = auth.authReducer(undefined, auth.sessionRestored(saved));
  state = auth.authReducer(
    state,
    auth.initializationFailed({ kind: "NETWORK", message: "Offline" }),
  );
  assert.equal(state.accessToken, saved.accessToken);
  assert.equal(state.refreshToken, saved.refreshToken);
  assert.equal(state.isHydrated, false);
  assert.equal(selectors.selectIsAuthenticated({ auth: state }), false);
});

test("login establishes verified identity and logout removes it", () => {
  let state = auth.authReducer(undefined, auth.sessionStarted(saved));
  assert.equal(selectors.selectIsAuthenticated({ auth: state }), true);
  state = auth.authReducer(state, auth.clearSession("invalid-session"));
  assert.equal(state.user, null);
  assert.equal(state.accessToken, null);
  assert.equal(state.isIdentityVerified, false);
  assert.equal(state.isHydrated, true);
});

async function initializeWith(unwrap) {
  let state = auth.authReducer(undefined, auth.sessionRestored(saved));
  let unsubscribed = false;
  const marker = {};
  const original = authApi.endpoints.getCurrentUser.initiate;
  authApi.endpoints.getCurrentUser.initiate = () => marker;
  const dispatch = (action) => {
    if (action === marker)
      return {
        unwrap,
        unsubscribe: () => {
          unsubscribed = true;
        },
      };
    state = auth.authReducer(state, action);
  };
  try {
    await initializeSession()(dispatch, () => ({ auth: state }));
    return { state, unsubscribed };
  } finally {
    authApi.endpoints.getCurrentUser.initiate = original;
  }
}

test("initialization verifies the server identity and releases its subscription", async () => {
  const { state, unsubscribed } = await initializeWith(async () => ({
    ...user,
    role: "CUSTOMER",
  }));
  assert.equal(state.user.role, "CUSTOMER");
  assert.equal(state.isIdentityVerified, true);
  assert.equal(unsubscribed, true);
});

test("definitive 401 clears the session while network failure keeps a retryable session", async () => {
  const invalid = await initializeWith(async () => {
    throw { status: 401 };
  });
  assert.equal(invalid.state.accessToken, null);
  assert.equal(invalid.state.isHydrated, true);
  const offline = await initializeWith(async () => {
    throw { status: "FETCH_ERROR" };
  });
  assert.equal(offline.state.accessToken, saved.accessToken);
  assert.equal(offline.state.initializationError.kind, "NETWORK");
  assert.equal(offline.state.isIdentityVerified, false);
  assert.equal(offline.unsubscribed, true);
});

test("unexpected identity shapes are retryable and do not grant access", async () => {
  const { state } = await initializeWith(async () => ({
    displayName: "Different contract",
  }));
  assert.equal(state.accessToken, saved.accessToken);
  assert.equal(state.isIdentityVerified, false);
  assert.ok(state.initializationError);
});
