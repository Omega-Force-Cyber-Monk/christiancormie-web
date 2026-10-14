export type ConfirmationVariant = "default" | "danger";

export type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isProcessing?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};
