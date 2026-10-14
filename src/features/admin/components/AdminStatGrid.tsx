import type { LucideIcon } from "lucide-react";

type AdminStat = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: LucideIcon;
};

type AdminStatGridProps = {
  stats: AdminStat[];
};

export function AdminStatGrid({ stats }: AdminStatGridProps) {
  return (
    <section
      aria-label="Admin statistics"
      className="legacy-admin-stats grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            className="legacy-admin-stat-card min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
            key={stat.label}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
              {Icon ? (
                <span className="grid size-10 place-items-center rounded-md bg-[var(--surface-muted)] text-[var(--primary)]">
                  <Icon aria-hidden="true" size={20} />
                </span>
              ) : null}
            </div>
            <p className="truncate text-2xl font-semibold text-[var(--text)]">
              {stat.value}
            </p>
            {stat.detail ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{stat.detail}</p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
