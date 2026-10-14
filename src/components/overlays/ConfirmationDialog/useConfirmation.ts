import { useRef, useState } from "react";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import type { AppError } from "@/utils/errors/error.types";

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
  const processingRef = useRef(false);
  const [error, setError] = useState<AppError | null>(null);

  const confirm = (nextOptions: ConfirmationOptions) => {
    if (processingRef.current) return;
    setError(null);
    setOptions(nextOptions);
  };

  const handleCancel = () => {
    if (processingRef.current) return;
    setError(null);
    setOptions(null);
  };

  const handleConfirm = async () => {
    if (!options || processingRef.current) return;
    processingRef.current = true;
    setError(null);
    setIsProcessing(true);
    try {
      await options.onConfirm();
      setOptions(null);
    } catch (failure) {
      setError(normalizeApiError(failure));
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  return {
    confirmationProps: options
      ? {
          ...options,
          isOpen: true,
          isProcessing,
          error,
          onCancel: handleCancel,
          onConfirm: handleConfirm,
        }
      : null,
    confirm,
  };
};
