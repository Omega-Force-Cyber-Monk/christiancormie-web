import type { LucideIcon } from "lucide-react";

import type { UserRole } from "@/constants/roles";

export type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
  children?: NavigationItem[];
};
