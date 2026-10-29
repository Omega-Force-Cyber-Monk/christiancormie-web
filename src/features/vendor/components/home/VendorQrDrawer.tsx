import { X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { VendorQrPanel } from "@/features/vendor/components/home/VendorQrPanel";
import { AppLoader } from "@/components/ui/AppLoader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { useGetVendorQrQuery } from "@/features/vendor/api/vendor.api";
import {
  useVendorContext,
  isVendorAccessError,
} from "@/features/vendor/utils/useVendorContext";
import { vendorAccessState } from "@/features/vendor/components/home/VendorAccessState";
import { toVendorQr, shareVendorQr } from "@/features/vendor/utils/vendorQr";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { env } from "@/config/env";

export function VendorQrDrawer({ onClose }: { onClose: () => void }) {
  const context = useVendorContext();
  const query = useGetVendorQrQuery(undefined, { skip: !context.allowed });
  const titleId = useId();
  const descriptionId = useId();
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const pending = useRef(false);
  const data = !isVendorAccessError(query.error) ? query.currentData : undefined;
  const qr =
    data && context.vendor && context.trucks.currentData
      ? toVendorQr(
          data,
          context.vendor,
          context.trucks.currentData,
          env.apiBaseUrl,
          typeof window !== "undefined" ? window.location.origin : undefined,
        )
      : undefined;
  const accessState = vendorAccessState(context);
  async function share() {
    if (pending.current || !qr?.shareUrl) return;
    pending.current = true;
    setSharing(true);
    try {
      const result = await shareVendorQr(qr.shareUrl, qr.shareMessage, {
        share: navigator.share?.bind(navigator),
        copy: navigator.clipboard?.writeText.bind(navigator.clipboard),
      });
      setStatus(
        result === "shared"
          ? "QR link shared."
          : result === "copied"
            ? "QR link copied."
            : result === "cancelled"
              ? "Sharing cancelled."
              : "Sharing is unavailable. Copy the QR link below.",
      );
    } finally {
      pending.current = false;
      setSharing(false);
    }
  }
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      descriptionId={descriptionId}
      showCloseButton={false}
      panelClassName="vendor-qr-drawer"
      backdropClassName="bg-[#121826]/60"
    >
      <button
        type="button"
        aria-label="Close QR code"
        className="vendor-qr-close"
        onClick={onClose}
      >
        <X size={22} />
      </button>
      <h2 id={titleId} className="text-center text-base font-semibold">
        Your BiteDrop QR Code
      </h2>
      <p id={descriptionId} className="mt-1 text-center text-xs text-[#B8C1D1]">
        Display at your truck for instant engagement
      </p>
      {accessState ?? (
        <>
          {query.error ? (
            <ErrorState
              error={normalizeApiError(query.error)}
              onRetry={() => {
                void query.refetch();
              }}
            />
          ) : null}
          {context.trucks.error ? (
            <ErrorState
              error={normalizeApiError(context.trucks.error)}
              onRetry={() => {
                void context.trucks.refetch();
              }}
            />
          ) : null}
          {(query.isFetching && !data) ||
          (context.trucks.isFetching && !context.trucks.currentData) ? (
            <AppLoader />
          ) : qr && !qr.belongs ? (
            <ErrorState
              error={{
                kind: "AUTHORIZATION",
                message: "The QR identity does not match this vendor's food trucks.",
              }}
              onRetry={() => {
                void query.refetch();
              }}
            />
          ) : qr?.hasCode && !context.trucks.isError ? (
            <VendorQrPanel
              qr={qr}
              businessName={data?.businessName ?? "Vendor"}
              sharing={sharing}
              onShare={() => {
                void share();
              }}
            />
          ) : !query.isError && !context.trucks.isError ? (
            <EmptyState
              title="No QR information available"
              description="A linked food truck and QR code are required. Complete truck onboarding and retry."
            />
          ) : null}
          {query.isFetching && data ? (
            <p role="status" className="mt-3 text-xs">
              Refreshing QR information...
            </p>
          ) : null}
          <Button
            className="mt-3 w-full"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch();
            }}
          >
            Refresh QR information
          </Button>
          <p role="status" className="mt-2 text-sm text-[#2ED3D1]">
            {status}
          </p>
        </>
      )}
    </Modal>
  );
}
