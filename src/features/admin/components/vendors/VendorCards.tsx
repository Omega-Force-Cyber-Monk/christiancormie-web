import { Eye, Star, Truck, Users } from "lucide-react";

import type { VendorItem } from "@/features/admin/components/vendors/vendors.types";
import { getVendorStatusBadge } from "@/features/admin/components/vendors/vendorBadges";
import { VendorEmptyState } from "@/features/admin/components/vendors/VendorEmptyState";

type VendorCardsProps = {
  vendors: VendorItem[];
  onViewDetails: (vendor: VendorItem) => void;
};

export function VendorCards({ onViewDetails, vendors }: VendorCardsProps) {
  if (vendors.length === 0) {
    return (
      <VendorEmptyState
        message="Vendor records will appear here when available."
        title="No vendors found"
      />
    );
  }

  return (
    <div className="space-y-4">
      {vendors.map((vendor) => (
        <div
          className="flex flex-col justify-between gap-5 rounded-2xl border border-[#2e3443] bg-[#171e30] p-5 shadow-xl transition-colors hover:border-[#2b374e] md:flex-row md:items-center"
          key={vendor.id}
        >
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-[#4d2623] bg-[#2a1b1a] text-[#ff6542]">
              <Truck className="size-6" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-base font-bold text-white">{vendor.name}</h3>
                {vendor.isVerified ? (
                  <span className="flex size-4 items-center justify-center rounded-full bg-[#2dd4bf] text-[10px] font-bold text-[#0f172a]">
                    ✓
                  </span>
                ) : null}
                {getVendorStatusBadge(vendor.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-[#8091a7] sm:grid-cols-4 sm:gap-8">
                <VendorDatum label="Owner" value={vendor.ownerName} />
                <VendorDatum label="Cuisine" value={vendor.cuisine} />
                <div>
                  <span className="block text-[11px] text-[#64748b]">Rating</span>
                  <div className="flex items-center gap-1 font-medium text-slate-200">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span>{vendor.rating}</span>
                    <span className="text-[#64748b]">({vendor.reviewsCount})</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] text-[#64748b]">Followers</span>
                  <div className="flex items-center gap-1 font-medium text-slate-200">
                    <Users className="size-3.5 text-[#2dd4bf]" />
                    <span>{vendor.followersCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <button
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#ff6542] px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-white shadow-md transition active:scale-95 hover:bg-[#ff5530]"
              onClick={() => onViewDetails(vendor)}
              type="button"
            >
              <Eye className="size-4" />
              <span>View Details</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function VendorDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] text-[#64748b]">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}
