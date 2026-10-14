import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ModalBody } from "@/components/overlays/Modal/ModalBody";
import { ModalFooter } from "@/components/overlays/Modal/ModalFooter";
import { ModalHeader } from "@/components/overlays/Modal/ModalHeader";
import type { ConfirmationDialogProps } from "@/components/overlays/ConfirmationDialog/confirmation.types";

export function ConfirmationDialog({
  cancelText = "Cancel",
  confirmText = "Confirm",
  description,
  isOpen,
  isProcessing = false,
  onCancel,
  onConfirm,
  title,
  variant = "default",
}: ConfirmationDialogProps) {
  const titleId = "confirmation-dialog-title";
  const descriptionId = "confirmation-dialog-description";

  return (
    <Modal
      closeOnEscape={!isProcessing}
      descriptionId={descriptionId}
      isOpen={isOpen}
      onClose={isProcessing ? () => undefined : onCancel}
      titleId={titleId}
    >
      <ModalHeader>
        <h2 className="text-lg font-semibold" id={titleId}>
          {title}
        </h2>
      </ModalHeader>
      <ModalBody>
        <p className="text-sm leading-6 text-[var(--text-muted)]" id={descriptionId}>
          {description}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button disabled={isProcessing} onClick={onCancel}>
          {cancelText}
        </Button>
        <Button
          disabled={isProcessing}
          onClick={() => {
            void onConfirm();
          }}
          variant={variant === "danger" ? "danger" : "primary"}
        >
          {isProcessing ? "Working..." : confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
