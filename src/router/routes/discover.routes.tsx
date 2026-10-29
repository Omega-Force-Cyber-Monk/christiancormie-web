import type { RouteObject } from "react-router";
import { USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { RoleGuard } from "@/router/guards/RoleGuard";
import { AuthGuard } from "@/router/guards/AuthGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";
export const discoverRoutes: RouteObject[] = [
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard allowedRoles={[USER_ROLES.CUSTOMER]} />,
        children: [
          {
            element: lazyRoute(
              () => import("@/features/customer/components/discover/DiscoverLayout"),
            ),
            children: [
              {
                path: ROUTES.CUSTOMER_MESSAGE,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerMessagePage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_COMMUNITY,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerCommunityPage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_FEED,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerFeedPage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_DISCOVER,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerDiscoverPage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_SETTINGS,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerSettingsPage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_LEADERBOARD,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerLeaderboardPage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_CREATE_POST,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerCreatePostPage"),
                ),
              },
              {
                path: ROUTES.CUSTOMER_PROFILE,
                element: lazyRoute(
                  () => import("@/features/customer/pages/CustomerProfilePage"),
                ),
              },
            ],
          },
        ],
      },
    ],
  },
];
