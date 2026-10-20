import { Navigate, type RouteObject } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const customerRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.CUSTOMER]} />,
    children: [
      {
        path: "customer",
        element: <Navigate replace to={ROUTES.CUSTOMER_DISCOVER} />,
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
