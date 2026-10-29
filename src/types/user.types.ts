import type { UserRole } from "@/constants/roles";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  /** Backend-verified roles; an active role is a separate, explicit choice. */
  roles: string[];
  role: UserRole | null;
  avatarUrl?: string | null;
};
