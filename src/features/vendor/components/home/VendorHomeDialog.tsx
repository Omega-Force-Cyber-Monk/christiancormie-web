import { useId, type ReactNode } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";

export function VendorHomeDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      panelClassName="vendor-home-dialog"
    >
      <h2 id={titleId} className="mb-4 pr-8 text-xl font-semibold">
        {title}
      </h2>
      {children}
    </Modal>
  );
}
