import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import {
  initialVendorFeedState,
  vendorFeedReducer,
  vendorFeedTextSchema,
  getVendorCommentOrder,
} from "./feedState.ts";
import { VendorFeedPostCard } from "../components/feed/VendorFeedPostCard.tsx";
import { VendorFeedCommentForm } from "../components/feed/VendorFeedCommentForm.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { ROUTES } from "../../../constants/routes.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";

test("post likes toggle independently and do not mutate fixture counts", () => {
  const original = initialVendorFeedState();
  const liked = vendorFeedReducer(original, {
    type: "like-post",
    postId: "taco-paradise",
  });
  assert.equal(liked.posts[0].likes, 121);
  assert.equal(liked.posts[0].liked, true);
  assert.equal(liked.posts[1], original.posts[1]);
  const unliked = vendorFeedReducer(liked, {
    type: "like-post",
    postId: "taco-paradise",
  });
  assert.equal(unliked.posts[0].likes, 120);
  assert.equal(unliked.posts[0].liked, false);
  assert.equal(original.posts[0].likes, 120);
});

test("comment likes preserve initial liked state and remain scoped to the selected post", () => {
  const original = initialVendorFeedState();
  const unliked = vendorFeedReducer(original, {
    type: "like-comment",
    postId: "taco-paradise",
    commentId: "alex",
  });
  assert.equal(unliked.posts[0].comments[1].likes, 14);
  assert.equal(unliked.posts[0].comments[1].liked, false);
  assert.equal(unliked.posts[1].comments[1].likes, 15);
  assert.equal(
    vendorFeedReducer(unliked, {
      type: "like-comment",
      postId: "taco-paradise",
      commentId: "alex",
    }).posts[0].comments[1].likes,
    15,
  );
});

test("comment sheet selection, close and reopen retain per-post drafts and reply targets", () => {
  let state = initialVendorFeedState();
  state = vendorFeedReducer(state, { type: "open-comments", postId: "taco-paradise" });
  state = vendorFeedReducer(state, {
    type: "draft",
    postId: "taco-paradise",
    draft: { text: "Saved draft", replyTo: "mike" },
  });
  state = vendorFeedReducer(state, { type: "open-comments", postId: null });
  assert.equal(state.selectedPostId, null);
  state = vendorFeedReducer(state, { type: "open-comments", postId: "sushi-haven" });
  assert.equal(state.selectedPostId, "sushi-haven");
  assert.equal(state.drafts["sushi-haven"], undefined);
  state = vendorFeedReducer(state, { type: "open-comments", postId: "taco-paradise" });
  assert.deepEqual(state.drafts["taco-paradise"], {
    text: "Saved draft",
    replyTo: "mike",
  });
  assert.equal(
    vendorFeedReducer(state, { type: "open-comments", postId: "absent" }),
    state,
  );
});

test("comments and replies validate, update the right count, clear drafts and reject duplicate IDs", () => {
  const original = initialVendorFeedState();
  assert.equal(vendorFeedTextSchema.safeParse({ text: " \n " }).success, false);
  const action = {
    type: "comment",
    postId: "taco-paradise",
    id: "local-reply",
    text: " Thanks! ",
    parentId: "mike",
  };
  let state = vendorFeedReducer(original, action);
  assert.equal(state.posts[0].comments.length, 5);
  assert.equal(state.posts[1].comments.length, 4);
  assert.equal(state.posts[0].comments.at(-1).text, "Thanks!");
  assert.equal(state.posts[0].comments.at(-1).parentId, "mike");
  assert.deepEqual(state.drafts["taco-paradise"], { text: "", replyTo: null });
  assert.equal(vendorFeedReducer(state, action), state);
  assert.equal(
    vendorFeedReducer(state, { ...action, id: "invalid", text: " " }),
    state,
  );
  assert.equal(
    vendorFeedReducer(state, { ...action, id: "invalid", parentId: "missing" }),
    state,
  );
  state = vendorFeedReducer(state, { ...action, id: "top-level", parentId: null });
  assert.equal(state.posts[0].comments.length, 6);
  assert.equal(original.posts[0].comments.length, 4);
});

test("reply ordering keeps parent context and handles nested replies without duplicate entries", () => {
  let state = initialVendorFeedState();
  state = vendorFeedReducer(state, {
    type: "comment",
    postId: "taco-paradise",
    id: "reply",
    text: "Thank you",
    parentId: "mike",
  });
  state = vendorFeedReducer(state, {
    type: "comment",
    postId: "taco-paradise",
    id: "nested",
    text: "You're welcome",
    parentId: "reply",
  });
  const ordered = getVendorCommentOrder(state.posts[0].comments);
  assert.deepEqual(
    ordered.slice(0, 3).map(({ id, depth }) => [id, depth]),
    [
      ["mike", 0],
      ["reply", 1],
      ["nested", 2],
    ],
  );
  assert.equal(new Set(ordered.map((item) => item.id)).size, 6);
});

test("local posts trim text, receive stable IDs, start with an empty thread and reject duplicates", () => {
  const original = initialVendorFeedState();
  const action = { type: "post", id: "local-post", text: "  At Union Square!  " };
  const state = vendorFeedReducer(original, action);
  assert.equal(state.posts[0].text, "At Union Square!");
  assert.equal(state.posts[0].id, "local-post");
  assert.deepEqual(state.posts[0].comments, []);
  assert.equal(state.posts[0].local, true);
  assert.equal(vendorFeedReducer(state, action), state);
  assert.equal(
    vendorFeedReducer(state, { ...action, id: "invalid", text: " " }),
    state,
  );
  assert.equal(original.posts.length, 3);
  assert.equal(initialVendorFeedState().posts.length, 3);
});

test("post controls expose consistent local comment counts and retained reply drafts render accessibly", () => {
  const html = renderToStaticMarkup(
    h(VendorFeedPostCard, {
      post: initialVendorFeedState().posts[0],
      onLike() {},
      onComments() {},
    }),
  );
  assert.match(html, /Open 4 comments on Taco Paradise/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /Grilled skewers/);
  const form = renderToStaticMarkup(
    h(VendorFeedCommentForm, {
      text: "My draft reply",
      replyingTo: { id: "mike", author: "Mike Chen" },
      onText() {},
      onCancelReply() {},
      onSubmit() {},
    }),
  );
  assert.match(form, /value="My draft reply"/);
  assert.match(form, /Replying to Mike Chen/);
  assert.match(form, /aria-label="Cancel reply"/);
  assert.match(form, /Save local reply/);
});

test("Vendor Feed remains under existing authentication and Vendor role guards", () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_FEED);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
});

function createStore(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) => defaults().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-feed-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: "test-vendor",
        name: "Test Vendor",
        email: "test@example.invalid",
        role,
      }),
    );
  }
  return store;
}
function RouteTree() {
  return useRoutes(appRoutes);
}
function renderAt(role) {
  return new Promise((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk;
    });
    output.on("end", () => resolve(html));
    output.on("error", reject);
    const stream = renderToPipeableStream(
      h(
        Provider,
        { store: createStore(role) },
        h(MemoryRouter, { initialEntries: [ROUTES.VENDOR_FEED] }, h(RouteTree)),
      ),
      {
        onAllReady() {
          stream.pipe(output);
        },
        onError: reject,
      },
    );
  });
}
test("verified Vendor Feed renders one shell, all supplied posts and active Feed navigation without a server", async () => {
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-feed-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  for (const name of ["Taco Paradise", "Sushi Haven", "Burger Joint"])
    assert.ok(html.includes(name), name);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/feed"/);
  assert.doesNotMatch(html, /Hello Taco!/);
  assert.match(html, /Share a location drop, menu item, or promo/);
});

test("anonymous users and other roles cannot access Vendor Feed", async () => {
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role), "");
});
