import { RequestOrderDetails } from "../components/requests/RequestOrderDetails.tsx";
import { RequestOwnPostCard } from "../components/requests/RequestOwnPostCard.tsx";
import assert from "node:assert/strict";
import test from "node:test";
import { PassThrough } from "node:stream";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import {
  bookingRequests,
  communityRequest,
  vendorOrders,
  defaultQuote,
  quoteSchema,
  quoteTotals,
  validateQuote,
  initialRequestsState,
  requestsReducer,
  postSchema,
} from "./requestsState.ts";
import {
  RequestQuoteForm,
  QuoteBreakdown,
} from "../components/requests/RequestQuoteForm.tsx";
import { BookingRequestCard, OrderCard } from "../components/requests/RequestCards.tsx";
import {
  RequestPostForm,
  RequestTextForm,
} from "../components/requests/RequestForms.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { ROUTES } from "../../../constants/routes.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { seedVendorHome, ownerId } from "./vendor.test-fixtures.mjs";

const reduce = (state, action) => requestsReducer(state, action);
test("all six design states connect with selected context and return navigation", () => {
  let state = initialRequestsState();
  assert.equal(state.view.type, "list");
  state = reduce(state, { type: "tab", tab: "community" });
  state = reduce(state, { type: "own", own: true });
  assert.equal(state.own, true);
  for (const event of [...bookingRequests, communityRequest]) {
    state = reduce(state, { type: "view", view: { type: "quote", id: event.id } });
    assert.equal(state.view.id, event.id);
    state = reduce(state, { type: "view", view: { type: "list" } });
  }
  state = reduce(state, { type: "view", view: { type: "orders" } });
  for (const order of vendorOrders) {
    state = reduce(state, { type: "view", view: { type: "order", id: order.id } });
    assert.equal(state.view.id, order.id);
    state = reduce(state, { type: "view", view: { type: "orders" } });
  }
  for (const type of ["order", "quote"])
    assert.equal(reduce(state, { type: "view", view: { type, id: "missing" } }), state);
});
test("quote drafts retain menus, notes, charges, pricing and payment selections across navigation", () => {
  let state = initialRequestsState();
  const draft = {
    ...defaultQuote(),
    pricing: "person",
    base: "20.25",
    payment: "full",
    note: "Vegetarian options",
    menus: ["Salad"],
    charges: [],
  };
  state = reduce(state, { type: "draft", id: "sarah", draft });
  draft.menus.push("not in saved draft");
  state = reduce(state, { type: "view", view: { type: "orders" } });
  state = reduce(state, { type: "view", view: { type: "quote", id: "sarah" } });
  assert.deepEqual(state.drafts.sarah.menus, ["Salad"]);
  assert.equal(state.drafts.sarah.note, "Vegetarian options");
  assert.equal(state.drafts.sarah.pricing, "person");
  assert.equal(state.drafts.sarah.payment, "full");
});
test("quote saving is local, validates, prevents duplicates and never creates a booking", () => {
  let state = initialRequestsState();
  assert.equal(
    reduce(state, { type: "quote", id: "missing", draft: defaultQuote() }),
    state,
  );
  assert.equal(
    reduce(state, {
      type: "quote",
      id: "sarah",
      draft: { ...defaultQuote(), deposit: "9999" },
    }),
    state,
  );
  state = reduce(state, { type: "quote", id: "sarah", draft: defaultQuote() });
  assert.equal(state.view.type, "list");
  assert.deepEqual(state.quotes.sarah, defaultQuote());
  assert.equal(
    reduce(state, {
      type: "quote",
      id: "sarah",
      draft: { ...defaultQuote(), base: "900" },
    }),
    state,
  );
  assert.equal(vendorOrders.length, 2);
  assert.deepEqual(initialRequestsState().quotes, {});
});
for (const amount of ["-1", "1.234", "NaN", "Infinity", "1e3", "", "9007199254740992"])
  test(`invalid money ${JSON.stringify(amount)} is rejected`, () => {
    assert.equal(
      quoteSchema.safeParse({ ...defaultQuote(), base: amount }).success,
      false,
    );
  });
test("money uses integer cents, person pricing, extra charges and full payment correctly", () => {
  const flat = quoteTotals(defaultQuote(), 50);
  assert.deepEqual(flat, {
    base: 120000,
    extras: 5000,
    total: 125000,
    deposit: 24000,
    balance: 101000,
  });
  const person = quoteTotals(
    {
      ...defaultQuote(),
      pricing: "person",
      base: "10.01",
      charges: [{ id: "x", label: "Setup", amount: "0.10" }],
      payment: "full",
    },
    3,
  );
  assert.deepEqual(person, {
    base: 3003,
    extras: 10,
    total: 3013,
    deposit: 3013,
    balance: 0,
  });
});
test("validation handles missing menus, zero amounts, deposit boundaries and full payment", () => {
  assert.ok(validateQuote({ ...defaultQuote(), menus: [] }, 50));
  assert.ok(validateQuote({ ...defaultQuote(), base: "0" }, 50));
  assert.ok(validateQuote({ ...defaultQuote(), deposit: "0" }, 50));
  assert.ok(validateQuote({ ...defaultQuote(), deposit: "1250.01" }, 50));
  assert.equal(validateQuote({ ...defaultQuote(), deposit: "1250" }, 50), undefined);
  assert.equal(
    validateQuote(
      { ...defaultQuote(), payment: "full", deposit: "invalid hidden field" },
      50,
    ),
    undefined,
  );
  assert.equal(
    validateQuote({ ...defaultQuote(), deposit: "1" }, 50),
    undefined,
    "no invented minimum deposit policy",
  );
});
test("hide/restore and pass/interest are reversible and fixtures stay untouched", () => {
  let state = initialRequestsState();
  state = reduce(state, { type: "hide", id: "sarah" });
  state = reduce(state, { type: "hide", id: "sarah" });
  assert.deepEqual(state.hidden, ["sarah"]);
  state = reduce(state, { type: "interest" });
  assert.equal(state.interested, true);
  state = reduce(state, { type: "interest" });
  assert.equal(state.interested, false);
  state = reduce(state, { type: "pass" });
  assert.equal(state.passed, true);
  state = reduce(state, { type: "restore" });
  assert.deepEqual(state.hidden, []);
  assert.equal(state.passed, false);
  assert.equal(bookingRequests.length, 1);
});
test("own posts create, edit, like, comment, and delete without leaking into another session", () => {
  let state = initialRequestsState();
  const post = {
    id: "new",
    title: "Lunch",
    category: "Community",
    body: "Hello",
    liked: false,
    likeCount: 0,
    comments: [],
    commentCount: 0,
  };
  assert.equal(postSchema.safeParse({ ...post, body: " " }).success, false);
  state = reduce(state, { type: "post", post });
  assert.equal(state.own, true);
  assert.equal(state.tab, "community");
  state = reduce(state, { type: "like", id: "new" });
  assert.equal(state.posts[0].liked, true);
  state = reduce(state, { type: "like", id: "new" });
  assert.equal(state.posts[0].liked, false);
  state = reduce(state, { type: "comment", id: "new", text: " Hello! " });
  assert.deepEqual(state.posts[0].comments, ["Hello!"]);
  assert.equal(reduce(state, { type: "comment", id: "new", text: " " }), state);
  state = reduce(state, { type: "post", post: { ...state.posts[0], body: "Edited" } });
  assert.equal(state.posts.filter((p) => p.id === "new").length, 1);
  assert.equal(state.posts[0].body, "Edited");
  state = reduce(state, { type: "delete", id: "new" });
  assert.equal(state.posts.length, 2);
  assert.equal(initialRequestsState().posts[0].comments.length, 0);
});
test("cards, forms and breakdown render semantic content with selected client, accessible controls and local caveats", () => {
  const card = renderToStaticMarkup(
    h(BookingRequestCard, {
      event: communityRequest,
      community: true,
      quoted: false,
      onIgnore() {},
      onQuote() {},
      onOffers() {},
    }),
  );
  for (const text of [
    "Alex Thompson",
    "2 offers",
    "Hide Details",
    'aria-expanded="true"',
    "Caesar Salad Cups",
    "Send quote",
  ])
    assert.ok(card.includes(text), text);
  const quote = renderToStaticMarkup(
    h(RequestQuoteForm, {
      event: bookingRequests[0],
      onBack() {},
      onSave() {},
      onQuote() {},
    }),
  );
  for (const text of [
    "Sarah Johnson",
    "Golden Gate Park",
    "Pricing Model",
    "Per person",
    "Extra Charges",
    "Deposit only",
    "Note to client",
    "No payment is collected",
    "local preview",
  ])
    assert.ok(quote.includes(text), text);
  assert.doesNotMatch(quote, /Sarah Mitchell/);
  const breakdown = renderToStaticMarkup(
    h(QuoteBreakdown, { draft: defaultQuote(), guests: 50 }),
  );
  assert.match(breakdown, /187\.50/);
  assert.match(breakdown, /1,010\.00/);
  for (const order of vendorOrders) {
    const html = renderToStaticMarkup(
      h(OrderCard, { order, onMessage() {}, onDetails() {} }),
    );
    assert.ok(html.includes(order.client));
    assert.match(html, /View Details/);
  }
  assert.match(
    renderToStaticMarkup(h(RequestPostForm, { onSave() {} })),
    /Create local post/,
  );
  assert.match(
    renderToStaticMarkup(
      h(RequestTextForm, { label: "Comment", button: "Add locally", onSubmit() {} }),
    ),
    /Add locally/,
  );
});
function RouteTree() {
  return useRoutes(appRoutes);
}
async function renderAt(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-requests-test",
        user: null,
      }),
    );
    store.dispatch(
      identityVerified({
        id: ownerId,
        name: "Test Vendor",
        email: "test@example.invalid",
        roles: [role],
        role,
      }),
    );
  }
  if (role === "VENDOR") await seedVendorHome(store);
  return new Promise((resolve, reject) => {
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => {
      html += chunk;
    });
    output.on("end", () => {
      store.dispatch(baseApi.util.resetApiState());
      resolve(html);
    });
    output.on("error", reject);
    const stream = renderToPipeableStream(
      h(
        Provider,
        { store },
        h(MemoryRouter, { initialEntries: [ROUTES.VENDOR_ORDERS] }, h(RouteTree)),
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
test("requests retains authentication and Vendor route protection while loading real records without fixtures", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_ORDERS);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-requests-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/orders"/);
  assert.doesNotMatch(html, /Sarah Johnson/);
  assert.match(html, /Loading bookings/);
  assert.match(html, /My orders/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role), "");
});

test("order details and own-post controls preserve selected content and accessible timeline/menu states", () => {
  for (const order of vendorOrders) {
    const html = renderToStaticMarkup(
      h(RequestOrderDetails, {
        order,
        onBack() {},
        onLocation() {},
        onMessage() {},
        onCall() {},
      }),
    );
    assert.ok(html.includes(order.client));
    for (const text of [
      "Booking Timeline",
      "Booking confirmed",
      "Deposit received",
      "Event day",
      "Completion request sent",
      "Completed",
      'aria-current="step"',
      'aria-expanded="true"',
      "Call Client",
    ])
      assert.ok(html.includes(text), text);
    if (order.note) assert.ok(html.includes(order.note));
    else assert.doesNotMatch(html, /Building 40/);
  }
  const html = renderToStaticMarkup(
    h(RequestOwnPostCard, {
      post: initialRequestsState().posts[0],
      onEdit() {},
      onDelete() {},
      onLike() {},
      onComments() {},
    }),
  );
  for (const text of [
    "Edit post",
    "Delete post",
    "Orange Whataburger",
    'aria-pressed="false"',
  ])
    assert.ok(html.includes(text), text);
});
