import type { PropsWithChildren } from "react";

type FormDescriptionProps = PropsWithChildren<{
  id?: string;
}>;

export function FormDescription({ children, id }: FormDescriptionProps) {
  return (
    <p className="text-sm text-[var(--text-muted)]" id={id}>
      {children}
    </p>
  );
}
