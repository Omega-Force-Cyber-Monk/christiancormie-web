import { useId, useRef, useState } from "react";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import type { AppError } from "@/utils/errors/error.types";

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
  error,
  isOpen,
  isProcessing = false,
  onCancel,
  onConfirm,
  title,
  variant = "default",
}: ConfirmationDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const [localError, setLocalError] = useState<AppError | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pending = useRef(false);
  const busy = isProcessing || submitting;
  const failure = error ?? localError;
  const cancel = () => {
    if (busy || pending.current) return;
    setLocalError(null);
    onCancel();
  };
  const submit = async () => {
    if (busy || pending.current) return;
    pending.current = true;
    setSubmitting(true);
    setLocalError(null);
    try {
      await onConfirm();
    } catch (failure) {
      setLocalError(normalizeApiError(failure));
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Modal
      closeOnEscape={!busy}
      descriptionId={descriptionId}
      isOpen={isOpen}
      onClose={cancel}
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
        {failure ? (
          <p className="mt-3 text-sm text-[var(--danger)]" role="alert">
            {failure.message}
          </p>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button disabled={busy} onClick={cancel}>
          {cancelText}
        </Button>
        <Button
          disabled={busy}
          onClick={() => {
            void submit();
          }}
          variant={variant === "danger" ? "danger" : "primary"}
        >
          {busy ? "Working..." : confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
