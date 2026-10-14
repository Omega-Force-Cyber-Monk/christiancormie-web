import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { env } from "@/config/env";
import { ALL_USER_ROLES, type UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { clearSession, setMockRole } from "@/features/auth/store/auth.slice";
import {
  selectAccessToken,
  selectCurrentRole,
  selectCurrentUser,
} from "@/features/auth/store/auth.selectors";
import adminAvatar from "@/layouts/DashboardLayout/assets/admin-avatar.png";

type UserMenuProps = {
  isLegacyAdmin?: boolean;
};

export function UserMenu({ isLegacyAdmin = false }: UserMenuProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const currentRole = useAppSelector(selectCurrentRole);
  const user = useAppSelector(selectCurrentUser);
  const accessToken = useAppSelector(selectAccessToken);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (isLegacyAdmin) {
    const displayName = user?.name || "Admin";
    const email = user?.email || "admin@platform.com";

    const handleLogout = () => {
      setOpen(false);
      dispatch(clearSession());
      void navigate(ROUTES.LOGIN);
    };

    return (
      <div className="relative" ref={menuRef}>
        <button
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center space-x-3 rounded-xl p-1 text-left transition-colors duration-150 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <img
            alt="Admin avatar"
            className="size-12 shrink-0 rounded-full border border-white/10 object-cover"
            src={adminAvatar}
          />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium text-[#FF5733]">{displayName}</span>
            <span className="text-xs font-normal text-[#B8C1D1]">{email}</span>
          </div>
          <ChevronDown
            aria-hidden="true"
            className={`hidden size-4 text-[#B8C1D1] transition-transform sm:block ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open ? (
          <div
            className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1B2233] p-1.5 text-white shadow-2xl"
            role="menu"
          >
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              role="menuitem"
              to={ROUTES.ADMIN_SETTINGS}
            >
              Settings
            </Link>
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              role="menuitem"
              to={ROUTES.TERMS_AND_CONDITIONS}
            >
              Terms & Conditions
            </Link>
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              role="menuitem"
              to={ROUTES.PRIVACY_POLICY}
            >
              Privacy Policy
            </Link>
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              role="menuitem"
              to={ROUTES.HELP_CENTER}
            >
              Help Center
            </Link>
            <button
              className="block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
              onClick={handleLogout}
              role="menuitem"
              type="button"
            >
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  if (!env.enableMockAuth || accessToken) {
    return <span className="text-sm text-[var(--text-muted)]">{user?.name}</span>;
  }

  return (
    <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
      <span className="hidden sm:inline">Role</span>
      <select
        aria-label="Development role selector"
        className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
        onChange={(event) => dispatch(setMockRole(event.target.value as UserRole))}
        value={currentRole ?? ""}
      >
        {ALL_USER_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
  );
}
