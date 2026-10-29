import type { AppError, FieldErrors } from "@/utils/errors/error.types";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

// Nest validation arrays have no structured field map. Map only known auth DTO fields.
const authFields = new Set([
  "name",
  "email",
  "password",
  "dateOfBirth",
  "phone",
  "businessName",
  "businessEmail",
  "businessPhone",
  "description",
  "websiteUrl",
  "firstName",
  "lastName",
  "displayName",
  "timezone",
  "referralCode",
  "code",
]);
export function normalizeAuthError(error: unknown): AppError {
  const normalized = normalizeApiError(error);
  if (!normalized.validationMessages) return normalized;
  const fieldErrors: FieldErrors = { ...normalized.fieldErrors };
  for (const message of normalized.validationMessages) {
    // Recognize Nest/class-validator field-prefixed diagnostics only, never prose
    // such as "email delivery failed". Explicit structured errors take priority.
    const field =
      /^(\w+) (?:must (?:be|not be|contain|not contain|match|not match|have|not have)|should not (?:be empty|exist))\b/.exec(
        message,
      )?.[1];
    if (field && authFields.has(field)) {
      const formField = field === "displayName" ? "name" : field;
      fieldErrors[formField] ??= message;
    }
  }
  return {
    ...normalized,
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : undefined,
  };
}
