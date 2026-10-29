import type { AdminUserDto } from "@/features/admin/types/admin.dto";

export const toAdminUser = (user: AdminUserDto) => ({
  ...user,
  userDisplayId: user.userId,
  activity: {
    bookings: user.activity?.totalBookings ?? user.totalBookings,
    referrals: user.activity?.referrals ?? user.referrals,
  },
  loyalty: {
    availablePoints: user.loyaltyPoints,
    lifetimePoints: user.lifetimePoints,
    redeemedPoints: user.redeemedPoints,
  },
  actions: {
    canSuspend: user.canSuspend === true,
    canRetrieve: user.canRetrieve === true,
  },
});
export type AdminUser = ReturnType<typeof toAdminUser>;
