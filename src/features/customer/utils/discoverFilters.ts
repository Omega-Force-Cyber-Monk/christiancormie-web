import type { DiscoverTruck } from "@/features/customer/data/discover.data";

export type DiscoverFilters = {
  cuisines: string[];
  distance: number | null;
  minimumRating: number | null;
};

export const defaultDiscoverFilters: DiscoverFilters = {
  cuisines: [],
  distance: null,
  minimumRating: null,
};

export const discoverCuisines = [
  "Mexican",
  "American",
  "Italian",
  "Asian",
  "BBQ",
  "Seafood",
  "Vegan",
  "Desserts",
  "Coffee",
  "Korean",
  "Japanese",
  "Indian",
];

export const getDiscoverFilterCount = (filters: DiscoverFilters) =>
  filters.cuisines.length +
  Number(filters.distance !== null) +
  Number(filters.minimumRating !== null);

export function matchesDiscoverFilters(
  truck: Pick<DiscoverTruck, "cuisine" | "distance" | "rating" | "stars">,
  filters: DiscoverFilters,
) {
  // Exact sample scores take precedence; other cards supply a visible star score.
  const rating = truck.rating ?? truck.stars;
  return (
    (filters.cuisines.length === 0 || filters.cuisines.includes(truck.cuisine)) &&
    (filters.distance === null || truck.distance <= filters.distance) &&
    (filters.minimumRating === null || rating >= filters.minimumRating)
  );
}
