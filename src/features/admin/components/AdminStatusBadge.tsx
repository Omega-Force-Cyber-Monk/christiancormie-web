type AdminStatusBadgeProps = {
  children: string;
};

export function AdminStatusBadge({ children }: AdminStatusBadgeProps) {
  const normalized = children.toLowerCase();
  const color =
    normalized.includes("suspend") ||
    normalized.includes("disputed") ||
    normalized.includes("reported")
      ? "bg-red-50 text-[var(--danger)] border-red-200"
      : normalized.includes("pending")
        ? "bg-amber-50 text-[var(--warning)] border-amber-200"
        : "bg-emerald-50 text-[var(--success)] border-emerald-200";

  return (
    <span
      className={`legacy-admin-status-badge inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${color}`}
    >
      {children.toLowerCase()}
    </span>
  );
}
