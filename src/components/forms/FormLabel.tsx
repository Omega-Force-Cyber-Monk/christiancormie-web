import type { LabelHTMLAttributes, PropsWithChildren } from "react";

type FormLabelProps = PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>;

export function FormLabel({ children, className = "", ...props }: FormLabelProps) {
  return (
    <label className={`text-sm font-medium text-[var(--text)] ${className}`} {...props}>
      {children}
    </label>
  );
}
