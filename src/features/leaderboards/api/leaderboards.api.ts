import { z } from "zod";
import { baseApi } from "@/services/api/baseApi";
import { readValidated } from "@/services/api/validatedQuery";
const decimal = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .nullable();
const rank = z.number().int().positive().nullable();
export const truckRankingsSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  calculatedAt: z.string().nullable(),
  entries: z.array(
    z.object({
      id: z.uuid(),
      rank,
      originalRank: rank.optional(),
      previousRank: rank,
      score: decimal,
      foodTruckId: z.uuid().nullable(),
      foodTruck: z
        .object({
          id: z.uuid(),
          name: z.string(),
          slug: z.string(),
          profileImageUrl: z.string().nullable(),
          averageRating: decimal,
          totalReviews: z.number().nullable(),
          totalBookings: z.number().nullable(),
        })
        .nullable(),
    }),
  ),
});
export const foodieRankingsSchema = z.object({
  items: z.array(
    z.object({
      userId: z.uuid(),
      rank,
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
      points: z.number().nullable(),
    }),
  ),
  total: z.number().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  nextOffset: z.number().int().nonnegative().nullable(),
});
export type RankingCategory = "top-rated" | "most-booked" | "most-points";
export type RankingQuery = {
  category: RankingCategory;
  limit: number;
  offset: number;
  marketId?: string;
  period?: "DAILY" | "WEEKLY" | "MONTHLY" | "ALL_TIME";
};
export const leaderboardsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getTruckRankings: b.query<
      z.infer<typeof truckRankingsSchema>,
      Omit<RankingQuery, "category"> & { category: "top-rated" | "most-booked" }
    >({
      queryFn: ({ category, ...params }, _a, _e, q) =>
        readValidated(
          { url: `/leaderboards/${category}`, params },
          truckRankingsSchema,
          q,
        ),
      providesTags: ["Leaderboards"],
    }),
    getFoodieRankings: b.query<
      z.infer<typeof foodieRankingsSchema>,
      { limit: number; offset: number }
    >({
      queryFn: (params, _a, _e, q) =>
        readValidated(
          { url: "/leaderboards/foodie-points", params },
          foodieRankingsSchema,
          q,
        ),
      providesTags: ["Leaderboards"],
    }),
  }),
});
export const { useGetTruckRankingsQuery, useGetFoodieRankingsQuery } = leaderboardsApi;
