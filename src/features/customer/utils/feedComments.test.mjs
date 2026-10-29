import { Provider } from "react-redux";
import {
  feedStore,
  feedPostDto,
} from "../../social/utils/socialFeed.test-fixtures.mjs";
import { toSocialCard } from "../../social/utils/feedAdapters.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";

import { FeedCommentForm } from "../components/feed/FeedCommentForm.tsx";
import { FeedPostCard } from "../components/feed/FeedPostCard.tsx";
import { createFeedComments } from "../data/feed-comments.data.ts";
import { feedPosts } from "../data/feed.data.ts";
import { feedCommentSchema } from "../schemas/feed.schema.ts";
import { feedCommentsReducer, getFeedCommentCount } from "./feedComments.ts";

test("new comments are trimmed, immutable, stable, and counted once", () => {
  const original = createFeedComments("post-1");
  const snapshot = original.map((comment) => ({ ...comment }));
  const action = {
    type: "add",
    id: "local-1",
    text: "  Looks great!  ",
    parentId: null,
  };
  const updated = feedCommentsReducer(original, action);
  assert.deepEqual(original, snapshot);
  assert.equal(updated.at(-1).text, "Looks great!");
  assert.equal(updated.at(-1).author, "You");
  assert.equal(updated.at(-1).id, "local-1");
  assert.equal(getFeedCommentCount(18, original.length, updated), 19);
  assert.strictEqual(feedCommentsReducer(updated, action), updated);
});

test("blank comments fail schema and reducer validation without changing counts", () => {
  const original = createFeedComments("post-1");
  for (const text of ["", " ", "\n\t "]) {
    assert.equal(feedCommentSchema.safeParse({ comment: text }).success, false);
    assert.strictEqual(
      feedCommentsReducer(original, { type: "add", id: "blank", text, parentId: null }),
      original,
    );
  }
  assert.equal(getFeedCommentCount(18, original.length, original), 18);
});

test("reply submission preserves its parent and rejects missing or unrelated parents", () => {
  const first = createFeedComments("first");
  const second = createFeedComments("second");
  const updated = feedCommentsReducer(first, {
    type: "add",
    id: "reply-1",
    parentId: first[0].id,
    text: "See you there!",
  });
  assert.equal(updated.at(-1).parentId, first[0].id);
  assert.equal(updated.filter((comment) => comment.parentId === first[0].id).length, 1);
  assert.equal(getFeedCommentCount(18, first.length, updated), 19);
  assert.equal(getFeedCommentCount(18, second.length, second), 18);
  for (const parentId of ["missing", second[0].id, "reply-1"]) {
    assert.strictEqual(
      feedCommentsReducer(updated, {
        type: "add",
        id: "reply-2",
        parentId,
        text: "Test",
      }),
      updated,
    );
  }
});

test("comment and reply likes toggle independently without affecting post totals", () => {
  const original = createFeedComments("post-1");
  const liked = feedCommentsReducer(original, { type: "like", id: original[0].id });
  assert.equal(liked[0].liked, true);
  assert.equal(liked[0].likes, 13);
  assert.strictEqual(liked[1], original[1]);
  assert.deepEqual(
    feedCommentsReducer(liked, { type: "like", id: original[0].id }),
    original,
  );
  const unliked = feedCommentsReducer(original, { type: "like", id: original[1].id });
  assert.equal(unliked[1].liked, false);
  assert.equal(unliked[1].likes, 14);
  const replies = feedCommentsReducer(original, {
    type: "add",
    id: "reply-1",
    parentId: original[0].id,
    text: "Nice!",
  });
  const reacted = feedCommentsReducer(replies, { type: "like", id: "reply-1" });
  assert.equal(reacted.at(-1).likes, 1);
  assert.strictEqual(reacted[0], original[0]);
  assert.equal(getFeedCommentCount(18, original.length, reacted), 19);
  assert.equal(feedPosts[0].likes, 234);
});

test("post cards preserve their actions and open comments as a dialog", () => {
  const html = renderToStaticMarkup(
    h(
      Provider,
      { store: feedStore() },
      h(
        MemoryRouter,
        null,
        h(FeedPostCard, {
          post: toSocialCard(feedPostDto({ likeCount: 234, commentCount: 18 })),
          onShare() {
            throw new Error("Unexpected share");
          },
          onImage() {
            throw new Error("Unexpected image action");
          },
        }),
      ),
    ),
  );
  for (const text of ["234", "18", 'aria-haspopup="dialog"', "Share", "Enlarge photo"])
    assert.ok(html.includes(text), text);
  assert.ok(!html.includes("their text was not supplied"));
  assert.equal((html.match(/class="feed-symbol"/g) ?? []).length, 0);
});

test("existing comment form contract stays intact and composer restores a draft", () => {
  const onPreview = () => {
    throw new Error("Unexpected submission");
  };
  const standard = renderToStaticMarkup(h(FeedCommentForm, { onPreview }));
  assert.ok(standard.includes("Comment"));
  assert.ok(standard.includes("Post comment"));
  const composer = renderToStaticMarkup(
    h(FeedCommentForm, {
      onPreview,
      composer: {
        draft: "Saved draft",
        onDraftChange() {},
        inputId: "test-composer",
        replyTo: "Mike Chen",
        onCancelReply() {},
      },
    }),
  );
  for (const text of [
    "Saved draft",
    "Replying to Mike Chen",
    "Cancel reply",
    'id="test-composer"',
    "Post reply",
  ])
    assert.ok(composer.includes(text), text);
});
