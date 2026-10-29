import assert from "node:assert/strict";
import test from "node:test";
import { URL } from "node:url";
import { setImmediate, setTimeout } from "node:timers";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { baseApi } from "../../../services/api/baseApi.ts";
import { socialFeedApi } from "../api/socialFeed.api.ts";
import { createSocialPostSchema, feedSchema } from "../schemas/socialFeed.schema.ts";
import { postPayload, validPostFile } from "./postPublishing.ts";
import { publishDraft } from "./usePublishPost.ts";
import { toSocialCard, uniqueFeedPosts } from "./feedAdapters.ts";
import { clearSession, sessionStarted } from "../../auth/store/auth.slice.ts";
import CustomerFeedPage from "../../customer/pages/CustomerFeedPage.tsx";
import VendorFeedPage from "../../vendor/pages/VendorFeedPage.tsx";
import CustomerCreatePostPage from "../../customer/pages/CustomerCreatePostPage.tsx";
import { FeedPostCard } from "../../customer/components/feed/FeedPostCard.tsx";
import { FeedCommentForm } from "../../customer/components/feed/FeedCommentForm.tsx";
import {
  vendorTestStore,
  seedVendorHome,
  truckId as vendorTruckId,
} from "../../vendor/utils/vendor.test-fixtures.mjs";
import {
  feedStore,
  feedDto,
  feedPostDto,
  commentDto,
  commentsDto,
  postId,
  otherPostId,
  memberId,
  viewerId,
  truckId,
  imageFile,
  json,
} from "./socialFeed.test-fixtures.mjs";
const cleanup = (store) => store.dispatch(baseApi.util.resetApiState());
const render = (store, Component, props = {}, path = "/") =>
  renderToStaticMarkup(
    h(
      Provider,
      { store },
      h(MemoryRouter, { initialEntries: [path] }, h(Component, props)),
    ),
  );
for (const audience of ["following", "explore"])
  test(`${audience} feed uses JWT, correct params and raw envelope`, async () => {
    const store = feedStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      const url = new URL(request.url);
      assert.equal(url.pathname, `/api/v1/social/feed/${audience}`);
      assert.equal(url.searchParams.get("limit"), "20");
      assert.equal(url.searchParams.has("cursor"), false);
      assert.equal(
        url.searchParams.get("sortBy"),
        audience === "explore" ? "newest" : null,
      );
      assert.equal(request.headers.get("authorization"), "Bearer test-access");
      return json(feedDto());
    };
    const req = store.dispatch(
      socialFeedApi.endpoints.getSocialFeed.initiate({
        audience,
        sessionId: "member-test",
      }),
    );
    try {
      const result = await req.unwrap();
      assert.equal(result.pages[0].items[0].id, postId);
    } finally {
      req.unsubscribe();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("cursor pages stay in RTK Query and duplicate IDs are reconciled without fake posts", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  const cursors = [];
  globalThis.fetch = async (request) => {
    const cursor = new URL(request.url).searchParams.get("cursor");
    cursors.push(cursor);
    return json(
      cursor
        ? feedDto({
            items: [feedPostDto({ likeCount: 99 }), feedPostDto({ id: otherPostId })],
          })
        : feedDto({ nextCursor: postId }),
    );
  };
  const arg = { audience: "following", sessionId: "member-test" };
  const first = store.dispatch(socialFeedApi.endpoints.getSocialFeed.initiate(arg));
  try {
    await first.unwrap();
    const second = store.dispatch(
      socialFeedApi.endpoints.getSocialFeed.initiate(arg, { direction: "forward" }),
    );
    const data = await second.unwrap();
    assert.deepEqual(cursors, [null, postId]);
    const posts = uniqueFeedPosts(data.pages);
    assert.equal(posts.length, 2);
    assert.equal(posts[0].likeCount, 99);
    second.unsubscribe();
  } finally {
    first.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("tab unsubscribe discards cursor pages and a return starts at the initial cursor", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  const cursors = [];
  globalThis.fetch = async (request) => {
    cursors.push(new URL(request.url).searchParams.get("cursor"));
    return json(feedDto({ nextCursor: postId }));
  };
  const arg = { audience: "following", sessionId: "member-test" };
  try {
    const req = store.dispatch(socialFeedApi.endpoints.getSocialFeed.initiate(arg));
    await req.unwrap();
    req.unsubscribe();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(
      socialFeedApi.endpoints.getSocialFeed.select(arg)(store.getState()).data,
      undefined,
    );
    const next = store.dispatch(socialFeedApi.endpoints.getSocialFeed.initiate(arg));
    await next.unwrap();
    next.unsubscribe();
    assert.deepEqual(cursors, [null, null]);
  } finally {
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("adapter keeps actual author UUID, location, counts and media; missing author/image remains unavailable", () => {
  const dto = feedSchema.parse(feedDto());
  const card = toSocialCard(dto.items[0]);
  assert.equal(card.authorId, memberId);
  assert.equal(card.location, "Actual food park");
  assert.equal(card.likes, 12);
  assert.equal(card.commentCount, 2);
  assert.equal(card.image, "https://example.invalid/food.jpg");
  assert.match(card.age, /UTC/);
  const absent = toSocialCard(
    feedPostDto({
      author: null,
      authorUserId: null,
      location: null,
      media: [],
      viewCount: undefined,
    }),
  );
  assert.equal(absent.authorId, null);
  assert.equal(absent.image, "");
  assert.equal(absent.views, null);
  assert.equal(absent.author, "Author unavailable");
});
for (const [kind, path, response] of [
  ["like", `/social/posts/${postId}/like`, { liked: false }],
  ["comment-like", `/social/comments/${memberId}/like`, { liked: true, likeCount: 3 }],
  [
    "share",
    `/social/posts/${postId}/share`,
    {
      success: true,
      postId,
      shareCount: 2,
      shareUrl: `/api/v1/social/posts/${postId}`,
      shareText: "Actual social post",
    },
  ],
  ["comment", `/social/posts/${postId}/comments`, commentDto()],
])
  test(`${kind} mutation consumes the actual toggle/comment/share result`, async () => {
    const store = feedStore();
    const original = globalThis.fetch;
    globalThis.fetch = async (request) => {
      assert.equal(new URL(request.url).pathname, `/api/v1${path}`);
      assert.equal(request.method, "POST");
      if (kind === "comment")
        assert.deepEqual(await request.json(), { content: "Actual comment" });
      else assert.equal(await request.text(), "");
      return json(response);
    };
    const req = store.dispatch(
      socialFeedApi.endpoints.socialPostAction.initiate({
        kind,
        postId,
        commentId: kind === "comment-like" ? memberId : undefined,
        content: kind === "comment" ? "Actual comment" : undefined,
      }),
    );
    try {
      assert.deepEqual(await req.unwrap(), response);
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("one-level reply payload uses the real parentCommentId and backend returned relation", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    assert.deepEqual(await request.json(), {
      content: "Reply",
      parentCommentId: memberId,
    });
    return json(commentDto({ parentCommentId: memberId, content: "Reply" }));
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.socialPostAction.initiate({
      kind: "comment",
      postId,
      content: "Reply",
      parentCommentId: memberId,
    }),
  );
  try {
    assert.equal((await req.unwrap()).parentCommentId, memberId);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("comments paginate top-level rows by offset while totalCount includes replies", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    assert.equal(url.searchParams.get("limit"), "20");
    assert.equal(url.searchParams.get("offset"), "20");
    return json(commentsDto);
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.getPostComments.initiate({ postId, offset: 20 }),
  );
  try {
    const result = await req.unwrap();
    assert.equal(result.totalCount, 2);
    assert.equal(result.comments.length, 1);
    assert.equal(result.comments[0].replies[0].parentCommentId, memberId);
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("actual places use search/offset, no invented location fields", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const url = new URL(request.url);
    assert.equal(url.pathname, "/api/v1/social/places");
    assert.equal(url.searchParams.get("search"), "park");
    assert.equal(url.searchParams.get("offset"), "20");
    return json([{ id: truckId, name: "Actual park", address: null }]);
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.getSocialPlaces.initiate({ search: "park", offset: 20 }),
  );
  try {
    assert.equal((await req.unwrap())[0].name, "Actual park");
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("upload uses multipart files field, real file bytes, browser boundary and persisted URL", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).pathname, "/api/v1/social/media/upload");
    assert.match(
      request.headers.get("content-type"),
      /^multipart\/form-data; boundary=/,
    );
    assert.equal(request.headers.get("authorization"), "Bearer test-access");
    const body = await request.formData();
    assert.equal(body.getAll("files").length, 1);
    assert.equal(body.get("files").name, "photo.jpg");
    assert.equal(body.get("files").size, 4);
    return json({
      media: [
        {
          mediaType: "IMAGE",
          mediaUrl: "https://example.invalid/persisted.jpg",
          sortOrder: 0,
        },
      ],
    });
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.uploadSocialImage.initiate({ file: imageFile() }),
  );
  try {
    assert.match((await req.unwrap()).media[0].mediaUrl, /persisted.jpg/);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
for (const file of [
  imageFile("x.webp", "image/webp"),
  imageFile("x.pdf", "application/pdf"),
  new globalThis.File([], "empty.jpg", { type: "image/jpeg" }),
  new globalThis.File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", {
    type: "image/png",
  }),
])
  test(`invalid upload ${file.name} never sends HTTP`, async () => {
    assert.ok(validPostFile(file));
    const store = feedStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () => assert.fail("invalid upload");
    const req = store.dispatch(
      socialFeedApi.endpoints.uploadSocialImage.initiate({ file }),
    );
    try {
      await assert.rejects(req.unwrap());
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("creation payload strips UI values, preserves supported place/tag UUIDs and remote URLs", () => {
  const payload = postPayload(
    { text: " Real post ", locationId: truckId, friendIds: [memberId, memberId] },
    [{ mediaType: "IMAGE", mediaUrl: "https://example.invalid/a.jpg", sortOrder: 8 }],
  );
  assert.deepEqual(payload, {
    content: "Real post",
    status: "PUBLISHED",
    locationId: truckId,
    taggedUserIds: [memberId],
    media: [
      { mediaType: "IMAGE", mediaUrl: "https://example.invalid/a.jpg", sortOrder: 0 },
    ],
  });
  for (const mediaUrl of [
    "blob:https://example.invalid/a",
    "data:image/png;base64,abc",
  ]) {
    assert.equal(
      createSocialPostSchema.safeParse({
        content: "x",
        status: "PUBLISHED",
        media: [{ mediaType: "IMAGE", mediaUrl, sortOrder: 0 }],
      }).success,
      false,
    );
  }
  assert.equal(
    createSocialPostSchema.safeParse({
      content: "x",
      status: "PUBLISHED",
      text: "unsupported",
    }).success,
    false,
  );
  assert.equal(
    createSocialPostSchema.safeParse({ content: " ", status: "PUBLISHED" }).success,
    false,
  );
});
test("customer publishes only supported DTO properties and waits for PUBLISHED response", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    assert.equal(new URL(request.url).pathname, "/api/v1/social/posts");
    assert.deepEqual(await request.json(), {
      content: "Actual post",
      status: "PUBLISHED",
    });
    return json({ id: postId, status: "PUBLISHED", authorUserId: viewerId });
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.createSocialPost.initiate({
      content: "Actual post",
      status: "PUBLISHED",
    }),
  );
  try {
    assert.equal((await req.unwrap()).id, postId);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
for (const [role, dual, arg] of [
  ["CUSTOMER", true, { content: "x", status: "PUBLISHED" }],
  ["CUSTOMER", false, { content: "x", status: "PUBLISHED", foodTruckId: truckId }],
  ["VENDOR", false, { content: "x", status: "PUBLISHED", foodTruckId: truckId }],
  ["ADMIN", false, { content: "x", status: "PUBLISHED" }],
])
  test(`posting identity gated without guessing ${role}/${dual}`, async () => {
    const store = feedStore(role, dual);
    const original = globalThis.fetch;
    globalThis.fetch = async () => assert.fail("unverified posting context");
    const req = store.dispatch(socialFeedApi.endpoints.createSocialPost.initiate(arg));
    try {
      await assert.rejects(req.unwrap());
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("vendor creation uses verified owned truck UUID", async () => {
  const store = vendorTestStore();
  await seedVendorHome(store);
  const original = globalThis.fetch;
  globalThis.fetch = async (request) => {
    const body = await request.json();
    assert.equal(body.foodTruckId, vendorTruckId);
    return json({ id: postId, status: "PUBLISHED" });
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.createSocialPost.initiate({
      content: "Truck update",
      status: "PUBLISHED",
      foodTruckId: vendorTruckId,
    }),
  );
  try {
    assert.equal((await req.unwrap()).status, "PUBLISHED");
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("partial upload retry reuses successful files and never publishes incomplete media", async () => {
  const cache = new Map();
  const uploads = [];
  let fail = true;
  let created = 0;
  const options = {
    text: "Post",
    files: [
      { id: "first", file: imageFile() },
      { id: "second", file: imageFile("second.png", "image/png") },
    ],
    isCurrent: () => true,
    cached: (id) => cache.get(id),
    upload: async (id) => {
      uploads.push(id);
      if (id === "second" && fail) throw new Error("offline");
      const value = {
        mediaType: "IMAGE",
        mediaUrl: `https://example.invalid/${id}.jpg`,
        sortOrder: 0,
      };
      cache.set(id, value);
      return value;
    },
    create: async (body) => {
      created++;
      assert.equal(body.media.length, 2);
      return { id: postId };
    },
  };
  await assert.rejects(publishDraft(options));
  assert.equal(created, 0);
  fail = false;
  await publishDraft(options);
  assert.deepEqual(uploads, ["first", "second", "second"]);
  assert.equal(created, 1);
});
test("failed publish after successful uploads retains media for explicit retry", async () => {
  const cache = new Map();
  let uploads = 0;
  let creations = 0;
  const options = {
    text: "Post",
    files: [{ id: "first", file: imageFile() }],
    isCurrent: () => true,
    cached: (id) => cache.get(id),
    upload: async (id) => {
      uploads++;
      const value = {
        mediaType: "IMAGE",
        mediaUrl: "https://example.invalid/real.jpg",
        sortOrder: 0,
      };
      cache.set(id, value);
      return value;
    },
    create: async () => {
      if (++creations === 1) throw new Error("server unavailable");
      return { id: postId };
    },
  };
  await assert.rejects(publishDraft(options));
  await publishDraft(options);
  assert.equal(uploads, 1);
  assert.equal(creations, 2);
});
test("session switch during upload prevents next upload and post creation", async () => {
  let current = true;
  let creations = 0;
  await assert.rejects(
    publishDraft({
      text: "x",
      files: [{ id: "first", file: imageFile() }],
      isCurrent: () => current,
      cached: () => undefined,
      upload: async () => {
        current = false;
        return {
          mediaType: "IMAGE",
          mediaUrl: "https://example.invalid/a.jpg",
          sortOrder: 0,
        };
      },
      create: async () => {
        creations++;
        return { id: postId };
      },
    }),
  );
  assert.equal(creations, 0);
});
for (const status of [400, 401, 403, 404, 409, 500, 503, "network"])
  test(`failed post action ${status} has no false confirmation`, async () => {
    const store = feedStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      if (status === "network") throw new TypeError("offline");
      return json({ message: ["content must be valid"] }, status);
    };
    const req = store.dispatch(
      socialFeedApi.endpoints.socialPostAction.initiate({
        kind: "comment",
        postId,
        content: "retained draft",
      }),
    );
    try {
      await assert.rejects(req.unwrap());
      assert.equal(req.arg.originalArgs.content, "retained draft");
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("concurrent toggles result in one request; logout removes old action state", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  let resolve;
  let calls = 0;
  globalThis.fetch = () => {
    calls++;
    return new Promise((r) => {
      resolve = r;
    });
  };
  const first = store.dispatch(
    socialFeedApi.endpoints.socialPostAction.initiate({ kind: "like", postId }),
  );
  try {
    await new Promise((r) => setImmediate(r));
    const second = store.dispatch(
      socialFeedApi.endpoints.socialPostAction.initiate({ kind: "like", postId }),
    );
    await assert.rejects(second.unwrap());
    assert.equal(calls, 1);
    store.dispatch(clearSession("storage"));
    resolve(json({ liked: true }));
    await assert.rejects(first.unwrap());
    await new Promise((r) => setImmediate(r));
    assert.equal(Object.keys(store.getState().api.mutations).length, 0);
    second.reset();
  } finally {
    first.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("new login while upload is pending cannot repopulate its mutation cache", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  let resolve;
  globalThis.fetch = () =>
    new Promise((r) => {
      resolve = r;
    });
  const req = store.dispatch(
    socialFeedApi.endpoints.uploadSocialImage.initiate(
      { file: imageFile() },
      { fixedCacheKey: "old-upload" },
    ),
  );
  try {
    await new Promise((r) => setImmediate(r));
    store.dispatch(
      sessionStarted({ accessToken: "new-access", refreshToken: "new-refresh" }),
    );
    resolve(
      json({
        media: [
          {
            mediaType: "IMAGE",
            mediaUrl: "https://example.invalid/old.jpg",
            sortOrder: 0,
          },
        ],
      }),
    );
    await assert.rejects(req.unwrap());
    await new Promise((r) => setImmediate(r));
    assert.equal(Object.keys(store.getState().api.mutations).length, 0);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("server-confirmed like invalidates feed cache and refetches authoritative counts/state", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  let liked = false;
  globalThis.fetch = async (request) => {
    if (request.method === "POST") {
      liked = true;
      return json({ liked: true });
    }
    return json(
      feedDto({ items: [feedPostDto({ isLiked: liked, likeCount: liked ? 13 : 12 })] }),
    );
  };
  const arg = { audience: "following", sessionId: "member-test" };
  const feed = store.dispatch(socialFeedApi.endpoints.getSocialFeed.initiate(arg));
  try {
    await feed.unwrap();
    const action = store.dispatch(
      socialFeedApi.endpoints.socialPostAction.initiate({ kind: "like", postId }),
    );
    await action.unwrap();
    await feed.refetch().unwrap();
    const data = socialFeedApi.endpoints.getSocialFeed.select(arg)(
      store.getState(),
    ).data;
    assert.equal(data.pages[0].items[0].likeCount, 13);
    assert.equal(data.pages[0].items[0].isLiked, true);
    action.reset();
  } finally {
    feed.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("initial customer/vendor loading and empty feeds contain no fixture posts", async () => {
  const store = feedStore();
  let html = render(store, CustomerFeedPage);
  assert.match(html, /Loading posts/);
  assert.doesNotMatch(html, /Taco Paradise|static preview/);
  await store.dispatch(
    socialFeedApi.util.upsertQueryData(
      "getSocialFeed",
      { audience: "following", sessionId: "member-test" },
      { pages: [{ items: [], nextCursor: null }], pageParams: [undefined] },
    ),
  );
  assert.match(render(store, CustomerFeedPage), /No posts yet/);
  cleanup(store);
  const vendor = vendorTestStore();
  html = render(vendor, VendorFeedPage);
  assert.match(html, /Loading posts/);
  assert.doesNotMatch(html, /Sushi Haven|Hello Taco/);
  cleanup(vendor);
});
test("real feed cards render identity, actions, counts and text without inserted emoji/artwork", () => {
  const store = feedStore();
  const html = render(store, FeedPostCard, {
    post: toSocialCard(feedPostDto()),
    onShare() {},
    onImage() {},
  });
  assert.match(html, /Actual social post/);
  assert.match(html, /12/);
  assert.match(html, new RegExp(`/profile/${memberId}`));
  assert.match(html, /aria-haspopup="dialog"/);
  assert.doesNotMatch(html, /feed-symbol|local preview/);
  cleanup(store);
});
test("composer starts empty with verified identity and backend-compatible MIME choices", () => {
  const store = feedStore();
  const html = render(store, CustomerCreatePostPage);
  assert.match(html, /Test Viewer/);
  assert.match(html, /image\/jpeg,image\/png/);
  assert.doesNotMatch(html, /sample-photo|Alex Rivera|image\/webp/);
  assert.match(
    renderToStaticMarkup(h(FeedCommentForm, { onPreview: () => false })),
    /Post comment/,
  );
  cleanup(store);
});
test("share API reference is not a frontend permalink or native delivery confirmation", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    json({
      success: true,
      postId,
      shareCount: 2,
      shareUrl: `/api/v1/social/posts/${postId}`,
      shareText: "Post",
    });
  const req = store.dispatch(
    socialFeedApi.endpoints.socialPostAction.initiate({ kind: "share", postId }),
  );
  try {
    const data = await req.unwrap();
    assert.equal(data.shareUrl, `/api/v1/social/posts/${postId}`);
    assert.equal(data.shareUrl.startsWith("/profile/"), false);
  } finally {
    req.reset();
    cleanup(store);
    globalThis.fetch = original;
  }
});
test("unknown envelopes and fake entity IDs fail without mock fallback", async () => {
  const store = feedStore();
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return json({ data: feedDto() });
  };
  const req = store.dispatch(
    socialFeedApi.endpoints.getSocialFeed.initiate({
      audience: "explore",
      sessionId: "member-test",
    }),
  );
  try {
    await assert.rejects(req.unwrap());
    const invalid = store.dispatch(
      socialFeedApi.endpoints.socialPostAction.initiate({
        kind: "like",
        postId: "sample-post",
      }),
    );
    await assert.rejects(invalid.unwrap());
    assert.equal(calls, 1);
    invalid.reset();
  } finally {
    req.unsubscribe();
    cleanup(store);
    globalThis.fetch = original;
  }
});

for (const status of [400, 413, 503, "network"])
  test(`upload failure ${status} never establishes persisted media`, async () => {
    const store = feedStore();
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      if (status === "network") throw new TypeError("offline");
      return json({ message: "upload rejected" }, status);
    };
    const req = store.dispatch(
      socialFeedApi.endpoints.uploadSocialImage.initiate(
        { file: imageFile() },
        { fixedCacheKey: "failed-upload" },
      ),
    );
    try {
      await assert.rejects(req.unwrap());
      assert.equal(
        socialFeedApi.endpoints.uploadSocialImage.select("failed-upload")(
          store.getState(),
        ).data,
        undefined,
      );
    } finally {
      req.reset();
      cleanup(store);
      globalThis.fetch = original;
    }
  });
test("media-only posts validate while excess files and long text stop before uploads", async () => {
  assert.equal(
    createSocialPostSchema.safeParse({
      status: "PUBLISHED",
      media: [
        { mediaType: "IMAGE", mediaUrl: "https://example.invalid/a.jpg", sortOrder: 0 },
      ],
    }).success,
    true,
  );
  let calls = 0;
  const shared = {
    isCurrent: () => true,
    cached: () => undefined,
    upload: async () => {
      calls++;
      throw new Error("should not upload");
    },
    create: async () => {
      calls++;
      return { id: postId };
    },
  };
  await assert.rejects(
    publishDraft({
      ...shared,
      text: "x",
      files: Array.from({ length: 11 }, (_, index) => ({
        id: String(index),
        file: imageFile(),
      })),
    }),
  );
  await assert.rejects(
    publishDraft({
      ...shared,
      text: "x".repeat(2201),
      files: [{ id: "a", file: imageFile() }],
    }),
  );
  assert.equal(calls, 0);
});
test("multiple image records remain available without fabricating image thumbnails", () => {
  const dto = feedPostDto();
  dto.media.push({
    ...dto.media[0],
    id: otherPostId,
    mediaUrl: "https://example.invalid/second.png",
  });
  const card = toSocialCard(dto);
  assert.equal(card.images.length, 2);
  assert.equal(card.image, card.images[0]);
});
