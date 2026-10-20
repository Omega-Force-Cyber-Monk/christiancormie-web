import { matchPath } from "react-router";

import { USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import type { RouteMetadata } from "@/router/metadata/route-metadata.types";

export const routeMetadata: RouteMetadata[] = [
  {
    path: ROUTES.VENDOR_SETTINGS,
    title: "Vendor Settings",
    breadcrumb: "Settings",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_LEADERBOARD,
    title: "Vendor Leaderboard",
    breadcrumb: "Leaderboard",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.CUSTOMER_SETTINGS,
    title: "Settings",
    breadcrumb: "Settings",
    requiredRoles: [USER_ROLES.CUSTOMER],
  },
  {
    path: ROUTES.CUSTOMER_LEADERBOARD,
    title: "Leaderboard",
    breadcrumb: "Leaderboard",
    requiredRoles: [USER_ROLES.CUSTOMER],
  },
  {
    path: ROUTES.CUSTOMER_CREATE_POST,
    title: "Create Post",
    breadcrumb: "Create Post",
    requiredRoles: [USER_ROLES.CUSTOMER],
  },
  {
    path: ROUTES.CUSTOMER_MESSAGE,
    title: "Message",
    breadcrumb: "Message",
    requiredRoles: [USER_ROLES.CUSTOMER],
    navigation: true,
  },
  {
    path: ROUTES.CUSTOMER_COMMUNITY,
    title: "Community",
    breadcrumb: "Community",
    requiredRoles: [USER_ROLES.CUSTOMER],
    navigation: true,
  },
  {
    path: ROUTES.CUSTOMER_FEED,
    title: "Feed",
    breadcrumb: "Feed",
    requiredRoles: [USER_ROLES.CUSTOMER],
    navigation: true,
  },
  {
    path: ROUTES.CUSTOMER_OWN_PROFILE,
    title: "Profile",
    breadcrumb: "Profile",
    requiredRoles: [USER_ROLES.CUSTOMER],
  },
  {
    path: ROUTES.CUSTOMER_PUBLIC_PROFILE,
    title: "Profile",
    breadcrumb: "Profile",
    requiredRoles: [USER_ROLES.CUSTOMER],
  },
  {
    path: ROUTES.CUSTOMER_PROFILE,
    title: "View Profile",
    breadcrumb: "View Profile",
    requiredRoles: [USER_ROLES.CUSTOMER],
  },
  {
    path: ROUTES.CUSTOMER_DISCOVER,
    title: "Discover",
    breadcrumb: "Discover",
    requiredRoles: [USER_ROLES.CUSTOMER],
    navigation: true,
  },
  {
    path: ROUTES.LOGIN,
    title: "Sign in",
    breadcrumb: "Sign in",
  },
  {
    path: ROUTES.SIGNUP,
    title: "Create Account",
    breadcrumb: "Create Account",
  },
  {
    path: ROUTES.PRIVACY_POLICY,
    title: "Privacy Policy",
    breadcrumb: "Privacy Policy",
  },
  {
    path: ROUTES.TERMS_AND_CONDITIONS,
    title: "Terms and Conditions",
    breadcrumb: "Terms",
  },
  {
    path: ROUTES.HELP_CENTER,
    title: "Help Center",
    breadcrumb: "Help Center",
  },
  {
    path: ROUTES.UNAUTHORIZED,
    title: "Unauthorized",
    breadcrumb: "Unauthorized",
  },
  {
    path: ROUTES.CUSTOMER_ORDERS,
    title: "Orders",
    breadcrumb: "Orders",
    requiredRoles: [USER_ROLES.CUSTOMER],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_DROPS,
    title: "Vendor Drops",
    breadcrumb: "Drops",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_CREATE_POST,
    title: "Vendor Create Post",
    breadcrumb: "Create post",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_MESSAGE,
    title: "Vendor Message",
    breadcrumb: "Message",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_EARNINGS,
    title: "Earnings & Analytics",
    breadcrumb: "Earnings & Analytics",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_PROFILE,
    title: "Vendor Profile",
    breadcrumb: "Profile",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_FEED,
    title: "Vendor Feed",
    breadcrumb: "Feed",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_DASHBOARD,
    title: "Vendor Home",
    breadcrumb: "Home",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_ORDERS,
    title: "Requests",
    breadcrumb: "Requests",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_PRODUCTS,
    title: "Products",
    breadcrumb: "Products",
    requiredRoles: [USER_ROLES.VENDOR],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_STAFF_DASHBOARD,
    title: "Staff Dashboard",
    breadcrumb: "Dashboard",
    requiredRoles: [USER_ROLES.VENDOR_STAFF],
    navigation: true,
  },
  {
    path: ROUTES.VENDOR_STAFF_TASKS,
    title: "Tasks",
    breadcrumb: "Tasks",
    requiredRoles: [USER_ROLES.VENDOR_STAFF],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_DASHBOARD,
    title: "Admin Dashboard",
    breadcrumb: "Admin",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_USERS,
    title: "Users",
    breadcrumb: "Users",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_BOOKINGS,
    title: "Bookings",
    breadcrumb: "Bookings",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_VENDORS,
    title: "Vendors",
    breadcrumb: "Vendors",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_COMMUNITY,
    title: "Community",
    breadcrumb: "Community",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_REVIEWS,
    title: "Reviews",
    breadcrumb: "Reviews",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_REWARDS,
    title: "Rewards",
    breadcrumb: "Rewards",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_PAYMENTS,
    title: "Payments",
    breadcrumb: "Payments",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
  {
    path: ROUTES.ADMIN_SETTINGS,
    title: "Settings",
    breadcrumb: "Settings",
    requiredRoles: [USER_ROLES.ADMIN],
    navigation: true,
  },
];

export const getRouteMetadata = (pathname: string) =>
  routeMetadata.find((metadata) => metadata.path === pathname) ??
  routeMetadata.find(
    (metadata) =>
      metadata.path.includes("/:") &&
      matchPath({ path: metadata.path, end: true }, pathname),
  );
