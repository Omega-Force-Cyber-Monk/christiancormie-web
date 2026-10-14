import type { ReactNode } from "react";

export type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  titleId?: string;
  descriptionId?: string;
  closeOnEscape?: boolean;
  backdropClassName?: string;
  panelClassName?: string;
  showCloseButton?: boolean;
};

export type ModalSectionProps = {
  children: ReactNode;
  className?: string;
};
