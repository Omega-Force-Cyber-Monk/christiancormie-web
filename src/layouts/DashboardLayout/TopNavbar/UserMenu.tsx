import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/routes";
import { clearSession } from "@/features/auth/store/auth.slice";
import { selectCurrentUser } from "@/features/auth/store/auth.selectors";
import adminAvatar from "@/layouts/DashboardLayout/assets/admin-avatar.png";

type UserMenuProps = {
  isLegacyAdmin?: boolean;
};

export function UserMenu({ isLegacyAdmin = false }: UserMenuProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
        triggerRef.current?.focus();
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
          aria-label={`Account options for ${displayName}`}
          aria-controls={open ? menuId : undefined}
          ref={triggerRef}
          className="flex items-center space-x-3 rounded-xl p-1 text-left transition-colors duration-150 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <img
            alt="Admin avatar"
            className="size-12 shrink-0 rounded-full border border-white/10 object-cover"
            src={user?.avatarUrl || adminAvatar}
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
          <nav
            className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1B2233] p-1.5 text-white shadow-2xl"
            aria-label="Account options"
            id={menuId}
          >
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              to={ROUTES.ADMIN_SETTINGS}
            >
              Settings
            </Link>
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              to={ROUTES.TERMS_AND_CONDITIONS}
            >
              Terms & Conditions
            </Link>
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              to={ROUTES.PRIVACY_POLICY}
            >
              Privacy Policy
            </Link>
            <Link
              className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-[#FF5733] hover:text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5733]"
              onClick={() => setOpen(false)}
              to={ROUTES.HELP_CENTER}
            >
              Help Center
            </Link>
            <button
              className="block w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
              onClick={handleLogout}
              type="button"
            >
              Sign Out
            </button>
          </nav>
        ) : null}
      </div>
    );
  }

  return <span className="text-sm text-[var(--text-muted)]">{user?.name}</span>;
}
