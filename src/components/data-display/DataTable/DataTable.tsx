import { DataTableBody } from "@/components/data-display/DataTable/DataTableBody";
import { DataTableHeader } from "@/components/data-display/DataTable/DataTableHeader";
import { DataTablePagination } from "@/components/data-display/DataTable/DataTablePagination";
import { DataTableToolbar } from "@/components/data-display/DataTable/DataTableToolbar";
import type { DataTableProps } from "@/components/data-display/DataTable/data-table.types";

export function DataTable<TRow, TSortKey extends string = string>({
  columns,
  data,
  emptyMessage,
  error,
  getRowId,
  isLoading = false,
  onRetry,
  onSortChange,
  pagination,
  rowActions,
  search,
  sort,
  variant = "default",
}: DataTableProps<TRow, TSortKey>) {
  const isLegacyAdminBookings = variant === "legacyAdminBookings";

  return (
    <section
      className={
        isLegacyAdminBookings
          ? "min-w-0 overflow-hidden rounded-xl border border-[#2e3443] bg-[#171e30] shadow-xl"
          : "min-w-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-sm"
      }
    >
      <DataTableToolbar search={search} variant={variant} />
      <div className="overflow-x-auto">
        <table
          className={
            isLegacyAdminBookings
              ? "w-full min-w-[1000px] text-left text-sm text-slate-200"
              : "min-w-full divide-y divide-[var(--border)]"
          }
        >
          <DataTableHeader
            columns={columns}
            hasRowActions={Boolean(rowActions)}
            onSortChange={onSortChange}
            sort={sort}
            variant={variant}
          />
          <DataTableBody
            columns={columns}
            data={data}
            emptyMessage={emptyMessage}
            error={error}
            getRowId={getRowId}
            isLoading={isLoading}
            onRetry={onRetry}
            rowActions={rowActions}
            variant={variant}
          />
        </table>
      </div>
      {pagination ? <DataTablePagination {...pagination} variant={variant} /> : null}
    </section>
  );
}
