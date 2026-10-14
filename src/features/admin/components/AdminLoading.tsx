import { Skeleton } from "@/components/states/Skeleton";

type AdminLoadingProps = {
  cards?: number;
  rows?: number;
};

export function AdminLoading({ cards = 4, rows = 5 }: AdminLoadingProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
      <Skeleton className="h-72" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton className="h-14" key={index} />
      ))}
    </div>
  );
}
