import { AdminDashboardEmpty } from "@/features/admin/components/dashboard/AdminDashboardStates";

type DashboardBadge = {
  text: string;
  type: "live" | "action" | "review";
};

export type DashboardMetricCard = {
  title: string;
  amount: string;
  change?: string;
  badge?: DashboardBadge;
  icon: string;
};

const getBadgeStyles = (type: DashboardBadge["type"]) => {
  switch (type) {
    case "live":
      return "bg-[#10B981]/20 text-[#47CD89]";
    case "action":
      return "bg-[#FBBF24]/20 text-[#FBBF24]";
    case "review":
      return "bg-[#FF6B4A]/20 text-[#FF5733]";
  }
};

type DashboardMetricsGridProps = {
  data?: DashboardMetricCard[];
};

export function DashboardMetricsGrid({ data }: DashboardMetricsGridProps) {
  const cards = data ?? [];

  if (cards.length === 0) {
    return (
      <AdminDashboardEmpty
        message="Dashboard overview metrics are not available yet."
        title="No dashboard metrics found"
      />
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-6 font-inter sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          className="flex min-h-[178px] w-full flex-col justify-between rounded-2xl border border-white/10 bg-[#1E293B]/40 p-6 transition-colors duration-200 hover:border-white/20"
          key={card.title}
        >
          <div className="flex w-full items-start justify-between">
            <img alt={card.title} className="size-12 select-none" src={card.icon} />

            {card.badge ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium leading-4 select-none ${getBadgeStyles(
                  card.badge.type,
                )}`}
              >
                {card.badge.text}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col justify-end">
            <p className="text-sm leading-5 font-medium text-[#90A1B9]">{card.title}</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[30px] leading-9 font-semibold tracking-normal text-white">
                {card.amount}
              </span>
              {card.change ? (
                <span className="text-sm leading-5 font-medium text-[#47CD89]">
                  {card.change}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
