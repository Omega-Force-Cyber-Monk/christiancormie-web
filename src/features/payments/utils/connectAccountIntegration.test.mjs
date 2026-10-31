import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { connectAccountApi } from "../api/connectAccount.api.ts";
import { connectAccountSchema } from "../schemas/connectAccount.schema.ts";
import { VendorConnectAccountStatus } from "../../vendor/components/earnings/VendorConnectAccountStatus.tsx";
import VendorEarningsPage from "../../vendor/pages/VendorEarningsPage.tsx";
import {
  vendorTestStore,
  seedVendorHome,
  profileDto,
  ownerId,
  vendorId,
  json,
} from "../../vendor/utils/vendor.test-fixtures.mjs";
import {
  clearSession,
  sessionRestored,
  identityVerified,
  activeRoleSelected,
} from "../../auth/store/auth.slice.ts";
import { vendorApi } from "../../vendor/api/vendor.api.ts";
import { normalizeApiError } from "../../../utils/errors/normalizeApiError.ts";

const accountDto = (patch = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
  vendorId,
  stripeAccountId: "acct_private_never_display",
  onboardingCompleted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  disabledReason: null,
  updatedAt: "2026-10-29T06:00:00Z",
  stripe: {
    accountType: "express",
    country: null,
    detailsSubmitted: false,
    chargesEnabled: false,
    payoutsEnabled: false,
    requirements: {
      currentlyDue: [],
      eventuallyDue: [],
      pastDue: [],
      pendingVerification: [],
      disabledReason: null,
    },
  },
  ...patch,
});
const flagsDto = (onboarding, charges, payouts, requirements = {}) =>
  accountDto({
    onboardingCompleted: onboarding,
    chargesEnabled: charges,
    payoutsEnabled: payouts,
    stripe: {
      accountType: "express",
      country: "US",
      detailsSubmitted: onboarding,
      chargesEnabled: charges,
      payoutsEnabled: payouts,
      requirements: {
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
        pendingVerification: [],
        disabledReason: null,
        ...requirements,
      },
    },
  });
const scopeFor = (store) => ({
  sessionId: store.getState().auth.sessionId ?? "",
  userId: store.getState().auth.user?.id ?? "",
  role: store.getState().auth.user?.role ?? "",
});
const clean = (store) => store.dispatch(baseApi.util.resetApiState());
async function setup({
  role = "VENDOR",
  profile = profileDto(),
  verified = true,
} = {}) {
  const store = vendorTestStore(role);
  if (!verified)
    store.dispatch(sessionRestored({ ...store.getState().auth, user: null }));
  await seedVendorHome(store, { profile });
  return { store, scope: scopeFor(store) };
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
const render = (store, component = VendorConnectAccountStatus) =>
  renderToStaticMarkup(h(Provider, { store }, h(MemoryRouter, null, h(component))));
async function seedAccount(store, raw) {
  await store.dispatch(
    connectAccountApi.util.upsertQueryData(
      "getVendorConnectAccount",
      scopeFor(store),
      connectAccountSchema.parse(raw),
    ),
  );
}

test("Connect GET uses exact owner endpoint/JWT, no body/query, and strips provider/bank/internal metadata", async () => {
  const { store, scope } = await setup();
  const calls = [];
  await withFetch(
    async (req) => {
      calls.push(req.method);
      assert.equal(new URL(req.url).pathname, "/api/v1/payments/connect/account");
      assert.equal(new URL(req.url).search, "");
      assert.equal(req.headers.get("authorization"), "Bearer test-access");
      assert.equal(await req.text(), "");
      return json(
        accountDto({
          metadata: { secret: "provider-private" },
          external_accounts: { last4: "1234" },
        }),
      );
    },
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        const account = await req.unwrap();
        assert.equal(account.vendorId, vendorId);
        assert.equal(account.onboardingCompleted, false);
        assert.doesNotMatch(
          JSON.stringify(store.getState()),
          /acct_private|provider-private|external_accounts|last4/,
        );
        assert.deepEqual(calls, ["GET"]);
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

test("null account alone means not connected; opening/rendering status never creates an account/payment/link", async () => {
  const { store, scope } = await setup();
  let calls = 0;
  await withFetch(
    async (req) => {
      calls++;
      assert.equal(req.method, "GET");
      return json(null);
    },
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        assert.equal(await req.unwrap(), null);
        const html = render(store);
        assert.match(html, /Stripe Connect is not connected/);
        assert.match(html, /Account setup is not available here/);
        assert.doesNotMatch(html, /Account connected|Onboarding details:/);
        assert.equal(calls, 1);
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

for (const [label, raw, texts] of [
  [
    "incomplete onboarding",
    accountDto(),
    ["Incomplete", "Not enabled", "Not returned"],
  ],
  [
    "onboarded without charges/payouts",
    flagsDto(true, false, false),
    ["Submitted", "Not enabled"],
  ],
  [
    "charges enabled but payouts disabled",
    flagsDto(true, true, false),
    [
      'Charges: </dt><dd class="inline">Enabled',
      'Payouts: </dt><dd class="inline">Not enabled',
    ],
  ],
  [
    "all flags enabled",
    flagsDto(true, true, true),
    ["Submitted", "Enabled", "None reported"],
  ],
  [
    "pending verification and restrictions",
    flagsDto(true, false, false, {
      currentlyDue: ["individual.private_field"],
      pendingVerification: ["document.private_field"],
      disabledReason: "requirements.pending_verification",
    }),
    ["Reported", "Requirements pending verification", "Requirements currently due"],
  ],
])
  test(`account status distinguishes ${label} without assuming settlement readiness`, async () => {
    const { store } = await setup();
    try {
      await seedAccount(store, raw);
      const html = render(store);
      for (const text of texts) assert.ok(html.includes(text), text);
      assert.match(
        html,
        /Connection alone does not mean charges or payouts are enabled/,
      );
      assert.doesNotMatch(
        html,
        /acct_private|private_field|requirements.pending_verification|bank verified|Ready for payments|15%|10%/,
      );
    } finally {
      clean(store);
    }
  });

test("malformed/partial core responses, bad ownership and contradictory flags fail safely", async () => {
  for (const response of [
    {},
    { paymentAccount: accountDto() },
    { ...accountDto(), chargesEnabled: "true" },
    { ...accountDto(), stripe: undefined },
    { ...accountDto(), updatedAt: "bad" },
    { ...accountDto(), payoutsEnabled: true },
  ])
    assert.equal(connectAccountSchema.safeParse(response).success, false);
  const { store, scope } = await setup();
  await withFetch(
    async () => json(accountDto({ vendorId: ownerId })),
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        assert.ok((await req).error);
        assert.doesNotMatch(
          render(store),
          /Account connected|Stripe Connect is not connected/,
        );
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

for (const [label, options, alter] of [
  ["staff", { role: "VENDOR_STAFF" }],
  ["customer", { role: "CUSTOMER" }],
  ["admin", { role: "ADMIN" }],
  ["unverified", { verified: false }],
  [
    "wrong owner",
    { profile: profileDto({ userId: "22222222-2222-4222-8222-222222222222" }) },
  ],
  ["blocked owner", { profile: profileDto({ user: { status: "BLOCKED" } }) }],
  [
    "blocked dashboard",
    {
      profile: profileDto({
        dashboardAccess: {
          allowed: false,
          status: "ONBOARDING_REQUIRED",
          reason: "Unavailable",
        },
      }),
    },
  ],
  ["suspended vendor", { profile: profileDto({ status: "SUSPENDED" }) }],
  ["stale session", {}, (s) => ({ ...s, sessionId: "old-session" })],
  ["wrong user", {}, (s) => ({ ...s, userId: "22222222-2222-4222-8222-222222222222" })],
])
  test(`Connect read denies ${label} before HTTP`, async () => {
    const { store, scope: actual } = await setup(options);
    const scope = alter ? alter(actual) : actual;
    let calls = 0;
    await withFetch(
      async () => {
        calls++;
        return json(accountDto());
      },
      async () => {
        const req = store.dispatch(
          connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
        );
        try {
          assert.ok((await req).error);
          assert.equal(calls, 0);
          assert.doesNotMatch(render(store), /acct_private|Account connected/);
        } finally {
          req.unsubscribe();
          clean(store);
        }
      },
    );
  });

for (const status of [400, 403, 404, 500])
  test(`Connect ${status} is an error, not null/unconnected; raw provider diagnostics stay private`, async () => {
    const { store, scope } = await setup();
    await withFetch(
      async () =>
        json(
          {
            message: "provider-private sk_live_do_not_display acct_private",
            details: "secret",
            errors: { account: "private" },
          },
          status,
        ),
      async () => {
        const req = store.dispatch(
          connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
        );
        try {
          const result = await req;
          assert.equal(normalizeApiError(result.error).status, status);
          const html = render(store);
          assert.doesNotMatch(
            html,
            /Stripe Connect is not connected|Account connected|provider-private|sk_live|acct_private/,
          );
          assert.match(html, /Try again|try again|Retry/);
          assert.doesNotMatch(
            JSON.stringify(store.getState()),
            /provider-private|sk_live|acct_private/,
          );
        } finally {
          req.unsubscribe();
          clean(store);
        }
      },
    );
  });

test("network/provider errors can retry the same GET without any POST", async () => {
  const { store, scope } = await setup();
  let calls = 0;
  await withFetch(
    async (req) => {
      assert.equal(req.method, "GET");
      calls++;
      if (calls === 1) throw new TypeError("test offline");
      return json(accountDto());
    },
    async () => {
      const first = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        await assert.rejects(first.unwrap());
        assert.doesNotMatch(render(store), /Stripe Connect is not connected/);
        await first.refetch().unwrap();
        assert.match(render(store), /Account connected/);
        assert.equal(calls, 2);
      } finally {
        first.unsubscribe();
        clean(store);
      }
    },
  );
});

test("initial load and background refresh keep null/error/known statuses distinct", async () => {
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
        release = () => r(json(flagsDto(true, true, false)));
      });
    },
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        await ready;
        assert.match(render(store), /Loading payment account status/);
        assert.doesNotMatch(render(store), /not connected|Account connected/);
        release();
        await req.unwrap();
      } finally {
        release?.();
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

for (const status of [400, 403, 404, 500])
  test(`background ${status} handles last-known status without declaring a failed refresh current`, async () => {
    const { store, scope } = await setup();
    await seedAccount(store, flagsDto(true, true, true));
    await withFetch(
      async () => json({ message: "Unavailable" }, status),
      async () => {
        const req = store.dispatch(
          connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope, {
            forceRefetch: true,
          }),
        );
        try {
          assert.ok((await req).error);
          const html = render(store);
          assert.doesNotMatch(html, /Stripe Connect is not connected/);
          if ([403, 404].includes(status))
            assert.doesNotMatch(
              html,
              /Last reported account status|Charges:|Account connected/,
            );
          else assert.match(html, /Last reported account status/);
        } finally {
          req.unsubscribe();
          clean(store);
        }
      },
    );
  });

test("a cached null followed by failure shows retry/error rather than a fresh not-connected claim", async () => {
  const { store, scope } = await setup();
  await seedAccount(store, null);
  await withFetch(
    async () => json({ message: "Unavailable" }, 500),
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope, {
          forceRefetch: true,
        }),
      );
      try {
        await req;
        assert.doesNotMatch(render(store), /Stripe Connect is not connected/);
        assert.match(render(store), /try again/);
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

test("401 uses shared single refresh and one GET retry", async () => {
  const { store, scope } = await setup();
  let reads = 0;
  let refreshes = 0;
  await withFetch(
    async (req) => {
      if (new URL(req.url).pathname.endsWith("/auth/refresh")) {
        refreshes++;
        return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
      }
      reads++;
      if (reads === 1) return json({ message: "Expired" }, 401);
      assert.equal(req.headers.get("authorization"), "Bearer rotated");
      return json(accountDto());
    },
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        await req.unwrap();
        assert.equal(reads, 2);
        assert.equal(refreshes, 1);
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});

for (const mode of ["logout", "new session", "role change"])
  test(`delayed Connect status cannot enter ${mode} context`, async () => {
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
          release = () => r(json(accountDto()));
        });
      },
      async () => {
        const req = store.dispatch(
          connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
        );
        try {
          await ready;
          if (mode === "logout") store.dispatch(clearSession("storage"));
          else if (mode === "role change") {
            store.dispatch(
              identityVerified({
                ...store.getState().auth.user,
                roles: ["VENDOR", "CUSTOMER"],
              }),
            );
            store.dispatch(activeRoleSelected("CUSTOMER"));
          } else
            store.dispatch(
              sessionRestored({
                sessionId: "new-owner-session",
                accessToken: "new-access",
                refreshToken: "new-refresh",
                user: null,
              }),
            );
          release();
          await req;
          assert.equal(
            connectAccountApi.endpoints.getVendorConnectAccount.select(scope)(
              store.getState(),
            ).data,
            undefined,
          );
          assert.doesNotMatch(render(store), /Account connected|Charges:/);
        } finally {
          release?.();
          req.unsubscribe();
          clean(store);
        }
      },
    );
  });

test("Connect cache tag refetches only status, preserving vendor identity and preview distinction", async () => {
  const { store, scope } = await setup();
  let reads = 0;
  await withFetch(
    async (req) => {
      reads++;
      assert.equal(req.method, "GET");
      assert.ok(req.url.endsWith("/payments/connect/account"));
      return json(accountDto());
    },
    async () => {
      const req = store.dispatch(
        connectAccountApi.endpoints.getVendorConnectAccount.initiate(scope),
      );
      try {
        await req.unwrap();
        store.dispatch(baseApi.util.invalidateTags(["VendorPaymentAccount"]));
        await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
        assert.equal(reads, 2);
        assert.equal(
          vendorApi.endpoints.getVendorMe.select()(store.getState()).data.id,
          vendorId,
        );
        const html = render(store, VendorEarningsPage);
        assert.match(html, /Stripe Connect status/);
        assert.match(html, /Local bank-method preview/);
        assert.match(html, /credit acceptance and charts remain local previews/);
        assert.match(html, /Payment activity summary/);
        assert.doesNotMatch(html, /Recent Transactions \(sample\)/);
        assert.match(html, /sample payment method/);
        assert.doesNotMatch(
          html,
          /Create Connect account|Start onboarding|Open Stripe dashboard|Pay now/,
        );
      } finally {
        req.unsubscribe();
        clean(store);
      }
    },
  );
});
