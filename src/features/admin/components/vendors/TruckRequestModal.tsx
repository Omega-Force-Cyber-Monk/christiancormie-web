import { CheckCircle, MapPin, Phone, Truck, X } from "lucide-react";
import type { ReactElement } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import type { TruckRequestItem } from "@/features/admin/components/vendors/vendors.types";
import { getVendorStatusBadge } from "@/features/admin/components/vendors/vendorBadges";

type TruckRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onMarkCommunicated: (requestId: string) => void;
  request?: TruckRequestItem | null;
};

export function TruckRequestModal({
  isOpen,
  onClose,
  onMarkCommunicated,
  request,
}: TruckRequestModalProps) {
  return (
    <Modal
      backdropClassName="bg-black/80 backdrop-blur-sm"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#2e3443] bg-[#171e30] text-slate-200 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6542]"
      showCloseButton={false}
      titleId="truck-request-title"
    >
      {request ? (
        <>
          <div className="flex items-start justify-between border-b border-[#2e3443] bg-[#111726]/80 p-6">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white" id="truck-request-title">
                  Request a Truck
                </h2>
                {getVendorStatusBadge(request.status)}
              </div>
              <p className="mt-1 text-xs text-[#8091a7]">
                {request.reqCode} • Submitted {request.submittedDate}
              </p>
            </div>
            <button
              className="rounded-lg p-1.5 text-[#8091a7] transition-colors hover:bg-[#1e2638] hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-4 overflow-y-auto bg-[#0f1420]/50 p-6 text-xs">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[#232d42] bg-[#182030] p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full border border-[#522923] bg-[#381e1a] text-xs font-bold text-[#ff6542]">
                  {request.submitter.avatarInitial}
                </div>
                <div>
                  <div className="font-semibold text-slate-100">
                    {request.submitter.name}
                  </div>
                  <div className="text-[11px] text-[#8091a7]">
                    {request.submitter.email}
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-[#522923] bg-[#381e1a] px-2.5 py-1 text-[11px] font-semibold text-[#ff6542]">
                {request.submitter.role}
              </span>
            </div>
            <RequestField
              icon={<Truck />}
              label="Truck Name"
              value={request.truckName}
            />
            <RequestField
              icon={<MapPin />}
              label="Usual Location"
              value={request.location}
            />
            <RequestField
              icon={<Phone />}
              label="Phone"
              value={request.phone || "(415) 882-3310"}
            />
            <RequestBlock label="Description" value={request.description} />
            <RequestBlock
              label="Why should we add this truck?"
              value={request.reason || ""}
            />
            <div className="pt-2">
              <button
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff6542] py-3.5 text-xs font-semibold text-white shadow-md transition active:scale-95 hover:bg-[#ff5530]"
                onClick={() => {
                  onMarkCommunicated(request.id);
                  onClose();
                }}
                type="button"
              >
                <CheckCircle className="size-4" />
                <span>Communicated</span>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  );
}

function RequestField({
  icon,
  label,
  value,
}: {
  icon: ReactElement;
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#8091a7]">
        <span className="[&>svg]:size-3.5 [&>svg]:text-[#2dd4bf]">{icon}</span>
        <span>{label}</span>
      </label>
      <div className="rounded-xl border border-[#232d42] bg-[#182030] p-3 text-slate-200">
        {value}
      </div>
    </div>
  );
}

function RequestBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-[#8091a7]">{label}</label>
      <div className="rounded-xl border border-[#232d42] bg-[#182030] p-3.5 leading-relaxed text-slate-200">
        {value}
      </div>
    </div>
  );
}
