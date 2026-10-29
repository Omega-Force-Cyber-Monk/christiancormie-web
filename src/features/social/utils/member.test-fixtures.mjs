import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { authSessionMiddleware } from "../../auth/store/auth.middleware.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { socialProfileApi } from "../api/socialProfile.api.ts";
import { leaderboardsApi } from "../../leaderboards/api/leaderboards.api.ts";
import { rewardsApi } from "../../rewards/api/rewards.api.ts";
export const viewerId = "22222222-2222-4222-8222-222222222222";
export const memberId = "44444444-4444-4444-8444-444444444444";
export const truckId = "11111111-1111-4111-8111-111111111111";
export const postId = "33333333-3333-4333-8333-333333333333";
export const memberDto = (userId = memberId, overrides = {}) => ({
  userId,
  accountType: "CUSTOMER",
  displayName: "Actual Member",
  avatarUrl: null,
  vendorId: null,
  foodTruckId: null,
  foodTruckSlug: null,
  isVerified: false,
  bio: "Member bio",
  city: null,
  state: null,
  postCount: 2,
  followerCount: 7,
  followingCount: 4,
  isFollowing: false,
  ...overrides,
});
export const postsDto = (overrides = {}) => ({
  items: [
    {
      id: postId,
      authorUserId: memberId,
      content: "Actual post content",
      createdAt: "2026-10-28T12:00:00Z",
      publishedAt: null,
      author: memberDto(),
      media: [
        {
          id: truckId,
          mediaType: "IMAGE",
          mediaUrl: "https://example.invalid/photo.jpg",
          sortOrder: 0,
        },
      ],
    },
  ],
  nextCursor: null,
  ...overrides,
});
export const connectionsDto = {
  items: [{ ...memberDto(), followedAt: "2026-10-28T12:00:00Z" }],
  total: 22,
  limit: 20,
  offset: 0,
  nextOffset: 20,
};
export const truckRankDto = (overrides = {}) => ({
  id: postId,
  title: "Actual truck board",
  calculatedAt: "2026-10-27T00:00:00Z",
  entries: [
    {
      id: memberId,
      rank: 5,
      originalRank: 8,
      previousRank: 9,
      score: "71.25",
      foodTruckId: truckId,
      foodTruck: {
        id: truckId,
        name: "Ranked Truck",
        slug: "ranked-truck",
        profileImageUrl: null,
        averageRating: "4.25",
        totalReviews: 12,
        totalBookings: 34,
      },
    },
  ],
  ...overrides,
});
export const foodieDto = {
  items: [
    {
      userId: memberId,
      rank: 21,
      displayName: "Ranked Member",
      avatarUrl: null,
      points: 8400,
    },
  ],
  total: 21,
  limit: 20,
  offset: 20,
  nextOffset: null,
};
const foodie = {
  slug: "foodie",
  name: "Foodie",
  requiredPoints: 0,
  creditAmount: 0,
  level: 1,
};
const explorer = {
  slug: "explorer",
  name: "Explorer",
  requiredPoints: 500,
  creditAmount: 5,
  level: 2,
};
const hunter = {
  slug: "drop_hunter",
  name: "Drop Hunter",
  requiredPoints: 2000,
  creditAmount: 10,
  level: 3,
};
const legend = {
  slug: "bitedrop_legend",
  name: "BiteDrop Legend",
  requiredPoints: 10000,
  creditAmount: 25,
  level: 4,
};
export const rewardsDto = (overrides = {}) => ({
  profile: { id: viewerId, name: "Actual Member", avatarUrl: null, level: 2 },
  loyalty: {
    availablePoints: 140,
    lifetimePoints: 900,
    redeemedPoints: 760,
    availableCreditAmount: 1,
    maxRedeemPerVisit: 5,
    currentTier: explorer,
    nextTier: { ...hunter, pointsRemaining: 1100 },
    progress: { current: 900, target: 10000, percentage: 9 },
  },
  tiers: [foodie, explorer, hunter, legend].map((tier) => ({
    ...tier,
    isCurrent: tier.slug === "explorer",
  })),
  pointsPerAction: [
    { sourceType: "REVIEW", action: "Leave a verified review", points: 25 },
  ],
  recentActivity: [
    {
      id: postId,
      type: "REVIEW",
      title: "Actual Review reward",
      subtitle: "Verified review",
      points: 25,
      createdAt: "2026-10-28T12:00:00Z",
      balanceAfter: 140,
    },
  ],
  ...overrides,
});
export const rulesDto = [
  {
    id: postId,
    name: "Actual reward rule",
    description: null,
    triggerType: "REVIEW",
    rewardType: "CREDIT",
    pointsRequired: null,
    rewardAmount: 0,
    isActive: true,
  },
];
export function memberStore(role = "CUSTOMER", verified = true) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (d) => d().concat(authSessionMiddleware, baseApi.middleware),
  });
  store.dispatch(
    sessionRestored({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      sessionId: "member-test",
      user: null,
    }),
  );
  if (verified)
    store.dispatch(
      identityVerified({
        id: viewerId,
        name: "Test Viewer",
        email: "test@example.invalid",
        roles: ["CUSTOMER", "VENDOR"],
        role,
      }),
    );
  return store;
}
export const json = (value, status = 200) =>
  new globalThis.Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
export async function seedMember(store, id = viewerId) {
  for (const [endpoint, arg, data] of [
    ["getMemberProfile", id, memberDto(id)],
    ["getMemberPosts", { userId: id, tab: "posts" }, postsDto()],
    ["getMemberPosts", { userId: id, tab: "tagged" }, { items: [], nextCursor: null }],
  ])
    await store.dispatch(socialProfileApi.util.upsertQueryData(endpoint, arg, data));
  await store.dispatch(
    rewardsApi.util.upsertQueryData("getMyRewardSummary", undefined, rewardsDto()),
  );
  await store.dispatch(
    rewardsApi.util.upsertQueryData("getRewardRules", undefined, rulesDto),
  );
}
export async function seedRankings(store, category = "top-rated", offset = 0) {
  await store.dispatch(
    category === "most-points"
      ? leaderboardsApi.util.upsertQueryData(
          "getFoodieRankings",
          { limit: 20, offset },
          foodieDto,
        )
      : leaderboardsApi.util.upsertQueryData(
          "getTruckRankings",
          { category, limit: 20, offset },
          truckRankDto(),
        ),
  );
}
