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

const messagesFrom = (value: unknown): string[] => {
  const values: unknown[] = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      values
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};

export const isSafeFieldPath = (field: string) =>
  Boolean(field) &&
  !field
    .split(/[.[\]]/)
    .some((part) => ["__proto__", "prototype", "constructor"].includes(part));

const normalizeFieldErrors = (errors: unknown): FieldErrors | undefined => {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return undefined;

  const fieldErrors = Object.entries(errors).reduce<FieldErrors>(
    (accumulator, [field, value]) => {
      const [message] = messagesFrom(value);
      if (isSafeFieldPath(field) && message) accumulator[field] = message;

      return accumulator;
    },
    {},
  );
  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
};

export const normalizeApiError = (error: unknown): AppError => {
  const fetchError =
    error && typeof error === "object" ? (error as Partial<FetchBaseQueryError>) : {};

  if (fetchError.status === "FETCH_ERROR" || fetchError.status === "TIMEOUT_ERROR") {
    return {
      kind: "NETWORK",
      message: "Network connection failed. Please check your connection.",
      code: fetchError.status,
    };
  }

  if (typeof fetchError.status === "number") {
    const data =
      fetchError.data &&
      typeof fetchError.data === "object" &&
      !Array.isArray(fetchError.data)
        ? (fetchError.data as BackendErrorShape)
        : {};
    const isServerError = fetchError.status >= 500;
    const fieldErrors = isServerError ? undefined : normalizeFieldErrors(data.errors);
    const messages = isServerError ? [] : messagesFrom(data.message);
    const validationMessages =
      (fetchError.status === 400 || fetchError.status === 422) &&
      Array.isArray(data.message) &&
      messages.length
        ? messages
        : undefined;
    const message = isServerError
      ? "The server could not complete the request. Please try again."
      : messages.length
        ? messages.join(" ")
        : fieldErrors
          ? "Please correct the highlighted fields."
          : "The request could not be completed.";

    return {
      kind: statusToKind(fetchError.status),
      status: fetchError.status,
      code: !isServerError && typeof data.code === "string" ? data.code : undefined,
      message,
      fieldErrors,
      validationMessages,
      details: isServerError ? undefined : data.details,
    };
  }

  if (fetchError.status === "PARSING_ERROR" || fetchError.status === "CUSTOM_ERROR") {
    return {
      kind: "UNKNOWN",
      code: fetchError.status,
      message: "The request could not be completed. Please try again.",
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
