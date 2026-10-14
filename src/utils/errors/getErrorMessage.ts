import type { AppError } from "@/utils/errors/error.types";

export const getErrorMessage = (
  error: AppError | null | undefined,
  fallback = "Something went wrong. Please try again.",
) => error?.message || fallback;
