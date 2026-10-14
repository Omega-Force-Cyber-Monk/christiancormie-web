import assert from "node:assert/strict";
import test from "node:test";
import { matchRoutes } from "react-router";
import { loadModule } from "../../lib/testing/loadModule.mjs";

const { ROUTES } = await loadModule("/src/constants/routes.ts");
const groups = await Promise.all(
  [
    ["admin", "ADMIN", "adminRoutes"],
    ["customer", "CUSTOMER", "customerRoutes"],
    ["vendor", "VENDOR", "vendorRoutes"],
    ["vendor-staff", "VENDOR_STAFF", "vendorStaffRoutes"],
  ].map(async ([name, role, exported]) => ({
    name,
    role,
    routes: (await loadModule(`/src/router/routes/${name}.routes.tsx`))[exported],
  })),
);
const { publicRoutes } = await loadModule("/src/router/routes/public.routes.tsx");

test("declared role routes resolve and retain the intended role guard", () => {
  for (const { name, role, routes } of groups) {
    const prefix = `/dashboard/${name}`;
    for (const path of Object.values(ROUTES).filter(
      (value) => value === prefix || value.startsWith(`${prefix}/`),
    )) {
      const matches = matchRoutes([{ path: "/dashboard", children: routes }], path);
      assert.ok(matches, `Missing route: ${path}`);
      assert.ok(
        matches.some(({ route }) => route.element?.props.allowedRoles?.includes(role)),
        `Missing guard: ${path}`,
      );
    }
  }
});

test("public and legacy routes continue resolving", () => {
  for (const key of [
    "LOGIN",
    "SIGNUP",
    "PRIVACY_POLICY",
    "TERMS_AND_CONDITIONS",
    "HELP_CENTER",
    "UNAUTHORIZED",
    ...Object.keys(ROUTES).filter((key) => key.includes("LEGACY")),
  ]) {
    assert.ok(
      matchRoutes(publicRoutes, ROUTES[key]),
      `Missing public/legacy route: ${ROUTES[key]}`,
    );
  }
});
