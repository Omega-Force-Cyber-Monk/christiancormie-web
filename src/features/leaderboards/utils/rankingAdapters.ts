import type { z } from "zod";
import type {
  truckRankingsSchema,
  foodieRankingsSchema,
  RankingCategory,
} from "../api/leaderboards.api";
export type RankingRow = {
  id: string;
  kind: "truck" | "member";
  name: string;
  rank: number | null;
  previousRank: number | null;
  originalRank: number | null;
  image: string | null;
  slug?: string;
  score: string | number | null;
  metric: string;
  rating: string | number | null;
};
export function truckRankingRows(
  data: z.infer<typeof truckRankingsSchema>,
  category: RankingCategory,
): RankingRow[] {
  return data.entries.map((entry) => ({
    id: entry.id,
    kind: "truck",
    name: entry.foodTruck?.name ?? "Truck unavailable",
    rank: entry.rank,
    previousRank: entry.previousRank,
    originalRank: entry.originalRank ?? null,
    image: entry.foodTruck?.profileImageUrl ?? null,
    slug: entry.foodTruck?.slug,
    score: entry.score,
    metric:
      category === "most-booked"
        ? `${entry.foodTruck?.totalBookings ?? "Unavailable"} bookings`
        : `${entry.foodTruck?.totalReviews ?? "Unavailable"} reviews`,
    rating: entry.foodTruck?.averageRating ?? null,
  }));
}
export function foodieRankingRows(
  data: z.infer<typeof foodieRankingsSchema>,
): RankingRow[] {
  return data.items.map((entry) => ({
    id: entry.userId,
    kind: "member",
    name: entry.displayName,
    rank: entry.rank,
    previousRank: null,
    originalRank: null,
    image: entry.avatarUrl,
    score: entry.points,
    metric: `${entry.points ?? "Unavailable"} Points`,
    rating: null,
  }));
}
