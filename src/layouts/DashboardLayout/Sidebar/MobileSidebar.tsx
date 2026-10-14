import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { NavigationItem } from "@/config/navigation/navigation.types";
import { appConfig } from "@/config/app.config";
import adminLogo from "@/layouts/DashboardLayout/assets/admin-logo.svg";
import { SidebarFooter } from "@/layouts/DashboardLayout/Sidebar/SidebarFooter";
import { SidebarNavigation } from "@/layouts/DashboardLayout/Sidebar/SidebarNavigation";

type MobileSidebarProps = {
  isLegacyAdmin?: boolean;
  items: NavigationItem[];
  open: boolean;
  onClose: () => void;
};

export function MobileSidebar({
  isLegacyAdmin = false,
  items,
  onClose,
  open,
}: MobileSidebarProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="Close navigation overlay"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        type="button"
      />
      <aside
        aria-label="Mobile dashboard navigation"
        aria-modal="true"
        className={`relative flex h-full flex-col border-r shadow-xl ${
          isLegacyAdmin
            ? "w-64 border-white/10 bg-[#1B2233] text-white"
            : "w-[min(22rem,88vw)] border-[var(--border)] bg-[var(--surface)]"
        }`}
        ref={drawerRef}
        role="dialog"
        tabIndex={-1}
      >
        <div
          className={`flex items-center justify-between gap-3 px-4 ${
            isLegacyAdmin ? "pb-6 pt-8" : "h-16 border-b border-[var(--border)]"
          }`}
        >
          {isLegacyAdmin ? (
            <img
              alt="Bite Drop Admin Panel"
              className="h-[52px] w-auto object-contain"
              src={adminLogo}
            />
          ) : (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{appConfig.name}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {appConfig.dashboardTitle}
              </p>
            </div>
          )}
          <button
            aria-label="Close navigation"
            className={`rounded-md p-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isLegacyAdmin
                ? "text-[#B8C1D1] hover:bg-white/10 hover:text-white focus-visible:outline-[#FF5733]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            }`}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <SidebarNavigation
          isLegacyAdmin={isLegacyAdmin}
          items={items}
          onNavigate={onClose}
        />
        <SidebarFooter isLegacyAdmin={isLegacyAdmin} />
      </aside>
    </div>
  );
}
