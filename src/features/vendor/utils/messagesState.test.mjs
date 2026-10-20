import assert from "node:assert/strict";
import test from "node:test";
import { File } from "node:buffer";
import { PassThrough } from "node:stream";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup, renderToPipeableStream } from "react-dom/server";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, matchRoutes, useRoutes } from "react-router";
import { vendorConversations } from "../data/messages.data.ts";
import {
  initialVendorMessagesState,
  vendorMessagesReducer,
  filterVendorConversations,
  validateVendorMessage,
} from "./messagesState.ts";
import { VendorConversationList } from "../components/messages/VendorConversationList.tsx";
import { VendorMessageThread } from "../components/messages/VendorMessageThread.tsx";
import { VendorMessageComposer } from "../components/messages/VendorMessageComposer.tsx";
import { VendorMessageAttachment } from "../components/messages/VendorMessageAttachment.tsx";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";
import { navigationItems } from "../../../config/navigation/navigation.config.ts";
const noop = () => {};
const reduce = vendorMessagesReducer;
const file = (name = "photo.jpg", type = "image/jpeg") => ({
  id: name,
  file: new File(["sample"], name, { type }),
});
const send = (id = "seoul-1", messageId = "local-1", text = "Hello", files = []) => ({
  type: "send",
  id,
  messageId,
  text,
  files,
  time: "11:00 AM",
});

test("reference inbox has unique thread IDs despite repeated merchant names, with Emily as the selected contact", () => {
  const state = initialVendorMessagesState();
  assert.equal(state.conversations.length, 7);
  assert.equal(new Set(state.conversations.map((c) => c.id)).size, 7);
  assert.equal(
    state.conversations.find((c) => c.id === state.selectedId).contact,
    "Emily Rodriguez",
  );
  assert.equal(
    state.conversations.reduce((sum, c) => sum + c.unread, 0),
    4,
  );
  assert.equal(state.mobileOpen, false);
});
test("search is case-insensitive and matches business, contact or preview without losing selection or drafts", () => {
  assert.equal(filterVendorConversations(vendorConversations, "  SEOUL ").length, 4);
  assert.equal(filterVendorConversations(vendorConversations, "emily").length, 1);
  assert.equal(filterVendorConversations(vendorConversations, "quote for").length, 2);
  assert.equal(filterVendorConversations(vendorConversations, "unmatched").length, 0);
  assert.equal(filterVendorConversations(vendorConversations, "  ").length, 7);
  const state = reduce(initialVendorMessagesState(), {
    type: "draft",
    id: "seoul-1",
    text: "Keep this",
  });
  filterVendorConversations(state.conversations, "unmatched");
  assert.equal(state.drafts["seoul-1"].text, "Keep this");
  assert.equal(state.selectedId, "seoul-1");
});
test("selection marks only the selected thread read and mobile Back retains its selected context", () => {
  let state = initialVendorMessagesState();
  state = reduce(state, { type: "select", id: "taco" });
  assert.equal(state.selectedId, "taco");
  assert.equal(state.mobileOpen, true);
  assert.equal(state.conversations.find((c) => c.id === "taco").unread, 0);
  assert.equal(state.conversations.find((c) => c.id === "burger-1").unread, 1);
  state = reduce(state, { type: "back" });
  assert.equal(state.mobileOpen, false);
  assert.equal(state.selectedId, "taco");
  state = reduce(state, { type: "unread", id: "taco" });
  assert.equal(state.conversations.find((c) => c.id === "taco").unread, 1);
  assert.equal(vendorConversations.find((c) => c.id === "taco").unread, 2);
});
test("text and attachment drafts remain scoped to the correct thread across switching and file removal", () => {
  let state = initialVendorMessagesState();
  state = reduce(state, { type: "draft", id: "seoul-1", text: "Keep my text" });
  state = reduce(state, { type: "files", id: "seoul-1", files: [file()] });
  state = reduce(state, { type: "select", id: "taco" });
  state = reduce(state, { type: "draft", id: "taco", text: "Taco draft" });
  state = reduce(state, { type: "select", id: "seoul-1" });
  assert.equal(state.drafts["seoul-1"].text, "Keep my text");
  assert.equal(state.drafts["seoul-1"].files.length, 1);
  state = reduce(state, { type: "files", id: "seoul-1", files: [] });
  assert.equal(state.drafts["seoul-1"].text, "Keep my text");
  assert.equal(state.drafts.taco.text, "Taco draft");
  assert.equal(initialVendorMessagesState().drafts["seoul-1"], undefined);
});
test("local send trims text, snapshots attachments, updates the correct preview, clears only its draft and rejects duplicate IDs", () => {
  let state = initialVendorMessagesState();
  state = reduce(state, { type: "draft", id: "taco", text: "Keep taco draft" });
  const files = [file("flyer.pdf", "application/pdf")];
  state = reduce(state, send("seoul-1", "local-1", "  Hello!  ", files));
  const conversation = state.conversations.find((c) => c.id === "seoul-1");
  const message = conversation.messages.at(-1);
  assert.equal(message.local, true);
  assert.equal(message.text, "Hello!");
  assert.equal(message.direction, "out");
  assert.equal(message.attachments[0].file, files[0].file);
  files.pop();
  assert.equal(message.attachments.length, 1);
  assert.equal(conversation.preview, "Hello!");
  assert.equal(conversation.age, "Now");
  assert.deepEqual(state.drafts["seoul-1"], { text: "", files: [] });
  assert.equal(state.drafts.taco.text, "Keep taco draft");
  assert.equal(reduce(state, send()), state);
  assert.match(state.status, /not delivered/);
  assert.equal(vendorConversations[0].messages.length, 6);
});
test("empty submissions fail, attachment-only messages work, and invalid files cannot enter history", () => {
  let state = initialVendorMessagesState();
  assert.match(validateVendorMessage("  ", []), /Enter a message/);
  assert.equal(reduce(state, send("seoul-1", "empty", " \n ")), state);
  assert.equal(
    validateVendorMessage("", [file("flyer.pdf", "application/pdf")]),
    undefined,
  );
  state = reduce(
    state,
    send("taco", "file-only", "", [file("flyer.pdf", "application/pdf")]),
  );
  assert.equal(state.conversations.find((c) => c.id === "taco").preview, "flyer.pdf");
  for (const invalid of [
    file("bad.svg", "image/svg+xml"),
    file("bad.html", "image/jpeg"),
    {
      id: "large",
      file: new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    },
  ]) {
    assert.ok(validateVendorMessage("Hello", [invalid]));
    assert.equal(reduce(state, send("taco", "bad-file", "Hello", [invalid])), state);
  }
});
test("clear affects only the selected local history, preserves drafts and exposes an empty state", () => {
  let state = reduce(initialVendorMessagesState(), {
    type: "draft",
    id: "seoul-1",
    text: "Keep draft",
  });
  state = reduce(state, { type: "clear", id: "seoul-1" });
  assert.equal(state.conversations[0].messages.length, 0);
  assert.equal(state.conversations.find((c) => c.id === "taco").messages.length, 1);
  assert.equal(state.drafts["seoul-1"].text, "Keep draft");
  const html = renderToStaticMarkup(
    h(VendorMessageThread, {
      conversation: state.conversations[0],
      mobileOpen: false,
      onBack: noop,
      onDetails: noop,
      onUnread: noop,
      onClear: noop,
    }),
  );
  assert.match(html, /No messages/);
  assert.match(html, /local preview/);
  assert.equal(initialVendorMessagesState().conversations[0].messages.length, 6);
});
test("unknown conversation IDs do not change selection, drafts, files, unread counts or history", () => {
  const state = initialVendorMessagesState();
  for (const action of [
    { type: "select", id: "missing" },
    { type: "draft", id: "missing", text: "No" },
    { type: "files", id: "missing", files: [file()] },
    { type: "clear", id: "missing" },
    { type: "unread", id: "missing" },
    send("missing"),
  ])
    assert.equal(reduce(state, action), state);
});
test("list and thread use accessible native controls and reproduce source text and attachments", () => {
  const list = renderToStaticMarkup(
    h(VendorConversationList, {
      conversations: vendorConversations,
      selectedId: "seoul-1",
      query: "",
      onQuery: noop,
      onSelect: noop,
    }),
  );
  assert.match(list, /Search conversations/);
  assert.match(list, /Emily Rodriguez/);
  assert.match(list, /2 unread/);
  assert.equal((list.match(/vendor-conversation-card /g) ?? []).length, 7);
  const noResults = renderToStaticMarkup(
    h(VendorConversationList, {
      conversations: [],
      selectedId: "seoul-1",
      query: "missing",
      onQuery: noop,
      onSelect: noop,
    }),
  );
  assert.match(noResults, /No matching results/);
  assert.match(noResults, /Clear conversation search/);
  const thread = renderToStaticMarkup(
    h(VendorMessageThread, {
      conversation: vendorConversations[0],
      mobileOpen: false,
      onBack: noop,
      onDetails: noop,
      onUnread: noop,
      onClear: noop,
    }),
  );
  for (const text of [
    "Emily Rodriguez",
    "integration by parts",
    "Integration Practice Problems.pdf",
    "Formula Sheet.pdf",
    "245 KB",
    "180 KB",
    "Conversation options",
    "Mark as unread",
    "Clear local history",
  ])
    assert.ok(thread.includes(text), text);
  assert.match(thread, /download="Sample - Integration Practice Problems.pdf"/);
});
test("composer retains selected-thread text, labels local send/attachments, and documents keyboard behavior", () => {
  const html = renderToStaticMarkup(
    h(VendorMessageComposer, {
      draft: { text: "Retained draft", files: [file()] },
      onText: noop,
      onFiles: noop,
      onSend: noop,
    }),
  );
  for (const text of [
    "Retained draft",
    "Attach files",
    "Attach images",
    "Send message locally",
    "Shift plus Enter",
    "Remove photo.jpg",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /<iframe|<object|<embed|blob:/);
});
test("local file downloads use the actual file name while sample downloads are labeled as placeholders", () => {
  const local = renderToStaticMarkup(
    h(VendorMessageAttachment, {
      attachment: { id: "local", name: "photo.jpg", size: "6 B", file: file().file },
    }),
  );
  assert.match(local, /download="photo.jpg"/);
  assert.doesNotMatch(local, /sample placeholder/);
  const sample = renderToStaticMarkup(
    h(VendorMessageAttachment, {
      attachment: vendorConversations[0].messages[4].attachments[0],
    }),
  );
  assert.match(sample, /sample placeholder Integration Practice Problems.pdf/);
  assert.match(sample, /design sample size/);
});
test("downloadable PDF placeholders are real self-contained PDFs and explicitly identify their missing source content", () => {
  for (const name of [
    "messages-integration-practice-preview.pdf",
    "messages-formula-sheet-preview.pdf",
  ]) {
    const pdf = readFileSync(
      resolve("src/features/vendor/assets/messages", name),
      "utf8",
    );
    assert.match(pdf, /^%PDF-1\.4/);
    assert.match(pdf, /LOCAL PREVIEW/);
    assert.match(pdf, /Original document content was not provided/);
    const offset = Number(/startxref\n(\d+)/.exec(pdf)[1]);
    assert.equal(pdf.slice(offset, offset + 4), "xref");
    assert.match(pdf, /%%EOF/);
  }
});
function RouteTree() {
  return useRoutes(appRoutes);
}
function renderAt(role) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(baseApi.middleware),
  });
  if (role) {
    store.dispatch(
      sessionRestored({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        sessionId: "vendor-messages-test",
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
        { store },
        h(MemoryRouter, { initialEntries: [ROUTES.VENDOR_MESSAGE] }, h(RouteTree)),
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
test("Vendor Messages keeps authentication, Vendor role isolation, one shared shell and active Message navigation", async () => {
  const matches = matchRoutes(appRoutes, ROUTES.VENDOR_MESSAGE);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  assert.deepEqual(
    matches.find(({ route }) => route.element?.type === RoleGuard).route.element.props
      .allowedRoles,
    ["VENDOR"],
  );
  assert.deepEqual(
    navigationItems.find((n) => n.path === ROUTES.VENDOR_MESSAGE).allowedRoles,
    ["VENDOR"],
  );
  const html = await renderAt("VENDOR");
  assert.match(html, /vendor-messages-shell/);
  assert.equal((html.match(/<main /g) ?? []).length, 1);
  assert.match(html, /aria-current="page"[^>]*href="\/dashboard\/vendor\/messages"/);
  assert.match(html, /Emily Rodriguez/);
  assert.match(html, /no messages are delivered/);
  for (const role of [undefined, "CUSTOMER", "ADMIN", "VENDOR_STAFF"])
    assert.equal(await renderAt(role), "");
});
