import { Bell } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <button
      aria-label="Show notification example"
      className="inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      onClick={() => toast.info("Notifications are ready for backend events.")}
      type="button"
    >
      <Bell size={18} />
    </button>
  );
}
