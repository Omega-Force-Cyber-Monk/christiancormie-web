import type { ReactNode } from "react";

import type { NavigationItem } from "@/config/navigation/navigation.types";
import { SidebarFooter } from "@/layouts/DashboardLayout/Sidebar/SidebarFooter";
import { SidebarHeader } from "@/layouts/DashboardLayout/Sidebar/SidebarHeader";
import { SidebarNavigation } from "@/layouts/DashboardLayout/Sidebar/SidebarNavigation";

type SidebarProps = {
  children?: ReactNode;
  collapsed: boolean;
  isLegacyAdmin?: boolean;
  items: NavigationItem[];
  onToggleCollapsed: () => void;
};

export function Sidebar({
  children,
  collapsed,
  isLegacyAdmin = false,
  items,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 z-40 hidden h-dvh w-[var(--dashboard-sidebar-width)] flex-col overflow-hidden border-r transition-[width] duration-200 lg:flex ${
        isLegacyAdmin
          ? "border-white/5 bg-[#1B2233] text-white"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {children ?? (
        <>
          <SidebarHeader
            collapsed={collapsed}
            isLegacyAdmin={isLegacyAdmin}
            onToggleCollapsed={onToggleCollapsed}
          />
          <SidebarNavigation
            collapsed={collapsed}
            isLegacyAdmin={isLegacyAdmin}
            items={items}
          />
          <SidebarFooter collapsed={collapsed} isLegacyAdmin={isLegacyAdmin} />
        </>
      )}
    </aside>
  );
}
