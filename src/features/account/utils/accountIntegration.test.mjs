import test from "node:test";
import assert from "node:assert/strict";
import { URL } from "node:url";
import { File } from "node:buffer";
import { setImmediate } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { accountApi } from "../api/account.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { profilePatchSchema, passwordFieldsSchema } from "../schemas/account.schema.ts";
import {
  profileChanges,
  accountFields,
  leadPayload,
  validAccountImage,
} from "./accountAdapters.ts";
import {
  accountDto,
  memberStore,
  json,
  scope,
  viewerId,
  seedAccount,
} from "./account.test-fixtures.mjs";
import { sessionStarted } from "../../auth/store/auth.slice.ts";
import { SettingsProfileEditor } from "../../customer/components/settings/SettingsProfileEditor.tsx";
import { SettingsProfilePanel } from "../../customer/components/settings/SettingsProfilePanel.tsx";
import { SettingsPasswordForm } from "../../customer/components/settings/SettingsPasswordForm.tsx";
import { socialProfileApi } from "../../social/api/socialProfile.api.ts";
import { memberDto } from "../../social/utils/member.test-fixtures.mjs";
const cleanup = (s) => s.dispatch(baseApi.util.resetApiState());
const tick = () => new Promise((r) => setImmediate(r));
const validPassword = {
  currentPassword: "OldPassword1!",
  newPassword: "NewPassword2!",
  confirmNewPassword: "NewPassword2!",
};
test("avatar provider failure keeps the current identity and an explicit retry can complete", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let fail = true;
  let uploads = 0;
  let reads = 0;
  globalThis.fetch = async (request) => {
    if (request.method === "POST") {
      uploads++;
      return fail
        ? json({ message: "Provider secret must stay hidden" }, 500)
        : json({ avatarUrl: "https://example.invalid/recovered.png" });
    }
    reads++;
    return json(
      accountDto({
        profile: {
          ...accountDto().profile,
          avatarUrl: "https://example.invalid/recovered.png",
        },
      }),
    );
  };
  const arg = { scope, file: new File(["image"], "avatar.png", { type: "image/png" }) };
  try {
    assert.ok(
      (await s.dispatch(accountApi.endpoints.uploadAccountAvatar.initiate(arg))).error,
    );
    assert.equal(reads, 0);
    assert.equal(s.getState().auth.user.avatarUrl, undefined);
    fail = false;
    assert.equal(
      (
        await s
          .dispatch(accountApi.endpoints.uploadAccountAvatar.initiate(arg))
          .unwrap()
      ).avatarUrl,
      "https://example.invalid/recovered.png",
    );
    assert.equal(uploads, 2);
    assert.equal(reads, 1);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("invalid avatar files never call the backend upload", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw Error("no upload");
  };
  try {
    for (const file of [
      new File([], "empty.png", { type: "image/png" }),
      new File(["svg"], "unsafe.svg", { type: "image/svg+xml" }),
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }),
    ])
      assert.ok(
        (
          await s.dispatch(
            accountApi.endpoints.uploadAccountAvatar.initiate({ scope, file }),
          )
        ).error,
      );
    assert.equal(calls, 0);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("confirmed profile update refetches an active member-profile cache with the new display name", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let saved = false;
  let memberReads = 0;
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    if (request.method === "PATCH") {
      saved = true;
      return json({
        userId: viewerId,
        displayName: "Saved Name",
        email: "actual@example.invalid",
        phone: null,
      });
    }
    if (url.pathname.includes("/social/profiles/")) {
      memberReads++;
      return json(
        memberDto(viewerId, { displayName: saved ? "Saved Name" : "Old Name" }),
      );
    }
    return json(
      accountDto({ profile: { ...accountDto().profile, displayName: "Saved Name" } }),
    );
  };
  const req = s.dispatch(
    socialProfileApi.endpoints.getMemberProfile.initiate(viewerId),
  );
  try {
    await req.unwrap();
    await s
      .dispatch(
        accountApi.endpoints.updateAccountProfile.initiate({
          scope,
          body: { displayName: "Saved Name" },
        }),
      )
      .unwrap();
    for (
      let i = 0;
      i < 100 &&
      socialProfileApi.endpoints.getMemberProfile.select(viewerId)(s.getState()).data
        ?.displayName !== "Saved Name";
      i++
    )
      await tick();
    assert.equal(memberReads, 2);
    assert.equal(
      socialProfileApi.endpoints.getMemberProfile.select(viewerId)(s.getState()).data
        .displayName,
      "Saved Name",
    );
  } finally {
    req.unsubscribe();
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("profile mapper keeps unsupported full name/bio read-only and submits only changed DTO fields", () => {
  const fields = accountFields(accountDto());
  assert.equal(fields.fullName, "Actual Person");
  assert.equal(fields.bio, "Read only bio");
  const editable = {
    displayName: fields.displayName,
    email: fields.email,
    phone: fields.phone,
  };
  assert.deepEqual(profileChanges(editable, { ...editable, phone: "" }), {});
  assert.deepEqual(profileChanges(editable, { ...editable, displayName: "Changed" }), {
    displayName: "Changed",
  });
  for (const body of [
    { fullName: "Not supported" },
    { bio: "Not supported" },
    { displayName: "x".repeat(151) },
    { phone: "x".repeat(31) },
    { email: "invalid" },
  ])
    assert.equal(profilePatchSchema.safeParse(body).success, false);
});
test("profile PATCH refreshes verified identity and retains explicit active role plus full backend role set", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (request) => {
    const p = new URL(request.url).pathname;
    calls.push(p);
    assert.equal(request.headers.get("authorization"), "Bearer test-access");
    if (request.method === "PATCH") {
      assert.deepEqual(await request.json(), { displayName: "New Name" });
      return json({
        userId: viewerId,
        displayName: "New Name",
        email: "actual@example.invalid",
        phone: null,
      });
    }
    return json(
      accountDto({ profile: { ...accountDto().profile, displayName: "New Name" } }),
    );
  };
  try {
    const result = await s
      .dispatch(
        accountApi.endpoints.updateAccountProfile.initiate({
          scope,
          body: { displayName: "New Name" },
        }),
      )
      .unwrap();
    assert.equal(result.identityRefreshed, true);
    assert.deepEqual(calls, ["/api/v1/users/me/profile", "/api/v1/users/me"]);
    assert.equal(s.getState().auth.user.name, "New Name");
    assert.equal(s.getState().auth.user.role, "CUSTOMER");
    assert.deepEqual(s.getState().auth.user.roles, ["CUSTOMER", "VENDOR"]);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("profile success with failed identity refresh remains explicit partial success", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) =>
    request.method === "PATCH"
      ? json({
          userId: viewerId,
          displayName: "Saved",
          email: "actual@example.invalid",
          phone: null,
        })
      : json({}, 503);
  try {
    assert.deepEqual(
      await s
        .dispatch(
          accountApi.endpoints.updateAccountProfile.initiate({
            scope,
            body: { displayName: "Saved" },
          }),
        )
        .unwrap(),
      { identityRefreshed: false },
    );
    assert.equal(s.getState().auth.isIdentityVerified, true);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("avatar upload uses multipart file and returned remote URL before identity refresh", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  const file = new File(["image"], "avatar.png", { type: "image/png" });
  const avatarUrl = "https://example.invalid/avatar.png";
  globalThis.fetch = async (request) => {
    if (request.method === "POST") {
      assert.equal(
        new URL(request.url).pathname,
        "/api/v1/users/me/profile/avatar/upload",
      );
      const body = await request.formData();
      assert.deepEqual([...body.keys()], ["file"]);
      assert.equal(body.get("file").name, "avatar.png");
      assert.equal(await body.get("file").text(), "image");
      return json({ message: "Saved", avatarUrl });
    }
    return json(accountDto({ profile: { ...accountDto().profile, avatarUrl } }));
  };
  try {
    const r = await s
      .dispatch(accountApi.endpoints.uploadAccountAvatar.initiate({ scope, file }))
      .unwrap();
    assert.equal(r.avatarUrl, avatarUrl);
    assert.equal(s.getState().auth.user.avatarUrl, avatarUrl);
    assert.equal(
      validAccountImage(new File([], "empty.png", { type: "image/png" })) !== null,
      true,
    );
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
for (const status of [400, 403, 404, 409, 500, "network"])
  test(`profile ${status} failure keeps existing account identity`, async () => {
    const s = memberStore();
    const original = globalThis.fetch;
    const previous = s.getState().auth.user;
    globalThis.fetch = async () => {
      if (status === "network") throw Error("offline");
      return json({ message: "Private details" }, status);
    };
    try {
      assert.ok(
        (
          await s.dispatch(
            accountApi.endpoints.updateAccountProfile.initiate({
              scope,
              body: { displayName: "Keep my draft" },
            }),
          )
        ).error,
      );
      assert.deepEqual(s.getState().auth.user, previous);
    } finally {
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("password DTO matches backend confirmation, strength, unchanged-password and mismatch rules", async () => {
  for (const newPassword of [
    "short",
    "lowercaseonly",
    "UPPERCASE1",
    "NoDigitsOrSymbols",
  ])
    assert.equal(
      passwordFieldsSchema.safeParse({
        currentPassword: "old",
        newPassword,
        confirmPassword: newPassword,
      }).success,
      false,
    );
  assert.equal(
    passwordFieldsSchema.safeParse({
      currentPassword: "NewPassword2!",
      newPassword: "NewPassword2!",
      confirmPassword: "NewPassword2!",
    }).success,
    false,
  );
  const s = memberStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).pathname, "/api/v1/auth/change-password");
    assert.deepEqual(await request.json(), validPassword);
    return json({ success: true, message: "Password changed successfully" });
  };
  try {
    const r = await s
      .dispatch(
        accountApi.endpoints.changeAccountPassword.initiate({
          scope,
          body: validPassword,
        }),
      )
      .unwrap();
    assert.equal(r.success, true);
    assert.equal(s.getState().auth.accessToken, "test-access");
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("incorrect current password 401 does not refresh or clear the valid session", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ message: "Current password is incorrect" }, 401);
  };
  try {
    const r = await s.dispatch(
      accountApi.endpoints.changeAccountPassword.initiate({
        scope,
        body: validPassword,
      }),
    );
    assert.equal(r.error.status, 401);
    assert.equal(calls, 1);
    assert.equal(s.getState().auth.accessToken, "test-access");
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("password expired JWT still refreshes and retries through existing infrastructure", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  let passwordCalls = 0;
  let refreshes = 0;
  globalThis.fetch = async (request) => {
    if (new URL(request.url).pathname.endsWith("/refresh")) {
      refreshes++;
      return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
    }
    passwordCalls++;
    return passwordCalls === 1
      ? json({ message: "Invalid or expired access token" }, 401)
      : json({ success: true, message: "Changed" });
  };
  try {
    assert.equal(
      (
        await s
          .dispatch(
            accountApi.endpoints.changeAccountPassword.initiate({
              scope,
              body: validPassword,
            }),
          )
          .unwrap()
      ).success,
      true,
    );
    assert.equal(refreshes, 1);
    assert.equal(passwordCalls, 2);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("lead uses exact current DTO: location and reason in notes, no unsupported usualLocation or coordinates", async () => {
  const s = memberStore();
  const original = globalThis.fetch;
  const body = leadPayload({
    truckName: "Actual Truck",
    location: "Park near Library",
    phone: "12345",
    description: "Menu",
    reason: "Local favorite",
  });
  globalThis.fetch = async (request) => {
    assert.equal(
      new URL(request.url).pathname,
      "/api/v1/community/new-food-truck-leads",
    );
    assert.deepEqual(await request.json(), {
      truckName: "Actual Truck",
      ownerPhone: "12345",
      notes:
        "Usual location: Park near Library\nDescription: Menu\nReason: Local favorite",
    });
    return json({ id: viewerId, truckName: "Actual Truck" });
  };
  try {
    assert.equal(
      (
        await s
          .dispatch(accountApi.endpoints.submitTruckLead.initiate({ scope, body }))
          .unwrap()
      ).id,
      viewerId,
    );
    assert.equal("usualLocation" in body, false);
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("deletion requires confirmation and a verified non-vendor account and only then clears locally", async () => {
  const s = memberStore();
  await seedAccount(s);
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (request) => {
    calls++;
    assert.equal(request.method, "DELETE");
    assert.equal(new URL(request.url).pathname, "/api/v1/users/me");
    return json({ deleted: true, message: "Account permanently deleted successfully" });
  };
  try {
    assert.ok(
      (
        await s.dispatch(
          accountApi.endpoints.deleteCustomerAccount.initiate({
            scope,
            confirmed: false,
          }),
        )
      ).error,
    );
    assert.equal(calls, 0);
    await s
      .dispatch(
        accountApi.endpoints.deleteCustomerAccount.initiate({ scope, confirmed: true }),
      )
      .unwrap();
    assert.equal(calls, 1);
    assert.equal(s.getState().auth.accessToken, null);
    assert.deepEqual(s.getState().api.queries, {});
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
test("vendor-profile deletion is blocked before HTTP, and failed deletion preserves account access", async () => {
  const s = memberStore();
  await seedAccount(s, { vendor: { id: viewerId } });
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ message: "Deletion blocked" }, 400);
  };
  try {
    assert.ok(
      (
        await s.dispatch(
          accountApi.endpoints.deleteCustomerAccount.initiate({
            scope,
            confirmed: true,
          }),
        )
      ).error,
    );
    assert.equal(calls, 0);
    await seedAccount(s);
    assert.ok(
      (
        await s.dispatch(
          accountApi.endpoints.deleteCustomerAccount.initiate({
            scope,
            confirmed: true,
          }),
        )
      ).error,
    );
    assert.equal(calls, 1);
    assert.equal(s.getState().auth.accessToken, "test-access");
  } finally {
    cleanup(s);
    globalThis.fetch = original;
  }
});
for (const endpoint of [
  "updateAccountProfile",
  "deleteCustomerAccount",
  "changeAccountPassword",
])
  test(`${endpoint} duplicate guard and session replacement reject delayed completion`, async () => {
    const s = memberStore();
    await seedAccount(s);
    const original = globalThis.fetch;
    let release;
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      await new Promise((r) => {
        release = r;
      });
      return json(
        endpoint === "deleteCustomerAccount"
          ? { deleted: true, message: "Deleted" }
          : endpoint === "changeAccountPassword"
            ? { success: true, message: "Changed" }
            : {
                userId: viewerId,
                displayName: "Old response",
                email: "old@example.invalid",
                phone: null,
              },
      );
    };
    const arg =
      endpoint === "deleteCustomerAccount"
        ? { scope, confirmed: true }
        : endpoint === "changeAccountPassword"
          ? { scope, body: validPassword }
          : { scope, body: { displayName: "Old response" } };
    const first = s.dispatch(accountApi.endpoints[endpoint].initiate(arg));
    try {
      while (!release) await tick();
      assert.ok((await s.dispatch(accountApi.endpoints[endpoint].initiate(arg))).error);
      assert.equal(calls, 1);
      s.dispatch(
        sessionStarted({ accessToken: "new-access", refreshToken: "new-refresh" }),
      );
      release();
      await first;
      assert.equal(s.getState().auth.accessToken, "new-access");
      assert.deepEqual(s.getState().api.queries, {});
    } finally {
      release?.();
      cleanup(s);
      globalThis.fetch = original;
    }
  });
test("settings forms preserve styling and read-only fields using verified current-user data", async () => {
  const s = memberStore();
  await seedAccount(s);
  const render = (C, props) =>
    renderToStaticMarkup(h(Provider, { store: s }, h(MemoryRouter, null, h(C, props))));
  try {
    const editor = render(SettingsProfileEditor, {
      profile: accountFields(accountDto()),
      onSave() {},
      onCancel() {},
    });
    assert.match(editor, /Read only bio/);
    assert.match(editor, /readOnly/);
    assert.doesNotMatch(editor, /name="bio"|name="fullName"/);
    assert.match(editor, /settings-form-card/);
    assert.match(render(SettingsPasswordForm, { onCancel() {} }), /type="password"/);
    assert.match(
      render(SettingsProfilePanel, {
        profile: accountFields(accountDto()),
        onEdit() {},
        onDelete() {},
      }),
      /Vendor accounts cannot be deleted here/,
    );
  } finally {
    cleanup(s);
  }
});
