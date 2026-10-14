import { Navigate } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";

const roleHomeRoute = {
  [USER_ROLES.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
  [USER_ROLES.VENDOR]: ROUTES.VENDOR_DASHBOARD,
  [USER_ROLES.VENDOR_STAFF]: ROUTES.VENDOR_STAFF_DASHBOARD,
  [USER_ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
} as const;

export function DashboardRedirect() {
  const role = useAppSelector(selectCurrentRole);

  if (!role) {
    return <Navigate replace to={ROUTES.LOGIN} />;
  }

  return <Navigate replace to={roleHomeRoute[role]} />;
}
