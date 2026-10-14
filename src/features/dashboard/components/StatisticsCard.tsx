import type { LucideIcon } from "lucide-react";

type StatisticsCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function StatisticsCard({ icon: Icon, label, value }: StatisticsCardProps) {
  return (
    <article className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--primary)]">
        <Icon aria-hidden="true" size={20} />
      </div>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-[var(--text)]">{value}</p>
    </article>
  );
}
