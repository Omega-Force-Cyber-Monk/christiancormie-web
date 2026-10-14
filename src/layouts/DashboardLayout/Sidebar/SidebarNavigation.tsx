import type { NavigationItem } from "@/config/navigation/navigation.types";
import { SidebarNavigationItem } from "@/layouts/DashboardLayout/Sidebar/SidebarNavigationItem";

type SidebarNavigationProps = {
  items: NavigationItem[];
  collapsed?: boolean;
  isLegacyAdmin?: boolean;
  onNavigate?: () => void;
};

export function SidebarNavigation({
  items,
  collapsed = false,
  isLegacyAdmin = false,
  onNavigate,
}: SidebarNavigationProps) {
  return (
    <nav
      aria-label="Dashboard navigation"
      className={`flex-1 overflow-y-auto ${
        isLegacyAdmin ? "space-y-1 px-4 py-2" : "p-3"
      }`}
    >
      <div className="space-y-1">
        {items.map((item) => (
          <SidebarNavigationItem
            collapsed={collapsed}
            isLegacyAdmin={isLegacyAdmin}
            item={item}
            key={item.path}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}
