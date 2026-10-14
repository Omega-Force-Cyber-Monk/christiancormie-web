import { DataTableEmpty } from "@/components/data-display/DataTable/DataTableEmpty";
import { DataTableSkeleton } from "@/components/data-display/DataTable/DataTableSkeleton";
import type {
  DataTableColumn,
  DataTableProps,
} from "@/components/data-display/DataTable/data-table.types";
import { ErrorState } from "@/components/states/ErrorState";

type DataTableBodyProps<TRow, TSortKey extends string> = Pick<
  DataTableProps<TRow, TSortKey>,
  | "data"
  | "emptyMessage"
  | "error"
  | "getRowId"
  | "isLoading"
  | "onRetry"
  | "rowActions"
  | "variant"
> & {
  columns: DataTableColumn<TRow, TSortKey>[];
};

export function DataTableBody<TRow, TSortKey extends string>({
  columns,
  data,
  emptyMessage = "No data available.",
  error,
  getRowId,
  isLoading,
  onRetry,
  rowActions,
  variant = "default",
}: DataTableBodyProps<TRow, TSortKey>) {
  const colSpan = columns.length + (rowActions ? 1 : 0);
  const isContrast = variant === "contrast";

  if (error) {
    return (
      <tbody>
        <tr>
          <td className="px-4 py-6" colSpan={colSpan}>
            <ErrorState error={error} onRetry={onRetry} />
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody
      className={
        isContrast ? "divide-y divide-[#1c2436]" : "divide-y divide-[var(--border)]"
      }
    >
      {isLoading ? <DataTableSkeleton columnCount={colSpan} /> : null}
      {!isLoading && data.length === 0 ? (
        isContrast ? (
          <tr>
            <td className="py-10 text-center text-sm text-[#64748b]" colSpan={colSpan}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          <DataTableEmpty colSpan={colSpan} message={emptyMessage} />
        )
      ) : null}
      {!isLoading
        ? data.map((row) => (
            <tr
              className={
                isContrast
                  ? "whitespace-nowrap transition-colors hover:bg-[#182032]/40"
                  : "hover:bg-[var(--surface-muted)]"
              }
              key={getRowId(row)}
            >
              {columns.map((column) => (
                <td
                  className={
                    isContrast
                      ? `px-6 py-5 text-sm whitespace-nowrap text-slate-200 ${column.className ?? ""}`
                      : `px-4 py-3 text-sm text-[var(--text)] ${column.className ?? ""}`
                  }
                  key={column.id}
                >
                  {column.accessor(row)}
                </td>
              ))}
              {rowActions ? (
                <td
                  className={
                    isContrast
                      ? "px-6 py-5 text-center whitespace-nowrap"
                      : "px-4 py-3 text-right"
                  }
                >
                  {rowActions(row)}
                </td>
              ) : null}
            </tr>
          ))
        : null}
    </tbody>
  );
}
