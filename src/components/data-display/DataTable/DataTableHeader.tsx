import type {
  DataTableColumn,
  SortState,
} from "@/components/data-display/DataTable/data-table.types";

type DataTableHeaderProps<TRow, TSortKey extends string> = {
  columns: DataTableColumn<TRow, TSortKey>[];
  hasRowActions: boolean;
  sort?: SortState<TSortKey> | null;
  onSortChange?: (sort: SortState<TSortKey>) => void;
  variant?: "default" | "legacyAdminBookings";
};

export function DataTableHeader<TRow, TSortKey extends string>({
  columns,
  hasRowActions,
  onSortChange,
  sort,
  variant = "default",
}: DataTableHeaderProps<TRow, TSortKey>) {
  const isLegacyAdminBookings = variant === "legacyAdminBookings";

  return (
    <thead className={isLegacyAdminBookings ? "" : "bg-[var(--surface-muted)]"}>
      <tr
        className={
          isLegacyAdminBookings
            ? "border-b border-[#1e2638] text-xs font-medium whitespace-nowrap text-[#8091a7]"
            : ""
        }
      >
        {columns.map((column) => {
          const isSorted = sort?.key === column.sortKey;
          const nextDirection = isSorted && sort?.direction === "asc" ? "desc" : "asc";

          return (
            <th
              className={
                isLegacyAdminBookings
                  ? `px-6 py-5 text-left whitespace-nowrap ${column.className ?? ""}`
                  : `px-4 py-3 text-left text-xs font-semibold uppercase tracking-normal text-[var(--text-muted)] ${column.className ?? ""}`
              }
              key={column.id}
              scope="col"
            >
              {column.sortKey && onSortChange ? (
                <button
                  className="inline-flex items-center gap-2 rounded-sm text-left hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  onClick={() =>
                    onSortChange({
                      key: column.sortKey as TSortKey,
                      direction: nextDirection,
                    })
                  }
                  type="button"
                >
                  {column.header}
                  <span aria-hidden="true">
                    {isSorted && sort ? sort.direction : "sort"}
                  </span>
                </button>
              ) : (
                column.header
              )}
            </th>
          );
        })}
        {hasRowActions ? (
          <th
            className={
              isLegacyAdminBookings
                ? "px-6 py-5 text-center whitespace-nowrap"
                : "px-4 py-3 text-right text-xs font-semibold uppercase tracking-normal text-[var(--text-muted)]"
            }
          >
            Actions
          </th>
        ) : null}
      </tr>
    </thead>
  );
}
