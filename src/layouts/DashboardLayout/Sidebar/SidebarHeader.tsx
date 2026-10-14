import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Link } from "react-router";

import { appConfig } from "@/config/app.config";
import { ROUTES } from "@/constants/routes";
import adminLogo from "@/layouts/DashboardLayout/assets/admin-logo.svg";

type SidebarHeaderProps = {
  collapsed: boolean;
  isLegacyAdmin?: boolean;
  onToggleCollapsed: () => void;
};

export function SidebarHeader({
  collapsed,
  isLegacyAdmin = false,
  onToggleCollapsed,
}: SidebarHeaderProps) {
  if (isLegacyAdmin) {
    return (
      <div className="flex items-center justify-center px-4 pb-6 pt-8">
        <Link
          aria-label="Bite Drop Admin Panel"
          className="flex min-h-[52px] items-center justify-center"
          to={ROUTES.ADMIN_DASHBOARD}
        >
          {collapsed ? (
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#FF5733] text-sm font-semibold text-[#121826]">
              BD
            </span>
          ) : (
            <img
              alt="Bite Drop Admin Panel"
              className="h-[52px] w-auto object-contain"
              src={adminLogo}
            />
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-16 items-center justify-between gap-3 border-b border-[var(--border)] px-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--text)]">
          {collapsed ? "CC" : appConfig.name}
        </p>
        {!collapsed ? (
          <p className="truncate text-xs text-[var(--text-muted)]">
            {appConfig.dashboardTitle}
          </p>
        ) : null}
      </div>
      <button
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden rounded-md p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 lg:inline-flex"
        onClick={onToggleCollapsed}
        type="button"
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>
    </div>
  );
}
