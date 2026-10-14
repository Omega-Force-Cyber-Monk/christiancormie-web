import type { ModalSectionProps } from "@/components/overlays/Modal/modal.types";

export function ModalFooter({ children, className = "" }: ModalSectionProps) {
  return (
    <footer
      className={`flex flex-wrap justify-end gap-3 border-t border-[var(--border)] px-5 py-4 ${className}`}
    >
      {children}
    </footer>
  );
}
