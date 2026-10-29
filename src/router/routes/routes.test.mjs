import assert from "node:assert/strict";
import test from "node:test";
import { matchRoutes } from "react-router";
import { ROUTES } from "../../constants/routes.ts";
import { adminRoutes } from "./admin.routes.tsx";
import { customerRoutes } from "./customer.routes.tsx";
import { vendorHomeRoutes, vendorRoutes } from "./vendor.routes.tsx";
import { vendorStaffRoutes } from "./vendor-staff.routes.tsx";
import { publicRoutes } from "./public.routes.tsx";

const groups = [
  { name: "admin", role: "ADMIN", routes: adminRoutes },
  { name: "customer", role: "CUSTOMER", routes: customerRoutes },
  { name: "vendor", role: "VENDOR", routes: [...vendorHomeRoutes, ...vendorRoutes] },
  { name: "vendor-staff", role: "VENDOR_STAFF", routes: vendorStaffRoutes },
];

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
