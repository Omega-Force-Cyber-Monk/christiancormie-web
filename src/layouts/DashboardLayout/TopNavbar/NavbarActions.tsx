import { Bell } from "lucide-react";
import { NotificationBell } from "@/features/notifications/NotificationBell";

type NavbarActionsProps = {
  isLegacyAdmin?: boolean;
};

export function NavbarActions({ isLegacyAdmin = false }: NavbarActionsProps) {
  if (isLegacyAdmin) {
    return (
      <button
        aria-label="Notifications"
        className="relative flex size-9 items-center justify-center rounded-[10px] bg-[#FF5733] shadow-sm transition-colors duration-150 hover:bg-[#ff6b4a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
        type="button"
      >
        <Bell className="size-5 text-white" fill="white" />
        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#121826]" />
      </button>
    );
  }

  return <NotificationBell square />;
}
