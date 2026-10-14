export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status">
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <span className="size-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        Loading page
      </div>
    </div>
  );
}
