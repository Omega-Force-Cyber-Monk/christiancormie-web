import { PageHeader } from "@/components/common/PageHeader";
import { DashboardChartPanel } from "@/features/dashboard/components/DashboardChartPanel";
import { StatisticsGrid } from "@/features/dashboard/components/StatisticsGrid";

type DashboardOverviewProps = {
  title: string;
  description: string;
};

export function DashboardOverview({ description, title }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <PageHeader description={description} title={title} />
      <StatisticsGrid />
      <DashboardChartPanel />
    </div>
  );
}
