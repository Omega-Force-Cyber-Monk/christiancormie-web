import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { authSessionMiddleware } from "../../auth/store/auth.middleware.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
export const truckId = "11111111-1111-4111-8111-111111111111";
export const cuisineId = "22222222-2222-4222-8222-222222222222";
export const reviewId = "33333333-3333-4333-8333-333333333333";
export const cuisineDto = {
  id: cuisineId,
  name: "Seafood",
  slug: "seafood",
  iconUrl: null,
};
export const discoveryDto = (overrides = {}) => ({
  meta: { count: 1 },
  foodTrucks: [
    {
      id: truckId,
      slug: "actual-seafood",
      name: "Actual Seafood",
      description: null,
      imageUrl: null,
      address: null,
      rating: null,
      reviewCount: 0,
      distanceKm: 1.609344,
      operatingStatus: "BUSY",
      isFeatured: false,
      location: { latitude: 0, longitude: 0 },
      cuisines: [{ ...cuisineDto, isPrimary: true }],
      primaryCuisine: { ...cuisineDto, isPrimary: true },
      trendingScore: 12,
      ...overrides,
    },
  ],
});
export const profileDto = (overrides = {}) => ({
  id: truckId,
  slug: "actual-seafood",
  name: "Actual Seafood",
  description: "Fresh catch",
  profileImageUrl: null,
  coverImageUrl: null,
  currentAddress: "Real waterfront",
  operatingStatus: "OPEN",
  averageRating: "4.50",
  totalReviews: 1,
  followerCount: 8,
  totalCheckIns: 3,
  maximumGuestCapacity: 0,
  vendor: { isVerified: false },
  cuisines: [{ cuisine: cuisineDto }],
  images: [
    {
      id: reviewId,
      imageUrl: "https://example.invalid/photo.jpg",
      altText: "Fresh catch",
    },
  ],
  menus: [
    {
      id: truckId,
      name: "Lunch",
      categories: [
        {
          id: cuisineId,
          name: "Fish",
          items: [
            {
              id: reviewId,
              name: "Actual fish plate",
              description: null,
              imageUrl: null,
              price: "18.90",
              status: "SOLD_OUT",
              isVegan: false,
              isVegetarian: false,
              isGlutenFree: true,
            },
          ],
        },
      ],
    },
  ],
  ...overrides,
});
export const reviewsDto = {
  items: [
    {
      id: reviewId,
      rating: 4,
      title: "Fresh lunch",
      content: "Real review content",
      createdAt: "2026-10-28T12:00:00Z",
      isVerified: true,
      vendorResponse: "Thank you",
      customer: { id: cuisineId, name: "Reviewer", avatarUrl: null },
    },
  ],
  nextCursor: null,
  summary: { averageRating: 4.5, totalReviews: 1 },
};
export const promotionDto = {
  id: cuisineId,
  foodTruckId: truckId,
  title: "Lunch offer",
  description: "Weekday special",
  type: "PERCENTAGE",
  value: "15.00",
  startsAt: "2026-10-01T00:00:00Z",
  endsAt: "2026-11-01T00:00:00Z",
  isActive: true,
  isFollowerOnly: true,
};
export const favoritesDto = {
  totalCount: 1,
  openCount: 0,
  closedCount: 1,
  items: [
    {
      id: truckId,
      slug: "actual-seafood",
      name: "Actual Seafood",
      profileImageUrl: null,
      cuisine: "Seafood",
      distanceKm: null,
      averageRating: null,
      operatingStatus: "CLOSED",
      isFavorite: true,
    },
  ],
};
export const json = (data, status = 200) =>
  new globalThis.Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
export function customerTestStore({ role = "CUSTOMER", verified = true } = {}) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  store.dispatch(
    sessionRestored({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      sessionId: "customer-test",
      user: null,
    }),
  );
  if (verified)
    store.dispatch(
      identityVerified({
        id: cuisineId,
        name: "Customer",
        email: "customer@example.invalid",
        roles: ["CUSTOMER", "VENDOR"],
        role,
      }),
    );
  return store;
}
