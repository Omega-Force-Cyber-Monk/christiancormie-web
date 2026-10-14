type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ description, title }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center">
      <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
