import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/states/ErrorState";
import {
  useGetAdminVendorsManagementQuery,
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
  TruckRequestItem,
  VendorItem,
} from "@/features/admin/components/vendors/vendors.types";
import { formatNumber } from "@/features/admin/utils/adminFormat";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

type VendorTab = "all" | "requests" | "communicated";

export default function AdminVendorsPage() {
  const [activeTab, setActiveTab] = useState<VendorTab>("all");
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<TruckRequestItem | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<LicenseDocument | null>(
    null,
  );
  const { data, error, isError, isLoading, refetch } =
    useGetAdminVendorsManagementQuery();
  const [updateTruckRequestStatus] = useUpdateTruckRequestStatusMutation();

  const vendors = useMemo<VendorItem[]>(
    () =>
      data?.vendors?.map((vendor) => ({
        cuisine: vendor.cuisineType,
        description: "N/A",
        documents: [],
        email: "N/A",
        followersCount: formatNumber(vendor.followers),
        id: vendor.id,
        isVerified: vendor.isVerified,
        memberSince: "N/A",
        menuItems: [],
        name: vendor.businessName,
        ownerName: vendor.ownerName,
        phone: "N/A",
        priceRange: "N/A",
        rating: vendor.rating,
        revenueGenerated: "N/A",
        reviewsCount: vendor.reviews,
        serviceArea: "N/A",
        status:
          vendor.status === "SUSPENDED"
            ? "suspended"
            : vendor.status === "APPROVED"
              ? "active"
              : "Pending",
        totalBookings: 0,
      })) ?? [],
    [data?.vendors],
  );

  const truckRequests = useMemo<TruckRequestItem[]>(
    () =>
      data?.truckRequests?.map((request) => ({
        description: request.description,
        id: request.id,
        location: request.usualLocation,
        phone: request.phone,
        reason: request.reason,
        reqCode: request.requestDisplayId,
        status: request.status === "COMMUNICATED" ? "Communicated" : "Pending",
        submittedDate: "Recently",
        submitter: {
          avatarInitial: request.requester.name.charAt(0).toUpperCase() || "R",
          email: request.requester.email,
          name: request.requester.name,
          role: "Requester",
        },
        truckName: request.truckName,
      })) ?? [],
    [data?.truckRequests],
  );

  const pendingRequestsCount = truckRequests.filter(
    (request) => request.status === "Pending",
  ).length;
  const communicatedCount =
    data?.tabs?.communicated ??
    truckRequests.filter((request) => request.status === "Communicated").length;
  const displayedRequests =
    activeTab === "communicated"
      ? truckRequests.filter((request) => request.status === "Communicated")
      : truckRequests;

  const handleMarkCommunicated = async (requestId: string) => {
    try {
      await updateTruckRequestStatus({
        requestId,
        status: "COMMUNICATED",
        notes: "Marked communicated from admin dashboard.",
      }).unwrap();
      toast.success("Truck request marked communicated.");
    } catch {
      toast.error("Unable to update truck request.");
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
            label={`Truck Requests (${pendingRequestsCount})`}
            onClick={() => setActiveTab("requests")}
            pill={pendingRequestsCount}
          />
          <VendorTabButton
            active={activeTab === "communicated"}
            label={`Communicated (${communicatedCount})`}
            onClick={() => setActiveTab("communicated")}
          />
        </div>
      </div>

      {activeTab === "all" ? (
        <VendorCards onViewDetails={setSelectedVendor} vendors={vendors} />
      ) : (
        <TruckRequestCards
          onMarkCommunicated={(requestId) => {
            void handleMarkCommunicated(requestId);
          }}
          onViewDetails={setSelectedRequest}
          requests={displayedRequests}
        />
      )}

      <VendorDetailsModal
        isOpen={Boolean(selectedVendor)}
        onClose={() => setSelectedVendor(null)}
        onViewDocument={setSelectedDocument}
        vendor={selectedVendor}
      />
      <TruckRequestModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        onMarkCommunicated={(requestId) => {
          void handleMarkCommunicated(requestId);
        }}
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
