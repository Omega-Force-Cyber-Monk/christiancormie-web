import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { AppLoader } from "./AppLoader.tsx";
import { SessionGate } from "../../features/auth/components/SessionGate.tsx";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../../app/rootReducer.ts";
import {
  sessionRestored,
  identityVerified,
  initializationFailed,
} from "../../features/auth/store/auth.slice.ts";
import { baseApi } from "../../services/api/baseApi.ts";
test("one canonical loader supports page/fullscreen/inline/compact with announced text and reduced-motion support", () => {
  for (const variant of ["page", "fullscreen", "inline", "compact"]) {
    const html = renderToStaticMarkup(
      h(AppLoader, { variant, label: "Checking account", className: "custom" }),
    );
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /Checking account/);
    assert.match(html, /motion-reduce:animate-none/);
    assert.match(html, /custom/);
    assert.equal((html.match(/animate-spin/g) ?? []).length, 1);
    assert.match(html, /aria-hidden="true"/);
    if (variant === "inline") assert.ok(html.startsWith("<span"));
  }
});
test("obsolete general loaders are removed and auth/Suspense import only AppLoader", () => {
  const root = process.cwd();
  for (const path of [
    "src/components/feedback/PageLoader.tsx",
    "src/components/feedback/InlineLoader.tsx",
  ])
    assert.equal(existsSync(resolve(root, path)), false);
  for (const path of [
    "src/router/routes/lazyRoute.tsx",
    "src/features/auth/components/SessionGate.tsx",
  ]) {
    const source = readFileSync(resolve(root, path), "utf8");
    assert.match(source, /components\/ui\/AppLoader/);
    assert.doesNotMatch(source, /PageLoader|InlineLoader/);
  }
});
test("SessionGate retains its pending/error/verified conditions without exposing children during verification", () => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(baseApi.middleware),
  });
  const render = () =>
    renderToStaticMarkup(
      h(Provider, { store }, h(SessionGate, null, h("p", null, "Protected content"))),
    );
  store.dispatch(
    sessionRestored({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      sessionId: "loader-test",
      user: null,
    }),
  );
  const waiting = render();
  assert.match(waiting, /Loading page/);
  assert.doesNotMatch(waiting, /Protected content/);
  store.dispatch(
    initializationFailed({ kind: "NETWORK", message: "Connection unavailable" }),
  );
  const error = render();
  assert.match(error, /Connection unavailable/);
  assert.doesNotMatch(error, /Protected content/);
  store.dispatch(
    identityVerified({
      id: "test-user",
      name: "Test",
      email: "test@example.invalid",
      role: "VENDOR",
      roles: ["VENDOR"],
    }),
  );
  assert.match(render(), /Protected content/);
});
