import { z } from "zod";

const nullableString = z.string().nullable();

export const currentUserResponseSchema = z.looseObject({
  id: z.string().min(1),
  email: z.string().min(1),
  phone: nullableString,
  status: z.string(),
  emailVerifiedAt: nullableString,
  phoneVerifiedAt: nullableString,
  lastLoginAt: nullableString,
  createdAt: z.string(),
  updatedAt: z.string(),
  roles: z.array(z.string()),
  profile: z
    .looseObject({
      id: z.string(),
      userId: z.string(),
      firstName: nullableString,
      lastName: nullableString,
      displayName: nullableString,
      dateOfBirth: nullableString,
      avatarUrl: nullableString,
      bio: nullableString,
      city: nullableString,
      state: nullableString,
      country: nullableString,
      postalCode: nullableString,
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  settings: z
    .looseObject({
      id: z.string(),
      userId: z.string(),
      language: z.string(),
      timezone: z.string(),
      distanceUnit: z.string(),
      locationPermissionGranted: z.boolean(),
      pushPermissionGranted: z.boolean(),
      marketingConsent: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
  notificationPreference: z
    .looseObject({
      id: z.string(),
      userId: z.string(),
      nearbyDropAlerts: z.boolean(),
      followedTruckUpdates: z.boolean(),
      favoriteTruckAlerts: z.boolean(),
      promotionAlerts: z.boolean(),
      bookingAlerts: z.boolean(),
      paymentAlerts: z.boolean(),
      messageAlerts: z.boolean(),
      rewardAlerts: z.boolean(),
      checkInAlerts: z.boolean(),
      marketingAlerts: z.boolean(),
    })
    .nullable(),
  interestCuisines: z.array(z.unknown()),
  // No vendor contract has been supplied; retain the opaque returned value.
  vendor: z.custom<unknown>((value) => value !== undefined).nullable(),
});
