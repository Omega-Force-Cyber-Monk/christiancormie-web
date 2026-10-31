import { USER_ROLES } from "@/constants/roles";
import { z } from "zod";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import { baseApi } from "@/services/api/baseApi";
import type { ApiBaseQuery } from "@/services/api/baseQuery";
import type { RootState } from "@/app/store";
import {
  selectIsAuthenticated,
  selectCurrentRole,
} from "@/features/auth/store/auth.selectors";
import {
  cuisineSchema,
  discoveryListSchema,
  favoritesSchema,
  promotionsSchema,
  reviewsSchema,
  truckProfileSchema,
} from "@/features/customer/schemas/discovery.schema";
import type {
  DiscoveryQuery,
  NearbyQuery,
} from "@/features/customer/types/discovery.types";
import { validCoordinates } from "@/features/customer/utils/discoveryAdapters";
import { ownedTruck } from "@/features/vendor/api/truckSettings.api";
import { vendorFor } from "@/features/vendor/api/vendorBookings.api";
import { managedPromotionsSchema } from "@/features/vendor/schemas/dropsIntegration.schema";
import {
  scopedRead,
  sessionDenied,
  type SessionScope,
} from "@/services/api/sessionGuard";
export type PromotionManagementArg = {
  foodTruckId: string;
  activeOnly: false;
  limit: 100;
  scope: SessionScope;
};

const invalid = {
  error: {
    status: "CUSTOM_ERROR" as const,
    error: "Invalid discovery response or request.",
  },
};
const socialFlights = new WeakMap<object, Set<string>>();
async function read<T>(
  args: FetchArgs,
  schema: z.ZodType<T>,
  query: (args: FetchArgs) => ReturnType<ApiBaseQuery>,
) {
  const result = await query(args);
  if (result.error) return { error: result.error };
  const parsed = schema.safeParse(result.data);
  return parsed.success ? { data: parsed.data } : invalid;
}
export type SocialAction = {
  foodTruckId: string;
  kind: "favorite" | "follow";
  enabled: boolean;
};
export const discoveryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTrendingTrucks: b.query<z.infer<typeof discoveryListSchema>, DiscoveryQuery>({
      queryFn: (params, _a, _e, q) =>
        read({ url: "/discovery/trending", params }, discoveryListSchema, q),
      providesTags: ["Discovery"],
    }),
    getNearbyTrucks: b.query<z.infer<typeof discoveryListSchema>, NearbyQuery>({
      queryFn: (params, _a, _e, q) =>
        validCoordinates(params)
          ? read({ url: "/discovery/nearby", params }, discoveryListSchema, q)
          : invalid,
      providesTags: ["Discovery"],
    }),
    getDiscoveryCuisines: b.query<z.infer<typeof cuisineSchema>[], void>({
      queryFn: (_p, _a, _e, q) =>
        read({ url: "/food-trucks/cuisines" }, z.array(cuisineSchema), q),
    }),
    getTruckProfile: b.query<z.infer<typeof truckProfileSchema>, string>({
      queryFn: (slug, _a, _e, q) =>
        read(
          { url: `/food-trucks/profile/${encodeURIComponent(slug)}` },
          truckProfileSchema,
          q,
        ),
      providesTags: ["TruckProfile", "FoodTruck"],
    }),
    getTruckReviews: b.query<
      z.infer<typeof reviewsSchema>,
      { slug: string; cursor?: string }
    >({
      queryFn: ({ slug, ...params }, _a, _e, q) =>
        read(
          {
            url: `/food-trucks/profile/${encodeURIComponent(slug)}/reviews`,
            params: { ...params, limit: 20 },
          },
          reviewsSchema,
          q,
        ),
      providesTags: ["TruckProfile"],
    }),
    getTruckPromotions: b.query<
      z.infer<typeof promotionsSchema>,
      string | PromotionManagementArg
    >({
      queryFn: async (arg, a, _e, q) => {
        if (typeof arg !== "string") {
          const { scope, foodTruckId } = arg;
          if (
            arg.activeOnly !== false ||
            arg.limit !== 100 ||
            !vendorFor(a.getState() as RootState, scope, true) ||
            !ownedTruck(a.getState() as RootState, scope, foodTruckId)
          )
            return sessionDenied;
          const r = await scopedRead(
            a,
            scope,
            q,
            {
              url: `/promotions/food-trucks/${foodTruckId}`,
              method: "GET",
              params: { activeOnly: false, limit: 100 },
            },
            managedPromotionsSchema.refine(
              (rows) =>
                rows.every((p) => p.foodTruckId === foodTruckId) &&
                new Set(rows.map((p) => p.id)).size === rows.length,
            ),
          );
          return vendorFor(a.getState() as RootState, scope, true) &&
            ownedTruck(a.getState() as RootState, scope, foodTruckId)
            ? r
            : sessionDenied;
        }
        const id = arg;
        return z.uuid().safeParse(id).success
          ? read(
              {
                url: `/promotions/food-trucks/${id}`,
                params: { activeOnly: true, limit: 100 },
              },
              promotionsSchema,
              q,
            )
          : invalid;
      },
      providesTags: ["TruckProfile", "TruckPromotions"],
    }),
    getDiscoveryFavorites: b.query<z.infer<typeof favoritesSchema>, void>({
      queryFn: (_p, a, _e, q) => {
        const state = a.getState() as RootState;
        return selectIsAuthenticated(state) &&
          selectCurrentRole(state) === USER_ROLES.CUSTOMER
          ? read({ url: "/social/favorites" }, favoritesSchema, q)
          : {
              error: {
                status: 403,
                data: { message: "Verified customer session required." },
              },
            };
      },
      providesTags: ["Favorites", "Follow"],
    }),
    setTruckRelationship: b.mutation<
      { enabled: boolean; kind: SocialAction["kind"]; foodTruckId: string },
      SocialAction
    >({
      async queryFn(arg, a, _e, q) {
        const state = a.getState() as RootState;
        if (
          !selectIsAuthenticated(state) ||
          selectCurrentRole(state) !== USER_ROLES.CUSTOMER
        )
          return {
            error: {
              status: 403,
              data: { message: "Verified customer session required." },
            },
          };
        if (!z.uuid().safeParse(arg.foodTruckId).success) return invalid;
        const flights = socialFlights.get(a.dispatch) ?? new Set<string>();
        socialFlights.set(a.dispatch, flights);
        const key = `${state.auth.sessionId}:${arg.foodTruckId}:${arg.kind}`;
        if (flights.has(key))
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "An update is already in progress.",
            },
          };
        flights.add(key);
        try {
          const schema: z.ZodType<unknown> = arg.enabled
            ? z.object({ id: z.string(), foodTruckId: z.literal(arg.foodTruckId) })
            : arg.kind === "follow"
              ? z.object({ unfollowed: z.boolean() })
              : z.object({ unfavorited: z.boolean() });
          const result = await read(
            {
              url: `/social/food-trucks/${arg.foodTruckId}/${arg.kind}`,
              method: arg.enabled ? "POST" : "DELETE",
            },
            schema,
            q,
          );
          if ((a.getState() as RootState).auth.sessionId !== state.auth.sessionId)
            return {
              error: {
                status: "CUSTOM_ERROR",
                error: "The authentication session changed.",
              },
            };
          return result.error ? { error: result.error } : { data: { ...arg } };
        } finally {
          flights.delete(key);
        }
      },
      invalidatesTags: (result) =>
        result
          ? [
              "Favorites",
              "Follow",
              "Discovery",
              "TruckProfile",
              "FoodTruck",
              "MemberProfile",
              "MemberFollowers",
              "MemberFollowing",
              "MemberPosts",
              "SocialFeed",
            ]
          : [],
    }),
  }),
});
export const {
  useGetTrendingTrucksQuery,
  useGetNearbyTrucksQuery,
  useGetDiscoveryCuisinesQuery,
  useGetTruckProfileQuery,
  useGetTruckReviewsQuery,
  useGetTruckPromotionsQuery,
  useGetDiscoveryFavoritesQuery,
  useSetTruckRelationshipMutation,
} = discoveryApi;
