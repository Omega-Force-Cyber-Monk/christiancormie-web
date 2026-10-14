import { USER_ROLES, type UserRole } from "@/constants/roles";
import type { CurrentUserResponse } from "@/features/auth/types/current-user.types";
import type { AuthenticatedUser } from "@/types/user.types";

const isUserRole = (role: string): role is UserRole =>
  Object.values(USER_ROLES).includes(role as UserRole);

export const toAuthenticatedUser = (user: CurrentUserResponse): AuthenticatedUser => {
  const roles = [...new Set(user.roles.filter(isUserRole))];
  if (roles.length === 0) {
    throw new Error(
      "This account has no supported dashboard role. Please contact support.",
    );
  }
  if (roles.length > 1) {
    // No role precedence or role-selection workflow has been approved.
    throw new Error(
      "This account has multiple dashboard roles. Please contact support to resolve access.",
    );
  }
  const profile = user.profile;
  const fullName = [profile?.firstName?.trim(), profile?.lastName?.trim()]
    .filter(Boolean)
    .join(" ");

  return {
    id: user.id,
    email: user.email,
    name: profile?.displayName?.trim() || fullName || user.email,
    role: roles[0],
    avatarUrl: profile?.avatarUrl?.trim() || null,
  };
};
