import type { RouteObject } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const vendorRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.VENDOR]} />,
    children: [
      {
        path: "vendor",
        element: lazyRoute(() => import("@/features/vendor/pages/VendorDashboardPage")),
      },
      {
        path: "vendor/orders",
        element: lazyRoute(() => import("@/features/vendor/pages/VendorOrdersPage")),
      },
      {
        path: "vendor/products",
        element: lazyRoute(() => import("@/features/vendor/pages/VendorProductsPage")),
      },
    ],
  },
];
