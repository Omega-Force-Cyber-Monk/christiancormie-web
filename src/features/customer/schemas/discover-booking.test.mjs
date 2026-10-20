import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  bookingReducer,
  bookingSchema,
  emptyBooking,
  initialBookingState,
  isBookingStepValid,
} from "./discover-booking.schema.ts";
import { DiscoverBookingFlow } from "../components/discover/DiscoverBookingFlow.tsx";

const valid = {
  ...emptyBooking,
  eventType: "Birthday Party",
  date: "2027-02-28",
  time: "18:30",
  location: "Union Square, SF",
  contact: "+1 (415) 555-0100",
  guests: "50",
  description: "A birthday dinner with friends.",
  menus: ["Tacos", "Vegan Options"],
  adult: true,
  terms: true,
};

test("a booking cannot skip required steps or advance with invalid entries", () => {
  let state = bookingReducer(initialBookingState, {
    type: "next",
    draft: emptyBooking,
  });
  assert.equal(state.step, 1);
  state = bookingReducer(state, {
    type: "next",
    draft: { ...emptyBooking, eventType: valid.eventType },
  });
  assert.equal(state.step, 2);
  state = bookingReducer(state, { type: "next", draft: { ...valid, guests: "0" } });
  assert.equal(state.step, 2);
  assert.equal(state.complete, false);
  assert.equal(isBookingStepValid(3, { ...valid, menus: [] }), false);
});

test("all five steps connect, Back retains draft, and completion is idempotent", () => {
  let state = initialBookingState;
  for (let step = 1; step <= 4; step++) {
    assert.equal(state.step, step);
    state = bookingReducer(state, { type: "next", draft: valid });
  }
  assert.equal(state.step, 5);
  state = bookingReducer(state, {
    type: "back",
    draft: { ...valid, additional: "No nuts, please." },
  });
  assert.equal(state.step, 4);
  assert.equal(state.draft.additional, "No nuts, please.");
  assert.deepEqual(state.draft.menus, valid.menus);
  state = bookingReducer(state, { type: "next", draft: state.draft });
  state = bookingReducer(state, { type: "next", draft: state.draft });
  assert.equal(state.complete, true);
  assert.strictEqual(bookingReducer(state, { type: "next", draft: valid }), state);
  assert.deepEqual(bookingReducer(state, { type: "reset" }), initialBookingState);
});

test("final confirmation requires both acknowledgements and revalidates earlier data", () => {
  const state = { step: 5, draft: valid, complete: false };
  for (const draft of [
    { ...valid, adult: false },
    { ...valid, terms: false },
    { ...valid, menus: [] },
    { ...valid, contact: "abc" },
  ]) {
    assert.equal(bookingReducer(state, { type: "next", draft }).complete, false);
  }
});

test("calendar, time, phone, and guests reject malformed values without inventing budget constraints", () => {
  assert.equal(bookingSchema.safeParse(valid).success, true);
  for (const draft of [
    { ...valid, date: "2027-02-30" },
    { ...valid, time: "25:00" },
    { ...valid, guests: "3.5" },
    { ...valid, guests: "-1" },
    { ...valid, guests: "9007199254740992" },
    { ...valid, location: " " },
    { ...valid, contact: "12" },
  ]) {
    assert.equal(bookingSchema.safeParse(draft).success, false);
  }
  assert.equal(bookingSchema.safeParse({ ...valid, budget: "$500–800" }).success, true);
  assert.equal(
    bookingReducer(initialBookingState, { type: "back", draft: valid }).step,
    1,
  );
});

test("booking starts with every designed event option and no remote action", () => {
  const html = renderToStaticMarkup(
    createElement(DiscoverBookingFlow, {
      truckName: "Taco Paradise",
      onBack() {
        throw new Error("Unexpected navigation");
      },
      onHome() {
        throw new Error("Unexpected navigation");
      },
      onComplete() {
        throw new Error("Unexpected submission");
      },
    }),
  );
  for (const text of [
    "Birthday Party",
    "Corporate Event",
    "Wedding",
    "Private Party",
    "Other",
    "Step 1 of 5",
    "Continue",
    "Local preview for Taco Paradise",
  ])
    assert.ok(html.includes(text), text);
  assert.equal((html.match(/type="radio"/g) ?? []).length, 5);
});
