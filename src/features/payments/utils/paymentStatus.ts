// Reviewed Payment.status values only. Booking, payout and provider states are
// separate contracts; a truthy value or accepted quote must never imply payment.
export const PAYMENT_STATUS_LABELS = {
  PENDING: "Payment request recorded; not paid",
  PROCESSING: "Payment processing; not yet confirmed",
  SUCCEEDED: "Payment confirmed by the backend",
  FAILED: "Payment failed",
  PARTIALLY_REFUNDED: "Payment partially refunded",
  REFUNDED: "Payment refunded",
  CANCELLED: "Payment cancelled",
} as const;
export type PaymentStatus = keyof typeof PAYMENT_STATUS_LABELS;

export function paymentStatusLabel(status: unknown): string {
  return typeof status === "string" && Object.hasOwn(PAYMENT_STATUS_LABELS, status)
    ? PAYMENT_STATUS_LABELS[status as PaymentStatus]
    : "Payment status unavailable";
}
