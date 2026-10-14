import { useState } from "react";

import type { ConfirmationDialogProps } from "@/components/overlays/ConfirmationDialog/confirmation.types";

type ConfirmationOptions = Omit<
  ConfirmationDialogProps,
  "isOpen" | "isProcessing" | "onCancel" | "onConfirm"
> & {
  onConfirm: () => void | Promise<void>;
};

export const useConfirmation = () => {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const confirm = (nextOptions: ConfirmationOptions) => {
    setOptions(nextOptions);
  };

  const handleCancel = () => {
    if (isProcessing) return;
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (!options) return;
    setIsProcessing(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    confirmationProps: options
      ? {
          ...options,
          isOpen: true,
          isProcessing,
          onCancel: handleCancel,
          onConfirm: handleConfirm,
        }
      : null,
    confirm,
  };
};
