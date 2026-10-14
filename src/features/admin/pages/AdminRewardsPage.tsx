import { Award, Gift, Ticket, Trophy } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { useGetAdminRewardsManagementQuery } from "@/features/admin/api/admin.api";
import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

const tabs = ["Leaderboard", "Redeem Transactions", "Top Users"];

export default function AdminRewardsPage() {
  const [activeTab, setActiveTab] = useState("Leaderboard");
  const { data, error, isError, isLoading, refetch } =
    useGetAdminRewardsManagementQuery();

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
    <AdminSection description="View and manage rewards." title="Rewards">
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
                  label: "Points Redeemed",
                  value: formatNumber(data.summary.pointsRedeemed),
                  icon: Gift,
                },
                {
                  label: "Credits Issued",
                  value: formatNumber(data.summary.creditsIssued),
                  icon: Award,
                },
                {
                  label: "Active Users",
                  value: formatNumber(data.summary.activeUsers),
                  icon: Trophy,
                },
                {
                  label: "QR Scans Today",
                  value: formatNumber(data.summary.qrScansToday),
                  icon: Ticket,
                },
              ]
            : []
        }
      />
      <AdminDataPanel
        description="Reward activity tabs from the source dashboard."
        title="Reward Activity"
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
          {activeTab === "Top Users" && data?.tierCounts ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(data.tierCounts).map(([tier, count]) => (
                <div key={tier}>
                  <dt className="text-[var(--text-muted)]">
                    {tier.replace(/_/g, " ")}
                  </dt>
                  <dd className="font-medium">{formatNumber(count)}</dd>
                </div>
              ))}
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
