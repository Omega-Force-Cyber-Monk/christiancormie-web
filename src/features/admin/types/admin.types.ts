export type AdminListQuery = {
  search?: string;
  status?: string;
  category?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "status";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type ChangeCard = {
  value: number;
  changePercent?: number;
};

export type AdminDashboardResponse = {
  generatedAt: string;
  cards: {
    totalUsers: ChangeCard;
    activeVendors: ChangeCard;
    liveDrops: Pick<ChangeCard, "value">;
    monthlyBookings: ChangeCard;
    revenueThisMonth: ChangeCard;
    commissionEarned: ChangeCard;
    pendingPayouts: Pick<ChangeCard, "value">;
    activeDisputes: Pick<ChangeCard, "value">;
  };
  charts: {
    revenueTrend: Array<{ month: string; revenue: number }>;
    monthlyBookings: Array<{ month: string; bookings: number }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    status: string;
    createdAt: string;
  }>;
};

export type AdminBookingsManagementResponse = {
  generatedAt: string;
  summary: {
    totalBookings: number;
    thisMonth: number;
    totalRevenue: number;
    pendingPaymentRelease: number;
    disputed: number;
  };
  bookings: Array<{
    id: string;
    bookingNumber: string;
    customer: { id: string; name: string; email: string; phone?: string };
    vendor: { id: string; name: string; email: string; phone?: string };
    event: { title: string; type: string; date: string; location: string };
    payment: {
      paymentModel: string;
      pricingModel: string;
      totalAmount: number;
      commissionAmount: number;
      vendorPayout: number;
      fundsStatus: string;
    };
    status: string;
    actions?: { canViewDetails?: boolean };
  }>;
};

export type AdminVendorsManagementResponse = {
  generatedAt: string;
  summary: {
    totalVendors: number;
    active: number;
    pendingApproval: number;
    suspended: number;
  };
  tabs?: Record<string, number> | null;
  vendors?: Array<{
    id: string;
    vendorDisplayId: string;
    businessName: string;
    ownerName: string;
    email: string;
    phone: string;
    cuisineType: string;
    serviceArea: string;
    rating: number;
    reviews: number;
    followers: number;
    totalBookings: number;
    revenueGenerated: number;
    status: string;
    isVerified: boolean;
    badges: unknown[];
    documents: unknown[];
  }> | null;
  truckRequests?: Array<{
    id: string;
    requestDisplayId: string;
    truckName: string;
    usualLocation: string;
    phone?: string;
    description: string;
    reason?: string;
    status: string;
    requester: { id: string; name: string; email: string };
  }> | null;
};

export type AdminUsersManagementResponse = {
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeThisMonth: number;
    newThisWeek: number;
    suspended: number;
  };
  users: Array<{
    id: string;
    userDisplayId: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    joinDate: string;
    activity?: { bookings: number; referrals: number } | null;
    loyalty?: {
      availablePoints: number;
      lifetimePoints: number;
      redeemedPoints: number;
    } | null;
    status: string;
    actions: { canView: boolean; canSuspend: boolean; canRetrieve: boolean };
  }>;
};

export type AdminCommunityManagementResponse = {
  generatedAt: string;
  summary: {
    totalPosts: number;
    today: number;
    reported: number;
    removedToday: number;
  };
  tabs: Record<string, number>;
  posts: Array<{
    id: string;
    postDisplayId: string;
    author: { id: string; name: string; email: string };
    category: string;
    type: string;
    content: string;
    media: unknown[];
    likes: number;
    commentsCount: number;
    status: string;
    reported: boolean;
    reports: Array<{ reason?: string }>;
    comments: Array<{
      id: string;
      author: { name: string };
      content: string;
      createdAt: string;
    }>;
  }>;
};

export type AdminReviewsManagementResponse = {
  generatedAt: string;
  summary: {
    totalReviews: number;
    averageRating: number;
    reported: number;
    removedThisWeek: number;
  };
  tabs: Record<string, number>;
  reviews: Array<{
    id: string;
    reviewDisplayId: string;
    source: string;
    customer: { id: string; name: string };
    vendor: { id: string; name: string };
    foodTruck?: { id: string; name: string };
    booking?: { id: string; bookingNumber: string };
    rating: number;
    content: string;
    isVerified: boolean;
    status: string;
    reported: boolean;
    reportReason?: string;
  }>;
};

export type AdminPaymentsManagementResponse = {
  generatedAt: string;
  summary: {
    pendingPayouts: number;
    totalAmount: number;
    revenueThisMonth: number;
    commissionEarned: number;
  };
  tabs: Record<string, number | boolean>;
  payoutRequests: unknown[];
  revenueOverview: unknown;
  transactions: unknown[];
  paymentMethods: unknown[];
  schemaGaps?: Record<string, string>;
};

export type AdminRewardsManagementResponse = {
  generatedAt: string;
  summary: {
    pointsRedeemed: number;
    creditsIssued: number;
    activeUsers: number;
    qrScansToday: number;
  };
  paymentSummary: AdminPaymentsManagementResponse["summary"];
  tabs: Record<string, number>;
  tierCounts: Record<string, number>;
  leaderboard: unknown[];
  redeemTransactions: unknown[];
  topUsers: unknown[];
  schemaGaps?: Record<string, string>;
};
