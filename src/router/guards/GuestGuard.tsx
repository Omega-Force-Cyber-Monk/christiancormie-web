import { Navigate, Outlet } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { PageLoader } from "@/components/feedback/PageLoader";
import { ROUTES } from "@/constants/routes";
import {
  selectIsAuthenticated,
  selectIsAuthHydrated,
} from "@/features/auth/store/auth.selectors";

export function GuestGuard() {
  const isHydrated = useAppSelector(selectIsAuthHydrated);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (!isHydrated) return <PageLoader />;

  if (isAuthenticated) {
    return <Navigate replace to={ROUTES.DASHBOARD} />;
  }

  return <Outlet />;
}
