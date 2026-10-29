import type { DiscoverFilters } from "@/features/customer/utils/discoverFilters";
import type {
  Coordinates,
  DiscoveryQuery,
  DiscoveryTruckDto,
  DiscoveryCard,
  FavoritesDto,
} from "@/features/customer/types/discovery.types";
export const KM_PER_MILE = 1.609344;
export function validCoordinates(value: Coordinates | null): value is Coordinates {
  return Boolean(
    value &&
    Number.isFinite(value.latitude) &&
    Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) &&
    Math.abs(value.longitude) <= 180,
  );
}
export function discoveryQuery(
  search: string,
  filters: DiscoverFilters,
  limit: number,
): DiscoveryQuery {
  return {
    ...(search.trim() ? { search: search.trim().slice(0, 100) } : {}),
    ...(filters.cuisines[0] ? { cuisineId: filters.cuisines[0] } : {}),
    ...(filters.minimumRating !== null ? { minRating: filters.minimumRating } : {}),
    limit,
  };
}
export function toDiscoveryCard(dto: DiscoveryTruckDto): DiscoveryCard {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    cuisine: dto.cuisines.map((c) => c.name).join(", ") || "Cuisine unavailable",
    distance: dto.distanceKm === null ? null : dto.distanceKm / KM_PER_MILE,
    rating: dto.rating,
    stars: dto.rating,
    image: dto.imageUrl ?? "",
    featured: dto.isFeatured,
    online: dto.operatingStatus === "OPEN",
    operatingStatus: dto.operatingStatus,
    address: dto.address ?? null,
  };
}
export function safeImage(value: string | null | undefined) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function toFavoriteCard(dto: FavoritesDto["items"][number]): DiscoveryCard {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    cuisine: dto.cuisine ?? "Cuisine unavailable",
    distance: dto.distanceKm === null ? null : dto.distanceKm / KM_PER_MILE,
    rating: dto.averageRating,
    stars: dto.averageRating,
    image: dto.profileImageUrl ?? "",
    featured: false,
    online: dto.operatingStatus === "OPEN",
    operatingStatus: dto.operatingStatus,
    address: null,
  };
}
