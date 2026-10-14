export const USER_ROLES = {
  CUSTOMER: "CUSTOMER",
  VENDOR: "VENDOR",
  VENDOR_STAFF: "VENDOR_STAFF",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ALL_USER_ROLES = Object.values(USER_ROLES);
