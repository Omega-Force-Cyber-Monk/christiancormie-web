import { Navigate, Outlet, useLocation } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { SessionGate } from "@/features/auth/components/SessionGate";
import { ROUTES } from "@/constants/routes";
import { selectIsAuthenticated } from "@/features/auth/store/auth.selectors";

export function AuthGuard() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  return (
    <SessionGate>
      {isAuthenticated ? (
        <Outlet />
      ) : (
        <Navigate replace state={{ from: location }} to={ROUTES.LOGIN} />
      )}
    </SessionGate>
  );
}
