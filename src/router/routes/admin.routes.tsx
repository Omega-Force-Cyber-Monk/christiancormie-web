import type { RouteObject } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const adminRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.ADMIN]} />,
    children: [
      {
        path: "admin",
        element: lazyRoute(() => import("@/features/admin/pages/AdminDashboardPage")),
      },
      {
        path: "admin/users",
        element: lazyRoute(() => import("@/features/admin/pages/AdminUsersPage")),
      },
      {
        path: "admin/bookings",
        element: lazyRoute(() => import("@/features/admin/pages/AdminBookingsPage")),
      },
      {
        path: "admin/vendors",
        element: lazyRoute(() => import("@/features/admin/pages/AdminVendorsPage")),
      },
      {
        path: "admin/community",
        element: lazyRoute(() => import("@/features/admin/pages/AdminCommunityPage")),
      },
      {
        path: "admin/reviews",
        element: lazyRoute(
          () => import("@/features/admin/pages/AdminReviewsModerationPage"),
        ),
      },
      {
        path: "admin/rewards",
        element: lazyRoute(() => import("@/features/admin/pages/AdminRewardsPage")),
      },
      {
        path: "admin/payments",
        element: lazyRoute(() => import("@/features/admin/pages/AdminPaymentsPage")),
      },
      {
        path: "admin/settings",
        element: lazyRoute(() => import("@/features/admin/pages/AdminSettingsPage")),
      },
    ],
  },
];
