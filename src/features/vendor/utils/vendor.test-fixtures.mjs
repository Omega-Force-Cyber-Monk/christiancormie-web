import {
  vendorProfileSchema,
  vendorTrucksSchema,
  vendorAnalyticsSchema,
  vendorRequestCountsSchema,
  vendorQrSchema,
} from "../schemas/vendor.schema.ts";
import { configureStore } from "@reduxjs/toolkit";
import { rootReducer } from "../../../app/rootReducer.ts";
import { baseApi } from "../../../services/api/baseApi.ts";
import { authSessionMiddleware } from "../../auth/store/auth.middleware.ts";
import { sessionRestored, identityVerified } from "../../auth/store/auth.slice.ts";
import { vendorApi } from "../api/vendor.api.ts";

export const ownerId = "77777777-7777-4777-8777-777777777777";
export const vendorId = "88888888-8888-4888-8888-888888888888";
export const truckId = "99999999-9999-4999-8999-999999999991";
export const profileDto = (overrides = {}) => ({
  id: vendorId,
  userId: ownerId,
  businessName: "Actual Vendor Kitchen",
  status: "PENDING_APPROVAL",
  logoUrl: null,
  description: null,
  businessEmail: "vendor@example.invalid",
  businessPhone: null,
  market: { id: "market-id", name: "Austin Market", city: "Austin", state: "TX" },
  user: {
    status: "ACTIVE",
    passwordHash: "test-sensitive-field-not-for-cache",
    profile: null,
    userRoles: [{ role: "CUSTOMER" }, { role: "VENDOR" }],
  },
  dashboardAccess: { allowed: true, status: "AVAILABLE", reason: null },
  verificationBadge: {
    isVerified: false,
    status: "PENDING",
    optional: true,
    message:
      "Verification documents are under review. Dashboard access remains available.",
    rejectionReason: null,
  },
  verificationRequirements: {
    state: "TX",
    normalizedState: "TX",
    requirementSet: "TEXAS",
    optional: true,
    purpose: "Bite Drop Verified badge only",
    requiredDocumentTypes: ["DSHS_MOBILE_FOOD_VENDOR_LICENSE"],
    requiredDocuments: [{ type: "DSHS_MOBILE_FOOD_VENDOR_LICENSE", label: "License" }],
    pendingUntilApproved: false,
    confirmationMessage: "Thank you for submitting your documents.",
  },
  ...overrides,
});
export const truckDto = (overrides = {}) => ({
  id: truckId,
  vendorId,
  name: "Actual Food Truck",
  slug: "actual-food-truck",
  status: "ACTIVE",
  operatingStatus: "CLOSED",
  profileImageUrl: null,
  currentAddress: "123 Actual Street",
  primaryCity: "Austin",
  averageRating: "4.85",
  totalBookings: 8,
  totalReviews: 5,
  totalCheckIns: 9,
  followerCount: 12,
  menus: [],
  cuisines: [],
  serviceAreas: [],
  images: [],
  ...overrides,
});
export const recentBookingDto = (overrides = {}) => ({
  id: "11111111-1111-4111-8111-11111111abcd",
  bookingNumber: "BK-2026-0007",
  bookingType: "EVENT",
  status: "COMPLETED",
  totalAmount: "1234.56",
  startsAt: "2026-11-01T18:30:00Z",
  createdAt: "2026-10-27T00:00:00Z",
  customer: {
    id: "customer-id",
    email: "customer@example.invalid",
    profile: {
      displayName: "Actual Customer",
      firstName: null,
      lastName: null,
      avatarUrl: null,
    },
  },
  foodTruck: { id: truckId, name: "Actual Food Truck", slug: "actual-food-truck" },
  ...overrides,
});
export const analyticsDto = (overrides = {}) => ({
  totalFoodTrucks: 1,
  totalBookings: 8,
  totalRevenue: 2500.25,
  totalReviews: 5,
  averageRating: 4.85,
  totalFollowers: 12,
  totalCheckIns: 9,
  recentBookings: [recentBookingDto()],
  paymentSummary: [{ status: "SUCCEEDED", count: 2, totalAmount: 2500.25 }],
  topTrucks: [
    {
      id: truckId,
      name: "Actual Food Truck",
      slug: "actual-food-truck",
      status: "ACTIVE",
      averageRating: "4.85",
      totalReviews: 5,
      totalBookings: 8,
      totalCheckIns: 9,
      followerCount: 12,
    },
  ],
  ...overrides,
});
export const countsDto = (overrides = {}) => ({
  bookings: 3,
  community: 4,
  messages: 2,
  ...overrides,
});
export const qrDto = (overrides = {}) => ({
  vendorId,
  businessName: "Actual Vendor Kitchen",
  foodTruckId: truckId,
  qrCode: "truck_backend_confirmed",
  qrCodeUrl: "/api/v1/qr/truck_backend_confirmed/profile",
  downloadUrl: null,
  shareMessage:
    "Scan our BiteDrop QR code at Actual Vendor Kitchen to check in and earn rewards!",
  ...overrides,
});
export function vendorTestStore(role = "VENDOR") {
  const store = configureStore({
    reducer: rootReducer,
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  store.dispatch(
    sessionRestored({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      sessionId: "vendor-integration-test",
      user: null,
    }),
  );
  store.dispatch(
    identityVerified({
      id: ownerId,
      name: "Vendor Owner",
      email: "vendor@example.invalid",
      roles: [role],
      role,
    }),
  );
  return store;
}
export async function seedVendorHome(
  store,
  {
    profile = profileDto(),
    trucks = [truckDto()],
    analytics = analyticsDto(),
    counts = countsDto(),
    qr = qrDto(),
  } = {},
) {
  // Exercise the endpoint parsers even when preloading a server-free UI cache.

  for (const [endpoint, data] of [
    ["getVendorMe", vendorProfileSchema.parse(profile)],
    ["getMyTrucks", vendorTrucksSchema.parse(trucks)],
    ["getVendorAnalytics", vendorAnalyticsSchema.parse(analytics)],
    ["getVendorRequestCounts", vendorRequestCountsSchema.parse(counts)],
    ["getVendorQr", vendorQrSchema.parse(qr)],
  ])
    await store.dispatch(vendorApi.util.upsertQueryData(endpoint, undefined, data));
}
export const json = (body, status = 200) =>
  new globalThis.Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
