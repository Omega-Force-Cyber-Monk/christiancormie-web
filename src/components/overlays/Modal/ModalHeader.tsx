import type { ModalSectionProps } from "@/components/overlays/Modal/modal.types";

export function ModalHeader({ children, className = "" }: ModalSectionProps) {
  return (
    <header className={`border-b border-[var(--border)] px-5 py-4 pr-14 ${className}`}>
      {children}
    </header>
  );
}
