import type { NavigationItem } from "@/config/navigation/navigation.types";
import { SidebarFooter } from "@/layouts/DashboardLayout/Sidebar/SidebarFooter";
import { SidebarHeader } from "@/layouts/DashboardLayout/Sidebar/SidebarHeader";
import { SidebarNavigation } from "@/layouts/DashboardLayout/Sidebar/SidebarNavigation";

type SidebarProps = {
  collapsed: boolean;
  isLegacyAdmin?: boolean;
  items: NavigationItem[];
  onToggleCollapsed: () => void;
};

export function Sidebar({
  collapsed,
  isLegacyAdmin = false,
  items,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      className={`hidden min-h-dvh border-r transition-[width] duration-200 lg:flex lg:flex-col ${
        isLegacyAdmin
          ? "border-white/5 bg-[#1B2233] text-white"
          : "border-[var(--border)] bg-[var(--surface)]"
      } ${
        collapsed ? (isLegacyAdmin ? "w-20" : "w-20") : isLegacyAdmin ? "w-64" : "w-72"
      }`}
    >
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
    </aside>
  );
}
