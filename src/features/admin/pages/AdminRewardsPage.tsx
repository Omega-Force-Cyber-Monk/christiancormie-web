import { AdminOperationalTable } from "@/features/admin/components/AdminOperationalTable";
import { adminPage, useAdminList } from "@/features/admin/utils/adminList";
import { rewardRows } from "@/features/admin/utils/adminOperations";
import { Award, Gift, Ticket, Trophy } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { useGetAdminRewardsManagementQuery } from "@/features/admin/api/admin.api";
import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import type { AdminRewardsManagementResponse } from "@/features/admin/types/admin.types";

const tabs = ["Leaderboard", "Redeem Transactions", "Top Users"];

export function ReturnedUserTiers({ data }: { data: AdminRewardsManagementResponse }) {
  return (
    <section aria-label="Tier counts for returned top users">
      <p className="text-sm text-[var(--text-muted)]">
        Tier counts cover the returned top users, not all platform members.
      </p>
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(data.tierCounts).map(([tier, count]) => (
          <div key={tier}>
            <dt className="text-[var(--text-muted)]">
              {data.topUsers.find((user) => user.tier?.slug === tier)?.tier?.name ??
                tier.replace(/_/g, " ")}
            </dt>
            <dd className="font-medium">{formatNumber(count)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function AdminRewardsPage() {
  const [activeTab, setActiveTab] = useState("Leaderboard");
  const list = useAdminList(10, activeTab);
  const paged = activeTab === "Redeem Transactions";
  const {
    currentData: data,
    error,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminRewardsManagementQuery(paged ? list.query : { limit: 100 });
  const allRows = rewardRows(activeTab, data);
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
            <ReturnedUserTiers data={data} />
          ) : null}
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
          {!paged ? (
            <p className="text-sm text-[var(--text-muted)]">
              Showing up to 100 returned records.
            </p>
          ) : null}
        </div>
      </AdminDataPanel>
    </AdminSection>
  );
}
