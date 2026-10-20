import type { RouteObject } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const vendorHomeRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.VENDOR]} />,
    children: [
      {
        path: "vendor",
        element: lazyRoute(
          () => import("@/features/vendor/components/home/VendorHomeLayout"),
        ),
        children: [
          {
            path: "settings",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorSettingsPage"),
            ),
          },
          {
            path: "leaderboard",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorLeaderboardPage"),
            ),
          },
          {
            path: "profile",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorProfilePage"),
            ),
          },
          {
            path: "earnings-and-analytics",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorEarningsPage"),
            ),
          },
          {
            path: "messages",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorMessagesPage"),
            ),
          },
          {
            path: "create-post",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorCreatePostPage"),
            ),
          },
          {
            path: "orders",
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorOrdersPage"),
            ),
          },
          {
            index: true,
            element: lazyRoute(
              () => import("@/features/vendor/pages/VendorDashboardPage"),
            ),
          },
          {
            path: "feed",
            element: lazyRoute(() => import("@/features/vendor/pages/VendorFeedPage")),
          },
          {
            path: "drops",
            element: lazyRoute(() => import("@/features/vendor/pages/VendorDropsPage")),
          },
        ],
      },
    ],
  },
];

export const vendorRoutes: RouteObject[] = [
  {
    element: <RoleGuard allowedRoles={[USER_ROLES.VENDOR]} />,
    children: [
      {
        path: "vendor/products",
        element: lazyRoute(() => import("@/features/vendor/pages/VendorProductsPage")),
      },
    ],
  },
];
