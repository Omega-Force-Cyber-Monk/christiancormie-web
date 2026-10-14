import { AlertCircle, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { useGetAdminPaymentsManagementQuery } from "@/features/admin/api/admin.api";
import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { formatCurrency, formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

const tabs = [
  "Payout Requests",
  "Revenue Overview",
  "Transaction History",
  "Payment Methods",
];

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState("Payout Requests");
  const { data, error, isError, isLoading, refetch } =
    useGetAdminPaymentsManagementQuery();

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
                  value: formatCurrency(data.summary.totalAmount),
                  icon: DollarSign,
                },
                {
                  label: "Revenue This Month",
                  value: formatCurrency(data.summary.revenueThisMonth),
                  icon: TrendingUp,
                },
                {
                  label: "Commission Earned",
                  value: formatCurrency(data.summary.commissionEarned),
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
          {activeTab === "Revenue Overview" ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--text-muted)]">Revenue This Month</dt>
                <dd className="font-medium">
                  {formatCurrency(data?.summary.revenueThisMonth)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Commission Earned</dt>
                <dd className="font-medium">
                  {formatCurrency(data?.summary.commissionEarned)}
                </dd>
              </div>
            </dl>
          ) : (
            <EmptyState
              title={`No ${activeTab.toLowerCase()} found`}
              description="The source dashboard defined this tab UI with local empty data; no additional backend row contract was available to migrate."
            />
          )}
        </div>
      </AdminDataPanel>
    </AdminSection>
  );
}
