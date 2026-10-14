import {
  Calendar,
  ClipboardList,
  Gift,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import type { NavigationItem } from "@/config/navigation/navigation.types";
import { USER_ROLES } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: ROUTES.CUSTOMER_DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Orders",
    path: ROUTES.CUSTOMER_ORDERS,
    icon: ShoppingBag,
    allowedRoles: [USER_ROLES.CUSTOMER],
  },
  {
    label: "Dashboard",
    path: ROUTES.VENDOR_DASHBOARD,
    icon: LayoutDashboard,
    allowedRoles: [USER_ROLES.VENDOR],
  },
  {
    label: "Orders",
    path: ROUTES.VENDOR_ORDERS,
    icon: ClipboardList,
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
