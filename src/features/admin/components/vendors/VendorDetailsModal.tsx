import { BadgeCheck, Download, Mail, Phone, Star, Users, X } from "lucide-react";
import type { ReactNode } from "react";
import { VendorAccountOperations } from "./VendorOperations";

import { Modal } from "@/components/overlays/Modal/Modal";
import type {
  LicenseDocument,
  VendorItem,
} from "@/features/admin/components/vendors/vendors.types";
import { getVendorStatusBadge } from "@/features/admin/components/vendors/vendorBadges";

type VendorDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onViewDocument: (document: LicenseDocument) => void;
  vendor?: VendorItem | null;
};

export function VendorDetailsModal({
  isOpen,
  onClose,
  onViewDocument,
  vendor,
}: VendorDetailsModalProps) {
  return (
    <Modal
      backdropClassName="bg-black/80 backdrop-blur-sm"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#2e3443] bg-[#171e30] text-slate-200 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6542]"
      showCloseButton={false}
      titleId="vendor-details-title"
    >
      {vendor ? (
        <>
          <div className="flex items-start justify-between gap-4 border-b border-[#2e3443] bg-[#111726]/80 p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-white" id="vendor-details-title">
                  {vendor.name}
                </h2>
                {vendor.isVerified ? (
                  <span className="flex items-center gap-1 rounded-full border border-[#14535e]/60 bg-[#0c2e32] px-2.5 py-1 text-[11px] font-semibold text-[#2dd4bf]">
                    <BadgeCheck className="size-3.5" />
                    Verified
                  </span>
                ) : null}
                {getVendorStatusBadge(vendor.status)}
              </div>
              <p className="mt-1 text-xs text-[#8091a7]">
                Vendor ID: {vendor.id || "N/A"}
              </p>
            </div>
            <button
              className="rounded-lg p-2 text-[#8091a7] transition hover:bg-[#1e2638] hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto bg-[#0f1420]/50 p-6">
            <DetailSection title="Vendor Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem label="Owner Name" value={vendor.ownerName} />
                <InfoItem label="Email" value={vendor.email} />
                <InfoItem label="Phone" value={vendor.phone} />
                <InfoItem label="Cuisine Type" value={vendor.cuisine} />
                <InfoItem label="Service Area" value={vendor.serviceArea} />
                <div className="flex gap-2 pt-5">
                  <button
                    className="flex items-center gap-1.5 rounded-lg border border-[#2e3443] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#1e2638]"
                    type="button"
                  >
                    <Mail className="size-3.5 text-[#8091a7]" />
                    Message
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded-lg border border-[#2e3443] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#1e2638]"
                    type="button"
                  >
                    <Phone className="size-3.5 text-[#8091a7]" />
                    Call
                  </button>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Performance Metrics">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<Star className="size-4 fill-amber-400 text-amber-400" />}
                  label="Rating"
                  value={vendor.rating.toString()}
                />
                <MetricCard label="Reviews" value={vendor.reviewsCount.toString()} />
                <MetricCard
                  icon={<Users className="size-4 text-[#2dd4bf]" />}
                  label="Followers"
                  value={vendor.followersCount}
                />
                <MetricCard
                  label="Total Bookings"
                  value={vendor.totalBookings.toString()}
                />
                <MetricCard
                  className="sm:col-span-2"
                  label="Revenue Generated"
                  value={vendor.revenueGenerated}
                />
              </div>
            </DetailSection>

            <DetailSection title="Business Details">
              <InfoItem label="Description" value={vendor.description} />
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <InfoItem
                  label="Menu Items"
                  value={
                    vendor.menuItems.length > 0 ? vendor.menuItems.join(", ") : "N/A"
                  }
                />
                <InfoItem label="Price Range" value={vendor.priceRange} />
                <InfoItem label="Member Since" value={vendor.memberSince} />
              </div>
            </DetailSection>

            <DetailSection title="Submitted Documents">
              {vendor.documents.length > 0 ? (
                <div className="space-y-3">
                  {vendor.documents.map((document) => (
                    <div
                      className="flex flex-col gap-3 rounded-xl border border-[#232d42] bg-[#182030] p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={document.id ?? document.title}
                    >
                      <div>
                        <div className="font-semibold text-slate-100">
                          {document.title}
                        </div>
                        <div className="mt-1 text-xs text-[#8091a7]">
                          Submitted {document.uploadedDate}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getVendorStatusBadge(document.status)}
                        <button
                          className="rounded-lg border border-[#2e3443] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-[#1e2638]"
                          onClick={() => onViewDocument(document)}
                          type="button"
                        >
                          View
                        </button>
                        <button
                          className="rounded-lg border border-[#2e3443] p-2 text-[#8091a7] transition hover:bg-[#1e2638] hover:text-white"
                          type="button"
                        >
                          <Download className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-[#232d42] bg-[#182030] p-4 text-xs text-[#8091a7]">
                  No submitted documents available.
                </p>
              )}
            </DetailSection>

            <DetailSection title="Account Actions">
              <VendorAccountOperations vendor={vendor} />
            </DetailSection>
          </div>
        </>
      ) : null}
    </Modal>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#2e3443] bg-[#171e30] p-5">
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      {children}
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium text-[#8091a7]">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function MetricCard({
  className,
  icon,
  label,
  value,
}: {
  className?: string;
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className={`rounded-xl border border-[#232d42] bg-[#182030] p-4 ${className ?? ""}`}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#8091a7]">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-lg font-bold text-white">{value}</div>
    </div>
  );
}
