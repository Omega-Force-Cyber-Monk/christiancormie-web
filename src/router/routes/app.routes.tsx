import { Navigate, type RouteObject } from "react-router";

import { ROUTES } from "@/constants/routes";
import { DashboardLayout } from "@/layouts/DashboardLayout/DashboardLayout";
import { AuthGuard } from "@/router/guards/AuthGuard";
import { DashboardRedirect } from "@/router/guards/DashboardRedirect";
import { adminRoutes } from "@/router/routes/admin.routes";
import { customerRoutes } from "@/router/routes/customer.routes";
import { discoverRoutes } from "@/router/routes/discover.routes";
import { ErrorPage } from "@/router/routes/ErrorPage";
import { lazyRoute } from "@/router/routes/lazyRoute";
import { publicRoutes } from "@/router/routes/public.routes";
import { RouteTitleManager } from "@/router/RouteTitleManager";
import { vendorRoutes } from "@/router/routes/vendor.routes";
import { vendorStaffRoutes } from "@/router/routes/vendor-staff.routes";

export const appRoutes: RouteObject[] = [
  {
    path: ROUTES.HOME,
    element: <RouteTitleManager />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate replace to={ROUTES.DASHBOARD} />,
      },
      ...publicRoutes,
      ...discoverRoutes,
      {
        element: <AuthGuard />,
        children: [
          {
            path: "dashboard",
            element: <DashboardLayout />,
            children: [
              {
                index: true,
                element: <DashboardRedirect />,
              },
              ...customerRoutes,
              ...vendorRoutes,
              ...vendorStaffRoutes,
              ...adminRoutes,
            ],
          },
        ],
      },
      {
        path: "*",
        element: lazyRoute(() => import("@/router/routes/NotFoundPage")),
      },
    ],
  },
];
