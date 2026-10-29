import { z } from "zod";

const text = z.string().nullable().optional();
const decimal = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(\.\d+)?$/)])
  .nullable()
  .optional();
export const cuisineSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  iconUrl: text,
});
const cuisineLink = cuisineSchema.extend({ isPrimary: z.boolean().optional() });
export const discoveryTruckSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string(),
  description: text,
  imageUrl: text,
  address: text,
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  distanceKm: z.number().nonnegative().nullable(),
  operatingStatus: z.string(),
  isFeatured: z.boolean(),
  location: z.object({
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
  }),
  cuisines: z.array(cuisineLink),
  primaryCuisine: cuisineLink.nullable(),
  trendingScore: z.number().optional(),
});
export const discoveryListSchema = z.object({
  meta: z.object({ count: z.number() }),
  foodTrucks: z.array(discoveryTruckSchema),
});
const menuItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: text,
  imageUrl: text,
  price: decimal,
  status: z.string(),
  isVegan: z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
});
export const truckProfileSchema = z.object({
  id: z.uuid(),
  slug: z.string().min(1),
  name: z.string(),
  description: text,
  profileImageUrl: text,
  coverImageUrl: text,
  currentAddress: text,
  operatingStatus: z.string(),
  averageRating: decimal,
  totalReviews: z.number().nullable().optional(),
  followerCount: z.number().nullable().optional(),
  totalCheckIns: z.number().nullable().optional(),
  maximumGuestCapacity: z.number().nullable().optional(),
  vendor: z.object({ isVerified: z.boolean() }),
  cuisines: z.array(z.object({ cuisine: cuisineSchema })),
  images: z.array(z.object({ id: z.uuid(), imageUrl: z.string(), altText: text })),
  menus: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      categories: z.array(
        z.object({ id: z.uuid(), name: z.string(), items: z.array(menuItemSchema) }),
      ),
    }),
  ),
});
export const reviewsSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      rating: z.number(),
      title: text,
      content: text,
      createdAt: z.string(),
      isVerified: z.boolean(),
      vendorResponse: text,
      customer: z.object({ id: z.uuid(), name: z.string(), avatarUrl: text }),
    }),
  ),
  nextCursor: z.uuid().nullable(),
  summary: z.object({ averageRating: z.number().nullable(), totalReviews: z.number() }),
});
export const promotionsSchema = z.array(
  z.object({
    id: z.uuid(),
    foodTruckId: z.uuid(),
    title: z.string(),
    description: text,
    type: z.string(),
    value: decimal,
    startsAt: z.string(),
    endsAt: z.string(),
    isFollowerOnly: z.boolean(),
    isActive: z.boolean(),
  }),
);
export const favoritesSchema = z.object({
  totalCount: z.number(),
  openCount: z.number(),
  closedCount: z.number(),
  items: z.array(
    z.object({
      id: z.uuid(),
      slug: z.string(),
      name: z.string(),
      profileImageUrl: text,
      cuisine: text,
      distanceKm: z.number().nullable(),
      averageRating: z.number().nullable(),
      operatingStatus: z.string(),
      isFavorite: z.boolean(),
    }),
  ),
});
