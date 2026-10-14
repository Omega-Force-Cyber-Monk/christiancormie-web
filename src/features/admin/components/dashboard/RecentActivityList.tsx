import { AdminDashboardEmpty } from "@/features/admin/components/dashboard/AdminDashboardStates";

export type DashboardActivityItem = {
  id: string;
  name: string;
  action: string;
  details: string;
  time: string;
  badge?: "pending" | "review" | "open" | "investigating";
};

const getBadgeStyle = (badge?: DashboardActivityItem["badge"]) => {
  switch (badge) {
    case "pending":
      return "bg-[#FBBF24]/20 text-[#FBBF24]";
    case "review":
      return "bg-[#14B8A6]/20 text-[#14B8A6]";
    case "open":
      return "bg-[#FF6B4A]/20 text-[#FF5733]";
    case "investigating":
      return "bg-[#64748B]/20 text-[#90A1B9]";
    default:
      return "";
  }
};

type RecentActivityListProps = {
  data?: DashboardActivityItem[];
};

export function RecentActivityList({ data }: RecentActivityListProps) {
  const activities = data ?? [];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#1E293B]/40 p-6 font-inter transition-colors duration-200 hover:border-white/20">
      <div className="mb-2">
        <h2 className="text-lg font-semibold tracking-normal text-white">
          Recent Activity
        </h2>
      </div>

      <div className="divide-y divide-white/5">
        {activities.length === 0 ? (
          <AdminDashboardEmpty
            message="Recent activity will appear here when events are available."
            title="No recent activity found"
          />
        ) : (
          activities.map((activity) => (
            <div
              className="flex items-center justify-between py-3.5 first:pt-2 last:pb-1"
              key={activity.id}
            >
              <div className="flex min-w-0 items-center space-x-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B4A]/10 text-sm font-medium text-[#FF5733] select-none">
                  LP
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-baseline truncate">
                    <span className="text-sm leading-5 font-medium text-white">
                      {activity.name}
                    </span>
                    <span className="ml-1.5 text-sm leading-5 font-normal text-[#90A1B9]">
                      {activity.action}
                    </span>
                  </div>
                  <span className="mt-0.5 truncate text-xs leading-4 font-normal text-[#90A1B9]">
                    {activity.details}
                  </span>
                </div>
              </div>

              <div className="ml-4 flex shrink-0 items-center space-x-3">
                {activity.badge ? (
                  <span
                    className={`rounded-full px-3 py-0.5 text-xs leading-4 font-medium select-none ${getBadgeStyle(
                      activity.badge,
                    )}`}
                  >
                    {activity.badge}
                  </span>
                ) : null}
                <span className="min-w-[45px] text-right text-xs leading-4 font-normal text-[#90A1B9]">
                  {activity.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
