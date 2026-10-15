import { Menu } from "lucide-react";
import type { ReactNode } from "react";

import { NavbarActions } from "@/layouts/DashboardLayout/TopNavbar/NavbarActions";
import { UserMenu } from "@/layouts/DashboardLayout/TopNavbar/UserMenu";

type TopNavbarProps = {
  children?: ReactNode;
  isLegacyAdmin?: boolean;
  onOpenMobileSidebar: () => void;
};

export function TopNavbar({
  children,
  isLegacyAdmin = false,
  onOpenMobileSidebar,
}: TopNavbarProps) {
  if (isLegacyAdmin) {
    return (
      <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between border-b border-white/5 bg-[#1B2233] px-6 font-inter select-none md:px-10 lg:h-[100px] lg:px-16">
        <div className="flex items-center">
          <button
            aria-label="Open mobile menu"
            className="inline-flex size-10 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733] lg:hidden"
            onClick={onOpenMobileSidebar}
            type="button"
          >
            <Menu className="size-6" />
          </button>
        </div>
        <div className="ml-auto flex items-center space-x-4 md:space-x-6">
          <NavbarActions isLegacyAdmin />
          <div className="h-8 w-px bg-[#B8C1D1]/30" />
          <UserMenu isLegacyAdmin />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Open navigation"
          className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
          onClick={onOpenMobileSidebar}
          type="button"
        >
          <Menu size={20} />
        </button>
        {!children && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--text)]">Dashboard</p>
            <p className="hidden truncate text-xs text-[var(--text-muted)] sm:block">
              Role-aware workspace
            </p>
          </div>
        )}
      </div>
      {children ?? (
        <div className="flex items-center gap-2">
          <NavbarActions />
          <UserMenu />
        </div>
      )}
    </header>
  );
}
