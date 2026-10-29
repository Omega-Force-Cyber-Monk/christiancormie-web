import type { z } from "zod";
import type {
  discoveryTruckSchema,
  truckProfileSchema,
  reviewsSchema,
  promotionsSchema,
  favoritesSchema,
} from "@/features/customer/schemas/discovery.schema";
export type DiscoveryTruckDto = z.infer<typeof discoveryTruckSchema>;
export type TruckProfileDto = z.infer<typeof truckProfileSchema>;
export type ReviewsDto = z.infer<typeof reviewsSchema>;
export type PromotionsDto = z.infer<typeof promotionsSchema>;
export type FavoritesDto = z.infer<typeof favoritesSchema>;
export type Coordinates = { latitude: number; longitude: number };
export type DiscoveryQuery = {
  search?: string;
  cuisineId?: string;
  minRating?: number;
  limit: number;
};
export type NearbyQuery = DiscoveryQuery & Coordinates & { radiusKm: number };
export type DiscoveryCard = {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  distance: number | null;
  rating: number | null;
  stars: number | null;
  image: string;
  featured: boolean;
  online: boolean;
  operatingStatus: string;
  address: string | null;
};
