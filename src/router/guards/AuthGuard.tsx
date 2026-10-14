import { Navigate, Outlet, useLocation } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { PageLoader } from "@/components/feedback/PageLoader";
import { ROUTES } from "@/constants/routes";
import {
  selectIsAuthenticated,
  selectIsAuthHydrated,
} from "@/features/auth/store/auth.selectors";

export function AuthGuard() {
  const isHydrated = useAppSelector(selectIsAuthHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isHydrated) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={ROUTES.LOGIN} />;
  }

  return <Outlet />;
}
