import { USER_ROLES, type UserRole } from "@/constants/roles";
import { STORAGE_KEYS } from "@/constants/storage";
import type { AuthenticatedUser } from "@/types/user.types";
import { storage } from "@/utils/storage";

const isUserRole = (value: string | null): value is UserRole =>
  value !== null && Object.values(USER_ROLES).includes(value as UserRole);

export const getInitialMockRole = (): UserRole => {
  const storedRole = storage.get(STORAGE_KEYS.MOCK_ROLE);
  return isUserRole(storedRole) ? storedRole : USER_ROLES.ADMIN;
};

export const persistMockRole = (role: UserRole) => {
  storage.set(STORAGE_KEYS.MOCK_ROLE, role);
};

export const createMockUser = (role: UserRole): AuthenticatedUser => ({
  id: "dev-current-user",
  name: "Christina Cormie",
  email: "christina@example.com",
  role,
});
