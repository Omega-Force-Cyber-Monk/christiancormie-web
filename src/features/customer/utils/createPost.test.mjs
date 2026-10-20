import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { matchRoutes } from "react-router";
import { createPostSchema } from "../schemas/create-post.schema.ts";
import {
  emptyPostDraft,
  samplePostDraft,
  checkInLocations,
  tagFriends,
} from "../data/create-post.data.ts";
import {
  addPostPhotos,
  removePostPhoto,
  togglePostFriend,
  filterPostOptions,
  submitLocalPost,
} from "./createPost.ts";
import CustomerCreatePostPage from "../pages/CustomerCreatePostPage.tsx";
import { PostDetailsPicker } from "../components/create-post/PostDetailsPicker.tsx";
import { discoverRoutes } from "../../../router/routes/discover.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";

test("empty and whitespace drafts validate; text-only and photo-only posts are supported", () => {
  assert.equal(createPostSchema.safeParse(emptyPostDraft()).success, false);
  assert.equal(
    createPostSchema.safeParse({ ...emptyPostDraft(), text: "  \n " }).success,
    false,
  );
  assert.equal(
    createPostSchema.safeParse({ ...emptyPostDraft(), text: "A great lunch" }).success,
    true,
  );
  assert.equal(createPostSchema.safeParse(samplePostDraft()).success, true);
});

test("photos retain original Files, allow multiple selections and reject unsupported/oversized files", () => {
  const photo = new File(["photo"], "lunch.jpg", { type: "image/jpeg" });
  const png = new File(["photo"], "lunch.png", { type: "image/png" });
  const video = new File(["video"], "movie.mp4", { type: "video/mp4" });
  const large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
    type: "image/jpeg",
  });
  const disguised = new File(["photo"], "file.svg", { type: "image/png" });
  let index = 0;
  const result = addPostPhotos(
    [],
    [photo, png, video, large, disguised],
    () => `photo-${++index}`,
  );
  assert.equal(result.media.length, 2);
  assert.equal(result.media[0].file, photo);
  assert.equal(result.media[1].file, png);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors.join(" "), /File is too large/);
});

test("removing one photo leaves the others and their IDs intact; a cancelled picker preserves media", () => {
  const draft = samplePostDraft();
  const remaining = removePostPhoto(draft.media, "sample-photo-2");
  assert.deepEqual(
    remaining.map((item) => item.id),
    ["sample-photo-1", "sample-photo-3"],
  );
  assert.equal(remaining[0], draft.media[0]);
  assert.deepEqual(addPostPhotos(remaining, [], () => "unused").media, remaining);
  assert.equal(draft.media.length, 3);
});

test("location and friend searches support no results without clearing draft selections", () => {
  const draft = samplePostDraft();
  assert.equal(filterPostOptions(checkInLocations, "  RIVERSIDE ")[0].id, "riverside");
  assert.equal(filterPostOptions(tagFriends, "jess")[0].id, "jessica");
  assert.deepEqual(filterPostOptions(tagFriends, "absent"), []);
  const ids = togglePostFriend(draft.friendIds, "alex");
  assert.equal(ids.length, 5);
  assert.deepEqual(togglePostFriend(ids, "alex"), draft.friendIds);
  assert.equal(draft.locationId, "downtown");
  assert.equal(draft.media.length, 3);
});

test("local submission trims text, retains selected details, ignores duplicate IDs and invalid drafts", () => {
  const draft = { ...samplePostDraft(), text: "  Lunch!  " };
  const posts = submitLocalPost([], draft, "local-1");
  assert.equal(posts[0].id, "local-1");
  assert.equal(posts[0].text, "Lunch!");
  assert.equal(posts[0].locationId, "downtown");
  assert.deepEqual(posts[0].friendIds, draft.friendIds);
  assert.equal(submitLocalPost(posts, draft, "local-1"), posts);
  assert.equal(submitLocalPost(posts, emptyPostDraft(), "invalid"), posts);
  draft.media.pop();
  draft.friendIds.pop();
  assert.equal(posts[0].media.length, 3);
  assert.equal(posts[0].friendIds.length, 4);
  assert.equal(
    submitLocalPost(posts, { ...emptyPostDraft(), text: "Another lunch" }, "local-2")
      .length,
    2,
  );
});

test("reset creates an empty independent draft and does not erase local results", () => {
  const posts = submitLocalPost([], samplePostDraft(), "retained");
  const reset = emptyPostDraft();
  assert.deepEqual(reset, { text: "", media: [], locationId: "", friendIds: [] });
  assert.notEqual(reset.media, emptyPostDraft().media);
  assert.equal(posts[0].media.length, 3);
});

test("all three design states render semantic controls without a server or DOM", () => {
  const compose = renderToStaticMarkup(h(CustomerCreatePostPage));
  assert.match(compose, /Post content/);
  assert.match(compose, /aria-label="Add photos"/);
  assert.match(compose, /aria-label="Tag friends"/);
  assert.equal((compose.match(/class="post-media-preview"/g) ?? []).length, 3);
  const props = {
    locationId: "downtown",
    friendIds: ["alex"],
    onLocation() {},
    onFriend() {},
  };
  const locations = renderToStaticMarkup(
    h(PostDetailsPicker, { ...props, screen: "location" }),
  );
  assert.match(locations, /Downtown Food Park/);
  assert.match(locations, /aria-pressed="true"/);
  const friends = renderToStaticMarkup(
    h(PostDetailsPicker, { ...props, screen: "friends" }),
  );
  assert.equal((friends.match(/type="checkbox"/g) ?? []).length, 5);
  assert.match(friends, /checked=""/);
});

test("Create Post uses the existing customer authentication and role guards", () => {
  const matches = matchRoutes(discoverRoutes, ROUTES.CUSTOMER_CREATE_POST);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  const role = matches.find(({ route }) => route.element?.type === RoleGuard);
  assert.deepEqual(role.route.element.props.allowedRoles, ["CUSTOMER"]);
});
