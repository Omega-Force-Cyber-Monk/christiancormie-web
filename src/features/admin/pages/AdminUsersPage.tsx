import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-display/DataTable/DataTable";
import { getPagination } from "@/components/data-display/DataTable/pagination";
import type { DataTableColumn } from "@/components/data-display/DataTable/data-table.types";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ModalBody } from "@/components/overlays/Modal/ModalBody";
import { ModalFooter } from "@/components/overlays/Modal/ModalFooter";
import { ModalHeader } from "@/components/overlays/Modal/ModalHeader";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import {
  useGetAdminUsersManagementQuery,
  useRetrieveAdminUserMutation,
  useSuspendAdminUserMutation,
} from "@/features/admin/api/admin.api";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { AdminStatGrid } from "@/features/admin/components/AdminStatGrid";
import { AdminStatusBadge } from "@/features/admin/components/AdminStatusBadge";
import type { AdminUsersManagementResponse } from "@/features/admin/types/admin.types";
import {
  formatDate,
  formatNumber,
  getInitials,
} from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

type AdminUser = AdminUsersManagementResponse["users"][number];

const columns: DataTableColumn<AdminUser>[] = [
  {
    id: "user",
    header: "User",
    accessor: (row) => (
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-[var(--surface-muted)] text-xs font-semibold">
          {getInitials(row.name)}
        </span>
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.email}</p>
        </div>
      </div>
    ),
  },
  { id: "location", header: "Location", accessor: (row) => row.location ?? "N/A" },
  { id: "joinDate", header: "Join Date", accessor: (row) => formatDate(row.joinDate) },
  {
    id: "activity",
    header: "Activity",
    accessor: (row) =>
      `${row.activity?.bookings ?? 0} bookings, ${row.activity?.referrals ?? 0} referrals`,
  },
  {
    id: "points",
    header: "Loyalty",
    accessor: (row) => formatNumber(row.loyalty?.availablePoints),
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => <AdminStatusBadge>{row.status}</AdminStatusBadge>,
  },
];

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { data, error, isError, isLoading, refetch } =
    useGetAdminUsersManagementQuery();
  const [suspendUser] = useSuspendAdminUserMutation();
  const [retrieveUser] = useRetrieveAdminUserMutation();
  const { confirm, confirmationProps } = useConfirmation();

  const handleToggleSuspend = (user: AdminUser) => {
    const isSuspended = user.status === "SUSPENDED";
    confirm({
      title: isSuspended ? "Restore user?" : "Suspend user?",
      description: `${user.name} will be ${isSuspended ? "restored" : "suspended"}.`,
      confirmText: isSuspended ? "Restore" : "Suspend",
      variant: isSuspended ? "default" : "danger",
      onConfirm: async () => {
        if (isSuspended) {
          await retrieveUser(user.id).unwrap();
          toast.success("User restored.");
        } else {
          await suspendUser(user.id).unwrap();
          toast.success("User suspended.");
        }
      },
    });
  };

  const filteredUsers = useMemo(() => {
    const users = data?.users ?? [];
    const term = search.toLowerCase().trim();

    if (!term) return users;

    return users.filter((user) =>
      [user.name, user.email, user.phone, user.location, user.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [data?.users, search]);

  const pagination = getPagination(page, pageSize, filteredUsers.length);
  const paginatedUsers = filteredUsers.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  if (isLoading) return <AdminLoading />;

  if (isError && !data) {
    return (
      <ErrorState
        error={normalizeApiError(error)}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <AdminSection
      description="Monitor and manage platform users."
      title="User Management"
    >
      {isError ? (
        <ErrorState
          error={normalizeApiError(error)}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}
      <AdminStatGrid
        stats={
          data
            ? [
                { label: "Total Users", value: formatNumber(data.summary.totalUsers) },
                {
                  label: "Active This Month",
                  value: formatNumber(data.summary.activeThisMonth),
                },
                {
                  label: "New This Week",
                  value: formatNumber(data.summary.newThisWeek),
                },
                { label: "Suspended", value: formatNumber(data.summary.suspended) },
              ]
            : []
        }
      />
      <DataTable
        columns={columns}
        data={paginatedUsers}
        emptyMessage="No users found."
        getRowId={(row) => row.id}
        rowActions={(row) => (
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => setSelectedUser(row)} variant="secondary">
              View
            </Button>
            <Button
              onClick={() => handleToggleSuspend(row)}
              variant={row.status === "SUSPENDED" ? "secondary" : "danger"}
            >
              {row.status === "SUSPENDED" ? "Restore" : "Suspend"}
            </Button>
          </div>
        )}
        pagination={{
          page: pagination.page,
          pageSize,
          totalItems: filteredUsers.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search users...",
        }}
      />
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        titleId="user-details-title"
      >
        <ModalHeader>
          <h2 className="text-lg font-semibold" id="user-details-title">
            User Details
          </h2>
        </ModalHeader>
        <ModalBody>
          {selectedUser ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--text-muted)]">Name</dt>
                <dd className="font-medium">{selectedUser.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Status</dt>
                <dd>
                  <AdminStatusBadge>{selectedUser.status}</AdminStatusBadge>
                </dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Email</dt>
                <dd>{selectedUser.email}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Phone</dt>
                <dd>{selectedUser.phone ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Location</dt>
                <dd>{selectedUser.location ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Join Date</dt>
                <dd>{formatDate(selectedUser.joinDate)}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Bookings</dt>
                <dd>{selectedUser.activity?.bookings ?? 0}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">Loyalty Points</dt>
                <dd>{formatNumber(selectedUser.loyalty?.availablePoints)}</dd>
              </div>
            </dl>
          ) : null}
        </ModalBody>
        <ModalFooter>
          {selectedUser ? (
            <Button
              onClick={() => handleToggleSuspend(selectedUser)}
              variant={selectedUser.status === "SUSPENDED" ? "secondary" : "danger"}
            >
              {selectedUser.status === "SUSPENDED" ? "Restore" : "Suspend"}
            </Button>
          ) : null}
          <Button onClick={() => setSelectedUser(null)}>Close</Button>
        </ModalFooter>
      </Modal>
      {confirmationProps ? <ConfirmationDialog {...confirmationProps} /> : null}
    </AdminSection>
  );
}
