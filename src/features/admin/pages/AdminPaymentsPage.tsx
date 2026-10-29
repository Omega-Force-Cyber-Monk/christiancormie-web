import { AdminOperationalTable } from "@/features/admin/components/AdminOperationalTable";
import { adminPage, useAdminList } from "@/features/admin/utils/adminList";
import { paymentRows } from "@/features/admin/utils/adminOperations";
import { AlertCircle, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { useGetAdminPaymentsManagementQuery } from "@/features/admin/api/admin.api";
import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { bookingMoney } from "@/features/admin/utils/adminBookings";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

const tabs = [
  "Payout Requests",
  "Revenue Overview",
  "Transaction History",
  "Payment Methods",
];

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState("Payout Requests");
  const list = useAdminList(10, activeTab);
  const paged = activeTab === "Payout Requests";
  const {
    currentData: data,
    error,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminPaymentsManagementQuery(paged ? list.query : { limit: 100 });
  const allRows = paymentRows(activeTab, data);
  const result = paged
    ? adminPage(allRows, list.pageSize)
    : { rows: allRows, hasNextPage: false };

  if (isLoading) return <AdminLoading />;
  if (isError && !data) {
    return (
      <ErrorState
        error={normalizeApiError(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <AdminSection
      description="Manage vendor payouts and platform revenue."
      title="Payments & Payouts"
    >
      {isError ? (
        <ErrorState
          error={normalizeApiError(error)}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}
      <AdminStatGrid
        stats={
          data
            ? [
                {
                  label: "Pending Payouts",
                  value: formatNumber(data.summary.pendingPayouts),
                  icon: AlertCircle,
                },
                {
                  label: "Total Amount",
                  value: bookingMoney(data.summary.totalAmount),
                  icon: DollarSign,
                },
                {
                  label: "Revenue This Month",
                  value: bookingMoney(data.summary.revenueThisMonth),
                  icon: TrendingUp,
                },
                {
                  label: "Commission Earned",
                  value: bookingMoney(data.summary.commissionEarned),
                  icon: Wallet,
                },
              ]
            : []
        }
      />
      <AdminDataPanel
        description="Operational payment tabs from the source dashboard."
        title="Payout Operations"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                variant={activeTab === tab ? "primary" : "secondary"}
              >
                {tab}
              </Button>
            ))}
          </div>
          {isFetching && !data ? (
            <AdminLoading cards={0} />
          ) : (
            <AdminOperationalTable
              rows={result.rows}
              emptyMessage={`No ${activeTab.toLowerCase()} found`}
              pagination={
                paged
                  ? { ...list.pagination, hasNextPage: result.hasNextPage, isFetching }
                  : undefined
              }
            />
          )}
          {!paged && activeTab === "Transaction History" ? (
            <p className="text-sm text-[var(--text-muted)]">
              Showing up to 100 returned transactions.
            </p>
          ) : null}
        </div>
      </AdminDataPanel>
    </AdminSection>
  );
}
