import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import type { AppError, AppErrorKind, FieldErrors } from "@/utils/errors/error.types";

type BackendErrorShape = {
  message?: unknown;
  code?: unknown;
  errors?: unknown;
  details?: unknown;
};

const statusToKind = (status?: number): AppErrorKind => {
  if (status === 400 || status === 422) return "VALIDATION";
  if (status === 401) return "AUTHENTICATION";
  if (status === 403) return "AUTHORIZATION";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMIT";
  if (status && status >= 500) return "SERVER";
  return "UNKNOWN";
};

const normalizeFieldErrors = (errors: unknown): FieldErrors | undefined => {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return undefined;

  return Object.entries(errors).reduce<FieldErrors>((accumulator, [field, value]) => {
    if (typeof value === "string") {
      accumulator[field] = value;
    } else if (Array.isArray(value) && typeof value[0] === "string") {
      accumulator[field] = value[0];
    }

    return accumulator;
  }, {});
};

export const normalizeApiError = (error: unknown): AppError => {
  const fetchError = error as Partial<FetchBaseQueryError>;

  if (fetchError.status === "FETCH_ERROR") {
    return {
      kind: "NETWORK",
      message: "Network connection failed. Please check your connection.",
      code: "FETCH_ERROR",
      details: fetchError.error,
    };
  }

  if (typeof fetchError.status === "number") {
    const data = (fetchError.data ?? {}) as BackendErrorShape;
    const fieldErrors = normalizeFieldErrors(data.errors);
    const message =
      typeof data.message === "string"
        ? data.message
        : fieldErrors
          ? "Please correct the highlighted fields."
          : "The request could not be completed.";

    return {
      kind: statusToKind(fetchError.status),
      status: fetchError.status,
      code: typeof data.code === "string" ? data.code : undefined,
      message,
      fieldErrors,
      details: data.details,
    };
  }

  if (error instanceof Error) {
    return {
      kind: "UNKNOWN",
      message: error.message,
    };
  }

  return {
    kind: "UNKNOWN",
    message: "Something went wrong. Please try again.",
    details: error,
  };
};
