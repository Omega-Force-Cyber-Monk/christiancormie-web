import { z } from "zod";
import { PAYMENT_STATUS_LABELS } from "../utils/paymentStatus";
export const paymentStateSchema = z.enum(
  Object.keys(PAYMENT_STATUS_LABELS) as [
    keyof typeof PAYMENT_STATUS_LABELS,
    ...Array<keyof typeof PAYMENT_STATUS_LABELS>,
  ],
);
const money = z.string().regex(/^-?\d+(\.\d+)?$/);
const date = z.iso.datetime({ offset: true });
export const payoutStateSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
]);
const refund = z.object({
  id: z.uuid(),
  amount: money,
  reason: z.string().nullable(),
  status: paymentStateSchema,
  processedAt: date.nullable(),
});
export const vendorTransactionSchema = z.object({
  paymentId: z.uuid(),
  bookingId: z.uuid(),
  bookingNumber: z.string().nullable(),
  eventName: z.string().nullable(),
  eventStartsAt: date.nullable(),
  foodTruck: z.object({ id: z.uuid(), name: z.string() }).nullable(),
  customer: z.object({ id: z.uuid(), name: z.string().nullable() }).nullable(),
  grossAmount: money,
  commissionAmount: money,
  vendorNetAmount: money,
  currency: z.string(),
  paymentStatus: paymentStateSchema,
  payout: z
    .object({
      id: z.uuid(),
      amount: money,
      status: payoutStateSchema,
      paidAt: date.nullable(),
      createdAt: date,
    })
    .nullable(),
  refunds: z.array(refund),
  paidAt: date.nullable(),
  createdAt: date,
});
export type VendorTransaction = z.infer<typeof vendorTransactionSchema>;
const meta = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});
export const transactionsSchema = z.object({
  items: z.array(vendorTransactionSchema),
  meta,
});
export const refundsSchema = z.object({
  items: z.array(
    refund.extend({
      paymentId: z.uuid(),
      bookingId: z.uuid(),
      bookingNumber: z.string(),
      eventName: z.string().nullable(),
      currency: z.string(),
      paymentStatus: paymentStateSchema,
    }),
  ),
  meta,
});
export const payoutsSchema = z.array(
  z.object({
    id: z.uuid(),
    vendorId: z.uuid(),
    bookingId: z.uuid().nullable(),
    paymentId: z.uuid().nullable(),
    amount: money,
    currency: z.string(),
    status: payoutStateSchema,
    paidAt: date.nullable(),
    createdAt: date,
  }),
);
export const summarySchema = z.object({
  totalPayments: z.number().int().nonnegative(),
  succeededPayments: z.number().int().nonnegative(),
  failedPayments: z.number().int().nonnegative(),
  processingPayments: z.number().int().nonnegative(),
  refundedPayments: z.number().int().nonnegative(),
});
export const financialFiltersSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().min(1).max(100),
    status: paymentStateSchema.optional(),
    from: date.optional(),
    to: date.optional(),
  })
  .strict()
  .refine(
    (f) => !f.from || !f.to || Date.parse(f.from) <= Date.parse(f.to),
    "From must precede To",
  );
export type FinancialFilters = z.infer<typeof financialFiltersSchema>;
