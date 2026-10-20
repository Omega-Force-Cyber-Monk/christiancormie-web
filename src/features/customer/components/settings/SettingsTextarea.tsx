import { useId, type TextareaHTMLAttributes } from "react";
import { FormError } from "@/components/forms/FormError";
import { FormLabel } from "@/components/forms/FormLabel";

export function SettingsTextarea({
  label,
  error,
  id,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className="space-y-2">
      <FormLabel htmlFor={fieldId}>{label}</FormLabel>
      <textarea
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`settings-textarea ${props.className ?? ""}`}
      />
      <FormError id={`${fieldId}-error`} message={error} />
    </div>
  );
}
