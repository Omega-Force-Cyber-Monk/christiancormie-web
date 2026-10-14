import { Activity, Clock, TrendingUp } from "lucide-react";

import { StatisticsCard } from "@/features/dashboard/components/StatisticsCard";

const statistics = [
  { label: "Active workflows", value: "24", icon: Activity },
  { label: "Pending reviews", value: "8", icon: Clock },
  { label: "Monthly trend", value: "+12%", icon: TrendingUp },
];

export function StatisticsGrid() {
  return (
    <section
      aria-label="Dashboard statistics"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {statistics.map((item) => (
        <StatisticsCard
          icon={item.icon}
          key={item.label}
          label={item.label}
          value={item.value}
        />
      ))}
    </section>
  );
}
