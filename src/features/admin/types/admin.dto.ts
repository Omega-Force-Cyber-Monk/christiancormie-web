export type AdminUserDto = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  joinDate: string;
  memberSince: string;
  lastLoginAt: string | null;
  activity: { totalBookings: number; referrals: number };
  totalBookings: number;
  referrals: number;
  loyaltyPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  status: string;
  roles: string[];
  canSuspend: boolean;
  canRetrieve: boolean;
};

export type AdminBookingDto = {
  id: string;
  bookingNumber: string;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  vendor: {
    id: string;
    businessName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  event: {
    name: string | null;
    type: string;
    bookingType: string;
    startsAt: string | null;
    endsAt: string | null;
    guestCount: number | null;
    address: string | null;
  } | null;
  amount: number;
  fees: {
    subtotal: number;
    serviceFee: number;
    taxAmount: number;
    discountAmount: number;
  };
  paymentModel: string | null;
  pricingModel: string | null;
  status: string;
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string | null;
    createdAt: string;
    commission: {
      grossAmount: number;
      commissionRate: number;
      commissionAmount: number;
      vendorNetAmount: number;
    } | null;
    refunds: Array<{ id: string; amount: number }>;
  } | null;
  dispute: { isDisputed: boolean; reports: unknown[]; source: "review_reports" };
  createdAt: string;
};

export type AdminVendorDto = {
  id: string;
  businessName: string;
  status: string;
  isVerified: boolean;
  ownerName: string;
  email: string | null;
  phone: string | null;
  cuisine: string | null;
  cuisines: string[];
  rating: number;
  reviews: number;
  followers: number;
  totalBookings: number;
  revenueGenerated: number;
  description: string | null;
  serviceArea: string | null;
  menuItems: string[];
  priceRange: string | null;
  memberSince: string;
  primaryTruck: unknown;
  foodTrucks: unknown[];
  verificationRequests: Array<{
    id: string;
    status: string;
    createdAt: string;
    documents: unknown;
  }>;
  documents: unknown;
  badges: unknown[];
  photoShootRequests: unknown[];
};
export type AdminTruckRequestDto = {
  id: string;
  requestedById: string | null;
  truckName: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  socialUrl: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  status: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedBy: {
    id: string;
    email: string | null;
    phone: string | null;
    profile: {
      displayName?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } | null;
  } | null;
  reviewedBy: unknown;
};

export type AdminCommunityPostDto = {
  id: string;
  postId: string;
  title: string | null;
  content: string | null;
  author: { id: string; userId: string; name: string; email: string | null } | null;
  category: string;
  type: string;
  status: string;
  visibility: string;
  likes: number;
  commentsCount: number;
  media: unknown[];
  imageUrls: string[];
  isReported: boolean;
  reportReason: string | null;
  reportStatus: string | null;
  reports: Array<{ id: string; reason: string; status: string }>;
  comments: Array<{
    id: string;
    author: { name: string };
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  deletedAt: string | null;
  moderation: { canRemove: boolean; canContactAuthor: boolean };
};
export type AdminReviewDto = {
  id: string;
  reviewId: string;
  source: string;
  sourceLabel: string;
  title: string | null;
  customer: { id: string; name: string; email: string | null } | null;
  vendor: { id: string; businessName: string } | null;
  foodTruck: { id: string; name: string } | null;
  booking: { id: string; bookingNumber: string } | null;
  rating: number;
  content: string | null;
  visibleContent: string | null;
  isVerified: boolean;
  status: string;
  isReported: boolean;
  contentHidden: boolean;
  ratingVisible: boolean;
  reportReason: string | null;
  reportDescription: string | null;
  reportStatus: string | null;
  reports: unknown[];
  moderationReason: string | null;
  createdAt: string;
  moderatedAt: string | null;
  actions: {
    canRemoveCompletely: boolean;
    canHideTextOnly: boolean;
    canKeepReview: boolean;
  };
};

export type AdminPayoutDto = {
  id: string;
  payoutId: string;
  vendorId: string;
  vendorName: string | null;
  ownerName: string;
  ownerEmail: string | null;
  amount: number;
  currency: string;
  completedBookings: number;
  payoutMethod: { type: string; label: string };
  requestedAt: string;
  status: string;
  failureReason: string | null;
  paidAt: string | null;
  actions: { canApprove: boolean; canReject: boolean; canHold: boolean };
};
export type AdminTransactionDto = {
  id: string;
  transactionId: string;
  type: string;
  vendorId: string | null;
  vendorName: string | null;
  amount: number;
  commission: number;
  method: string;
  date: string;
  status: string;
  booking: { id: string; bookingNumber: string } | null;
};
export type AdminPaymentMethodDto = {
  id: string;
  vendorId: string;
  vendorName: string | null;
  type: string;
  label: string;
  isPrimary: boolean;
  isVerified: boolean;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  disabledReason: string | null;
  updatedAt: string;
};
export type AdminRevenueDto = {
  summary: {
    totalRevenueYtd: number;
    platformCommissionYtd: number;
    vendorPayoutsYtd: number;
  };
  monthlyRevenueBreakdown: Array<{
    month: string;
    monthIndex: number;
    revenue: number;
    commission: number;
    payouts: number;
  }>;
  commissionVsPayouts: Array<{ month: string; commission: number; payouts: number }>;
};
export type AdminRewardLeaderboardDto = {
  rank: number;
  vendorId: string | null;
  foodTruckId: string | null;
  truckName: string | null;
  ownerName: string;
  location: string | null;
  pointsGiven: number;
  bookings: number;
  revenue: number;
  score: number;
  metrics: { bookings: number; reviews: number; checkIns: number; followers: number };
};
export type AdminRewardTierDto = {
  slug: string;
  name: string;
  level: number;
  requiredPoints: number;
  nextTierPoints: number | null;
};
export type AdminRewardRedemptionDto = {
  id: string;
  transactionId: string;
  user: { id: string; name: string; email: string | null; tier: AdminRewardTierDto };
  truck: { id: string; name: string | null } | null;
  truckOwner: { id: string; name: string; businessName: string } | null;
  points: number;
  credit: number;
  minimumPurchaseAmount: number | null;
  fundingType: string;
  date: string;
  status: string;
  rewardRule: unknown;
  code: string | null;
};
export type AdminRewardTopUserDto = {
  rank: number;
  userId: string;
  name: string;
  email: string | null;
  tier: AdminRewardTierDto;
  points: number;
  availablePoints: number;
  redeemedPoints: number;
  transactions: number;
  progressToLegendPercent: number;
};
