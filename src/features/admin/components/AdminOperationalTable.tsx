import { DataTable } from "@/components/data-display/DataTable/DataTable";
import type { DataTableProps } from "@/components/data-display/DataTable/data-table.types";
import type { AdminOperationalRow } from "@/features/admin/utils/adminOperations";

export function AdminOperationalTable({
  rows,
  pagination,
  emptyMessage,
}: {
  rows: AdminOperationalRow[];
  pagination?: DataTableProps<AdminOperationalRow>["pagination"];
  emptyMessage: string;
}) {
  return (
    <DataTable
      columns={[
        { id: "id", header: "Record", accessor: (row) => row.displayId },
        { id: "name", header: "Name", accessor: (row) => row.name },
        { id: "detail", header: "Details", accessor: (row) => row.detail },
        { id: "value", header: "Value", accessor: (row) => row.value },
        { id: "status", header: "Status", accessor: (row) => row.status },
      ]}
      data={rows}
      getRowId={(row) => row.id}
      pagination={pagination}
      emptyMessage={emptyMessage}
    />
  );
}
