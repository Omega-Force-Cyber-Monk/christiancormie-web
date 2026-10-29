import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "@/app/hooks";
import { socialActorAllowed } from "@/features/social/api/socialProfile.api";
import {
  useGetFoodieRankingsQuery,
  useGetTruckRankingsQuery,
  type RankingCategory,
} from "../api/leaderboards.api";
import { foodieRankingRows, truckRankingRows } from "./rankingAdapters";
export function useRankings(category: RankingCategory, offset: number) {
  const allowed = useAppSelector(socialActorAllowed);
  const trucks = useGetTruckRankingsQuery(
    allowed && category !== "most-points" ? { category, limit: 20, offset } : skipToken,
  );
  const foodies = useGetFoodieRankingsQuery(
    allowed && category === "most-points" ? { limit: 20, offset } : skipToken,
  );
  const query = category === "most-points" ? foodies : trucks;
  return {
    query,
    rows:
      category === "most-points"
        ? foodies.currentData
          ? foodieRankingRows(foodies.currentData)
          : []
        : trucks.currentData
          ? truckRankingRows(trucks.currentData, category)
          : [],
    next:
      category === "most-points"
        ? (foodies.currentData?.nextOffset ?? null)
        : trucks.currentData?.entries.length === 20
          ? offset + 20
          : null,
    calculatedAt: category !== "most-points" ? trucks.currentData?.calculatedAt : null,
  };
}
