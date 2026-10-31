import type { AppError } from "@/utils/errors/error.types";
import type { ReactNode } from "react";

export type ConfirmationVariant = "default" | "danger";

export type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isProcessing?: boolean;
  error?: AppError | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};
