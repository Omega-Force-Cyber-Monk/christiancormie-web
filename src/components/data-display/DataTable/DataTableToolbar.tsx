import { Search } from "lucide-react";

type DataTableToolbarProps = {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  variant?: "default" | "contrast";
};

export function DataTableToolbar({
  search,
  variant = "default",
}: DataTableToolbarProps) {
  if (!search) return null;

  if (variant === "contrast") {
    return (
      <div className="pb-4">
        <label className="relative block w-full max-w-72 sm:max-w-80">
          <span className="sr-only">Search table</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#64748b]" />
          <input
            className="w-full rounded-xl border border-[#232d42] bg-[#182030] py-2.5 pr-4 pl-10 text-sm text-slate-100 placeholder-[#64748b] transition-colors focus:border-orange-500/50 focus:outline-none"
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? "Search"}
            type="search"
            value={search.value}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="max-w-md flex-1">
        <span className="sr-only">Search table</span>
        <input
          className="min-h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          onChange={(event) => search.onChange(event.target.value)}
          placeholder={search.placeholder ?? "Search"}
          type="search"
          value={search.value}
        />
      </label>
    </div>
  );
}
