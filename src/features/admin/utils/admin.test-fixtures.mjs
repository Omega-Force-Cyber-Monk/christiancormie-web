import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import {
  authReducer,
  sessionRestored,
  identityVerified,
} from "../../auth/store/auth.slice.ts";
import { authSessionMiddleware } from "../../auth/store/auth.middleware.ts";
import { baseApi } from "../../../services/api/baseApi.ts";

export function adminTestStore() {
  const store = configureStore({
    reducer: { auth: authReducer, [baseApi.reducerPath]: baseApi.reducer },
    middleware: (defaults) =>
      defaults().concat(authSessionMiddleware, baseApi.middleware),
  });
  store.dispatch(
    sessionRestored({
      accessToken: "test-access",
      refreshToken: "test-refresh",
      sessionId: "admin-test",
      user: null,
    }),
  );
  store.dispatch(
    identityVerified({
      id: "test-admin",
      name: "Test Admin",
      email: "admin@example.invalid",
      role: "ADMIN",
      roles: ["ADMIN"],
    }),
  );
  return store;
}
export const json = (data, status = 200) =>
  new globalThis.Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
export const renderAdmin = (store, page) =>
  renderToStaticMarkup(
    createElement(
      Provider,
      { store },
      createElement(MemoryRouter, null, createElement(page)),
    ),
  );
export const userDto = (overrides = {}) => ({
  id: "11111111-1111-4111-8111-11111111abcd",
  userId: "U-ABCD",
  name: "Real User",
  email: "user@example.invalid",
  phone: null,
  location: null,
  joinDate: "2026-10-01T00:00:00Z",
  memberSince: "2026-10-01T00:00:00Z",
  lastLoginAt: null,
  activity: { totalBookings: 7, referrals: 3 },
  totalBookings: 7,
  referrals: 3,
  loyaltyPoints: 123,
  lifetimePoints: 456,
  redeemedPoints: 333,
  status: "ACTIVE",
  roles: ["CUSTOMER"],
  canSuspend: true,
  canRetrieve: false,
  ...overrides,
});
export const usersResponse = (users = [userDto()]) => ({
  generatedAt: "2026-10-27T00:00:00Z",
  summary: { totalUsers: 200, activeThisMonth: 120, newThisWeek: 12, suspended: 6 },
  users,
});

export const bookingDto = (overrides = {}) => ({
  id: "22222222-2222-4222-8222-22222222abcd",
  bookingNumber: "BK-2026-27",
  customer: {
    id: "customer-id",
    name: "Booking Customer",
    email: "customer@example.invalid",
    phone: null,
  },
  vendor: {
    id: "vendor-id",
    businessName: "Real Truck",
    email: "truck@example.invalid",
    phone: "+12025550191",
  },
  foodTruck: null,
  event: {
    name: "Party",
    type: "BIRTHDAY_PARTY",
    bookingType: "EVENT",
    startsAt: "2026-11-01T18:30:00Z",
    endsAt: "2026-11-01T20:30:00Z",
    guestCount: 30,
    address: "123 Actual Street",
  },
  amount: 1000.25,
  fees: { subtotal: 950, serviceFee: 50.25, taxAmount: 0, discountAmount: 0 },
  paymentModel: "DEPOSIT_ONLY",
  pricingModel: "PER_PERSON",
  status: "COMPLETED",
  payment: {
    id: "payment-id",
    amount: 200,
    currency: "USD",
    status: "SUCCEEDED",
    paidAt: "2026-10-27T00:00:00Z",
    createdAt: "2026-10-27T00:00:00Z",
    commission: {
      grossAmount: 200,
      commissionRate: 0.15,
      commissionAmount: 30,
      vendorNetAmount: 170,
    },
    refunds: [],
  },
  dispute: { isDisputed: false, reports: [], source: "review_reports" },
  createdAt: "2026-10-27T00:00:00Z",
  ...overrides,
});
export const bookingsResponse = (bookings = [bookingDto()]) => ({
  generatedAt: "2026-10-27T00:00:00Z",
  summary: {
    totalBookings: 100,
    thisMonth: 50,
    totalRevenue: 1200,
    disputed: 1,
    disputedSource: "review_reports",
  },
  bookings,
});

export const vendorDto = (overrides = {}) => ({
  id: "33333333-3333-4333-8333-33333333abcd",
  businessName: "Real Vendor",
  status: "APPROVED",
  isVerified: true,
  ownerName: "Real Owner",
  email: "vendor@example.invalid",
  phone: "+12025550191",
  cuisine: "Tacos",
  cuisines: ["Tacos"],
  rating: 4.8,
  reviews: 12,
  followers: 24,
  totalBookings: 8,
  revenueGenerated: 2345.67,
  description: "Actual description",
  serviceArea: "Austin",
  menuItems: ["Taco", "Burrito"],
  priceRange: "$5.00-$12.00",
  memberSince: "2026-10-01T00:00:00Z",
  primaryTruck: { id: "truck", name: "Real Truck" },
  foodTrucks: [{ id: "truck", name: "Real Truck" }],
  verificationRequests: [
    {
      id: "verification",
      status: "PENDING",
      createdAt: "2026-10-02T00:00:00Z",
      documents: [
        {
          type: "DSHS_MOBILE_FOOD_VENDOR_LICENSE",
          url: "https://example.invalid/document.pdf",
        },
      ],
    },
  ],
  documents: [
    {
      type: "DSHS_MOBILE_FOOD_VENDOR_LICENSE",
      url: "https://example.invalid/document.pdf",
    },
  ],
  badges: [],
  photoShootRequests: [],
  ...overrides,
});
export const vendorsResponse = (vendors = [vendorDto()]) => ({
  summary: { totalVendors: 20, active: 10, pendingApproval: 5, suspended: 5 },
  tabs: { allVendors: 20, truckRequests: 7, communicated: 2, photoShootRequests: 0 },
  vendors,
});
export const truckRequestDto = (overrides = {}) => ({
  id: "44444444-4444-4444-8444-44444444abcd",
  requestedById: "requester-id",
  truckName: "Requested Truck",
  ownerName: "Truck Owner",
  ownerEmail: "owner@example.invalid",
  ownerPhone: null,
  socialUrl: null,
  city: "Austin",
  state: "TX",
  notes: "Please add this local truck",
  status: "PENDING",
  reviewedById: null,
  reviewedAt: null,
  createdAt: "2026-10-05T00:00:00Z",
  requestedBy: {
    id: "requester-id",
    email: "requester@example.invalid",
    phone: null,
    profile: { displayName: "Actual Requester" },
  },
  reviewedBy: null,
  ...overrides,
});

export const postDto = (overrides = {}) => ({
  id: "55555555-5555-4555-8555-55555555abcd",
  postId: "P-ABCD",
  title: "Need a truck",
  content: "Actual post content",
  author: {
    id: "author",
    userId: "U-AUTH",
    name: "Post Author",
    email: "post@example.invalid",
  },
  category: "NEED_TRUCK",
  type: "EVENT",
  status: "OPEN",
  visibility: "PUBLIC",
  likes: 2,
  commentsCount: 1,
  media: [],
  imageUrls: [],
  isReported: true,
  reportReason: "SPAM_OR_IRRELEVANT",
  reportStatus: "PENDING",
  reports: [{ id: "report", reason: "SPAM_OR_IRRELEVANT", status: "PENDING" }],
  comments: [],
  createdAt: "2026-10-01T00:00:00Z",
  deletedAt: null,
  moderation: { canRemove: true, canContactAuthor: true },
  ...overrides,
});
export const communityResponse = (posts = [postDto()]) => ({
  generatedAt: "2026-10-27T00:00:00Z",
  summary: { totalPosts: 100, today: 20, reported: 3, removedToday: 0 },
  tabs: { allPosts: 100, needTruck: 50 },
  posts,
});
export const reviewDto = (overrides = {}) => ({
  id: "66666666-6666-4666-8666-66666666abcd",
  reviewId: "R-ABCD",
  source: "BOOKING",
  sourceLabel: "Booking",
  title: null,
  customer: { id: "customer", name: "Real Reviewer", email: null },
  vendor: { id: "vendor", businessName: "Reviewed Vendor" },
  foodTruck: null,
  booking: null,
  rating: 5,
  content: "Actual feedback",
  visibleContent: "Actual feedback",
  isVerified: true,
  status: "PUBLISHED",
  isReported: true,
  contentHidden: false,
  ratingVisible: true,
  reportReason: "SPAM",
  reportDescription: null,
  reportStatus: "PENDING",
  reports: [],
  moderationReason: null,
  createdAt: "2026-10-01T00:00:00Z",
  moderatedAt: null,
  actions: { canRemoveCompletely: true, canHideTextOnly: true, canKeepReview: true },
  ...overrides,
});
export const reviewsResponse = (reviews = [reviewDto()]) => ({
  generatedAt: "2026-10-27T00:00:00Z",
  summary: { totalReviews: 100, averageRating: 4.8, reported: 10, removedThisWeek: 0 },
  tabs: { allReviews: 100, reportedOnly: 10, bookings: 100, checkIn: 0 },
  reviews,
});

export const paymentsResponse = (overrides = {}) => ({
  generatedAt: "2026-10-27T00:00:00Z",
  summary: {
    pendingPayouts: 1,
    totalAmount: 1000,
    revenueThisMonth: 500,
    commissionEarned: 75,
  },
  tabs: {
    payoutRequests: 1,
    revenueOverview: true,
    transactionHistory: 1,
    paymentMethods: 1,
  },
  payoutRequests: [
    {
      id: "payout-uuid",
      payoutId: "PO-1234",
      vendorId: "vendor-uuid",
      vendorName: "Payout Vendor",
      ownerName: "Owner",
      ownerEmail: null,
      amount: 125.5,
      currency: "USD",
      completedBookings: 2,
      payoutMethod: { type: "STRIPE_CONNECT", label: "Stripe Connected" },
      requestedAt: "2026-10-01T00:00:00Z",
      status: "PENDING",
      failureReason: null,
      paidAt: null,
      actions: { canApprove: true, canReject: true, canHold: true },
    },
  ],
  revenueOverview: {
    summary: {
      totalRevenueYtd: 1000,
      platformCommissionYtd: 150,
      vendorPayoutsYtd: 850,
    },
    monthlyRevenueBreakdown: [
      { month: "Oct", monthIndex: 9, revenue: 1000, commission: 150, payouts: 850 },
    ],
    commissionVsPayouts: [{ month: "Oct", commission: 150, payouts: 850 }],
  },
  transactions: [
    {
      id: "payment-uuid",
      transactionId: "TXN-1234",
      type: "BOOKING",
      vendorId: "vendor-uuid",
      vendorName: "Payment Vendor",
      amount: 125.5,
      commission: 18.825,
      method: "Stripe",
      date: "2026-10-01T00:00:00Z",
      status: "SUCCEEDED",
      booking: null,
    },
  ],
  paymentMethods: {
    summary: { bankTransfers: 0, paypalAccounts: 0, stripeConnected: 1 },
    methods: [
      {
        id: "account-uuid",
        vendorId: "vendor-uuid",
        vendorName: "Account Vendor",
        type: "STRIPE_CONNECT",
        label: "Stripe Connected",
        isPrimary: true,
        isVerified: true,
        onboardingCompleted: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        disabledReason: null,
        updatedAt: "2026-10-01T00:00:00Z",
      },
    ],
  },
  ...overrides,
});

export const rewardsResponse = (overrides = {}) => ({
  generatedAt: "2026-10-27T00:00:00Z",
  summary: { pointsRedeemed: 100, creditsIssued: 1, activeUsers: 10, qrScansToday: 5 },
  paymentSummary: paymentsResponse().summary,
  tabs: { leaderboard: 1, redeemTransactions: 1, topUsers: 1 },
  tierCounts: { foodie: 0, explorer: 1, drop_hunter: 0, bitedrop_legend: 0 },
  leaderboard: [
    {
      rank: 1,
      vendorId: "vendor-uuid",
      foodTruckId: null,
      truckName: "Ranked Truck",
      ownerName: "Truck Owner",
      location: "Austin",
      pointsGiven: 500,
      bookings: 5,
      revenue: 1000,
      score: 500,
      metrics: { bookings: 5, reviews: 3, checkIns: 10, followers: 20 },
    },
  ],
  redeemTransactions: [
    {
      id: "redemption-uuid",
      transactionId: "RDM-1234",
      user: {
        id: "user-uuid",
        name: "Redeeming User",
        email: null,
        tier: {
          slug: "explorer",
          name: "Explorer",
          level: 2,
          requiredPoints: 500,
          nextTierPoints: 2000,
        },
      },
      truck: null,
      truckOwner: null,
      points: -100,
      credit: 1,
      minimumPurchaseAmount: null,
      fundingType: "VENDOR_FUNDED",
      date: "2026-10-01T00:00:00Z",
      status: "completed",
      rewardRule: null,
      code: null,
    },
  ],
  topUsers: [
    {
      rank: 1,
      userId: "user-uuid",
      name: "Top User",
      email: null,
      tier: {
        slug: "explorer",
        name: "Explorer",
        level: 2,
        requiredPoints: 500,
        nextTierPoints: 2000,
      },
      points: 500,
      availablePoints: 400,
      redeemedPoints: 100,
      transactions: 3,
      progressToLegendPercent: 5,
    },
  ],
  ...overrides,
});
