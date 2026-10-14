import { Skeleton } from "@/components/states/Skeleton";

type AdminDashboardLoadingProps = {
  cards?: number;
  charts?: number;
  rows?: number;
};

export function AdminDashboardLoading({
  cards = 4,
  charts = 0,
  rows = 5,
}: AdminDashboardLoadingProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton
            className="h-32 rounded-2xl bg-[#1E293B]/70"
            key={`card-${index}`}
          />
        ))}
      </div>

      {charts > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: charts }).map((_, index) => (
            <Skeleton
              className="h-[402px] rounded-2xl bg-[#1E293B]/70"
              key={`chart-${index}`}
            />
          ))}
        </div>
      ) : null}

      <Skeleton className="h-11 w-80 rounded-xl bg-[#1E293B]/70" />
      <div className="space-y-3 rounded-2xl border border-[#2e3443] bg-[#171e30] p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton className="h-14 rounded-xl bg-[#263044]" key={`row-${index}`} />
        ))}
      </div>
    </div>
  );
}

type AdminDashboardEmptyProps = {
  title?: string;
  message?: string;
};

export function AdminDashboardEmpty({
  title = "No data found",
  message = "There is no data available for this section right now.",
}: AdminDashboardEmptyProps) {
  return (
    <div className="rounded-2xl border border-[#2e3443] bg-[#171e30] px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-[#8091a7]">{message}</p>
    </div>
  );
}

export function AdminDashboardError({
  message = "Unable to load data. Please try again.",
}: {
  message?: string;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-4 text-sm text-red-100">
      {message}
    </div>
  );
}
