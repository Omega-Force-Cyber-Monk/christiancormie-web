import { z } from "zod";

const optionalText = z.string().nullable().optional();
import { galleryImageSchema } from "./truckAssets.schema";
import { menuSchema } from "./truckMenu.schema";
const count = z.number().int().nonnegative().nullable().optional();
const decimal = z
  .union([z.number().finite(), z.string().regex(/^-?\d+(?:\.\d+)?$/)])
  .nullable()
  .optional();

// Select only reviewed fields; raw /vendors/me includes an unrestricted user relation.
export const vendorProfileSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  businessName: z.string(),
  status: z.string(),
  logoUrl: optionalText,
  description: optionalText,
  businessEmail: optionalText,
  businessPhone: optionalText,
  user: z.object({ status: z.string() }).nullable().optional(),
  market: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      city: optionalText,
      state: optionalText,
    })
    .nullable()
    .optional(),
  dashboardAccess: z.object({
    allowed: z.boolean(),
    status: z.string(),
    reason: optionalText,
  }),
  verificationBadge: z
    .object({
      isVerified: z.boolean(),
      status: z.string(),
      optional: z.boolean(),
      message: z.string(),
      rejectionReason: optionalText,
    })
    .nullable()
    .optional(),
  verificationRequirements: z
    .object({
      optional: z.boolean(),
      purpose: z.string(),
      requiredDocumentTypes: z.array(z.string()).optional(),
      confirmationMessage: z.string().optional(),
    })
    .nullable()
    .optional(),
});
export const vendorTruckSchema = z.object({
  id: z.string().min(1),
  vendorId: z.string().min(1),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  operatingStatus: z.string(),
  profileImageUrl: optionalText,
  currentAddress: optionalText,
  primaryCity: optionalText,
  averageRating: decimal,
  totalBookings: count,
  totalReviews: count,
  totalCheckIns: count,
  followerCount: count,
  handle: optionalText,
  description: optionalText,
  coverImageUrl: optionalText,
  maximumGuestCapacity: count,
  images: z.array(galleryImageSchema).optional(),
  menus: z.array(menuSchema).optional(),
  operatingHours: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0).max(6),
        isClosed: z.boolean(),
        openingTime: z.string().nullable(),
        closingTime: z.string().nullable(),
      }),
    )
    .optional(),
  cuisines: z
    .array(
      z.object({
        cuisineId: z.uuid(),
        isPrimary: z.boolean(),
        cuisine: z.object({
          id: z.uuid(),
          name: z.string(),
          slug: z.string().optional(),
        }),
      }),
    )
    .optional(),
});
export const vendorTrucksSchema = z
  .array(vendorTruckSchema)
  .refine((trucks) =>
    trucks.every(
      (t) =>
        (t.images?.every((i) => i.foodTruckId === t.id) ?? true) &&
        (t.menus?.every(
          (m) =>
            m.foodTruckId === t.id &&
            m.categories.every(
              (c) => c.menuId === m.id && c.items.every((i) => i.categoryId === c.id),
            ),
        ) ??
          true) &&
        (t.cuisines?.every((c) => c.cuisineId === c.cuisine.id) ?? true),
    ),
  );
export const vendorRecentBookingSchema = z.object({
  id: z.string().min(1),
  bookingNumber: z.string(),
  bookingType: z.string(),
  status: z.string(),
  totalAmount: decimal,
  startsAt: optionalText,
  createdAt: optionalText,
  customer: z
    .object({
      id: z.string(),
      email: optionalText,
      profile: z
        .object({
          displayName: optionalText,
          firstName: optionalText,
          lastName: optionalText,
          avatarUrl: optionalText,
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  foodTruck: z
    .object({ id: z.string(), name: z.string(), slug: z.string() })
    .nullable()
    .optional(),
});
export const vendorAnalyticsSchema = z.object({
  totalFoodTrucks: z.number().int().nonnegative(),
  totalBookings: count,
  totalRevenue: decimal,
  totalReviews: count,
  averageRating: decimal,
  totalFollowers: count,
  totalCheckIns: count,
  recentBookings: z.array(vendorRecentBookingSchema).optional(),
  paymentSummary: z
    .array(z.object({ status: z.string(), count, totalAmount: decimal }))
    .optional(),
  topTrucks: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        slug: z.string(),
        status: z.string(),
        averageRating: decimal,
        totalReviews: count,
        totalBookings: count,
        totalCheckIns: count,
        followerCount: count,
      }),
    )
    .optional(),
});
export const vendorRequestCountsSchema = z.object({
  bookings: z.number().int().nonnegative(),
  community: count,
  messages: count,
});
export const vendorQrSchema = z.object({
  vendorId: z.string().min(1),
  businessName: z.string(),
  foodTruckId: z.string().nullable(),
  qrCode: z.string().nullable(),
  qrCodeUrl: optionalText,
  downloadUrl: optionalText,
  shareMessage: optionalText,
});
