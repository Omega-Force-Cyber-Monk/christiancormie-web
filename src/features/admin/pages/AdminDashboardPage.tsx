import { PageHeader } from "@/components/common/PageHeader";
import {
  AdminDashboardError,
  AdminDashboardLoading,
} from "@/features/admin/components/dashboard/AdminDashboardStates";
import {
  MonthlyBookingsChart,
  RevenueTrendChart,
} from "@/features/admin/components/dashboard/DashboardCharts";
import { DashboardMetricsGrid } from "@/features/admin/components/dashboard/DashboardMetricsGrid";
import { RecentActivityList } from "@/features/admin/components/dashboard/RecentActivityList";
import { dashboardCardIcons } from "@/features/admin/components/dashboard/dashboardCardIcons";
import { useGetAdminDashboardQuery } from "@/features/admin/api/admin.api";
import {
  formatNumber,
  formatPercentChange,
  formatRelativeTime,
} from "@/features/admin/utils/adminFormat";
import { bookingMoney } from "@/features/admin/utils/adminBookings";

export default function AdminDashboardPage() {
  const {
    currentData: data,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminDashboardQuery();

  if (isLoading) {
    return <AdminDashboardLoading cards={8} charts={2} rows={5} />;
  }
  if (isError && !data) {
    return (
      <AdminDashboardError
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  const cards = data
    ? [
        {
          title: "Total Users",
          amount: formatNumber(data.cards.totalUsers.value),
          change: formatPercentChange(data.cards.totalUsers.changePercent),
          icon: dashboardCardIcons.totalUsers,
        },
        {
          title: "Active Vendors",
          amount: formatNumber(data.cards.activeVendors.value),
          change: formatPercentChange(data.cards.activeVendors.changePercent),
          icon: dashboardCardIcons.activeVendors,
        },
        {
          title: "Live Drops",
          amount: formatNumber(data.cards.liveDrops.value),
          badge: { text: "Live Now" as const, type: "live" as const },
          icon: dashboardCardIcons.liveDrops,
        },
        {
          title: "Monthly Bookings",
          amount: formatNumber(data.cards.monthlyBookings.value),
          change: formatPercentChange(data.cards.monthlyBookings.changePercent),
          icon: dashboardCardIcons.monthlyBookings,
        },
        {
          title: "Revenue This Month",
          amount: bookingMoney(data.cards.revenueThisMonth.value),
          change: formatPercentChange(data.cards.revenueThisMonth.changePercent),
          icon: dashboardCardIcons.revenueThisMonth,
        },
        {
          title: "Commission Earned",
          amount: bookingMoney(data.cards.commissionEarned.value),
          change: formatPercentChange(data.cards.commissionEarned.changePercent),
          icon: dashboardCardIcons.commissionEarned,
        },
        {
          title: "Pending Payouts",
          amount: formatNumber(data.cards.pendingPayouts.value),
          badge: { text: "Action Required" as const, type: "action" as const },
          icon: dashboardCardIcons.pendingPayouts,
        },
        {
          title: "Active Review Reports",
          amount: formatNumber(data.cards.activeDisputes.value),
          badge: { text: "Needs Review" as const, type: "review" as const },
          icon: dashboardCardIcons.activeDisputes,
        },
      ]
    : undefined;

  const revenueTrend = data?.charts.revenueTrend.map((item) => ({
    name: item.month,
    revenue: item.revenue,
  }));

  const monthlyBookings = data?.charts.monthlyBookings.map((item) => ({
    name: item.month,
    bookings: item.bookings,
  }));

  const recentActivity = data?.recentActivity.map((item) => {
    return {
      id: `${item.type}:${item.id}`,
      title: item.title ?? "Activity",
      details: item.subtitle,
      time: formatRelativeTime(item.createdAt),
      status: item.status,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        description="Monitor platform activity and key metrics"
        title="Dashboard Overview"
      />

      <div className="space-y-6">
        {isError ? (
          <AdminDashboardError
            message="Unable to refresh dashboard data. Previously loaded data is shown."
            onRetry={() => {
              void refetch();
            }}
          />
        ) : null}
        {isFetching && data && <p role="status">Refreshing dashboard…</p>}
        <p className="text-sm text-[var(--text-muted)]">
          Currency is not provided for dashboard revenue, commission or activity
          amounts. Activity descriptions use the backend-provided text.
        </p>

        <section aria-label="Dashboard Metrics">
          <DashboardMetricsGrid data={cards} />
        </section>

        <section
          aria-label="Platform Analytics"
          className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
          <RevenueTrendChart data={revenueTrend} />
          <MonthlyBookingsChart data={monthlyBookings} />
        </section>

        <section aria-label="Recent Activity Table">
          <RecentActivityList data={recentActivity} />
        </section>
      </div>
    </div>
  );
}
