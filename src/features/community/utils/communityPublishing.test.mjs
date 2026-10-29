import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { communityFormErrors, customerCommunityFields } from "./communityFormErrors.ts";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { baseApi } from "../../../services/api/baseApi.ts";
import {
  communityApi,
  communityScope,
  communityPublisherAllowed,
} from "../api/community.api.ts";
import {
  communityDetailSchema,
  communityPostSchema,
} from "../schemas/community.schema.ts";
import {
  createCommunitySchema,
  updateCommunitySchema,
} from "../schemas/communityPublishing.schema.ts";
import {
  composerPayload,
  composerPatch,
  composerFromPost,
  communityBudget,
  communityFileError,
  communityFileSignature,
  editableCommunityPost,
  publishCommunityDraft,
} from "./communityPublishing.ts";
import {
  vendorGeneralComposer,
  vendorTruckComposer,
} from "./vendorCommunityPublishing.ts";
import { emptyCommunityComposer } from "../../customer/schemas/community.schema.ts";
import { CommunityComposer } from "../../customer/components/community/CommunityComposer.tsx";
import { CommunityPublishingFeedback } from "../components/CommunityPublishingFeedback.tsx";
import { VendorCommunityPostForm } from "../../vendor/components/create-posts/VendorCommunityPostForm.tsx";
import { VendorTruckRequestForm } from "../../vendor/components/create-posts/VendorTruckRequestForm.tsx";
import { VendorPostReview } from "../../vendor/components/create-posts/VendorPostReview.tsx";
import { vendorApi } from "../../vendor/api/vendor.api.ts";
import { profileDto } from "../../vendor/utils/vendor.test-fixtures.mjs";
import { identityVerified, sessionRestored } from "../../auth/store/auth.slice.ts";
import {
  communityStore as baseCommunityStore,
  viewerId,
  postId,
  otherId,
  postDto,
  listDto,
  json,
} from "./community.test-fixtures.mjs";
const cleanup = (store) => store.dispatch(baseApi.util.resetApiState());
const communityStore = (role = "CUSTOMER") => {
  const store = baseCommunityStore(role);
  store.dispatch(identityVerified({ ...store.getState().auth.user, roles: [role] }));
  return store;
};
const scope = (store) => communityScope(store.getState());
const noop = () => {};
const image = (name = "photo.jpg") =>
  new globalThis.File([new Uint8Array([255, 216, 255, 0])], name, {
    type: "image/jpeg",
  });
const pdf = () =>
  new globalThis.File(["%PDF-1.7"], "flyer.pdf", { type: "application/pdf" });
const media = { mediaUrl: "https://example.invalid/confirmed.jpg", mediaType: "IMAGE" };
const ownPost = (overrides = {}) =>
  postDto({
    author: { ...postDto().author, id: viewerId },
    viewer: { isOwner: true, isIgnored: false, isInterested: false },
    allowedActions: {
      canEdit: true,
      canDelete: true,
      canQuote: false,
      canSendInterest: false,
    },
    ...overrides,
  });
const created = (overrides = {}) => ({
  message: "Community post created successfully",
  post: ownPost(),
  rewardStatus: "NOT_AWARDED",
  ...overrides,
});
const requestValues = {
  ...emptyCommunityComposer,
  category: "Need a truck",
  body: "Actual event description",
  eventType: "Birthday Party",
  date: "2099-06-20",
  time: "12:30",
  location: "Actual event venue",
  guests: "50",
  budget: "$500.50–800.25",
  menus: ["Tacos"],
};
async function seedDetail(store, post = ownPost()) {
  await store.dispatch(
    communityApi.util.upsertQueryData(
      "getCommunityPost",
      { ...scope(store), postId: post.id },
      communityDetailSchema.parse({ message: "ok", post }),
    ),
  );
}

for (const [label, category] of [
  ["Community", "COMMUNITY"],
  ["Community help", "COMMUNITY_HELP"],
  ["For sale", "FOR_SALE"],
  ["Hiring / jobs", "HIRING_JOBS"],
  ["Callout", "VENDOR_CALLOUT"],
  ["Need a truck", "NEED_TRUCK"],
])
  test(`${category} maps collected inputs to an exact whitelisted DTO`, () => {
    const values =
      label === "Need a truck"
        ? requestValues
        : {
            ...emptyCommunityComposer,
            category: label,
            body: "Actual description",
            itemName: "Actual grill",
            fake: "unsupported",
            date: "fake unrelated date",
          };
    const body = composerPayload(values);
    assert.equal(body.category, category);
    assert.equal(body.description, values.body);
    if (category === "NEED_TRUCK") {
      assert.equal(body.eventType, "BIRTHDAY_PARTY");
      assert.equal(body.startTime, "12:30");
      assert.equal(body.budgetMin, 500.5);
      assert.equal(body.budgetMax, 800.25);
      assert.equal(body.guestCount, 50);
      assert.equal(body.eventTimezone, undefined);
      assert.equal(body.latitude, undefined);
    } else
      assert.deepEqual(
        Object.keys(body).sort(),
        (category === "FOR_SALE"
          ? ["category", "description", "title"]
          : ["category", "description"]
        ).sort(),
      );
    assert.equal(body.fake, undefined);
    assert.equal(body.foodTruckId, undefined);
  });
test("conditional validation rejects absent event fields, malformed dates, inverted budgets and unsupported writes", () => {
  const body = composerPayload(requestValues);
  for (const field of [
    "eventType",
    "eventDate",
    "startTime",
    "address",
    "guestCount",
  ]) {
    const invalid = { ...body };
    delete invalid[field];
    assert.equal(createCommunitySchema.safeParse(invalid).success, false);
  }
  for (const patch of [
    { title: "", category: "FOR_SALE" },
    { eventDate: "2000-01-01" },
    { eventDate: "2099-02-31" },
    { startTime: "25:00" },
    { guestCount: 0 },
    { budgetMin: 900, budgetMax: 1 },
    { latitude: 0 },
    { foodTruckId: postId },
    { media: [{ mediaUrl: "blob:local", mediaType: "IMAGE" }] },
  ])
    assert.equal(createCommunitySchema.safeParse({ ...body, ...patch }).success, false);
  assert.equal(
    updateCommunitySchema.safeParse({ category: "COMMUNITY" }).success,
    false,
  );
  assert.equal(updateCommunitySchema.safeParse({ description: null }).success, false);
  assert.equal(updateCommunitySchema.safeParse({}).success, false);
});
test("budgets retain major-unit lower/upper bounds, optional budget and Decimal edit values", () => {
  assert.deepEqual(communityBudget("$1,500.50–2,500.25"), {
    budgetMin: 1500.5,
    budgetMax: 2500.25,
  });
  assert.deepEqual(communityBudget("0"), { budgetMin: 0, budgetMax: 0 });
  for (const value of ["500–bad", "800-500", "12.345", "Infinity", "-5"])
    assert.throws(() => communityBudget(value));
  const body = composerPayload({ ...requestValues, budget: "" });
  assert.equal(body.budgetMin, undefined);
  const post = communityPostSchema.parse(
    ownPost({
      category: "NEED_TRUCK",
      eventType: "BIRTHDAY_PARTY",
      eventDate: "2099-06-20T00:00:00.000Z",
      startTime: "1970-01-01T12:30:00.000Z",
      address: "Venue",
      guestCount: 50,
      budgetMin: "500.50",
      budgetMax: "800.25",
      preferredMenuItems: ["Saved tag not in picker"],
      eventTimezone: "America/Chicago",
    }),
  );
  const before = composerFromPost(post);
  assert.equal(before.time, "12:30");
  assert.equal(before.budget, "500.50–800.25");
  assert.deepEqual(
    composerPatch(before, { ...before, body: "Changed only description" }),
    { description: "Changed only description" },
  );
});
test("vendor forms share the six category mappings without substituting truck/user identity", () => {
  for (const [id, category] of [
    ["callout", "VENDOR_CALLOUT"],
    ["sale", "FOR_SALE"],
    ["jobs", "HIRING_JOBS"],
    ["help", "COMMUNITY_HELP"],
    ["community", "COMMUNITY"],
  ])
    assert.equal(
      composerPayload(
        vendorGeneralComposer({
          category: id,
          title: "Grill",
          description: "Actual vendor text",
        }),
      ).category,
      category,
    );
  const { body, ...fields } = requestValues;
  assert.equal(
    composerPayload(vendorTruckComposer({ ...fields, description: body })).category,
    "NEED_TRUCK",
  );
});
test("customer create sends exact POST/JWT/DTO and confirms ownership, UUID and returned rewardStatus", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (req) => {
    assert.equal(req.method, "POST");
    assert.equal(new URL(req.url).pathname, "/api/v1/community/posts");
    assert.equal(req.headers.get("authorization"), "Bearer test-access");
    assert.deepEqual(await req.json(), {
      category: "COMMUNITY",
      description: "Actual content",
    });
    return json(
      created({
        rewardStatus: "UNCONFIRMED",
        rewardMessage: "Post created, reward unconfirmed",
      }),
      201,
    );
  };
  const req = store.dispatch(
    communityApi.endpoints.createCommunityPost.initiate({
      ...scope(store),
      body: { category: "COMMUNITY", description: "Actual content" },
    }),
  );
  try {
    const result = await req.unwrap();
    assert.equal(result.post.id, postId);
    assert.equal(result.rewardStatus, "UNCONFIRMED");
    assert.equal(result.points, undefined);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("vendor eligibility requires matching active onboarding/dashboard metadata, including dual-role customers", async () => {
  const store = communityStore();
  const actor = store.getState().auth.user;
  store.dispatch(identityVerified({ ...actor, roles: ["CUSTOMER", "VENDOR"] }));
  try {
    assert.equal(communityPublisherAllowed(store.getState(), scope(store)), false);
    for (const [patch, expected] of [
      [{}, true],
      [{ status: "APPROVED" }, true],
      [{ status: "SUSPENDED" }, false],
      [{ status: "ONBOARDING" }, false],
      [{ userId: otherId }, false],
      [{ user: { status: "SUSPENDED" } }, false],
      [
        {
          dashboardAccess: { allowed: false, status: "BLOCKED", reason: "Onboarding" },
        },
        false,
      ],
    ]) {
      await store.dispatch(
        vendorApi.util.upsertQueryData(
          "getVendorMe",
          undefined,
          profileDto({ userId: viewerId, ...patch }),
        ),
      );
      assert.equal(
        communityPublisherAllowed(store.getState(), scope(store)),
        expected,
        JSON.stringify(patch),
      );
    }
  } finally {
    cleanup(store);
  }
});
test("verified active vendor can publish through the same endpoint without requiring a fabricated truck", async () => {
  const store = communityStore("VENDOR");
  const original = globalThis.fetch;
  await store.dispatch(
    vendorApi.util.upsertQueryData(
      "getVendorMe",
      undefined,
      profileDto({ userId: viewerId }),
    ),
  );
  globalThis.fetch = async (req) => {
    assert.equal(new URL(req.url).pathname, "/api/v1/community/posts");
    assert.equal((await req.json()).foodTruckId, undefined);
    return json(created());
  };
  const req = store.dispatch(
    communityApi.endpoints.createCommunityPost.initiate({
      ...scope(store),
      body: { category: "COMMUNITY", description: "Vendor content" },
    }),
  );
  try {
    assert.equal((await req.unwrap()).post.id, postId);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("unsupported role, unverified/stale session, vendor onboarding and unknown payloads issue no write", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json(created());
  };
  try {
    for (const mode of ["ADMIN", "VENDOR", "unverified", "stale", "unknown"]) {
      const store = communityStore(
        ["ADMIN", "VENDOR"].includes(mode) ? mode : "CUSTOMER",
      );
      let arg = {
        ...scope(store),
        body: { category: "COMMUNITY", description: "Text" },
      };
      if (mode === "unverified")
        store.dispatch(
          sessionRestored({
            accessToken: "test-access",
            refreshToken: "test-refresh",
            sessionId: arg.sessionId,
            user: null,
          }),
        );
      if (mode === "stale") arg.sessionId = "old";
      if (mode === "unknown") arg.body.fake = "N/A";
      const req = store.dispatch(
        communityApi.endpoints.createCommunityPost.initiate(arg),
      );
      await assert.rejects(req.unwrap());
      req.reset();
      cleanup(store);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = original;
  }
});
test("file validation enforces five files, actual MIME, nonempty size and ten MB; binary checks reject forged files", async () => {
  assert.equal(communityFileError([image(), pdf()]), undefined);
  assert.equal(await communityFileSignature(image()), true);
  assert.equal(await communityFileSignature(pdf()), true);
  for (const files of [
    Array.from({ length: 6 }, () => image()),
    [new globalThis.File([], "empty.jpg", { type: "image/jpeg" })],
    [new globalThis.File(["svg"], "x.svg", { type: "image/svg+xml" })],
    [
      new globalThis.File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", {
        type: "image/png",
      }),
    ],
  ])
    assert.ok(communityFileError(files));
  assert.equal(
    await communityFileSignature(
      new globalThis.File(["fake"], "fake.jpg", { type: "image/jpeg" }),
    ),
    false,
  );
  assert.equal(
    await communityFileSignature(
      new globalThis.File(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
        "x.png",
        { type: "image/png" },
      ),
    ),
    true,
  );
});
test("Community upload sends actual multipart files with generated boundary and validates IMAGE/PDF metadata", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (req) => {
    assert.equal(new URL(req.url).pathname, "/api/v1/community/media/upload");
    assert.equal(req.method, "POST");
    assert.match(req.headers.get("content-type"), /^multipart\/form-data; boundary=/);
    const form = await req.formData();
    assert.deepEqual([...form.keys()], ["files", "files"]);
    assert.deepEqual(
      form.getAll("files").map((f) => f.name),
      ["photo.jpg", "flyer.pdf"],
    );
    return json({
      message: "Attachments uploaded successfully",
      media: [
        media,
        { mediaUrl: "https://example.invalid/flyer.pdf", mediaType: "PDF" },
      ],
    });
  };
  const req = store.dispatch(
    communityApi.endpoints.uploadCommunityMedia.initiate({
      ...scope(store),
      files: [image(), pdf()],
    }),
  );
  try {
    assert.equal((await req.unwrap()).media.length, 2);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("forged upload and mismatched/unsafe returned metadata cannot become remote attachments", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ message: "ok", media: [{ ...media, mediaType: "PDF" }] });
  };
  try {
    const invalid = store.dispatch(
      communityApi.endpoints.uploadCommunityMedia.initiate({
        ...scope(store),
        files: [new globalThis.File(["bad"], "bad.jpg", { type: "image/jpeg" })],
      }),
    );
    await assert.rejects(invalid.unwrap());
    invalid.reset();
    assert.equal(calls, 0);
    for (const response of [
      [{ ...media, mediaType: "PDF" }],
      [{ ...media, mediaUrl: "blob:local" }],
      [],
    ]) {
      globalThis.fetch = async () => json({ message: "ok", media: response });
      const req = store.dispatch(
        communityApi.endpoints.uploadCommunityMedia.initiate({
          ...scope(store),
          files: [image()],
        }),
      );
      await assert.rejects(req.unwrap());
      req.reset();
    }
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("partial file success is retained and explicit retry uploads only the unconfirmed file", async () => {
  const files = [image("one.jpg"), image("two.jpg")];
  const confirmed = new Map();
  let uploads = 0;
  let fail = true;
  let saves = 0;
  const options = {
    body: { category: "COMMUNITY", description: "Draft retained" },
    files,
    isCurrent: () => true,
    cached: (f) => confirmed.get(f),
    remember: (f, m) => confirmed.set(f, m),
    upload: async (f) => {
      uploads++;
      if (f === files[1] && fail) throw new Error("Provider unavailable");
      return { ...media, mediaUrl: `https://example.invalid/${f.name}` };
    },
    save: async (body) => {
      saves++;
      assert.equal(body.media.length, 2);
      return { id: postId };
    },
  };
  await assert.rejects(publishCommunityDraft(options), /Provider unavailable/);
  assert.equal(confirmed.size, 1);
  assert.equal(saves, 0);
  fail = false;
  assert.equal((await publishCommunityDraft(options)).id, postId);
  assert.equal(uploads, 3);
  assert.equal(saves, 1);
});
test("post-create failure after successful upload never republishes automatically or reuploads confirmed files", async () => {
  const file = image();
  const confirmed = new Map();
  let uploads = 0;
  let saves = 0;
  let fail = true;
  const options = {
    body: { category: "COMMUNITY", description: "Draft" },
    files: [file],
    isCurrent: () => true,
    cached: (f) => confirmed.get(f),
    remember: (f, m) => confirmed.set(f, m),
    upload: async () => {
      uploads++;
      return media;
    },
    save: async (body) => {
      saves++;
      assert.deepEqual(body.media, [media]);
      if (fail)
        throw new TypeError("Network failed after persistence might have occurred");
      return { id: postId };
    },
  };
  await assert.rejects(publishCommunityDraft(options));
  assert.equal(saves, 1);
  assert.equal(uploads, 1);
  fail = false;
  await publishCommunityDraft(options);
  assert.equal(saves, 2);
  assert.equal(uploads, 1);
});
test("too many existing plus new attachments blocks before uploading; stale upload cannot be remembered or saved", async () => {
  let uploads = 0;
  let saves = 0;
  let current = true;
  let remembered = 0;
  const options = {
    body: {
      category: "COMMUNITY",
      description: "Text",
      media: Array.from({ length: 5 }, () => media),
    },
    files: [image()],
    isCurrent: () => current,
    cached: () => undefined,
    remember: () => {
      remembered++;
    },
    upload: async () => {
      uploads++;
      current = false;
      return media;
    },
    save: async () => {
      saves++;
    },
  };
  await assert.rejects(publishCommunityDraft(options), /at most five/);
  assert.equal(uploads, 0);
  await assert.rejects(
    publishCommunityDraft({
      ...options,
      body: { category: "COMMUNITY", description: "Text" },
    }),
    /session changed/,
  );
  assert.equal(remembered, 0);
  assert.equal(saves, 0);
});
test("edit form population and changed-field payload preserve unrelated server properties and category", () => {
  const post = communityPostSchema.parse(
    ownPost({
      category: "FOR_SALE",
      title: "Actual grill",
      description: "Original text",
      address: "Saved address",
      eventTimezone: "America/Chicago",
    }),
  );
  const before = composerFromPost(post);
  assert.equal(editableCommunityPost(post, viewerId, "edit"), true);
  assert.equal(before.itemName, "Actual grill");
  assert.deepEqual(composerPatch(before, { ...before, body: "Updated description" }), {
    description: "Updated description",
  });
  assert.throws(() => composerPatch(before, { ...before, category: "Community" }));
  assert.throws(() => composerPatch(before, before));
});
test("PATCH uses actual UUID, changed fields only and confirmed response association", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  await seedDetail(store);
  globalThis.fetch = async (req) => {
    assert.equal(req.method, "PATCH");
    assert.equal(new URL(req.url).pathname, `/api/v1/community/posts/${postId}`);
    assert.deepEqual(await req.json(), { description: "Changed text" });
    return json({
      message: "Community post updated successfully",
      post: ownPost({ description: "Changed text" }),
    });
  };
  const req = store.dispatch(
    communityApi.endpoints.updateCommunityPost.initiate({
      ...scope(store),
      postId,
      body: { description: "Changed text" },
    }),
  );
  try {
    assert.equal((await req.unwrap()).post.id, postId);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("edit/delete reject wrong owner, absent actions, quotes, expired and non-OPEN statuses without HTTP", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ deleted: true, message: "ok" });
  };
  try {
    for (const patch of [
      { author: { ...postDto().author, id: otherId } },
      { viewer: { isOwner: false, isIgnored: false, isInterested: false } },
      {
        allowedActions: {
          canEdit: false,
          canDelete: false,
          canQuote: false,
          canSendInterest: false,
        },
      },
      { counts: { comments: 0, reactions: 0, offers: 1, interestedVendors: 0 } },
      { expiresAt: "2000-01-01T00:00:00Z" },
      ...["DRAFT", "MATCHED", "CLOSED", "CANCELLED", "EXPIRED"].map((status) => ({
        status,
      })),
    ]) {
      await seedDetail(store, ownPost(patch));
      for (const name of ["updateCommunityPost", "deleteCommunityPost"]) {
        const req = store.dispatch(
          communityApi.endpoints[name].initiate({
            ...scope(store),
            postId,
            confirmed: true,
            body: { description: "Edit" },
          }),
        );
        await assert.rejects(req.unwrap());
        req.reset();
      }
    }
    assert.equal(calls, 0);
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("confirmed DELETE uses UUID and soft-delete response; missing confirmation sends nothing", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let calls = 0;
  await seedDetail(store);
  globalThis.fetch = async (req) => {
    calls++;
    assert.equal(req.method, "DELETE");
    assert.equal(new URL(req.url).pathname, `/api/v1/community/posts/${postId}`);
    assert.equal(await req.text(), "");
    return json({ message: "Community post deleted successfully", deleted: true });
  };
  try {
    const denied = store.dispatch(
      communityApi.endpoints.deleteCommunityPost.initiate({
        ...scope(store),
        postId,
        confirmed: false,
      }),
    );
    await assert.rejects(denied.unwrap());
    denied.reset();
    assert.equal(calls, 0);
    const req = store.dispatch(
      communityApi.endpoints.deleteCommunityPost.initiate({
        ...scope(store),
        postId,
        confirmed: true,
      }),
    );
    assert.equal((await req.unwrap()).deleted, true);
    req.reset();
    assert.equal(calls, 1);
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
for (const status of [400, 403, 404, 409, 413, 503, 500])
  test(`write failure ${status} preserves failure and never claims confirmed save/delete`, async () => {
    const store = communityStore();
    const original = globalThis.fetch;
    await seedDetail(store);
    globalThis.fetch = async () =>
      json(
        {
          message:
            status === 400
              ? ["description must be shorter than 5001 characters"]
              : "Rejected",
        },
        status,
      );
    try {
      for (const name of ["updateCommunityPost", "deleteCommunityPost"]) {
        const req = store.dispatch(
          communityApi.endpoints[name].initiate({
            ...scope(store),
            postId,
            body: { description: "Draft text" },
            confirmed: true,
          }),
        );
        await assert.rejects(req.unwrap(), (e) => e.status === status);
        req.reset();
      }
    } finally {
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("concurrent duplicate creation issues one write and rejects the second", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let release;
  let began;
  const started = new Promise((r) => {
    began = r;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    began();
    return new Promise((r) => {
      release = () => r(json(created()));
    });
  };
  const arg = {
    ...scope(store),
    body: { category: "COMMUNITY", description: "Only once" },
  };
  const first = store.dispatch(
    communityApi.endpoints.createCommunityPost.initiate(arg),
  );
  try {
    await started;
    const duplicate = store.dispatch(
      communityApi.endpoints.createCommunityPost.initiate(arg),
    );
    await assert.rejects(duplicate.unwrap(), (e) => e.status === "CUSTOM_ERROR");
    duplicate.reset();
    release();
    await first.unwrap();
    assert.equal(calls, 1);
  } finally {
    first.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("old-session create completion cannot invalidate or populate a newer account", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let release;
  let began;
  const started = new Promise((r) => {
    began = r;
  });
  globalThis.fetch = async () => {
    began();
    return new Promise((r) => {
      release = () => r(json(created()));
    });
  };
  const req = store.dispatch(
    communityApi.endpoints.createCommunityPost.initiate({
      ...scope(store),
      body: { category: "COMMUNITY", description: "Old draft" },
    }),
  );
  try {
    await started;
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
        id: otherId,
        name: "Other user",
        email: "other@example.invalid",
        roles: ["CUSTOMER"],
        role: "CUSTOMER",
      }),
    );
    release();
    await assert.rejects(req.unwrap());
    assert.equal(store.getState().auth.user.id, otherId);
    assert.equal(Object.keys(store.getState().api.queries).length, 0);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("successful creation invalidates Community All/My/detail and Rewards tags; failed write does not", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let reads = 0;
  let fail = true;
  globalThis.fetch = async (req) => {
    if (req.method === "POST")
      return fail ? json({ message: "No" }, 400) : json(created());
    reads++;
    return json(
      new URL(req.url).pathname.endsWith(postId)
        ? { message: "ok", post: ownPost() }
        : listDto(),
    );
  };
  const arg = { ...scope(store), filters: { limit: 20 } };
  const list = store.dispatch(communityApi.endpoints.getCommunityPosts.initiate(arg));
  const mine = store.dispatch(communityApi.endpoints.getMyCommunityPosts.initiate(arg));
  const detail = store.dispatch(
    communityApi.endpoints.getCommunityPost.initiate({ ...scope(store), postId }),
  );
  try {
    await Promise.all([list.unwrap(), mine.unwrap(), detail.unwrap()]);
    assert.equal(reads, 3);
    let write = store.dispatch(
      communityApi.endpoints.createCommunityPost.initiate({
        ...scope(store),
        body: { category: "COMMUNITY", description: "Content" },
      }),
    );
    await assert.rejects(write.unwrap());
    write.reset();
    assert.equal(reads, 3);
    fail = false;
    write = store.dispatch(
      communityApi.endpoints.createCommunityPost.initiate({
        ...scope(store),
        body: { category: "COMMUNITY", description: "Content" },
      }),
    );
    await write.unwrap();
    await Promise.all(store.dispatch(baseApi.util.getRunningQueriesThunk()));
    write.reset();
    assert.equal(reads, 6);
  } finally {
    list.unsubscribe();
    mine.unsubscribe();
    detail.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("malformed create identity, category or reward response cannot produce success", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  try {
    for (const body of [
      created({ post: postDto() }),
      created({ post: ownPost({ category: "FOR_SALE" }) }),
      created({ post: ownPost({ id: "mock-id" }) }),
      created({ rewardStatus: "100_POINTS" }),
      { message: "uploaded", media: [media] },
    ]) {
      globalThis.fetch = async () => json(body);
      const req = store.dispatch(
        communityApi.endpoints.createCommunityPost.initiate({
          ...scope(store),
          body: { category: "COMMUNITY", description: "Draft" },
        }),
      );
      await assert.rejects(req.unwrap());
      req.reset();
    }
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("structured validation maps only known DTO fields while arrays stay at form level", () => {
  const mapped = communityFormErrors(
    {
      kind: "VALIDATION",
      message: "Invalid input",
      fieldErrors: {
        description: "Too long",
        address: "Invalid address",
        internalField: "Hidden",
      },
      validationMessages: ["Array diagnostic"],
    },
    customerCommunityFields,
  );
  assert.deepEqual(mapped.fieldErrors, {
    body: "Too long",
    location: "Invalid address",
  });
  assert.deepEqual(mapped.validationMessages, ["Array diagnostic"]);
});

test("expired Community JWT uses the existing refresh and exactly one authenticated retry", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let writes = 0;
  let refreshes = 0;
  globalThis.fetch = async (req) => {
    if (new URL(req.url).pathname === "/api/v1/auth/refresh") {
      refreshes++;
      assert.deepEqual(await req.json(), { refreshToken: "test-refresh" });
      return json({ accessToken: "rotated", refreshToken: "rotated-refresh" });
    }
    writes++;
    return req.headers.get("authorization") === "Bearer test-access"
      ? json({ message: "Invalid or expired access token" }, 401)
      : json(created());
  };
  const req = store.dispatch(
    communityApi.endpoints.createCommunityPost.initiate({
      ...scope(store),
      body: { category: "COMMUNITY", description: "Actual post" },
    }),
  );
  try {
    await req.unwrap();
    assert.equal(refreshes, 1);
    assert.equal(writes, 2);
    assert.equal(store.getState().auth.isIdentityVerified, true);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});

for (const status of [400, 413, 503])
  test(`upload ${status} remains a failed upload with no post publication`, async () => {
    const store = communityStore();
    const original = globalThis.fetch;
    const paths = [];
    globalThis.fetch = async (req) => {
      paths.push(new URL(req.url).pathname);
      return json({ message: "Upload rejected" }, status);
    };
    const req = store.dispatch(
      communityApi.endpoints.uploadCommunityMedia.initiate({
        ...scope(store),
        files: [image()],
      }),
    );
    try {
      await assert.rejects(req.unwrap(), (e) => e.status === status);
      assert.deepEqual(paths, ["/api/v1/community/media/upload"]);
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });

test("network failure during create is not retried automatically", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new TypeError("offline");
  };
  const req = store.dispatch(
    communityApi.endpoints.createCommunityPost.initiate({
      ...scope(store),
      body: { category: "COMMUNITY", description: "Retained draft" },
    }),
  );
  try {
    await assert.rejects(req.unwrap(), (e) => e.status === "FETCH_ERROR");
    assert.equal(calls, 1);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});

test("in-flight edit and delete share one post lock", async () => {
  const store = communityStore();
  const original = globalThis.fetch;
  await seedDetail(store);
  let release;
  let begin;
  const started = new Promise((r) => {
    begin = r;
  });
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    begin();
    return new Promise((r) => {
      release = () =>
        r(json({ message: "ok", post: ownPost({ description: "Updated" }) }));
    });
  };
  const edit = store.dispatch(
    communityApi.endpoints.updateCommunityPost.initiate({
      ...scope(store),
      postId,
      body: { description: "Updated" },
    }),
  );
  try {
    await started;
    const deletion = store.dispatch(
      communityApi.endpoints.deleteCommunityPost.initiate({
        ...scope(store),
        postId,
        confirmed: true,
      }),
    );
    await assert.rejects(deletion.unwrap(), (e) => e.status === "CUSTOM_ERROR");
    deletion.reset();
    release();
    await edit.unwrap();
    assert.equal(calls, 1);
  } finally {
    edit.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});

test("integrated forms retain styles and expose real pending/error/recovery language without preview success", () => {
  const html = renderToStaticMarkup(
    h(CommunityComposer, {
      integrated: true,
      initial: requestValues,
      pending: true,
      onSave: noop,
      onCancel: noop,
    }),
  );
  assert.ok(html.includes("community-form-panel"));
  assert.ok(html.includes("UTC"));
  assert.ok(html.includes("Saving"));
  assert.ok(!html.includes("Save changes (preview)"));
  const vendor = renderToStaticMarkup(
    h(VendorCommunityPostForm, {
      integrated: true,
      category: "community",
      heading: "Community",
      files: [],
      onFiles: noop,
      onDraft: noop,
      onBack: noop,
      onSubmit: noop,
    }),
  );
  assert.ok(vendor.includes("vendor-post-form"));
  assert.ok(vendor.includes("10 MB"));
  assert.ok(!vendor.includes("Nothing is published or sent"));
  const truck = renderToStaticMarkup(
    h(VendorTruckRequestForm, {
      integrated: true,
      onDraft: noop,
      onBack: noop,
      onCancel: noop,
      onSubmit: noop,
    }),
  );
  assert.ok(truck.includes("UTC"));
  assert.ok(truck.includes("not a booking or quote"));
  const recovery = renderToStaticMarkup(
    h(CommunityPublishingFeedback, {
      publication: {
        error: "Saving unconfirmed",
        uncertain: true,
        reviewed: true,
        pending: false,
        refreshMine: noop,
        review: { pages: [listDto()] },
      },
    }),
  );
  assert.ok(recovery.includes("Refresh My Posts before retrying"));
  assert.ok(recovery.includes("cannot prove"));
  const review = renderToStaticMarkup(
    h(VendorPostReview, {
      remote: communityPostSchema.parse(ownPost()),
      rewardStatus: "UNCONFIRMED",
      editable: true,
      onEdit: noop,
      onNew: noop,
    }),
  );
  assert.ok(review.includes("Reward status: UNCONFIRMED"));
  assert.ok(!review.includes("saved in this preview"));
});
