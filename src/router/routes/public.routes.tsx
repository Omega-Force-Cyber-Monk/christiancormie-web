import { Navigate, type RouteObject } from "react-router";

import { ROUTES } from "@/constants/routes";
import { GuestGuard } from "@/router/guards/GuestGuard";
import { lazyRoute } from "@/router/routes/lazyRoute";

export const publicRoutes: RouteObject[] = [
  {
    element: <GuestGuard />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: lazyRoute(() => import("@/features/auth/pages/LoginPage")),
      },
      {
        path: ROUTES.SIGNUP,
        element: lazyRoute(() => import("@/features/auth/pages/SignupPage")),
      },
    ],
  },
  {
    path: ROUTES.PRIVACY_POLICY,
    element: lazyRoute(() => import("@/features/public/pages/PrivacyPolicyPage")),
  },
  {
    path: ROUTES.TERMS_AND_CONDITIONS,
    element: lazyRoute(() => import("@/features/public/pages/TermsAndConditionsPage")),
  },
  {
    path: ROUTES.TERMS_CONDITION_LEGACY,
    element: <Navigate replace to={ROUTES.TERMS_AND_CONDITIONS} />,
  },
  {
    path: ROUTES.TERMS_OF_SERVICE_LEGACY,
    element: <Navigate replace to={ROUTES.TERMS_AND_CONDITIONS} />,
  },
  {
    path: ROUTES.HELP_CENTER,
    element: lazyRoute(() => import("@/features/public/pages/HelpCenterPage")),
  },
  {
    path: ROUTES.LEGACY_ADMIN_DASHBOARD,
    element: <Navigate replace to={ROUTES.ADMIN_DASHBOARD} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_DASHBOARD_ALIAS,
    element: <Navigate replace to={ROUTES.ADMIN_DASHBOARD} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_BOOKINGS,
    element: <Navigate replace to={ROUTES.ADMIN_BOOKINGS} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_VENDORS,
    element: <Navigate replace to={ROUTES.ADMIN_VENDORS} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_USERS,
    element: <Navigate replace to={ROUTES.ADMIN_USERS} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_COMMUNITY,
    element: <Navigate replace to={ROUTES.ADMIN_COMMUNITY} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_REVIEWS,
    element: <Navigate replace to={ROUTES.ADMIN_REVIEWS} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_REWARDS,
    element: <Navigate replace to={ROUTES.ADMIN_REWARDS} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_PAYMENTS,
    element: <Navigate replace to={ROUTES.ADMIN_PAYMENTS} />,
  },
  {
    path: ROUTES.LEGACY_ADMIN_SETTINGS,
    element: <Navigate replace to={ROUTES.ADMIN_SETTINGS} />,
  },
  {
    path: ROUTES.UNAUTHORIZED,
    element: lazyRoute(() => import("@/router/routes/UnauthorizedPage")),
  },
];
