import { CheckCircle, Clock, FileText, MapPin, Navigation } from "lucide-react";

import type { TruckRequestItem } from "@/features/admin/components/vendors/vendors.types";
import { getVendorStatusBadge } from "@/features/admin/components/vendors/vendorBadges";
import { VendorEmptyState } from "@/features/admin/components/vendors/VendorEmptyState";

type TruckRequestCardsProps = {
  isUpdating?: boolean;
  requests: TruckRequestItem[];
  onMarkCommunicated: (requestId: string) => void;
  onViewDetails: (request: TruckRequestItem) => void;
};

export function TruckRequestCards({
  isUpdating = false,
  onMarkCommunicated,
  onViewDetails,
  requests,
}: TruckRequestCardsProps) {
  if (requests.length === 0) {
    return (
      <VendorEmptyState
        message="Truck requests will appear here when available."
        title="No truck requests found"
      />
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          className="space-y-4 rounded-2xl border border-[#2e3443] bg-[#171e30] p-5 shadow-xl transition-colors hover:border-[#2b374e] sm:p-6"
          key={request.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#0369a1]/40 bg-[#0c2538] text-[#2dd4bf]">
                <Navigation className="size-4 rotate-45" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {request.truckName}
                  </h3>
                  {getVendorStatusBadge(request.status)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8091a7]">
                  <MapPin className="size-3.5 text-[#64748b]" />
                  <span>{request.location}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <Clock className="size-3.5" />
              <span>{request.submittedDate}</span>
            </div>
          </div>

          <div className="rounded-xl border border-[#232d42] bg-[#182030]/80 p-4 text-xs leading-relaxed text-slate-300 italic">
            "{request.description}"
          </div>

          <div className="flex flex-col justify-between gap-4 pt-1 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full border border-[#522923] bg-[#381e1a] text-xs font-bold text-[#ff6542]">
                {request.submitter.avatarInitial}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {request.submitter.name}
                </div>
                <div className="text-[11px] text-[#ff6542]">
                  {request.submitter.role}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#2b374e] px-4 py-2 text-xs font-semibold text-slate-200 transition active:scale-95 hover:bg-[#1e2638]"
                onClick={() => onViewDetails(request)}
                type="button"
              >
                <FileText className="size-3.5 text-[#8091a7]" />
                <span>View Details</span>
              </button>
              {request.status === "Pending" ? (
                <button
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#ff6542] px-4 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95 hover:bg-[#ff5530]"
                  onClick={() => onMarkCommunicated(request.id)}
                  disabled={isUpdating}
                  type="button"
                >
                  <CheckCircle className="size-3.5" />
                  <span>Communicated</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
