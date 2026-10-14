import { X } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";

import type { ModalProps } from "@/components/overlays/Modal/modal.types";
import { useDialogLifecycle } from "@/components/overlays/useDialogLifecycle";

export function Modal({
  children,
  backdropClassName,
  closeOnEscape = true,
  descriptionId,
  isOpen,
  onClose,
  panelClassName,
  showCloseButton = true,
  titleId,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const themeAnchorRef = useRef<HTMLSpanElement>(null);

  useDialogLifecycle(
    isOpen,
    dialogRef,
    rootRef,
    onClose,
    closeOnEscape,
    themeAnchorRef,
  );

  return (
    <>
      <span aria-hidden="true" hidden ref={themeAnchorRef} />
      {isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 grid place-items-center p-4"
              ref={rootRef}
            >
              <button
                aria-label="Close dialog overlay"
                tabIndex={-1}
                className={"absolute inset-0 " + (backdropClassName ?? "bg-black/45")}
                onClick={onClose}
                type="button"
              />
              <div
                aria-describedby={descriptionId}
                aria-labelledby={titleId}
                aria-label={titleId ? undefined : "Dialog"}
                aria-modal="true"
                className={
                  panelClassName ??
                  "relative flex max-h-[min(42rem,90dvh)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-[var(--surface)] shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                }
                ref={dialogRef}
                role="dialog"
                tabIndex={-1}
              >
                {showCloseButton ? (
                  <button
                    aria-label="Close dialog"
                    className="absolute top-3 right-3 z-10 rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    onClick={onClose}
                    type="button"
                  >
                    <X size={18} />
                  </button>
                ) : null}
                {children}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
