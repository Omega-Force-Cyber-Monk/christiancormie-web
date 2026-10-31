import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { authSessionMiddleware } from "../../auth/store/auth.middleware.ts";
import {
  clearSession,
  sessionRestored,
  identityVerified,
  activeRoleSelected,
} from "../../auth/store/auth.slice.ts";
import { vendorApi } from "../api/vendor.api.ts";
import {
  vendorStaffApi,
  createVendorStaff,
  resetVendorStaffPin,
} from "../api/vendorStaff.api.ts";
import {
  vendorStaffListSchema,
  vendorStaffDeleteSchema,
} from "../schemas/vendorStaff.schema.ts";
import {
  createVendorStaffSchema,
  vendorStaffPinSchema,
} from "../schemas/settings.schema.ts";
import { VendorStaffManagement } from "../components/settings/VendorStaffManagement.tsx";
import { normalizeApiError } from "../../../utils/errors/normalizeApiError.ts";
import {
  profileDto,
  ownerId,
  vendorId,
  json,
  seedVendorHome,
} from "./vendor.test-fixtures.mjs";

const staffId = "11111111-1111-4111-8111-111111111111";
const otherId = "22222222-2222-4222-8222-222222222222";
const staffDto = (extra = {}) => ({
  id: staffId,
  email: "actual.staff@example.com",
  pin: "0042",
  status: "ACTIVE",
  addedAt: "2026-10-29T12:00:00Z",
  ...extra,
});
const scopeFor = (store) => ({
  sessionId: store.getState().auth.sessionId ?? "",
  userId: store.getState().auth.user?.id ?? "",
  role: store.getState().auth.user?.role ?? "",
});
const clean = (store) => store.dispatch(baseApi.util.resetApiState());
const render = (store) =>
  renderToStaticMarkup(
    h(Provider, { store }, h(VendorStaffManagement, { onBack() {} })),
  );
async function setup({
  role = "VENDOR",
  profile = profileDto(),
  records = [staffDto()],
  verified = true,
} = {}) {
  const actions = [];
  const store = configureStore({
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
  store.dispatch(
    sessionRestored({
      sessionId: "staff-test-session",
      accessToken: "test-access",
      refreshToken: "test-refresh",
      user: null,
    }),
  );
  if (verified)
    store.dispatch(
      identityVerified({
        id: ownerId,
        name: "Owner",
        email: "owner@example.com",
        roles: role === "VENDOR" ? ["CUSTOMER", "VENDOR"] : [role],
        role,
      }),
    );
  await seedVendorHome(store, { profile });
  const scope = scopeFor(store);
  await store.dispatch(
    vendorStaffApi.util.upsertQueryData(
      "getVendorStaff",
      scope,
      vendorStaffListSchema.parse({ items: records }),
    ),
  );
  return { store, scope, actions };
}
async function withFetch(mock, run) {
  const original = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}
function remove(store, scope, id = staffId, confirmed = true) {
  return store.dispatch(
    vendorStaffApi.endpoints.deleteVendorStaff.initiate({
      scope,
      staffId: id,
      confirmed,
    }),
  );
}
const changed = (extra = {}) =>
  staffDto({ message: "Staff operation confirmed", ...extra });

test("staff GET uses JWT and actor-scoped path, validates items and strips all PIN/private material", async () => {
  const { store, scope, actions } = await setup();
  await withFetch(
    async (req) => {
      assert.equal(req.method, "GET");
      assert.equal(new URL(req.url).pathname, "/api/v1/vendors/me/staff");
      assert.equal(new URL(req.url).search, "");
      assert.equal(req.headers.get("authorization"), "Bearer test-access");
      assert.equal(await req.text(), "");
      return json({
        items: [
          staffDto({ pinHash: "private-hash", pinEncrypted: "private-encrypted" }),
        ],
      });
    },
    async () => {
      const req = store.dispatch(
        vendorStaffApi.endpoints.getVendorStaff.initiate(scope, { forceRefetch: true }),
      );
      try {
        const data = await req.unwrap();
        assert.deepEqual(Object.keys(data.items[0]).sort(), [
          "addedAt",
          "email",
          "id",
          "status",
        ]);
        assert.doesNotMatch(
          JSON.stringify(store.getState()),
          /0042|private-hash|private-encrypted/,
        );
        assert.doesNotMatch(
          JSON.stringify(actions),
          /0042|private-hash|private-encrypted/,
        );
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

test("create sends normalized email and exact string PIN, preserves zeros and omits unsupported fields", async () => {
  const { store, scope, actions } = await setup();
  await withFetch(
    async (req) => {
      assert.equal(req.method, "POST");
      assert.equal(new URL(req.url).pathname, "/api/v1/vendors/me/staff");
      assert.equal(req.headers.get("authorization"), "Bearer test-access");
      assert.deepEqual(await req.json(), {
        email: "actual.staff@example.com",
        pin: "0042",
      });
      return json(changed(), 201);
    },
    async () => {
      try {
        const result = await createVendorStaff(store.dispatch, scope, {
          email: " Actual.Staff@Example.COM ",
          pin: "0042",
          vendorId: "forged",
          name: "unsupported",
        });
        assert.equal(result.id, staffId);
        assert.equal(result.pin, undefined);
        assert.doesNotMatch(JSON.stringify(actions), /0042|pinEncrypted|pinHash/);
        assert.doesNotMatch(JSON.stringify(store.getState()), /0042/);
      } finally {
        clean(store);
      }
    },
  );
});

test("reset sends only PIN to selected real staff UUID and verifies returned identity", async () => {
  const { store, scope, actions } = await setup({
    records: [staffDto(), staffDto({ id: otherId, email: "second@example.com" })],
  });
  await withFetch(
    async (req) => {
      assert.equal(
        new URL(req.url).pathname,
        `/api/v1/vendors/me/staff/${otherId}/reset-pin`,
      );
      assert.equal(req.method, "POST");
      assert.deepEqual(await req.json(), { pin: "0007" });
      return json(
        changed({ id: otherId, email: "second@example.com", pin: "0007" }),
        201,
      );
    },
    async () => {
      try {
        const result = await resetVendorStaffPin(store.dispatch, scope, otherId, {
          pin: "0007",
        });
        assert.equal(result.id, otherId);
        assert.equal(result.pin, undefined);
        assert.doesNotMatch(JSON.stringify(actions), /"0007"/);
        assert.doesNotMatch(JSON.stringify(store.getState()), /"0007"/);
      } finally {
        clean(store);
      }
    },
  );
});

test("delete uses selected UUID with no body and requires literal deleted:true", async () => {
  const { store, scope } = await setup();
  await withFetch(
    async (req) => {
      assert.equal(req.method, "DELETE");
      assert.equal(new URL(req.url).pathname, `/api/v1/vendors/me/staff/${staffId}`);
      assert.equal(await req.text(), "");
      return json({ deleted: true, message: "Staff member deleted successfully" });
    },
    async () => {
      const req = remove(store, scope);
      try {
        assert.equal((await req.unwrap()).deleted, true);
      } finally {
        req.reset();
        clean(store);
      }
    },
  );
  for (const deleted of [false, "true", null, undefined])
    assert.equal(
      vendorStaffDeleteSchema.safeParse({ deleted, message: "ok" }).success,
      false,
    );
});

test("PIN schemas reject all but four numeric string digits; email normalizes without numeric PIN conversion", () => {
  for (const pin of ["0000", "0007", "1234", "9999"])
    assert.equal(vendorStaffPinSchema.parse({ pin }).pin, pin);
  for (const pin of [
    7,
    1234,
    "123",
    "12345",
    "12a4",
    "12 4",
    " 1234",
    "1234 ",
    "１２３４",
    "",
  ])
    assert.equal(vendorStaffPinSchema.safeParse({ pin }).success, false);
  for (const email of ["", "invalid", "name@", "a b@example.com"])
    assert.equal(
      createVendorStaffSchema.safeParse({ email, pin: "0042" }).success,
      false,
    );
  assert.equal(
    createVendorStaffSchema.parse({ email: " Staff@Example.com ", pin: "0042" }).email,
    "staff@example.com",
  );
});

for (const [label, options, alter] of [
  ["staff role", { role: "VENDOR_STAFF" }],
  ["Customer role", { role: "CUSTOMER" }],
  ["Admin role", { role: "ADMIN" }],
  ["unverified identity", { verified: false }],
  ["foreign owner", { profile: profileDto({ userId: otherId }) }],
  [
    "restricted dashboard",
    {
      profile: profileDto({
        dashboardAccess: {
          allowed: false,
          status: "ONBOARDING_REQUIRED",
          reason: "Restricted",
        },
      }),
    },
  ],
  ["suspended vendor", { profile: profileDto({ status: "SUSPENDED" }) }],
  ["restricted user", { profile: profileDto({ user: { status: "BLOCKED" } }) }],
  ["old session", {}, (scope) => ({ ...scope, sessionId: "obsolete" })],
  ["wrong user", {}, (scope) => ({ ...scope, userId: otherId })],
])
  test(`all staff operations deny ${label} before HTTP`, async () => {
    const { store, scope: actual } = await setup(options);
    const scope = alter ? alter(actual) : actual;
    let calls = 0;
    await withFetch(
      async () => {
        calls++;
        return json({});
      },
      async () => {
        const read = store.dispatch(
          vendorStaffApi.endpoints.getVendorStaff.initiate(scope, {
            forceRefetch: true,
          }),
        );
        const del = remove(store, scope);
        try {
          assert.ok((await read).error);
          assert.ok((await del).error);
          await assert.rejects(
            createVendorStaff(store.dispatch, scope, {
              email: "actual.staff@example.com",
              pin: "0042",
            }),
          );
          await assert.rejects(
            resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" }),
          );
          assert.equal(calls, 0);
        } finally {
          read.unsubscribe();
          del.reset();
          clean(store);
        }
      },
    );
  });

test("invalid payloads, absent selections and missing confirmation never send HTTP", async () => {
  const { store, scope } = await setup();
  let calls = 0;
  await withFetch(
    async () => {
      calls++;
      return json({});
    },
    async () => {
      try {
        for (const body of [
          { email: "bad", pin: "0042" },
          { email: "a@example.com", pin: "42" },
          { email: "a@example.com", pin: 1234 },
        ])
          await assert.rejects(createVendorStaff(store.dispatch, scope, body));
        for (const id of [otherId, "sample-jake", ""]) {
          await assert.rejects(
            resetVendorStaffPin(store.dispatch, scope, id, { pin: "0042" }),
          );
          const req = remove(store, scope, id);
          assert.ok((await req).error);
          req.reset();
        }
        const unconfirmed = remove(store, scope, staffId, false);
        assert.ok((await unconfirmed).error);
        unconfirmed.reset();
        const replay = store.dispatch(
          vendorStaffApi.endpoints.createVendorStaff.initiate({
            scope,
            submissionId: "not-a-draft",
          }),
        );
        assert.ok((await replay).error);
        replay.reset();
        assert.equal(calls, 0);
      } finally {
        clean(store);
      }
    },
  );
});

for (const [status, data] of [
  [
    400,
    {
      message: [
        "Staff PIN must be exactly 4 digits",
        "Staff email must be a valid email address",
      ],
    },
  ],
  [
    400,
    {
      message: "This email belongs to an account that cannot be used for staff",
      errors: { email: "Account cannot be used" },
    },
  ],
  [403, { message: "Vendor access restricted" }],
  [404, { message: "Staff member not found" }],
  [409, { message: "Staff member already exists for this vendor" }],
  [409, { message: "This email is already assigned as staff for another vendor" }],
  [500, { message: "private server stack and 0042", errors: { pin: "0042" } }],
])
  test(`staff mutation safely preserves useful ${status} error (${data.message})`, async () => {
    const { store, scope, actions } = await setup();
    await withFetch(
      async () => json(data, status),
      async () => {
        try {
          await assert.rejects(
            createVendorStaff(store.dispatch, scope, {
              email: "actual.staff@example.com",
              pin: "0042",
            }),
            (cause) => {
              const e = normalizeApiError(cause);
              assert.equal(e.status, status);
              if (status === 400 && Array.isArray(data.message))
                assert.equal(e.validationMessages.length, 2);
              if (data.errors?.email)
                assert.equal(e.fieldErrors.email, "Account cannot be used");
              assert.doesNotMatch(JSON.stringify(cause), /private server|0042/);
              return true;
            },
          );
          assert.doesNotMatch(JSON.stringify(actions), /private server|0042/);
        } finally {
          clean(store);
        }
      },
    );
  });

test("PIN-bearing error text is redacted before actions/cache and failed mutation does not show success", async () => {
  const { store, scope, actions } = await setup();
  await withFetch(
    async () =>
      json({ message: "Rejected PIN 0042", errors: { pin: "0042 is invalid" } }, 400),
    async () => {
      try {
        await assert.rejects(
          resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" }),
          (e) => {
            assert.doesNotMatch(JSON.stringify(e), /0042/);
            return true;
          },
        );
        assert.doesNotMatch(JSON.stringify(actions), /0042/);
        assert.equal(
          vendorStaffApi.endpoints.getVendorStaff.select(scope)(store.getState()).data
            .items.length,
          1,
        );
        assert.doesNotMatch(render(store), /Staff PIN reset\./);
      } finally {
        clean(store);
      }
    },
  );
});

test("network failure is recoverable and never clears staff rows optimistically", async () => {
  const { store, scope } = await setup();
  await withFetch(
    async () => {
      throw new TypeError("test offline");
    },
    async () => {
      const req = remove(store, scope);
      try {
        assert.ok((await req).error);
        assert.equal(
          vendorStaffApi.endpoints.getVendorStaff.select(scope)(store.getState()).data
            .items.length,
          1,
        );
      } finally {
        req.reset();
        clean(store);
      }
    },
  );
});

for (const operation of ["create", "reset", "delete"])
  test(`concurrent ${operation} requests send one change and preserve rows while pending`, async () => {
    const { store, scope } = await setup();
    let release;
    let entered;
    const ready = new Promise((r) => {
      entered = r;
    });
    let calls = 0;
    const run = () =>
      operation === "create"
        ? createVendorStaff(store.dispatch, scope, {
            email: "actual.staff@example.com",
            pin: "0042",
          })
        : operation === "reset"
          ? resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" })
          : remove(store, scope).unwrap();
    await withFetch(
      async () => {
        calls++;
        entered();
        return await new Promise((r) => {
          release = () =>
            r(
              json(
                operation === "delete"
                  ? { deleted: true, message: "Deleted" }
                  : changed(),
              ),
            );
        });
      },
      async () => {
        const first = run();
        try {
          await ready;
          await assert.rejects(run());
          assert.equal(calls, 1);
          assert.equal(
            vendorStaffApi.endpoints.getVendorStaff.select(scope)(store.getState()).data
              .items.length,
            1,
          );
          release();
          await first;
        } finally {
          release?.();
          await first.catch(() => {});
          clean(store);
        }
      },
    );
  });

for (const replacement of ["logout", "new login", "role switch"])
  test(`delayed staff read/reset/delete cannot populate ${replacement} context`, async () => {
    for (const operation of ["read", "create", "reset", "delete"]) {
      const { store, scope } = await setup();
      let release;
      let entered;
      const ready = new Promise((r) => {
        entered = r;
      });
      await withFetch(
        async () => {
          entered();
          return await new Promise((r) => {
            release = () =>
              r(
                json(
                  operation === "read"
                    ? { items: [staffDto()] }
                    : operation === "reset" || operation === "create"
                      ? changed()
                      : { deleted: true, message: "Deleted" },
                ),
              );
          });
        },
        async () => {
          const req =
            operation === "read"
              ? store.dispatch(
                  vendorStaffApi.endpoints.getVendorStaff.initiate(scope, {
                    forceRefetch: true,
                  }),
                )
              : operation === "delete"
                ? remove(store, scope)
                : null;
          const result = req
            ? req.unwrap()
            : operation === "create"
              ? createVendorStaff(store.dispatch, scope, {
                  email: "actual.staff@example.com",
                  pin: "0042",
                })
              : resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" });
          const settled = result.catch((e) => e);
          try {
            await ready;
            if (replacement === "logout") store.dispatch(clearSession("storage"));
            else if (replacement === "role switch")
              store.dispatch(activeRoleSelected("CUSTOMER"));
            else {
              store.dispatch(
                sessionRestored({
                  sessionId: "replacement-session",
                  accessToken: "new-access",
                  refreshToken: "new-refresh",
                  user: null,
                }),
              );
              store.dispatch(
                identityVerified({
                  id: otherId,
                  name: "Other",
                  email: "other@example.com",
                  roles: ["VENDOR"],
                  role: "VENDOR",
                }),
              );
            }
            release();
            const outcome = await settled;
            assert.ok(outcome === undefined || outcome.status || outcome.name);
            assert.equal(
              vendorStaffApi.endpoints.getVendorStaff.select(scope)(store.getState())
                .data,
              undefined,
            );
            assert.doesNotMatch(
              JSON.stringify(store.getState()),
              /0042|actual.staff@example.com/,
            );
          } finally {
            release?.();
            if (operation === "read") req?.unsubscribe();
            else req?.reset();
            clean(store);
          }
        },
      );
    }
  });

test("successful staff writes invalidate VendorStaff only, preserving unrelated vendor data", async () => {
  for (const operation of ["create", "reset", "delete"]) {
    const { store, scope } = await setup();
    let gets = 0;
    await withFetch(
      async (req) => {
        if (req.method === "GET") {
          gets++;
          return json({ items: [staffDto()] });
        }
        return json(
          operation === "delete" ? { deleted: true, message: "Deleted" } : changed(),
        );
      },
      async () => {
        const read = store.dispatch(
          vendorStaffApi.endpoints.getVendorStaff.initiate(scope),
        );
        try {
          if (operation === "create")
            await createVendorStaff(store.dispatch, scope, {
              email: "actual.staff@example.com",
              pin: "0042",
            });
          else if (operation === "reset")
            await resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" });
          else {
            const req = remove(store, scope);
            await req.unwrap();
            req.reset();
          }
          await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
          assert.equal(gets, 1);
          assert.equal(
            vendorApi.endpoints.getVendorMe.select()(store.getState()).data.id,
            vendorId,
          );
        } finally {
          read.unsubscribe();
          clean(store);
        }
      },
    );
  }
});

test("list errors retain background data for temporary failures but hide definitive denial", async () => {
  for (const status of [403, 404, 500]) {
    const { store, scope } = await setup();
    await withFetch(
      async () => json({ message: "Staff list unavailable" }, status),
      async () => {
        const req = store.dispatch(
          vendorStaffApi.endpoints.getVendorStaff.initiate(scope, {
            forceRefetch: true,
          }),
        );
        try {
          assert.ok((await req).error);
          const html = render(store);
          if (status === 500) assert.match(html, /actual.staff@example.com/);
          else assert.doesNotMatch(html, /actual.staff@example.com/);
        } finally {
          req.unsubscribe();
          clean(store);
        }
      },
    );
  }
});

test("empty staff list and masked input preserve existing design without sample PINs or unsupported lock requests", async () => {
  const { store } = await setup({ records: [] });
  try {
    const html = render(store);
    assert.match(html, /No staff members/);
    assert.match(html, /vendor-staff-card/);
    assert.match(html, /type="password"/);
    assert.match(html, /inputMode="numeric"/);
    assert.match(html, /Lock\/unlock is unavailable/);
    assert.doesNotMatch(html, /maria@example|jake@example|1504|5678|Sample PIN/);
  } finally {
    clean(store);
  }
});

test("malformed envelope/status/UUID/date and mismatched reset identity fail validation", async () => {
  for (const data of [
    [staffDto()],
    { items: [staffDto({ id: "sample" })] },
    { items: [staffDto({ status: "LOCKED" })] },
    { items: [staffDto({ addedAt: "invalid" })] },
  ])
    assert.equal(vendorStaffListSchema.safeParse(data).success, false);
  const { store, scope } = await setup();
  await withFetch(
    async () => json(changed({ id: otherId })),
    async () => {
      try {
        await assert.rejects(
          resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" }),
        );
      } finally {
        clean(store);
      }
    },
  );
});

test("expired JWT uses shared refresh and retries the exact staff read once", async () => {
  const { store, scope } = await setup();
  let gets = 0;
  let refreshes = 0;
  await withFetch(
    async (req) => {
      if (new URL(req.url).pathname.endsWith("/auth/refresh")) {
        refreshes++;
        return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
      }
      gets++;
      if (gets === 1) return json({ message: "Expired" }, 401);
      assert.equal(req.headers.get("authorization"), "Bearer rotated");
      return json({ items: [staffDto()] });
    },
    async () => {
      const req = store.dispatch(
        vendorStaffApi.endpoints.getVendorStaff.initiate(scope, { forceRefetch: true }),
      );
      try {
        assert.equal((await req.unwrap()).items[0].id, staffId);
        assert.equal(gets, 2);
        assert.equal(refreshes, 1);
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

test("deleted:false is rejected without success invalidation or optimistic removal", async () => {
  const { store, scope } = await setup();
  await withFetch(
    async () => json({ deleted: false, message: "Not deleted" }),
    async () => {
      const req = remove(store, scope);
      try {
        await assert.rejects(req.unwrap());
        assert.equal(
          vendorStaffApi.endpoints.getVendorStaff.select(scope)(store.getState()).data
            .items.length,
          1,
        );
      } finally {
        req.reset();
        clean(store);
      }
    },
  );
});

test("one pending create also blocks a conflicting reset or deletion", async () => {
  const { store, scope } = await setup();
  let release;
  let entered;
  let calls = 0;
  const ready = new Promise((r) => {
    entered = r;
  });
  await withFetch(
    async () => {
      calls++;
      entered();
      return await new Promise((r) => {
        release = () => r(json(changed()));
      });
    },
    async () => {
      const first = createVendorStaff(store.dispatch, scope, {
        email: "actual.staff@example.com",
        pin: "0042",
      });
      try {
        await ready;
        await assert.rejects(
          resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" }),
        );
        const del = remove(store, scope);
        assert.ok((await del).error);
        del.reset();
        assert.equal(calls, 1);
        release();
        await first;
      } finally {
        release?.();
        await first.catch(() => {});
        clean(store);
      }
    },
  );
});

test("initial staff loading does not show fake rows or a false empty state", async () => {
  const { store, scope } = await setup();
  store.dispatch(baseApi.util.invalidateTags(["VendorStaff"]));
  let release;
  let entered;
  const ready = new Promise((r) => {
    entered = r;
  });
  await withFetch(
    async () => {
      entered();
      return await new Promise((r) => {
        release = () => r(json({ items: [] }));
      });
    },
    async () => {
      const req = store.dispatch(
        vendorStaffApi.endpoints.getVendorStaff.initiate(scope),
      );
      try {
        await ready;
        const html = render(store);
        assert.match(html, /Loading staff/);
        assert.doesNotMatch(
          html,
          /No staff members|actual.staff@example.com|Staff Members \(0\)/,
        );
        release();
        await req.unwrap();
        assert.match(render(store), /No staff members/);
      } finally {
        release?.();
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

for (const operation of ["reset", "delete"])
  test(`missing/deleted staff ${operation} stays a failure and preserves the confirmed identity`, async () => {
    const { store, scope } = await setup();
    await withFetch(
      async (req) => {
        assert.ok(new URL(req.url).pathname.includes(staffId));
        return json({ message: "Staff member not found" }, 404);
      },
      async () => {
        const req = operation === "delete" ? remove(store, scope) : null;
        try {
          await assert.rejects(
            req
              ? req.unwrap()
              : resetVendorStaffPin(store.dispatch, scope, staffId, { pin: "0042" }),
            (e) => e.status === 404,
          );
          assert.equal(
            vendorStaffApi.endpoints.getVendorStaff.select(scope)(store.getState()).data
              .items[0].id,
            staffId,
          );
          assert.doesNotMatch(
            render(store),
            /Staff member deleted\.|Staff PIN reset\./,
          );
        } finally {
          req?.reset();
          clean(store);
        }
      },
    );
  });
