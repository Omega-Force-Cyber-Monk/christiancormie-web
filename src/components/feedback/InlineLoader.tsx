export function InlineLoader() {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
      <span className="size-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
      Loading
    </span>
  );
}
