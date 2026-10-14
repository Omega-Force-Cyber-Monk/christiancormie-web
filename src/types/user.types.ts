import type { UserRole } from "@/constants/roles";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
