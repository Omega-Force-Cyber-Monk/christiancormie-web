import { Activity, Clock, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/features/dashboard/components/StatisticsCard";

export default function VendorStaffDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Your staff workspace. Statistics and task management are unavailable."
        title="Staff dashboard"
      />
      <section
        aria-label="Staff statistics unavailable"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <StatisticsCard icon={Activity} label="Active workflows" value="Unavailable" />
        <StatisticsCard icon={Clock} label="Pending reviews" value="Unavailable" />
        <StatisticsCard icon={TrendingUp} label="Monthly trend" value="Unavailable" />
      </section>
      <section className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--text)]">Activity trend</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Staff activity statistics are unavailable.
        </p>
      </section>
    </div>
  );
}
