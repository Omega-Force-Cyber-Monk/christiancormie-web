import type { ModalSectionProps } from "@/components/overlays/Modal/modal.types";

export function ModalBody({ children, className = "" }: ModalSectionProps) {
  return <div className={`overflow-y-auto px-5 py-4 ${className}`}>{children}</div>;
}
