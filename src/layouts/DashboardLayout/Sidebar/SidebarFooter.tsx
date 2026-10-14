import { LogOut } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearSession } from "@/features/auth/store/auth.slice";
import { selectCurrentUser } from "@/features/auth/store/auth.selectors";

type SidebarFooterProps = {
  collapsed?: boolean;
  isLegacyAdmin?: boolean;
};

export function SidebarFooter({
  collapsed = false,
  isLegacyAdmin = false,
}: SidebarFooterProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  if (isLegacyAdmin) {
    return (
      <div className="mt-auto p-4">
        <button
          aria-label="Sign out"
          className={`flex h-12 w-full items-center rounded-xl px-4 text-sm font-medium text-[#B8C1D1] transition-colors duration-150 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733] ${
            collapsed ? "justify-center px-0" : "space-x-3.5"
          }`}
          onClick={() => dispatch(clearSession())}
          type="button"
        >
          <LogOut className="size-5 text-[#B8C1D1]" />
          {!collapsed ? <span>Sign out</span> : null}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--border)] p-3">
      <div
        className={`mb-3 min-w-0 rounded-md bg-[var(--surface-muted)] p-3 ${
          collapsed ? "text-center" : ""
        }`}
      >
        <p className="truncate text-sm font-medium text-[var(--text)]">
          {collapsed ? user?.name.charAt(0) : user?.name}
        </p>
        {!collapsed ? (
          <p className="truncate text-xs text-[var(--text-muted)]">{user?.role}</p>
        ) : null}
      </div>
      <button
        aria-label="Sign out"
        className={`flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          collapsed ? "justify-center" : ""
        }`}
        onClick={() => dispatch(clearSession())}
        type="button"
      >
        <LogOut size={18} />
        {!collapsed ? <span>Sign out</span> : null}
      </button>
    </div>
  );
}
