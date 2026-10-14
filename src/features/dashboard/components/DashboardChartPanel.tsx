import { ResponsiveAreaChart } from "@/components/charts/ResponsiveAreaChart";

const chartData = [
  { label: "Mon", value: 18 },
  { label: "Tue", value: 22 },
  { label: "Wed", value: 19 },
  { label: "Thu", value: 31 },
  { label: "Fri", value: 28 },
  { label: "Sat", value: 35 },
  { label: "Sun", value: 33 },
];

export function DashboardChartPanel() {
  return (
    <section className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--text)]">Activity trend</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Example responsive chart using Recharts.
        </p>
      </div>
      <ResponsiveAreaChart data={chartData} />
    </section>
  );
}
