import { Download, X } from "lucide-react";
import { VerificationDocumentOperations } from "./VendorOperations";

import { Modal } from "@/components/overlays/Modal/Modal";
import type { LicenseDocument } from "@/features/admin/components/vendors/vendors.types";
import { getVendorStatusBadge } from "@/features/admin/components/vendors/vendorBadges";

type BusinessLicenseModalProps = {
  document?: LicenseDocument | null;
  isOpen: boolean;
  onClose: () => void;
};

export function BusinessLicenseModal({
  document,
  isOpen,
  onClose,
}: BusinessLicenseModalProps) {
  return (
    <Modal
      backdropClassName="bg-black/80 backdrop-blur-sm"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#2e3443] bg-[#171e30] text-slate-200 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6542]"
      showCloseButton={false}
      titleId="business-license-title"
    >
      {document ? (
        <>
          <div className="flex flex-col gap-4 border-b border-[#2e3443] bg-[#111726]/80 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2
                  className="text-lg font-bold text-white"
                  id="business-license-title"
                >
                  {document.title}
                </h2>
                {getVendorStatusBadge(document.status)}
              </div>
              <p className="mt-1 text-xs text-[#8091a7]">
                Submitted {document.uploadedDate}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <VerificationDocumentOperations document={document} />
              <a
                className="rounded-lg border border-[#2e3443] p-2 text-[#8091a7] transition hover:bg-[#1e2638] hover:text-white"
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open submitted document"
                aria-disabled={!document.url}
              >
                <Download className="size-4" />
              </a>
              <button
                className="rounded-lg p-2 text-[#8091a7] transition hover:bg-[#1e2638] hover:text-white"
                onClick={onClose}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto bg-[#0f1420] p-4 sm:p-8">
            <div className="mx-auto max-w-2xl rounded-sm bg-white p-8 text-slate-900 shadow-2xl sm:p-10">
              <div className="border-b-2 border-slate-900 pb-5 text-center">
                <p className="text-xs font-bold tracking-[0.35em] text-slate-500 uppercase">
                  Submitted document metadata
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-normal">
                  {document.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Submitted verification document
                </p>
              </div>
              <div className="mt-8 grid gap-5 text-sm sm:grid-cols-2">
                <LicenseField
                  label="License Number"
                  value={document.licenseNumber || "N/A"}
                />
                <LicenseField label="Status" value={document.status} />
                <LicenseField
                  label="Business Name"
                  value={document.businessName || "N/A"}
                />
                <LicenseField label="Owner Name" value={document.ownerName || "N/A"} />
                <LicenseField
                  label="Business Type"
                  value={document.businessType || "N/A"}
                />
                <LicenseField label="Issue Date" value={document.issueDate || "N/A"} />
                <LicenseField
                  label="Expiration Date"
                  value={document.expirationDate || "N/A"}
                />
                <LicenseField label="Issuing Authority" value="N/A" />
              </div>
              <div className="mt-5">
                <LicenseField
                  label="Business Address"
                  value={document.businessAddress || "N/A"}
                />
              </div>
              <div className="mt-8 rounded border border-slate-300 p-5 text-xs leading-relaxed text-slate-600">
                Open the submitted document to review its original contents. Missing
                metadata does not establish licensing or approval status.
              </div>
              <div className="mt-10 flex items-end justify-between gap-6">
                <div>
                  <div className="h-10 w-40 border-b border-slate-800" />
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Signature available in original document
                  </p>
                </div>
                <div className="flex size-20 items-center justify-center rounded-full border-4 border-slate-300 text-center text-[10px] font-bold text-slate-400">
                  ORIGINAL
                  <br />
                  DOCUMENT
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </Modal>
  );
}

function LicenseField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
