import {
  Calendar,
  Activity,
  Zap,
  ClipboardList,
  Gift,
  House,
  LayoutDashboard,
  MessageSquare,
  Package,
  Plus,
  Rss,
  ShoppingBag,
  Star,
  Truck,
  Users,
  UserRound,
  Wallet,
  Trophy,
  Settings,
} from "lucide-react";

import type { NavigationItem } from "@/config/navigation/navigation.types";
import { USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

export const navigationItems: NavigationItem[] = [
  {
    label: "Settings",
    path: ROUTES.VENDOR_SETTINGS,
    icon: Settings,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Leaderboard",
    path: ROUTES.VENDOR_LEADERBOARD,
    icon: Trophy,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Message",
    path: ROUTES.CUSTOMER_MESSAGE,
    icon: MessageSquare,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Community",
    path: ROUTES.CUSTOMER_COMMUNITY,
    icon: MessageSquare,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Feed",
    path: ROUTES.CUSTOMER_FEED,
    icon: Rss,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Discover",
    path: ROUTES.CUSTOMER_DISCOVER,
    icon: House,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Orders",
    path: ROUTES.CUSTOMER_ORDERS,
    icon: ShoppingBag,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Drops",
    path: ROUTES.VENDOR_DROPS,
    icon: Zap,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Feed",
    path: ROUTES.VENDOR_FEED,
    icon: Rss,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Dashboard",
    path: ROUTES.VENDOR_DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Requests",
    path: ROUTES.VENDOR_ORDERS,
    icon: ClipboardList,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Create post",
    path: ROUTES.VENDOR_CREATE_POST,
    icon: Plus,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Message",
    path: ROUTES.VENDOR_MESSAGE,
    icon: MessageSquare,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Earnings & Analytics",
    path: ROUTES.VENDOR_EARNINGS,
    icon: Activity,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Profile",
    path: ROUTES.VENDOR_PROFILE,
    icon: UserRound,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Products",
    path: ROUTES.VENDOR_PRODUCTS,
    icon: Package,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Dashboard",
    path: ROUTES.VENDOR_STAFF_DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [USER_ROLES.VENDOR_STAFF],
  },
  {
    label: "Tasks",
    path: ROUTES.VENDOR_STAFF_TASKS,
    icon: ClipboardList,
    allowedRoles: [USER_ROLES.VENDOR_STAFF],
  },
  {
    label: "Dashboard",
    path: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Bookings",
    path: ROUTES.ADMIN_BOOKINGS,
    icon: Calendar,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Vendors",
    path: ROUTES.ADMIN_VENDORS,
    icon: Truck,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Users",
    path: ROUTES.ADMIN_USERS,
    icon: Users,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Community",
    path: ROUTES.ADMIN_COMMUNITY,
    icon: MessageSquare,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Reviews",
    path: ROUTES.ADMIN_REVIEWS,
    icon: Star,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Payments",
    path: ROUTES.ADMIN_PAYMENTS,
    icon: Wallet,
    allowedRoles: [USER_ROLES.ADMIN],
  },
  {
    label: "Rewards",
    path: ROUTES.ADMIN_REWARDS,
    icon: Gift,
    allowedRoles: [USER_ROLES.ADMIN],
  },
];

export const getNavigationForRole = (role: string | null) =>
  navigationItems.filter((item) =>
    item.allowedRoles.some((allowedRole) => allowedRole === role),
  );
