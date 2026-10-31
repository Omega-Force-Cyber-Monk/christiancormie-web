import type {
  AdminPaymentsManagementResponse,
  AdminRewardsManagementResponse,
} from "@/features/admin/types/admin.types";
import { formatDate, formatNumber } from "@/features/admin/utils/adminFormat";
import { bookingMoney } from "@/features/admin/utils/adminBookings";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";

export type AdminOperationalRow = {
  id: string;
  displayId: string;
  name: string;
  detail: string;
  value: string;
  status: string;
};
export function paymentRows(
  tab: string,
  data?: AdminPaymentsManagementResponse,
): AdminOperationalRow[] {
  if (tab === "Payout Requests")
    return (data?.payoutRequests ?? []).map((row) => ({
      id: row.id,
      displayId: row.payoutId,
      name: row.vendorName ?? "N/A",
      detail: `${formatDate(row.requestedAt)}; ${row.payoutMethod?.label ?? "N/A"}`,
      value: formatFinancialAmount(financialAmount(row.amount, row.currency, "major")),
      status: row.status,
    }));
  if (tab === "Transaction History")
    return (data?.transactions ?? []).map((row) => ({
      id: `${row.type}:${row.id}`,
      displayId: row.transactionId,
      name: row.vendorName ?? "N/A",
      detail: `${row.type}; ${formatDate(row.date)}; ${row.method}`,
      value: bookingMoney(row.amount),
      status: row.status,
    }));
  if (tab === "Payment Methods")
    return (data?.paymentMethods?.methods ?? []).map((row) => ({
      id: row.id,
      displayId: row.id,
      name: row.vendorName ?? "N/A",
      detail: row.label,
      value: row.payoutsEnabled ? "Payouts enabled" : "Payouts disabled",
      status: row.isVerified ? "Verified" : "Not verified",
    }));
  return (data?.revenueOverview?.monthlyRevenueBreakdown ?? []).map((row) => ({
    id: String(row.monthIndex),
    displayId: row.month,
    name: "Revenue",
    detail: `Commission: ${bookingMoney(row.commission)}; Payouts: ${bookingMoney(row.payouts)}`,
    value: bookingMoney(row.revenue),
    status: "N/A",
  }));
}
export function rewardRows(
  tab: string,
  data?: AdminRewardsManagementResponse,
): AdminOperationalRow[] {
  if (tab === "Leaderboard")
    return (data?.leaderboard ?? []).map((row) => ({
      id: `${row.rank}:${row.vendorId ?? row.foodTruckId ?? "unassigned"}`,
      displayId: String(row.rank),
      name: row.truckName ?? "N/A",
      detail: `${row.ownerName}; ${row.location ?? "N/A"}; ${formatNumber(row.bookings)} bookings`,
      value: `${formatNumber(row.pointsGiven)} points`,
      status: "N/A",
    }));
  if (tab === "Redeem Transactions")
    return (data?.redeemTransactions ?? []).map((row) => ({
      id: row.id,
      displayId: row.transactionId,
      name: row.user?.name ?? "N/A",
      detail: `${formatDate(row.date)}; ${row.truck?.name ?? "N/A"}; ${formatNumber(row.credit)} credits`,
      value: `${formatNumber(row.points)} points`,
      status: row.status,
    }));
  return (data?.topUsers ?? []).map((row) => ({
    id: row.userId,
    displayId: String(row.rank),
    name: row.name,
    detail: `${formatNumber(row.availablePoints)} available; ${formatNumber(row.redeemedPoints)} redeemed`,
    value: `${formatNumber(row.points)} lifetime points`,
    status: row.tier?.name ?? "N/A",
  }));
}
