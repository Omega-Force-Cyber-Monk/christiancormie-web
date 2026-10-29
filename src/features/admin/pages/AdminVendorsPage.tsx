import { DataTablePagination } from "@/components/data-display/DataTable/DataTablePagination";
import { adminPage, useAdminList } from "@/features/admin/utils/adminList";
import {
  toAdminVendor,
  toAdminTruckRequest,
} from "@/features/admin/utils/adminVendors";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/states/ErrorState";
import {
  useGetAdminVendorsManagementQuery,
  useGetAdminTruckRequestsQuery,
  useUpdateTruckRequestStatusMutation,
} from "@/features/admin/api/admin.api";
import { AdminLoading } from "@/features/admin/components/AdminLoading";
import { AdminSection } from "@/features/admin/components/AdminSection";
import { BusinessLicenseModal } from "@/features/admin/components/vendors/BusinessLicenseModal";
import { TruckRequestCards } from "@/features/admin/components/vendors/TruckRequestCards";
import { TruckRequestModal } from "@/features/admin/components/vendors/TruckRequestModal";
import { VendorCards } from "@/features/admin/components/vendors/VendorCards";
import { VendorDetailsModal } from "@/features/admin/components/vendors/VendorDetailsModal";
import { VendorSummaryCards } from "@/features/admin/components/vendors/VendorSummaryCards";
import type {
  LicenseDocument,
  VendorItem,
} from "@/features/admin/components/vendors/vendors.types";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

type VendorTab = "all" | "requests" | "communicated";

export default function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<VendorTab>("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<LicenseDocument | null>(
    null,
  );
  const vendorsList = useAdminList(10);
  const requestsList = useAdminList(10, activeTab);
  const {
    currentData: data,
    error,
    isError,
    isLoading,
    isFetching,
    refetch,
  } = useGetAdminVendorsManagementQuery(vendorsList.query);
  const requests = useGetAdminTruckRequestsQuery(
    {
      ...requestsList.query,
      ...(activeTab === "communicated" ? { status: "COMMUNICATED" } : {}),
    },
    { skip: activeTab === "all" },
  );
  const vendorPage = adminPage(data?.vendors, vendorsList.pageSize);
  const requestPage = adminPage(requests.currentData, requestsList.pageSize);
  const vendors = vendorPage.rows.map(toAdminVendor);
  const displayedRequests = requestPage.rows.map(toAdminTruckRequest);
  const selectedRequest =
    displayedRequests.find((request) => request.id === selectedRequestId) ?? null;
  const pendingRequestsCount = data?.tabs?.truckRequests;
  const communicatedCount = data?.tabs?.communicated;
  const [updateTruckRequestStatus, update] = useUpdateTruckRequestStatusMutation();
  const pendingRequest = useRef<string | null>(null);

  const handleMarkCommunicated = async (requestId: string) => {
    if (pendingRequest.current) return;
    const request = displayedRequests.find((row) => row.id === requestId);
    if (!request || request.status !== "Pending") return;
    pendingRequest.current = requestId;
    try {
      await updateTruckRequestStatus({ requestId, status: "COMMUNICATED" }).unwrap();
      setSelectedRequestId((current) => (current === requestId ? null : current));
      toast.success("Truck request marked communicated.");
    } catch (failure) {
      toast.error(normalizeApiError(failure).message);
    } finally {
      pendingRequest.current = null;
    }
  };
  if (isLoading) return <AdminLoading cards={4} rows={5} />;

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
      description="Approve, manage, and monitor food truck vendors"
      title="Vendor Management"
    >
      {isError ? (
        <ErrorState
          error={normalizeApiError(error)}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      <VendorSummaryCards
        data={
          data
            ? [
                {
                  title: "Total Vendors",
                  value: formatNumber(data.summary.totalVendors),
                  valueColor: "text-white",
                },
                {
                  title: "Active",
                  value: formatNumber(data.summary.active),
                  valueColor: "text-[#2dd4bf]",
                },
                {
                  title: "Pending Approval",
                  value: formatNumber(data.summary.pendingApproval),
                  valueColor: "text-[#eab308]",
                },
                {
                  title: "Suspended",
                  value: formatNumber(data.summary.suspended),
                  valueColor: "text-[#f87171]",
                },
              ]
            : []
        }
      />

      <div className="border-b border-[#1e2638]">
        <div className="flex flex-wrap gap-8">
          <VendorTabButton
            active={activeTab === "all"}
            label="All Vendors"
            onClick={() => setActiveTab("all")}
          />
          <VendorTabButton
            active={activeTab === "requests"}
            label={`Truck Requests (${formatNumber(pendingRequestsCount)})`}
            onClick={() => setActiveTab("requests")}
            pill={pendingRequestsCount ?? undefined}
          />
          <VendorTabButton
            active={activeTab === "communicated"}
            label={`Communicated (${formatNumber(communicatedCount)})`}
            onClick={() => setActiveTab("communicated")}
          />
        </div>
      </div>

      <input
        aria-label={activeTab === "all" ? "Search vendors" : "Search truck requests"}
        type="search"
        className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        placeholder="Search..."
        value={activeTab === "all" ? vendorsList.search : requestsList.search}
        onChange={(event) =>
          (activeTab === "all" ? vendorsList.setSearch : requestsList.setSearch)(
            event.target.value,
          )
        }
      />
      {activeTab === "all" ? (
        <>
          {isFetching && !data ? (
            <AdminLoading cards={0} />
          ) : (
            <VendorCards onViewDetails={setSelectedVendor} vendors={vendors} />
          )}
          <DataTablePagination
            {...vendorsList.pagination}
            hasNextPage={vendorPage.hasNextPage}
            isFetching={isFetching}
            variant="contrast"
          />
        </>
      ) : (
        <>
          {requests.isError ? (
            <ErrorState
              error={normalizeApiError(requests.error)}
              onRetry={() => {
                void requests.refetch();
              }}
            />
          ) : null}
          {requests.isFetching && !requests.currentData ? (
            <AdminLoading cards={0} />
          ) : !requests.isError || requests.currentData ? (
            <TruckRequestCards
              isUpdating={update.isLoading}
              onMarkCommunicated={(requestId) => {
                void handleMarkCommunicated(requestId);
              }}
              onViewDetails={(request) => setSelectedRequestId(request.id)}
              requests={displayedRequests}
            />
          ) : null}
          <DataTablePagination
            {...requestsList.pagination}
            hasNextPage={requestPage.hasNextPage}
            isFetching={requests.isFetching}
            variant="contrast"
          />
        </>
      )}
      <VendorDetailsModal
        isOpen={Boolean(selectedVendor)}
        onClose={() => setSelectedVendor(null)}
        onViewDocument={setSelectedDocument}
        vendor={selectedVendor}
      />
      <TruckRequestModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequestId(null)}
        onMarkCommunicated={(requestId) => {
          void handleMarkCommunicated(requestId);
        }}
        isUpdating={update.isLoading}
        request={selectedRequest}
      />
      <BusinessLicenseModal
        document={selectedDocument}
        isOpen={Boolean(selectedDocument)}
        onClose={() => setSelectedDocument(null)}
      />
    </AdminSection>
  );
}

function VendorTabButton({
  active,
  label,
  onClick,
  pill,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  pill?: number;
}) {
  return (
    <button
      className={`relative flex cursor-pointer items-center gap-2 border-b-2 px-0 py-4 text-sm font-semibold transition ${
        active
          ? "border-[#ff6542] text-white"
          : "border-transparent text-[#8091a7] hover:text-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      {pill ? (
        <span className="flex min-w-5 items-center justify-center rounded-full bg-[#ff6542] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {pill}
        </span>
      ) : null}
    </button>
  );
}
