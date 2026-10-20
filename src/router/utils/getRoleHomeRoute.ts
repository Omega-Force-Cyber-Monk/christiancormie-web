import { USER_ROLES, type UserRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

const roleHomeRoute = {
  [USER_ROLES.CUSTOMER]: ROUTES.CUSTOMER_DISCOVER,
  [USER_ROLES.VENDOR]: ROUTES.VENDOR_DASHBOARD,
  [USER_ROLES.VENDOR_STAFF]: ROUTES.VENDOR_STAFF_DASHBOARD,
  [USER_ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
} as const;

export const getRoleHomeRoute = (role: UserRole | null) =>
  role ? roleHomeRoute[role] : ROUTES.LOGIN;
