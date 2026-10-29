import {
  memberStore,
  seedMember,
  viewerId,
  memberId,
} from "../../social/utils/member.test-fixtures.mjs";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes, matchRoutes } from "react-router";
import { Provider } from "react-redux";
import {
  customerTestStore,
  profileDto,
  reviewsDto,
  truckId,
} from "./discovery.test-fixtures.mjs";
import { discoveryApi } from "../api/discovery.api.ts";
import { baseApi } from "../../../services/api/baseApi.ts";

import { ROUTES } from "../../../constants/routes.ts";
import { appRoutes } from "../../../router/routes/app.routes.tsx";
import { AuthGuard } from "../../../router/guards/AuthGuard.tsx";
import { RoleGuard } from "../../../router/guards/RoleGuard.tsx";
import { routeMetadata } from "../../../router/metadata/routeMetadata.ts";
import CustomerProfilePage from "../pages/CustomerProfilePage.tsx";
import {
  memberProfilePhotos,
  memberProfileTiers,
} from "../data/member-profile.data.ts";
import { memberProfileEditSchema } from "../schemas/member-profile.schema.ts";
import {
  getMemberFollowerCount,
  getMemberProfileTab,
  initialMemberProfileState,
  memberProfileReducer,
} from "./memberProfile.ts";

function renderProfile(path, store = customerTestStore()) {
  return renderToStaticMarkup(
    h(
      Provider,
      { store },
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          Routes,
          null,
          h(Route, { path: ROUTES.CUSTOMER_PROFILE, element: h(CustomerProfilePage) }),
        ),
      ),
    ),
  );
}

test("profile editing is a draft until Save and Cancel leaves the saved name intact", () => {
  const original = initialMemberProfileState;
  let state = memberProfileReducer(original, { type: "edit" });
  assert.equal(state.editing, true);
  state = memberProfileReducer(state, { type: "cancel" });
  assert.equal(state.editing, false);
  assert.equal(state.name, original.name);
  state = memberProfileReducer(state, { type: "edit" });
  state = memberProfileReducer(state, { type: "save", name: "  Alex Morgan  " });
  assert.equal(state.name, "Alex Morgan");
  assert.equal(state.editing, false);
  assert.equal(original.name, "Alex Rivera");
  assert.ok(state.status.includes("locally"));
});

test("blank names fail validation without losing the current profile or editor state", () => {
  const editing = memberProfileReducer(initialMemberProfileState, { type: "edit" });
  for (const name of ["", " ", "\n\t"]) {
    assert.equal(memberProfileEditSchema.safeParse({ name }).success, false);
    assert.strictEqual(memberProfileReducer(editing, { type: "save", name }), editing);
  }
  assert.equal(
    memberProfileEditSchema.safeParse({ name: "Álex Rivera" }).success,
    true,
  );
});

test("following updates followers consistently and leaves unrelated profile data intact", () => {
  const original = initialMemberProfileState;
  assert.equal(getMemberFollowerCount(original.following), 2);
  const followed = memberProfileReducer(original, { type: "follow" });
  assert.equal(getMemberFollowerCount(followed.following), 3);
  assert.equal(followed.name, original.name);
  const unFollowed = memberProfileReducer(followed, { type: "follow" });
  assert.equal(getMemberFollowerCount(unFollowed.following), 2);
  const edited = memberProfileReducer(followed, { type: "save", name: "Alex M." });
  assert.equal(edited.following, true);
});

test("own/public member views use real identity while keeping distinct actions", async () => {
  const store = memberStore();
  await seedMember(store);
  const own = renderProfile(ROUTES.CUSTOMER_OWN_PROFILE, store);
  for (const text of [
    "Actual Member",
    "Edit profile",
    "Tier Badges",
    "Current",
    `href="/profile/${viewerId}"`,
    'value="900"',
    'max="2000"',
  ])
    assert.ok(own.includes(text), text);
  await seedMember(store, memberId);
  const publicView = renderProfile(`/profile/${memberId}`, store);
  assert.match(publicView, /Actual Member/);
  assert.match(publicView, /aria-pressed="false"/);
  assert.match(publicView, />Follow<\/button>/);
  assert.match(publicView, />Message<\/button>/);
  assert.doesNotMatch(publicView, /Edit profile|Tier Badges|Credit Accepted/);
  store.dispatch(baseApi.util.resetApiState());
});
test("posts/tagged tabs normalize URL state and preserve the supplied gallery structure", async () => {
  assert.equal(getMemberProfileTab("tagged"), "tagged");
  assert.equal(getMemberProfileTab("menu"), "posts");
  assert.equal(getMemberProfileTab(null), "posts");
  assert.equal(memberProfilePhotos.length, 8);
  assert.equal(memberProfilePhotos.filter(Boolean).length, 5);
  assert.equal(
    new Set(memberProfilePhotos.filter(Boolean).map((photo) => photo.id)).size,
    5,
  );
  const store = memberStore();
  await seedMember(store);
  const html = renderProfile(`${ROUTES.CUSTOMER_OWN_PROFILE}?tab=tagged`, store);
  assert.match(html, /role="tab" aria-label="Tagged posts" aria-selected="true"/);
  assert.ok(html.includes("No tagged posts"));
  assert.equal(memberProfileTiers.length, 4);
  store.dispatch(baseApi.util.resetApiState());
});

test("existing food-truck profiles and unknown-profile states remain separate from personal profiles", async () => {
  const store = customerTestStore();
  await store.dispatch(
    discoveryApi.util.upsertQueryData(
      "getTruckProfile",
      "actual-seafood",
      profileDto(),
    ),
  );
  await store.dispatch(
    discoveryApi.util.upsertQueryData(
      "getTruckReviews",
      { slug: "actual-seafood" },
      reviewsDto,
    ),
  );
  await store.dispatch(
    discoveryApi.util.upsertQueryData("getTruckPromotions", truckId, []),
  );
  const truck = renderProfile("/profile/actual-seafood?tab=menu", store);
  for (const text of ["Actual Seafood", "Actual fish plate", ">Book</button>"])
    assert.ok(truck.includes(text), text);
  assert.ok(!truck.includes("Tier Badges"));
  const unknown = renderProfile("/profile/unknown");
  assert.ok(unknown.includes("Loading truck profile"));
  assert.ok(!unknown.includes("Alex Rivera"));
  store.dispatch(baseApi.util.resetApiState());
});

test("personal and truck URLs retain verified-customer guards and route metadata", () => {
  for (const path of [
    ROUTES.CUSTOMER_OWN_PROFILE,
    ROUTES.CUSTOMER_PUBLIC_PROFILE,
    "/profile/taco-paradise",
  ]) {
    const matches = matchRoutes(appRoutes, path);
    assert.ok(matches.some(({ route }) => route.element?.type === AuthGuard));
    assert.ok(
      matches.some(
        ({ route }) =>
          route.element?.type === RoleGuard &&
          route.element.props.allowedRoles.includes("CUSTOMER"),
      ),
    );
  }
  assert.equal(
    routeMetadata.find((item) => item.path === ROUTES.CUSTOMER_OWN_PROFILE).title,
    "Profile",
  );
});
