import { useId, type InputHTMLAttributes } from "react";

import { FormError } from "@/components/forms/FormError";
import { FormLabel } from "@/components/forms/FormLabel";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function FormField({
  error,
  id,
  label,
  className = "",
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <div className="space-y-2">
      <FormLabel htmlFor={inputId}>{label}</FormLabel>
      <input
        aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : invalid}
        className={`min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
        id={inputId}
        {...props}
      />
      <FormError id={errorId} message={error} />
    </div>
  );
}
