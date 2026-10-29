import assert from "node:assert/strict";
import { File } from "node:buffer";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, matchRoutes } from "react-router";
import { Provider } from "react-redux";
import { memberStore } from "../../social/utils/member.test-fixtures.mjs";
import {
  initialSettingsState,
  settingsReducer,
  validateSettingsPhoto,
} from "./settingsState.ts";
import { parseSettingsSection, pointsGuide } from "../data/settings.data.ts";
import {
  settingsProfileSchema,
  settingsPasswordSchema,
  truckRequestSchema,
  settingsIssueSchema,
  settingsMessageSchema,
} from "../schemas/settings.schema.ts";
import CustomerSettingsPage from "../pages/CustomerSettingsPage.tsx";
import { SettingsProfileEditor } from "../components/settings/SettingsProfileEditor.tsx";
import { SettingsPasswordForm } from "../components/settings/SettingsPasswordForm.tsx";
import {
  SettingsSupportList,
  SettingsConversation,
} from "../components/settings/SettingsSupport.tsx";
import { discoverRoutes } from "../../../router/routes/discover.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";

test("Settings section links parse defensively and retain their intended screen", () => {
  for (const section of ["request", "support", "issue"])
    assert.equal(parseSettingsSection(section), section);
  for (const value of [null, "home", "unknown", "SUPPORT"])
    assert.equal(parseSettingsSection(value), "home");
});

test("opening, editing, cancelling and closing dialogs do not save unsaved profile values", () => {
  const original = initialSettingsState();
  let state = settingsReducer(original, {
    type: "overlay",
    overlay: { kind: "profile" },
  });
  state = settingsReducer(state, { type: "overlay", overlay: { kind: "edit" } });
  const draft = { ...state.profile, fullName: "Unsaved name" };
  state = settingsReducer(state, { type: "overlay", overlay: { kind: "profile" } });
  assert.equal(state.profile.fullName, "Alex Rivera");
  assert.equal(draft.fullName, "Unsaved name");
  state = settingsReducer(state, { type: "overlay", overlay: null });
  assert.equal(state.overlay, null);
  assert.deepEqual(state.profile, original.profile);
});

test("profile save validates, normalizes and preserves a separate saved snapshot", () => {
  const original = initialSettingsState();
  const draft = {
    ...original.profile,
    fullName: "  Jamie Smith  ",
    displayName: "",
    bio: "  Loves tacos  ",
  };
  const saved = settingsReducer(original, { type: "profile", values: draft });
  assert.equal(saved.profile.fullName, "Jamie Smith");
  assert.equal(saved.profile.displayName, "Jamie S.");
  assert.equal(saved.profile.bio, "Loves tacos");
  assert.equal(saved.overlay.kind, "profile");
  assert.equal(original.profile.fullName, "Alex Rivera");
  draft.fullName = "Another draft";
  assert.equal(saved.profile.fullName, "Jamie Smith");
  assert.equal(
    settingsReducer(saved, { type: "profile", values: { ...draft, email: "invalid" } }),
    saved,
  );
  assert.equal(
    settingsProfileSchema.safeParse({ ...draft, fullName: " " }).success,
    false,
  );
});

test("password preview enforces the existing eight-character minimum, required current password and confirmation", () => {
  const valid = {
    currentPassword: "old-example",
    newPassword: "New-example1",
    confirmPassword: "New-example1",
  };
  assert.equal(settingsPasswordSchema.safeParse(valid).success, true);
  assert.equal(
    settingsPasswordSchema.safeParse({ ...valid, currentPassword: "" }).success,
    false,
  );
  assert.equal(
    settingsPasswordSchema.safeParse({
      ...valid,
      newPassword: "short",
      confirmPassword: "short",
    }).success,
    false,
  );
  const mismatch = settingsPasswordSchema.safeParse({
    ...valid,
    confirmPassword: "different-example",
  });
  assert.equal(mismatch.success, false);
  assert.deepEqual(mismatch.error.issues[0].path, ["confirmPassword"]);
  assert.equal(
    Object.keys(initialSettingsState()).some((key) => /password/i.test(key)),
    false,
  );
});

test("truck request validation requires only the represented mandatory fields", () => {
  const request = {
    truckName: " Taco Truck ",
    location: " Downtown ",
    phone: "",
    description: "",
    reason: "",
  };
  assert.equal(truckRequestSchema.parse(request).truckName, "Taco Truck");
  assert.equal(
    truckRequestSchema.safeParse({ ...request, truckName: " " }).success,
    false,
  );
  assert.equal(
    truckRequestSchema.safeParse({ ...request, location: " " }).success,
    false,
  );
});

test("local tickets validate required fields, retain submitted text and reject duplicate IDs", () => {
  const original = initialSettingsState();
  assert.equal(
    settingsIssueSchema.safeParse({ subject: " ", message: " " }).success,
    false,
  );
  const action = {
    type: "ticket",
    values: { subject: "  Booking question ", message: " Please help " },
    id: "local-ticket",
    date: "Local preview",
  };
  const state = settingsReducer(original, action);
  assert.equal(state.tickets.length, 4);
  assert.equal(state.tickets[0].subject, "Booking question");
  assert.equal(state.tickets[0].messages[0].text, "Please help");
  assert.equal(state.tickets[0].status, "Pending");
  assert.equal(settingsReducer(state, action), state);
  assert.equal(original.tickets.length, 3);
});

test("support selections stay bound to the right ticket and messages never leak between conversations", () => {
  let state = initialSettingsState();
  state = settingsReducer(state, {
    type: "overlay",
    overlay: { kind: "conversation", ticketId: "TX-8492" },
  });
  assert.equal(state.overlay.ticketId, "TX-8492");
  const message = {
    id: "local-message",
    sender: "you",
    text: "  Following up  ",
    time: "Local preview",
  };
  const action = { type: "message", ticketId: "TX-8492", message };
  state = settingsReducer(state, action);
  assert.equal(state.tickets[0].messages.at(-1).text, "Following up");
  assert.equal(settingsReducer(state, action).tickets[0].messages.length, 5);
  state = settingsReducer(state, {
    type: "overlay",
    overlay: { kind: "conversation", ticketId: "TX-8493" },
  });
  assert.equal(state.overlay.ticketId, "TX-8493");
  assert.equal(state.tickets[1].messages.length, 1);
  assert.equal(
    settingsReducer(state, {
      type: "overlay",
      overlay: { kind: "conversation", ticketId: "missing" },
    }),
    state,
  );
  assert.equal(
    settingsReducer(state, {
      type: "message",
      ticketId: "TX-8493",
      message: { ...message, text: " " },
    }),
    state,
  );
});

test("photos use existing safe types and 5 MB limit and retain original local Files", () => {
  const photo = new File(["photo"], "photo.jpg", { type: "image/jpeg" });
  const unsafe = new File(["svg"], "photo.svg", { type: "image/svg+xml" });
  const large = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", {
    type: "image/png",
  });
  assert.equal(validateSettingsPhoto(photo), null);
  assert.ok(validateSettingsPhoto(unsafe));
  assert.ok(validateSettingsPhoto(large));
  const state = settingsReducer(initialSettingsState(), { type: "photo", file: photo });
  assert.equal(state.photo, photo);
  assert.equal(settingsReducer(state, { type: "photo", file: unsafe }), state);
  assert.equal(
    settingsMessageSchema.safeParse({ text: " ", attachment: null }).success,
    false,
  );
  assert.equal(
    settingsMessageSchema.safeParse({ text: "", attachment: photo }).success,
    true,
  );
});

test("fresh settings reset sample values independently and preserve all source points", () => {
  const first = initialSettingsState();
  first.profile.fullName = "Changed";
  first.tickets[0].messages.pop();
  const reset = initialSettingsState();
  assert.equal(reset.profile.fullName, "Alex Rivera");
  assert.equal(reset.tickets[0].messages.length, 4);
  assert.deepEqual(
    pointsGuide.map((item) => item.points),
    [10, 25, 5, 100, 10, 100, 5, 50, 50],
  );
});

test("menu and page forms render without a server and keep request/issue form instances mounted for drafts", () => {
  const html = renderToStaticMarkup(
    h(
      Provider,
      { store: memberStore() },
      h(MemoryRouter, { initialEntries: ["/settings"] }, h(CustomerSettingsPage)),
    ),
  );
  for (const label of [
    "Invite Friends",
    "Request a Truck",
    "How to Earn Points",
    "Profile Information",
    "Change password",
    "Help &amp; Support",
  ])
    assert.ok(html.includes(label), label);
  assert.equal((html.match(/hidden=""/g) ?? []).length, 2);
  assert.match(html, /name="truckName"/);
  assert.match(html, /name="subject"/);
  const profile = renderToStaticMarkup(
    h(
      Provider,
      { store: memberStore() },
      h(SettingsProfileEditor, {
        profile: initialSettingsState().profile,
        onSave() {},
        onCancel() {},
      }),
    ),
  );
  assert.match(profile, /value="Alex Rivera"/);
  assert.match(profile, /Full Name and Bio are read-only/);
  const password = renderToStaticMarkup(
    h(Provider, { store: memberStore() }, h(SettingsPasswordForm, { onCancel() {} })),
  );
  assert.equal((password.match(/type="password"/g) ?? []).length, 3);
  assert.match(password, /uppercase, lowercase/);
});

test("support cards and conversation render selected context with explicit local-only behavior", () => {
  const tickets = initialSettingsState().tickets;
  const list = renderToStaticMarkup(h(SettingsSupportList, { tickets, onSelect() {} }));
  assert.equal((list.match(/aria-haspopup="dialog"/g) ?? []).length, 3);
  const conversation = renderToStaticMarkup(
    h(SettingsConversation, {
      ticket: tickets[1],
      draft: { text: "Draft message", attachment: null },
      onDraft() {},
      onSend() {},
    }),
  );
  assert.match(conversation, /TX-8493/);
  assert.match(conversation, /Delta Airlines/);
  assert.doesNotMatch(conversation, /Sarah Johnson/);
  assert.match(conversation, /New messages stay local/);
});

test("Settings uses existing customer authentication and role protection", () => {
  const matches = matchRoutes(discoverRoutes, ROUTES.CUSTOMER_SETTINGS);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  const role = matches.find(({ route }) => route.element?.type === RoleGuard);
  assert.deepEqual(role.route.element.props.allowedRoles, ["CUSTOMER"]);
});
