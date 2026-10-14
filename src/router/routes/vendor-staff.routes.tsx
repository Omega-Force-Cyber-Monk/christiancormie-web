import type { RouteObject } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const vendorStaffRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.VENDOR_STAFF]} />,
    children: [
      {
        path: "vendor-staff",
        element: lazyRoute(
          () => import("@/features/vendor-staff/pages/VendorStaffDashboardPage"),
        ),
      },
      {
        path: "vendor-staff/tasks",
        element: lazyRoute(
          () => import("@/features/vendor-staff/pages/VendorStaffTasksPage"),
        ),
      },
    ],
  },
];
