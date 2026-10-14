import { Skeleton } from "@/components/states/Skeleton";

type DataTableSkeletonProps = {
  columnCount: number;
};

export function DataTableSkeleton({ columnCount }: DataTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columnCount }).map((__, cellIndex) => (
            <td className="px-4 py-3" key={cellIndex}>
              <Skeleton className="h-5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
