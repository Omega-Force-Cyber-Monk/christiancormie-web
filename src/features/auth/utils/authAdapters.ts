import { USER_ROLES, type UserRole } from "@/constants/roles";
import type { SourceAuthUser } from "@/features/auth/types/auth.types";
import type { AuthenticatedUser } from "@/types/user.types";

const isUserRole = (role: string): role is UserRole =>
  Object.values(USER_ROLES).includes(role as UserRole);

export const toAuthenticatedUser = (user: SourceAuthUser): AuthenticatedUser => {
  const role = user.roles.find(isUserRole) ?? USER_ROLES.CUSTOMER;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    role,
  };
};
