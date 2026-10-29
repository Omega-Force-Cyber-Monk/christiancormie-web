import type {
  AdminPayoutDto,
  AdminTransactionDto,
  AdminPaymentMethodDto,
  AdminRevenueDto,
  AdminRewardLeaderboardDto,
  AdminRewardRedemptionDto,
  AdminRewardTopUserDto,
} from "./admin.dto";
import type {
  AdminUserDto,
  AdminBookingDto,
  AdminVendorDto,
  AdminCommunityPostDto,
  AdminReviewDto,
} from "./admin.dto";
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
  value: number | null;
  changePercent?: number | null;
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
    activeDisputes: Pick<ChangeCard, "value"> & { source: "review_reports" };
  };
  charts: {
    revenueTrend: Array<{ month: string; revenue: number | null }>;
    monthlyBookings: Array<{ month: string; bookings: number | null }>;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string | null;
    subtitle: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
};

export type AdminBookingsManagementResponse = {
  generatedAt: string;
  summary: {
    totalBookings: number;
    thisMonth: number;
    totalRevenue: number;
    disputed: number;
    disputedSource: "review_reports";
  };
  bookings: AdminBookingDto[];
};

export type AdminVendorsManagementResponse = {
  summary: {
    totalVendors: number;
    active: number;
    pendingApproval: number;
    suspended: number;
  };
  tabs?: Record<string, number> | null;
  vendors: AdminVendorDto[];
};

export type AdminUsersManagementResponse = {
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeThisMonth: number;
    newThisWeek: number;
    suspended: number;
  };
  users: AdminUserDto[];
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
  posts: AdminCommunityPostDto[];
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
  reviews: AdminReviewDto[];
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
  payoutRequests: AdminPayoutDto[];
  revenueOverview: AdminRevenueDto;
  transactions: AdminTransactionDto[];
  paymentMethods: {
    summary: { bankTransfers: number; paypalAccounts: number; stripeConnected: number };
    methods: AdminPaymentMethodDto[];
  };
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
  leaderboard: AdminRewardLeaderboardDto[];
  redeemTransactions: AdminRewardRedemptionDto[];
  topUsers: AdminRewardTopUserDto[];
  schemaGaps?: Record<string, string>;
};
