import type { RouteObject } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const customerRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.CUSTOMER]} />,
    children: [
      {
        path: "customer",
        element: lazyRoute(
          () => import("@/features/customer/pages/CustomerDashboardPage"),
        ),
      },
      {
        path: "customer/orders",
        element: lazyRoute(
          () => import("@/features/customer/pages/CustomerOrdersPage"),
        ),
      },
    ],
  },
];
