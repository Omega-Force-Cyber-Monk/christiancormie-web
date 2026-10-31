import { z } from "zod";
import type { AdminBookingDto, AdminPayoutDto } from "../types/admin.dto";
import type { BookingIssue } from "@/features/customer/schemas/bookingIssues.schema";
export const financialBlocker =
  "Unavailable: payment security, settlement, idempotency, concurrency and reconciliation require verification and explicit approval.";
export type IssueDecision = "RELEASE_PAYOUT" | "FULL_REFUND";
export function issueDecisionState(
  issue: BookingIssue,
  booking: AdminBookingDto,
  decision: IssueDecision,
) {
  const reasons: string[] = [];
  if (
    !z.uuid().safeParse(booking.id).success ||
    issue.bookingId !== booking.id ||
    !z.uuid().safeParse(issue.id).success
  )
    reasons.push("Booking/issue identity is unavailable or mismatched.");
  if (issue.status !== "OPEN")
    reasons.push(`Issue is ${issue.status}; only OPEN issues can be resolved.`);
  if (booking.status === "COMPLETED")
    reasons.push("Completed bookings cannot be resolved through issue decisions.");
  if (!booking.payment || !z.uuid().safeParse(booking.payment.id).success)
    reasons.push("Verified payment identity is unavailable.");
  if (booking.payment?.status !== "SUCCEEDED")
    reasons.push(
      "The returned payment is not SUCCEEDED; the backend requires a succeeded booking payment.",
    );
  reasons.push(
    decision === "RELEASE_PAYOUT"
      ? "Payout identity, account readiness and release eligibility require authoritative verification."
      : "Refundable balance and provider refund status require authoritative verification.",
  );
  reasons.push(financialBlocker);
  return { decision, enabled: false as const, reasons };
}
export function payoutState(p: AdminPayoutDto) {
  const status =
    ({ APPROVED: "PAID", ON_HOLD: "PROCESSING" } as Record<string, string>)[p.status] ??
    p.status;
  return {
    status,
    enabled: false as const,
    retryCandidate:
      status === "FAILED" &&
      z.uuid().safeParse(p.id).success &&
      z.uuid().safeParse(p.vendorId).success,
    reason:
      status === "FAILED"
        ? `Failed payout; booking/payment links and account readiness are absent from this presenter. ${financialBlocker}`
        : `Only FAILED payouts can be retried by approve/retry endpoints. ${financialBlocker}`,
  };
}
