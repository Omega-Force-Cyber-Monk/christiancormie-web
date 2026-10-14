import type { UserRole } from "@/constants/roles";

export type RouteMetadata = {
  path: string;
  title: string | ((pathname: string) => string);
  breadcrumb: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  navigation?: boolean;
};
