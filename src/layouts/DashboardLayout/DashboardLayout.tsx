import { useCallback, useState } from "react";
import { Outlet } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { getNavigationForRole } from "@/config/navigation/navigation.config";
import { USER_ROLES } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/storage";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { MobileSidebar } from "@/layouts/DashboardLayout/Sidebar/MobileSidebar";
import { Sidebar } from "@/layouts/DashboardLayout/Sidebar/Sidebar";
import { TopNavbar } from "@/layouts/DashboardLayout/TopNavbar/TopNavbar";
import { storage } from "@/utils/storage";

const getInitialCollapsedState = () =>
  storage.get(STORAGE_KEYS.SIDEBAR_COLLAPSED) === "true";

export function DashboardLayout() {
  const role = useAppSelector(selectCurrentRole);
  const navigation = getNavigationForRole(role);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    getInitialCollapsedState,
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isAdmin = role === USER_ROLES.ADMIN;
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);

  const handleToggleCollapsed = () => {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      storage.set(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  };

  return (
    <div
      className={`flex bg-[var(--background)] ${
        isAdmin ? "legacy-admin-shell h-screen overflow-hidden" : "min-h-dvh"
      }`}
    >
      <Sidebar
        collapsed={isAdmin ? false : isSidebarCollapsed}
        isLegacyAdmin={isAdmin}
        items={navigation}
        onToggleCollapsed={handleToggleCollapsed}
      />
      <MobileSidebar
        isLegacyAdmin={isAdmin}
        items={navigation}
        onClose={closeMobileSidebar}
        open={isMobileSidebarOpen}
      />
      <div
        className={`flex min-w-0 flex-1 flex-col ${
          isAdmin ? "h-screen overflow-hidden" : ""
        }`}
      >
        <TopNavbar
          isLegacyAdmin={isAdmin}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <main
          className={`min-w-0 flex-1 overflow-x-hidden ${
            isAdmin
              ? "overflow-y-auto bg-[#121826] p-6 text-white md:p-8 lg:p-12 xl:p-16"
              : "p-4 sm:p-6 lg:p-8"
          }`}
        >
          <div
            className={`mx-auto w-full ${
              isAdmin ? "max-w-[1540px]" : "max-w-[92rem]"
            } ${isAdmin ? "legacy-admin-content" : ""}`}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
