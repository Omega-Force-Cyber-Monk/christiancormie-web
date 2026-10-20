import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, matchRoutes } from "react-router";
import {
  getLeaderboardRankings,
  getLeaderboardKeyboardCategory,
  parseLeaderboardCategory,
} from "./leaderboard.data.ts";
import CustomerLeaderboardPage from "../pages/CustomerLeaderboardPage.tsx";
import { discoverRoutes } from "../../../router/routes/discover.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { ROUTES } from "../../../constants/routes.ts";

const renderCategory = (category) =>
  renderToStaticMarkup(
    h(
      MemoryRouter,
      { initialEntries: [`/leaderboard?category=${category}`] },
      h(CustomerLeaderboardPage),
    ),
  );

test("keyboard tabs wrap in both directions and support Home and End", () => {
  assert.equal(
    getLeaderboardKeyboardCategory("top-rated", "ArrowRight"),
    "most-booked",
  );
  assert.equal(
    getLeaderboardKeyboardCategory("most-booked", "ArrowRight"),
    "most-points",
  );
  assert.equal(
    getLeaderboardKeyboardCategory("most-points", "ArrowRight"),
    "top-rated",
  );
  assert.equal(getLeaderboardKeyboardCategory("top-rated", "ArrowLeft"), "most-points");
  assert.equal(getLeaderboardKeyboardCategory("most-points", "Home"), "top-rated");
  assert.equal(getLeaderboardKeyboardCategory("top-rated", "End"), "most-points");
  assert.equal(getLeaderboardKeyboardCategory("top-rated", "Tab"), null);
});

test("category parsing supports direct links and safely defaults invalid values", () => {
  for (const category of ["top-rated", "most-booked", "most-points"])
    assert.equal(parseLeaderboardCategory(category), category);
  for (const invalid of [null, "", "TOP-RATED", "unknown"])
    assert.equal(parseLeaderboardCategory(invalid), "top-rated");
});

test("truck ranks preserve supplied order and sequential numbering through rating ties", () => {
  const top = getLeaderboardRankings("top-rated");
  assert.deepEqual(
    top.map((entry) => entry.name),
    [
      "Burger Bliss",
      "Pizza Wheels",
      "Taco Paradise",
      "Seoul Street",
      "Vegan Vibes",
      "BBQ Bros",
      "Sushi Roll",
    ],
  );
  assert.deepEqual(
    top.map((entry) => entry.rank),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(top[0].rating, top[1].rating);
  assert.equal(top[4].rating, top[5].rating);
  assert.ok(
    top.every((entry, index) => index === 0 || top[index - 1].rating >= entry.rating),
  );
  assert.equal(new Set(top.map((entry) => entry.id)).size, 7);
});

test("Most Booked preserves the identical truck rows shown by its design without invented booking counts", () => {
  const booked = getLeaderboardRankings("most-booked");
  assert.deepEqual(booked, getLeaderboardRankings("top-rated"));
  assert.equal(booked[0].reviews, 1234);
  assert.equal(booked[2].reviews, 2103);
  assert.ok(booked.every((entry) => entry.kind === "truck" && !("points" in entry)));
});

test("point rankings contain the seven supplied members, scores and portraits without truck data", () => {
  const points = getLeaderboardRankings("most-points");
  assert.deepEqual(
    points.map((entry) => entry.points),
    [1890, 1889, 1850, 1234, 1150, 1100, 1050],
  );
  assert.deepEqual(
    points.map((entry) => entry.rank),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(points[0].name, "Lionel Messi");
  assert.equal(points[6].name, "Tobin Heath");
  assert.ok(
    points.every(
      (entry) => entry.kind === "member" && entry.avatar && !("reviews" in entry),
    ),
  );
});

test("switching categories never mutates fixture data or leaks another category's rows", () => {
  const top = getLeaderboardRankings("top-rated");
  const original = top.map((entry) => ({ ...entry }));
  top.reverse();
  top[0].name = "Changed local result";
  getLeaderboardRankings("most-points");
  assert.deepEqual(getLeaderboardRankings("top-rated"), original);
  assert.deepEqual(getLeaderboardRankings("most-booked"), original);
});

test("each URL category renders one selected keyboard tab and the correct accessible ranking list", () => {
  for (const [category, label] of [
    ["top-rated", "Top Rated"],
    ["most-booked", "Most Booked"],
    ["most-points", "Most points"],
  ]) {
    const html = renderCategory(category);
    assert.equal((html.match(/role="tab"/g) ?? []).length, 3);
    assert.equal((html.match(/aria-selected="true"/g) ?? []).length, 1);
    assert.match(html, new RegExp(`aria-selected="true"[^>]*>.*?${label}`, "s"));
    assert.match(html, /role="tabpanel"/);
    assert.match(html, new RegExp(`aria-label="${label} sample rankings"`));
    assert.equal((html.match(/<li /g) ?? []).length, 7);
    assert.equal(html.includes("Burger Bliss"), category !== "most-points");
    assert.equal(html.includes("Lionel Messi"), category === "most-points");
  }
  assert.match(renderCategory("invalid"), /Top Rated sample rankings/);
});

test("Leaderboard stays behind existing authentication and customer role guards", () => {
  const matches = matchRoutes(discoverRoutes, ROUTES.CUSTOMER_LEADERBOARD);
  assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
  const role = matches.find(({ route }) => route.element?.type === RoleGuard);
  assert.deepEqual(role.route.element.props.allowedRoles, ["CUSTOMER"]);
});
