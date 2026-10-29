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
  const profile = user.profile;
  const fullName = [profile?.firstName?.trim(), profile?.lastName?.trim()]
    .filter(Boolean)
    .join(" ");

  return {
    id: user.id,
    email: user.email,
    name: profile?.displayName?.trim() || fullName || user.email,
    roles: [...new Set(user.roles)],
    role: roles.length === 1 ? roles[0] : null,
    avatarUrl: profile?.avatarUrl?.trim() || null,
  };
};
