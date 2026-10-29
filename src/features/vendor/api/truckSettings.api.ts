import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import { invalidContract } from "@/services/api/validatedQuery";
import {
  scopedRead,
  sessionFlight,
  sessionDenied,
  scopeMatches,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { vendorApi } from "./vendor.api";
import { vendorTruckSchema } from "../schemas/vendor.schema";
import {
  cuisineCatalogSchema,
  truckSettingsPatchSchema,
} from "../schemas/truckSettings.schema";
export function ownedTruck(state: RootState, scope: SessionScope, id: string) {
  if (
    !scopeMatches(state, scope) ||
    scope.role !== "VENDOR" ||
    !z.uuid().safeParse(id).success
  )
    return undefined;
  const vendor = vendorApi.endpoints.getVendorMe.select()(state).data;
  const trucks = vendorApi.endpoints.getMyTrucks.select()(state).data;
  if (
    !vendor ||
    vendor.userId !== scope.userId ||
    !vendor.dashboardAccess.allowed ||
    (vendor.user?.status && vendor.user.status !== "ACTIVE")
  )
    return undefined;
  return trucks?.find((t) => t.id === id && t.vendorId === vendor.id);
}
export const truckWriteTags = [
  "Vendor",
  "FoodTruck",
  "TruckProfile",
  "Discovery",
  "VendorAnalytics",
  "VendorQr",
  "MemberProfile",
  "SocialFeed",
  "SocialPosts",
  "MemberPosts",
  "MemberFollowers",
  "MemberFollowing",
  "Conversations",
  "ConversationDetail",
  "Favorites",
] as const;
export const truckSettingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTruckCuisines: b.query<z.infer<typeof cuisineCatalogSchema>, SessionScope>({
      queryFn: (scope, a, _e, q) =>
        scope.role === "VENDOR"
          ? scopedRead(
              a,
              scope,
              q,
              { url: "/food-trucks/cuisines" },
              cuisineCatalogSchema,
            )
          : sessionDenied,
    }),
    saveTruckProfile: b.mutation<
      z.infer<typeof vendorTruckSchema>,
      { scope: SessionScope; truckId: string; body: unknown }
    >({
      queryFn: ({ scope, truckId, body }, a, _e, q) =>
        sessionFlight(a, scope, `truck-profile:${truckId}`, () => {
          if (!ownedTruck(a.getState() as RootState, scope, truckId))
            return Promise.resolve(sessionDenied);
          const parsed = truckSettingsPatchSchema.safeParse(body);
          if (!parsed.success) return Promise.resolve(invalidContract);
          const list = truckSettingsApi.endpoints.getTruckCuisines.select(scope)(
            a.getState() as RootState,
          ).data;
          if (
            parsed.data.cuisines &&
            parsed.data.cuisines.some(
              (c) => !list?.some((row) => row.id === c.cuisineId),
            )
          )
            return Promise.resolve(invalidContract);
          return scopedRead(
            a,
            scope,
            q,
            {
              url: `/food-trucks/${truckId}/profile-settings`,
              method: "PATCH",
              body: parsed.data,
            },
            vendorTruckSchema.refine(
              (t) =>
                t.id === truckId &&
                t.vendorId ===
                  ownedTruck(a.getState() as RootState, scope, truckId)?.vendorId,
            ),
          );
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
  }),
});
export const { useGetTruckCuisinesQuery, useSaveTruckProfileMutation } =
  truckSettingsApi;
