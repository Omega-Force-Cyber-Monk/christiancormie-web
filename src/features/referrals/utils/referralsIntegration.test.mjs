import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { referralsApi } from "../api/referrals.api.ts";
import {
  referralCodeSchema,
  referralCodesSchema,
} from "../schemas/referrals.schema.ts";
import {
  copyReferralCode,
  customerReferralCodes,
  referralAvailability,
} from "./referralAdapters.ts";
import { SettingsInvite } from "../../customer/components/settings/SettingsInvite.tsx";
import { RewardsPanel } from "../../rewards/components/RewardsPanel.tsx";
import {
  rewardsApi,
  rewardSummarySchema,
  rewardRulesSchema,
} from "../../rewards/api/rewards.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import {
  sessionRestored,
  identityVerified,
  clearSession,
  activeRoleSelected,
} from "../../auth/store/auth.slice.ts";
import {
  memberStore,
  viewerId,
  memberId,
  postId,
  json,
  rewardsDto,
  rulesDto,
  seedMember,
} from "../../social/utils/member.test-fixtures.mjs";
const storeFor = (role = "CUSTOMER", verified = true) => memberStore(role, verified);
const scope = (store) => ({
  sessionId: store.getState().auth.sessionId ?? "",
  userId: store.getState().auth.user?.id ?? "",
  role: store.getState().auth.user?.role ?? "",
});
const codeDto = (overrides = {}) => ({
  id: postId,
  ownerUserId: viewerId,
  code: "BD1234ACTUAL",
  programType: "CUSTOMER",
  maximumUses: null,
  usageCount: 0,
  expiresAt: null,
  isActive: true,
  ...overrides,
});
const clean = (store) => store.dispatch(baseApi.util.resetApiState());
const render = (store, Component = SettingsInvite, props = {}) =>
  renderToStaticMarkup(h(Provider, { store }, h(Component, props)));
async function seedCodes(store, codes) {
  await store.dispatch(
    referralsApi.util.upsertQueryData(
      "getReferralCodes",
      scope(store),
      referralCodesSchema.parse(codes),
    ),
  );
}

test("GET referral codes sends only exact JWT read and accepts raw array, not a fabricated envelope", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (req) => {
    calls.push(req.method);
    assert.equal(req.method, "GET");
    assert.equal(new URL(req.url).pathname, "/api/v1/referrals/codes");
    assert.equal(new URL(req.url).search, "");
    assert.equal(req.headers.get("authorization"), "Bearer test-access");
    return json([
      codeDto({
        referrals: [{ referredUserId: memberId, rewards: [{ points: 999 }] }],
      }),
    ]);
  };
  const req = store.dispatch(
    referralsApi.endpoints.getReferralCodes.initiate(scope(store)),
  );
  try {
    const result = await req.unwrap();
    assert.equal(result[0].code, "BD1234ACTUAL");
    assert.equal(result[0].programType, "CUSTOMER");
    assert.equal(result[0].referrals, undefined);
    assert.equal(result[0].createdAt, undefined);
    assert.deepEqual(calls, ["GET"]);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("CUSTOMER invitation intent filters actual program values without guessing campaign or code precedence", () => {
  const codes = referralCodesSchema.parse([
    codeDto(),
    codeDto({ id: memberId, programType: "VENDOR", code: "VENDORCODE" }),
    codeDto({ id: viewerId, code: "ANOTHER_CUSTOMER" }),
  ]);
  assert.deepEqual(
    customerReferralCodes(codes).map((c) => c.code),
    ["BD1234ACTUAL", "ANOTHER_CUSTOMER"],
  );
  assert.equal(
    referralCodeSchema.safeParse(codeDto({ programType: "FRIEND" })).success,
    false,
  );
});
test("availability distinguishes active, inactive, expired, exhausted and empty actual codes", () => {
  const now = Date.parse("2026-10-29T00:00:00Z");
  for (const [patch, status] of [
    [{}, "Available"],
    [{ isActive: false }, "Inactive"],
    [{ expiresAt: "2026-10-28T23:59:59Z" }, "Expired"],
    [{ expiresAt: "2026-10-29T00:00:00Z" }, "Expired"],
    [{ maximumUses: 2, usageCount: 2 }, "Usage limit reached"],
    [{ maximumUses: 2, usageCount: 3 }, "Usage limit reached"],
    [{ code: "   " }, "Unavailable"],
  ])
    assert.equal(
      referralAvailability(referralCodeSchema.parse(codeDto(patch)), now),
      status,
    );
  assert.equal(
    referralAvailability(
      referralCodeSchema.parse(
        codeDto({ expiresAt: "2099-01-01T00:00:00Z", maximumUses: 1, usageCount: 0 }),
      ),
      now,
    ),
    "Available",
  );
});
test("malformed/raw response fields are rejected without fabricating defaults", () => {
  for (const dto of [
    { data: [codeDto()] },
    [codeDto({ id: "sample-id" })],
    [codeDto({ usageCount: "0" })],
    [codeDto({ maximumUses: 0 })],
    [codeDto({ expiresAt: "yesterday" })],
    [codeDto({ isActive: undefined })],
  ])
    assert.equal(referralCodesSchema.safeParse(dto).success, false);
});
test("list rejects another owner's row before exposing it to the cache", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  globalThis.fetch = async () => json([codeDto({ ownerUserId: memberId })]);
  const arg = scope(store);
  const req = store.dispatch(referralsApi.endpoints.getReferralCodes.initiate(arg));
  try {
    await assert.rejects(req.unwrap(), (e) => e.status === "CUSTOM_ERROR");
    assert.equal(
      referralsApi.endpoints.getReferralCodes.select(arg)(store.getState()).data,
      undefined,
    );
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
for (const mode of ["VENDOR", "ADMIN", "unverified", "stale-session", "wrong-user"])
  test(`${mode} cannot fetch Customer invitation codes`, async () => {
    const store = storeFor(
      ["VENDOR", "ADMIN"].includes(mode) ? mode : "CUSTOMER",
      mode !== "unverified",
    );
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return json([codeDto()]);
    };
    const arg = scope(store);
    if (mode === "stale-session") arg.sessionId = "old";
    if (mode === "wrong-user") arg.userId = memberId;
    const req = store.dispatch(referralsApi.endpoints.getReferralCodes.initiate(arg));
    try {
      await assert.rejects(req.unwrap(), (e) => e.status === 403);
      assert.equal(calls, 0);
    } finally {
      req.unsubscribe();
      clean(store);
      globalThis.fetch = original;
    }
  });
test("actual multiple customer codes display independently with usage/status and no referral URL", async () => {
  const store = storeFor();
  try {
    await seedCodes(store, [
      codeDto(),
      codeDto({
        id: memberId,
        code: "EXPIRED_CODE",
        expiresAt: "2000-01-01T00:00:00Z",
        usageCount: 2,
        maximumUses: 3,
      }),
      codeDto({ id: viewerId, programType: "VENDOR", code: "HIDDEN_VENDOR" }),
    ]);
    const html = render(store);
    assert.ok(html.includes("BD1234ACTUAL"));
    assert.ok(html.includes("EXPIRED_CODE"));
    assert.ok(html.includes("Expired"));
    assert.ok(html.includes("0 / Unlimited"));
    assert.ok(html.includes("2 / 3"));
    assert.equal((html.match(/Copy referral code/g) ?? []).length, 2);
    assert.ok(!html.includes("HIDDEN_VENDOR"));
    assert.ok(!html.includes("/signup"));
    assert.ok(!html.includes("http"));
    assert.ok(!html.includes("referralCode="));
    assert.ok(html.includes("No expiration"));
  } finally {
    clean(store);
  }
});
test("empty list has an honest read-only creation limitation, without automatic generation", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (req) => {
    calls++;
    assert.equal(req.method, "GET");
    return json([]);
  };
  const req = store.dispatch(
    referralsApi.endpoints.getReferralCodes.initiate(scope(store)),
  );
  try {
    await req.unwrap();
    const html = render(store);
    assert.ok(html.includes("No Customer referral codes"));
    assert.ok(html.includes("Code creation is not available here"));
    assert.ok(!html.includes("Copy referral code"));
    assert.equal(calls, 1);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("unavailable codes are shown honestly and cannot be copied", async () => {
  const store = storeFor();
  try {
    await seedCodes(store, [codeDto({ isActive: false })]);
    const html = render(store);
    assert.ok(html.includes("Inactive"));
    assert.match(html, /disabled=""[^>]*>Copy referral code/);
    assert.ok(html.includes("None of these codes is currently available"));
  } finally {
    clean(store);
  }
});
test("clipboard receives only actual code and reports success only after write completion", async () => {
  let resolve;
  let copied = "";
  let finished = false;
  const promise = copyReferralCode(
    referralCodeSchema.parse(codeDto()),
    async (text) => {
      copied = text;
      await new Promise((r) => {
        resolve = r;
      });
    },
    () => true,
  ).then((result) => {
    finished = true;
    return result;
  });
  assert.equal(copied, "BD1234ACTUAL");
  assert.equal(finished, false);
  resolve();
  assert.equal(await promise, true);
  assert.equal(finished, true);
  assert.ok(!copied.includes("http"));
});
test("clipboard failure/unavailable and expired/used-up/wrong-program codes never claim successful copy", async () => {
  const code = referralCodeSchema.parse(codeDto());
  await assert.rejects(
    copyReferralCode(code, undefined, () => true),
    /Clipboard access is unavailable/,
  );
  await assert.rejects(
    copyReferralCode(
      code,
      async () => {
        throw new Error("Permission denied");
      },
      () => true,
    ),
    /Permission denied/,
  );
  let writes = 0;
  for (const patch of [
    { isActive: false },
    { expiresAt: "2000-01-01T00:00:00Z" },
    { maximumUses: 1, usageCount: 1 },
    { programType: "VENDOR" },
    { code: "" },
  ])
    await assert.rejects(
      copyReferralCode(
        referralCodeSchema.parse(codeDto(patch)),
        async () => {
          writes++;
        },
        () => true,
      ),
      /unavailable/,
    );
  assert.equal(writes, 0);
});
test("logout/session change during clipboard write suppresses obsolete completion", async () => {
  let current = true;
  let resolve;
  const result = copyReferralCode(
    referralCodeSchema.parse(codeDto()),
    () =>
      new Promise((r) => {
        resolve = r;
      }),
    () => current,
  );
  current = false;
  resolve();
  assert.equal(await result, false);
  let calls = 0;
  assert.equal(
    await copyReferralCode(
      referralCodeSchema.parse(codeDto()),
      async () => {
        calls++;
      },
      () => false,
    ),
    false,
  );
  assert.equal(calls, 0);
});
for (const status of [400, 403, 404, 409, 500])
  test(`GET ${status} remains an error, not a sample invitation`, async () => {
    const store = storeFor();
    const original = globalThis.fetch;
    globalThis.fetch = async () =>
      json(
        { message: status === 500 ? "internal stack secret" : "Unavailable" },
        status,
      );
    const req = store.dispatch(
      referralsApi.endpoints.getReferralCodes.initiate(scope(store)),
    );
    try {
      await assert.rejects(req.unwrap(), (e) => e.status === status);
      const html = render(store);
      assert.ok(html.includes("Retry"));
      assert.ok(!html.includes("BD1234ACTUAL"));
      assert.ok(!html.includes("internal stack secret"));
    } finally {
      req.unsubscribe();
      clean(store);
      globalThis.fetch = original;
    }
  });
test("temporary background failure preserves known codes; definitive denial hides cached private codes", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let status = 200;
  globalThis.fetch = async () =>
    status === 200 ? json([codeDto()]) : json({ message: "Unavailable" }, status);
  const arg = scope(store);
  const req = store.dispatch(referralsApi.endpoints.getReferralCodes.initiate(arg));
  try {
    await req.unwrap();
    status = 500;
    let refresh = store.dispatch(
      referralsApi.endpoints.getReferralCodes.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(refresh.unwrap());
    refresh.unsubscribe();
    assert.ok(render(store).includes("BD1234ACTUAL"));
    status = 403;
    refresh = store.dispatch(
      referralsApi.endpoints.getReferralCodes.initiate(arg, { forceRefetch: true }),
    );
    await assert.rejects(refresh.unwrap());
    refresh.unsubscribe();
    assert.ok(!render(store).includes("BD1234ACTUAL"));
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("network error preserves failure and explicit read retry returns authoritative codes", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let fail = true;
  globalThis.fetch = async () => {
    if (fail) throw new TypeError("offline");
    return json([codeDto()]);
  };
  const arg = scope(store);
  let req = store.dispatch(referralsApi.endpoints.getReferralCodes.initiate(arg));
  try {
    await assert.rejects(req.unwrap(), (e) => e.status === "FETCH_ERROR");
    req.unsubscribe();
    fail = false;
    req = store.dispatch(
      referralsApi.endpoints.getReferralCodes.initiate(arg, { forceRefetch: true }),
    );
    assert.equal((await req.unwrap())[0].code, "BD1234ACTUAL");
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("401 uses the established refresh and authenticated retry", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let reads = 0;
  let refreshes = 0;
  globalThis.fetch = async (req) => {
    if (new URL(req.url).pathname.endsWith("/auth/refresh")) {
      refreshes++;
      return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
    }
    reads++;
    return req.headers.get("authorization") === "Bearer test-access"
      ? json({ message: "Expired" }, 401)
      : json([codeDto()]);
  };
  const req = store.dispatch(
    referralsApi.endpoints.getReferralCodes.initiate(scope(store)),
  );
  try {
    await req.unwrap();
    assert.equal(reads, 2);
    assert.equal(refreshes, 1);
    assert.equal(store.getState().auth.isIdentityVerified, true);
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
test("ReferralCodes invalidation refetches only referral readers and preserves existing rewards cache", async () => {
  const store = storeFor();
  const original = globalThis.fetch;
  let reads = 0;
  globalThis.fetch = async () => {
    reads++;
    return json([codeDto()]);
  };
  await store.dispatch(
    rewardsApi.util.upsertQueryData("getMyRewardSummary", undefined, rewardsDto()),
  );
  const req = store.dispatch(
    referralsApi.endpoints.getReferralCodes.initiate(scope(store)),
  );
  try {
    await req.unwrap();
    store.dispatch(baseApi.util.invalidateTags(["ReferralCodes"]));
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    assert.equal(reads, 2);
    assert.equal(
      rewardsApi.endpoints.getMyRewardSummary.select(undefined)(store.getState()).data
        .loyalty.availablePoints,
      140,
    );
  } finally {
    req.unsubscribe();
    clean(store);
    globalThis.fetch = original;
  }
});
for (const mode of ["logout", "new-user", "role"])
  test(`delayed referral read cannot populate ${mode} context`, async () => {
    const store = storeFor();
    const original = globalThis.fetch;
    let begin;
    let resolve;
    const started = new Promise((r) => {
      begin = r;
    });
    globalThis.fetch = async () => {
      begin();
      return new Promise((r) => {
        resolve = () => r(json([codeDto()]));
      });
    };
    const arg = scope(store);
    const req = store.dispatch(referralsApi.endpoints.getReferralCodes.initiate(arg));
    try {
      await started;
      if (mode === "logout") store.dispatch(clearSession("storage"));
      else if (mode === "role") store.dispatch(activeRoleSelected("VENDOR"));
      else {
        store.dispatch(
          sessionRestored({
            accessToken: "new",
            refreshToken: "new-refresh",
            sessionId: "new-session",
            user: null,
          }),
        );
        store.dispatch(
          identityVerified({
            id: memberId,
            name: "Other user",
            email: "other@example.invalid",
            roles: ["CUSTOMER"],
            role: "CUSTOMER",
          }),
        );
      }
      resolve();
      await req;
      assert.equal(
        referralsApi.endpoints.getReferralCodes.select(arg)(store.getState()).data,
        undefined,
      );
      assert.ok(!render(store).includes("BD1234ACTUAL"));
    } finally {
      req.unsubscribe();
      clean(store);
      globalThis.fetch = original;
    }
  });
test("existing RewardsPanel keeps real balances, current/next tiers, rules/activity and maximum-tier semantics", async () => {
  const store = storeFor();
  try {
    await seedMember(store);
    const parsed = rewardSummarySchema.parse(rewardsDto());
    assert.equal(parsed.loyalty.availablePoints, 140);
    assert.equal(parsed.loyalty.lifetimePoints, 900);
    assert.equal(parsed.loyalty.redeemedPoints, 760);
    assert.equal(rewardRulesSchema.parse(rulesDto)[0].rewardAmount, 0);
    let html = render(store, RewardsPanel);
    for (const text of [
      "Available points",
      "Lifetime points",
      "Redeemed points",
      "140",
      "900",
      "760",
      "Explorer",
      "Drop Hunter",
      "Actual reward rule",
      "Actual Review reward",
    ])
      assert.ok(html.includes(text), text);
    assert.match(html, /max="2000"/);
    assert.match(html, /value="900"/);
    assert.ok(!html.includes("500 points for each"));
    await store.dispatch(
      rewardsApi.util.upsertQueryData(
        "getMyRewardSummary",
        undefined,
        rewardsDto({
          loyalty: { ...parsed.loyalty, nextTier: null },
          recentActivity: [],
        }),
      ),
    );
    html = render(store, RewardsPanel);
    assert.ok(html.includes("Maximum tier reached"));
    assert.ok(html.includes("No reward activity yet"));
  } finally {
    clean(store);
  }
});
