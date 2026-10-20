import { useEffect, useId, useRef, type ReactNode } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";

export function SettingsDialog({
  title,
  variant = "profile",
  onClose,
  children,
}: {
  title: string;
  variant?: "profile" | "points" | "password" | "conversation" | "invite";
  onClose: () => void;
  children: ReactNode;
}) {
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [title]);
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      backdropClassName="bg-black/10"
      panelClassName={`settings-dialog settings-dialog--${variant}`}
    >
      <h2
        ref={heading}
        tabIndex={-1}
        id={titleId}
        className={
          variant === "points" ? "sr-only" : "mb-4 pr-5 text-lg leading-7 font-semibold"
        }
      >
        {title}
      </h2>
      {children}
    </Modal>
  );
}
