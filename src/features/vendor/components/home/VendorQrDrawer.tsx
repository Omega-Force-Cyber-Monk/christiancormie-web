import { Download, Share2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { FormField } from "@/components/forms/FormField";
import qrUrl from "@/features/vendor/assets/home/QR-code.svg";
import qrSource from "@/features/vendor/assets/home/QR-code.svg?raw";
import { shareVendorHomeQr } from "@/features/vendor/utils/homeState";

export function VendorQrDrawer({ onClose }: { onClose: () => void }) {
  const titleId = useId();
  const descriptionId = useId();
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  const pending = useRef(false);
  const absoluteUrl = new URL(qrUrl, window.location.origin).href;
  async function share() {
    if (pending.current) return;
    pending.current = true;
    setSharing(true);
    try {
      const result = await shareVendorHomeQr(
        new File([qrSource], "BiteDrop-sample-QR.svg", { type: "image/svg+xml" }),
        absoluteUrl,
        {
          share: navigator.share?.bind(navigator),
          canShare: navigator.canShare?.bind(navigator),
          copy: navigator.clipboard?.writeText.bind(navigator.clipboard),
        },
      );
      setStatus(
        result === "shared"
          ? "Sample QR artwork shared."
          : result === "copied"
            ? "Sample QR artwork link copied."
            : result === "cancelled"
              ? "Sharing cancelled."
              : "Sharing is unavailable. Copy the artwork link below or use Download.",
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
      <img
        src={qrUrl}
        alt="Sample BiteDrop QR artwork from the supplied design"
        className="mt-3 aspect-square w-full rounded-xl bg-white"
      />
      <div className="mt-6 grid grid-cols-2 gap-2">
        <a
          className="vendor-qr-download"
          href={qrUrl}
          download="BiteDrop-sample-QR.svg"
        >
          <Download size={14} aria-hidden="true" />
          Download
        </a>
        <button
          type="button"
          className="vendor-qr-share"
          onClick={() => {
            void share();
          }}
          disabled={sharing}
        >
          <Share2 size={14} aria-hidden="true" />
          {sharing ? "Sharing…" : "Share"}
        </button>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
        Supplied sample QR artwork. Its destination has not been verified for your
        truck.
      </p>
      <p role="status" className="mt-2 text-sm text-[#2ED3D1]">
        {status}
      </p>
      {status.includes("unavailable") && (
        <div className="mt-3">
          <FormField
            label="QR artwork link"
            value={absoluteUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </Modal>
  );
}
