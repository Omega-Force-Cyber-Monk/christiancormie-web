import { Link, useLocation } from "react-router";

import type { NavigationItem } from "@/config/navigation/navigation.types";
import { ROUTES } from "@/constants/routes";

type SidebarNavigationItemProps = {
  item: NavigationItem;
  collapsed?: boolean;
  isLegacyAdmin?: boolean;
  onNavigate?: () => void;
};

export function SidebarNavigationItem({
  item,
  collapsed = false,
  isLegacyAdmin = false,
  onNavigate,
}: SidebarNavigationItemProps) {
  const Icon = item.icon;
  const { pathname } = useLocation();
  const isActive =
    pathname === item.path ||
    (item.path !== ROUTES.ADMIN_DASHBOARD && pathname.startsWith(`${item.path}/`));

  if (isLegacyAdmin) {
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={`flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733] ${
          isActive
            ? "bg-[#FF5733] text-[#121826]"
            : "text-[#B8C1D1] hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center px-0" : ""}`}
        onClick={onNavigate}
        title={collapsed ? item.label : undefined}
        to={item.path}
      >
        <span
          className={`flex items-center ${
            collapsed ? "justify-center" : "space-x-3.5"
          }`}
        >
          <Icon
            aria-hidden="true"
            className={isActive ? "text-[#121826]" : "text-[#B8C1D1]"}
            size={20}
          />
          {!collapsed ? <span>{item.label}</span> : null}
        </span>
      </Link>
    );
  }

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
        isActive
          ? "bg-[var(--primary)] text-white"
          : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
      } ${collapsed ? "justify-center" : ""}`}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      to={item.path}
    >
      <Icon aria-hidden="true" size={18} />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}
