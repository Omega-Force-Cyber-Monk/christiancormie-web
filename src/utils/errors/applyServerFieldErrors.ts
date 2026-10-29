import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { AppError } from "@/utils/errors/error.types";
import { isSafeFieldPath } from "@/utils/errors/normalizeApiError";

export const applyServerFieldErrors = <TFieldValues extends FieldValues>(
  error: AppError,
  setError: UseFormSetError<TFieldValues>,
  allowedFields?: readonly Path<TFieldValues>[],
) => {
  if (!error.fieldErrors) return;

  Object.entries(error.fieldErrors).forEach(([field, message]) => {
    if (
      !isSafeFieldPath(field) ||
      (allowedFields && !allowedFields.includes(field as Path<TFieldValues>))
    )
      return;
    setError(field as Path<TFieldValues>, {
      type: "server",
      message,
    });
  });
};
