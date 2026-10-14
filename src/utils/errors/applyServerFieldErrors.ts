import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import type { AppError } from "@/utils/errors/error.types";

export const applyServerFieldErrors = <TFieldValues extends FieldValues>(
  error: AppError,
  setError: UseFormSetError<TFieldValues>,
) => {
  if (!error.fieldErrors) return;

  Object.entries(error.fieldErrors).forEach(([field, message]) => {
    setError(field as Path<TFieldValues>, {
      type: "server",
      message,
    });
  });
};
