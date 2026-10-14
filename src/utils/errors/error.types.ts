export type AppErrorKind =
  | "VALIDATION"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT"
  | "SERVER"
  | "NETWORK"
  | "UNKNOWN";

export type FieldErrors = Record<string, string>;

export type AppError = {
  kind: AppErrorKind;
  message: string;
  status?: number;
  code?: string;
  fieldErrors?: FieldErrors;
  details?: unknown;
};
