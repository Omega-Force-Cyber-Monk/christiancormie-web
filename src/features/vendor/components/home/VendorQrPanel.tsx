import { Download, Share2 } from "lucide-react";
import { EmptyState } from "@/components/states/EmptyState";
import { FormField } from "@/components/forms/FormField";
import type { toVendorQr } from "@/features/vendor/utils/vendorQr";

export function VendorQrPanel({
  qr,
  businessName,
  sharing,
  onShare,
}: {
  qr: ReturnType<typeof toVendorQr>;
  businessName: string;
  sharing: boolean;
  onShare: () => void;
}) {
  if (!qr.belongs || !qr.hasCode)
    return (
      <EmptyState
        title="No QR information available"
        description="A linked food truck and QR code are required."
      />
    );
  return (
    <>
      {qr.imageUrl ? (
        <img
          src={qr.imageUrl}
          alt={`BiteDrop QR code for ${businessName}`}
          className="mt-3 aspect-square w-full rounded-xl bg-white"
        />
      ) : (
        <EmptyState
          title="QR image unavailable"
          description="The QR code exists, but no downloadable image was provided."
        />
      )}
      <FormField label="QR code" value={qr.code ?? ""} readOnly />
      <div className="mt-6 grid grid-cols-2 gap-2">
        {qr.imageUrl ? (
          <a
            className="vendor-qr-download"
            href={qr.imageUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={14} aria-hidden="true" />
            Download
          </a>
        ) : (
          <button className="vendor-qr-download" type="button" disabled>
            <Download size={14} aria-hidden="true" />
            Download unavailable
          </button>
        )}
        <button
          type="button"
          className="vendor-qr-share"
          onClick={onShare}
          disabled={sharing || !qr.shareUrl}
        >
          <Share2 size={14} aria-hidden="true" />
          {sharing ? "Sharing..." : "Share"}
        </button>
      </div>
      {qr.shareUrl ? (
        <div className="mt-3">
          <FormField
            label="QR link"
            value={qr.shareUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </>
  );
}
