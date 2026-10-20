import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import {
  communityReducer,
  createCommunityPost,
  getCommunityComposerValues,
  initialCommunityState,
} from "./communityState.ts";
import {
  communityComposerSchema,
  communityIssueSchema,
  communityQuoteConsentSchema,
  emptyCommunityComposer,
} from "../schemas/community.schema.ts";
import { CommunityReportPreview } from "../components/community/CommunityReportPreview.tsx";
import { CommunityComposer } from "../components/community/CommunityComposer.tsx";
import { CommunityOffersView } from "../components/community/CommunityOffersView.tsx";
import CustomerCommunityPage from "../pages/CustomerCommunityPage.tsx";
import { communityQuotes } from "../data/community-requests.data.ts";

const request = {
  ...emptyCommunityComposer,
  category: "Need a truck",
  body: "Birthday lunch with vegetarian options",
  eventType: "Birthday Party",
  date: "2027-05-25",
  time: "12:00",
  location: "Golden Gate Park",
  guests: "50",
  budget: "$500–800",
  menus: ["Tacos", "Vegetarian"],
};

test("post-specific overlays open and close without mutating data or mounting permanent report panels", () => {
  const original = initialCommunityState;
  let state = communityReducer(original, {
    type: "overlay",
    overlay: { kind: "actions", postId: "fiesta-meetup" },
  });
  assert.equal(state.overlay.postId, "fiesta-meetup");
  assert.strictEqual(state.posts, original.posts);
  state = communityReducer(state, { type: "overlay", overlay: null });
  assert.equal(state.overlay, null);
  assert.strictEqual(
    communityReducer(state, {
      type: "overlay",
      overlay: { kind: "issue", postId: "missing" },
    }),
    state,
  );
  const html = renderToStaticMarkup(
    h(CommunityReportPreview, {
      selected: null,
      onHide() {},
      onCopy() {},
      onCancel() {},
      onBack() {},
    }),
  );
  assert.ok(!html.includes("Report post"));
});

test("all post types validate their actual fields; malformed requests and whitespace fail", () => {
  assert.equal(communityComposerSchema.safeParse(request).success, true);
  for (const values of [
    { ...request, guests: "0" },
    { ...request, guests: "1.5" },
    { ...request, date: "2027-02-30" },
    { ...request, time: "25:00" },
    { ...request, location: " " },
    { ...request, eventType: "Unknown" },
    { ...request, body: " " },
  ])
    assert.equal(communityComposerSchema.safeParse(values).success, false);
  assert.equal(
    communityComposerSchema.safeParse({
      ...emptyCommunityComposer,
      category: "For sale",
      body: "Good condition",
    }).success,
    false,
  );
  for (const category of ["Community", "Callout", "Community help", "Hiring / jobs"])
    assert.equal(
      communityComposerSchema.safeParse({
        ...emptyCommunityComposer,
        category,
        body: "Sample post",
      }).success,
      true,
    );
});

test("Cancel leaves saved values intact; Submit updates only the selected request", () => {
  const existing = initialCommunityState.posts.find(
    (post) => post.id === "my-request-2",
  );
  const draft = getCommunityComposerValues(existing);
  const edited = { ...draft, body: "Updated birthday request", guests: "75" };
  let state = communityReducer(initialCommunityState, {
    type: "navigate",
    screen: "compose",
    postId: existing.id,
  });
  state = communityReducer(state, { type: "navigate", screen: "home" });
  assert.equal(
    state.posts.find((post) => post.id === existing.id).request.guests,
    "50",
  );
  const post = createCommunityPost(existing.id, edited, existing.city, [], existing);
  assert.ok(post);
  state = communityReducer(state, { type: "save", post });
  assert.equal(
    state.posts.find((post) => post.id === existing.id).request.guests,
    "75",
  );
  assert.strictEqual(
    state.posts.find((post) => post.id === "my-request-1"),
    initialCommunityState.posts.find((post) => post.id === "my-request-1"),
  );
  assert.equal(existing.request.guests, "50");
  assert.deepEqual(getCommunityComposerValues(post).menus, edited.menus);
});

test("new posts keep stable IDs, request details and safe attachments; invalid files never commit", () => {
  assert.equal(createCommunityPost("bad", { ...request, body: " " }, "SF", []), null);
  const files = [
    { id: "invalid", error: "Unsupported file", file: { name: "bad.svg" } },
  ];
  assert.equal(createCommunityPost("bad", request, "SF", files), null);
  assert.equal(
    createCommunityPost(
      "bad",
      request,
      "SF",
      Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        file: { name: "sample.png" },
      })),
    ),
    null,
  );
  const post = createCommunityPost("new-request", request, "San Antonio, TX", []);
  let state = communityReducer(initialCommunityState, { type: "save", post });
  state = communityReducer(state, { type: "save", post });
  assert.equal(state.posts.filter((item) => item.id === post.id).length, 1);
  assert.equal(post.request.offers, 0);
  assert.equal(post.request.location, request.location);
});

test("hide/restore and confirmed local deletion affect the selected item only", () => {
  let state = communityReducer(initialCommunityState, {
    type: "hide",
    id: "fiesta-meetup",
  });
  state = communityReducer(state, { type: "hide", id: "fiesta-meetup" });
  assert.deepEqual(state.hiddenIds, ["fiesta-meetup"]);
  state = communityReducer(state, { type: "restore" });
  assert.deepEqual(state.hiddenIds, []);
  const before = state.posts.length;
  state = communityReducer(state, { type: "delete", id: "my-request-2" });
  assert.equal(state.posts.length, before - 1);
  assert.ok(state.posts.some((post) => post.id === "my-request-1"));
});

test("truck decisions and counts are scoped, repeat-safe, and reversible", () => {
  let state = communityReducer(initialCommunityState, {
    type: "truck",
    postId: "my-block-party",
    truckId: "sushi-1",
    decision: "declined",
  });
  assert.equal(
    state.posts.find((post) => post.id === "my-block-party").callout.interested,
    11,
  );
  state = communityReducer(state, {
    type: "truck",
    postId: "my-block-party",
    truckId: "sushi-1",
    decision: "declined",
  });
  assert.equal(
    state.posts.find((post) => post.id === "my-block-party").callout.interested,
    11,
  );
  state = communityReducer(state, {
    type: "truck",
    postId: "my-block-party",
    truckId: "sushi-1",
    decision: "invited",
  });
  assert.equal(
    state.posts.find((post) => post.id === "my-block-party").callout.interested,
    12,
  );
  assert.equal(state.truckDecisions["my-block-party:sushi-2"], undefined);
});

test("quotes, payment and booking retain the selected request and calculate consistent balances", () => {
  let state = communityReducer(initialCommunityState, {
    type: "navigate",
    screen: "quotes",
    postId: "my-request-2",
  });
  state = communityReducer(state, {
    type: "navigate",
    screen: "payment",
    postId: "my-request-2",
    quoteId: "quote-1",
  });
  assert.equal(state.quoteId, "quote-1");
  assert.strictEqual(
    communityReducer(state, {
      type: "confirm-booking",
      postId: "my-request-3",
      quoteId: "quote-1",
    }),
    state,
  );
  state = communityReducer(state, {
    type: "confirm-booking",
    postId: "my-request-2",
    quoteId: "quote-1",
  });
  const post = state.posts.find((post) => post.id === "my-request-2");
  assert.equal(post.status, "Ongoing");
  assert.equal(post.acceptedQuoteId, "quote-1");
  assert.equal(state.overlay.kind, "confirmed");
  const quote = communityQuotes.find((quote) => quote.id === post.acceptedQuoteId);
  assert.equal(quote.totalCents - quote.depositCents, 84000);
  assert.equal(
    communityQuoteConsentSchema.safeParse({ terms: false, deposit: true }).success,
    false,
  );
  assert.equal(
    communityQuoteConsentSchema.safeParse({ terms: true, deposit: true }).success,
    true,
  );
});

test("ignored quotes update offer counts once; issue validation and completion remain local", () => {
  let state = communityReducer(initialCommunityState, {
    type: "ignore-quote",
    id: "my-request-2",
    quoteId: "quote-1",
  });
  state = communityReducer(state, {
    type: "ignore-quote",
    id: "my-request-2",
    quoteId: "quote-1",
  });
  assert.equal(
    state.posts.find((post) => post.id === "my-request-2").request.offers,
    1,
  );
  assert.equal(communityIssueSchema.safeParse({ details: " " }).success, false);
  assert.strictEqual(
    communityReducer(state, { type: "issue", id: "my-request-1", details: " " }),
    state,
  );
  state = communityReducer(state, {
    type: "issue",
    id: "my-request-1",
    details: "  Missing menu item  ",
  });
  assert.equal(
    state.posts.find((post) => post.id === "my-request-1").issue,
    "Missing menu item",
  );
  state = communityReducer(state, { type: "approve", id: "my-request-1" });
  assert.equal(
    state.posts.find((post) => post.id === "my-request-1").status,
    "Completed",
  );
});

test("Community preserves the main cards, exposes six creation types, and renders quote disclosures", () => {
  const page = renderToStaticMarkup(h(MemoryRouter, null, h(CustomerCommunityPage)));
  for (const text of [
    "fiesta-meetup",
    "birthday-truck-request",
    "pearl-brewery-callout",
    "All Posts",
    "My Requests",
  ])
    assert.ok(page.includes(text), text);
  assert.ok(!page.includes('role="dialog"'));
  const composer = renderToStaticMarkup(
    h(CommunityComposer, { onSave() {}, onCancel() {} }),
  );
  for (const text of [
    "Need a truck",
    "Vendor callout",
    "For sale",
    "Hiring / jobs",
    "Community help",
    "Community",
  ])
    assert.ok(composer.includes(text), text);
  const post = initialCommunityState.posts.find((post) => post.id === "my-request-2");
  const quoteHtml = renderToStaticMarkup(
    h(CommunityOffersView, {
      post,
      payment: false,
      selectedQuoteId: null,
      onBack() {},
      onPayment() {},
      onConfirm() {},
      onIgnore() {},
    }),
  );
  for (const text of [
    "Quotes Received",
    "Show Details",
    "Hide Details",
    "Deposit due now",
    "$240",
    "$1,250",
  ])
    assert.ok(quoteHtml.includes(text), text);
});
