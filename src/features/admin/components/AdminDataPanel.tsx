import type { PropsWithChildren } from "react";

type AdminDataPanelProps = PropsWithChildren<{
  title: string;
  description?: string;
}>;

export function AdminDataPanel({ children, description, title }: AdminDataPanelProps) {
  return (
    <section className="legacy-admin-panel min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
        {description ? (
          <p className="text-sm text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
