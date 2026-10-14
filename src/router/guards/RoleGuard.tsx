import { Navigate, Outlet } from "react-router";

import { useAppSelector } from "@/app/hooks";
import type { UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";

type RoleGuardProps = {
  allowedRoles: UserRole[];
};

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const currentRole = useAppSelector(selectCurrentRole);

  if (!currentRole || !allowedRoles.includes(currentRole)) {
    return <Navigate replace to={ROUTES.UNAUTHORIZED} />;
  }

  return <Outlet />;
}
