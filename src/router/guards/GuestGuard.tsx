import { Navigate, Outlet } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { SessionGate } from "@/features/auth/components/SessionGate";
import { ROUTES } from "@/constants/routes";
import { selectIsAuthenticated } from "@/features/auth/store/auth.selectors";

export function GuestGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <SessionGate>
      {isAuthenticated ? <Navigate replace to={ROUTES.DASHBOARD} /> : <Outlet />}
    </SessionGate>
  );
}
