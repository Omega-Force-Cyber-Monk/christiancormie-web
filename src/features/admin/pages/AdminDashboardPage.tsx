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
  formatCurrency,
  formatNumber,
  formatPercentChange,
  formatRelativeTime,
} from "@/features/admin/utils/adminFormat";

export default function AdminDashboardPage() {
  const { data, isError, isLoading } = useGetAdminDashboardQuery();

  if (isLoading) {
    return <AdminDashboardLoading cards={8} charts={2} rows={5} />;
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
          amount: formatCurrency(data.cards.revenueThisMonth.value),
          change: formatPercentChange(data.cards.revenueThisMonth.changePercent),
          icon: dashboardCardIcons.revenueThisMonth,
        },
        {
          title: "Commission Earned",
          amount: formatCurrency(data.cards.commissionEarned.value),
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
          title: "Active Disputes",
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
    const [name, ...actionParts] = item.title.split(" ");

    return {
      id: item.id,
      name,
      action: actionParts.join(" ") || item.type.toLowerCase(),
      details: item.subtitle,
      time: formatRelativeTime(item.createdAt),
      badge: item.status ? ("review" as const) : undefined,
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
          <AdminDashboardError message="Unable to load dashboard data." />
        ) : null}

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
