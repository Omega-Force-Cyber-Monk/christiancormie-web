import { z } from "zod";
const money = z.string().regex(/^-?\d+(\.\d+)?$/);
export const bookingQuoteSchema = z.object({
  id: z.uuid(),
  bookingId: z.uuid(),
  vendorId: z.uuid(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"]),
  pricingModel: z.enum(["FLAT_FEE", "PER_PERSON"]).nullable(),
  pricePerPerson: money.nullable(),
  selectedMenuItems: z.array(z.string()).nullable(),
  extraCharges: z
    .array(z.object({ label: z.string(), amount: z.number().finite() }))
    .nullable(),
  baseServiceFee: money,
  transportFee: money,
  serviceFee: money,
  taxAmount: money,
  discountAmount: money,
  totalAmount: money,
  paymentPreference: z
    .enum(["DEPOSIT_ONLY", "PREPAID_IN_FULL", "NO_PREFERENCE"])
    .nullable(),
  depositAmount: money,
  depositPercent: money,
  balanceDueAtEvent: money,
  message: z.string().nullable(),
  noteToClient: z.string().nullable(),
  terms: z.string().nullable(),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type BookingQuote = z.infer<typeof bookingQuoteSchema>;
const amount = z.number().finite().min(0).max(999999999);
export const quoteInputSchema = z
  .object({
    pricingModel: z.enum(["FLAT_FEE", "PER_PERSON"]),
    baseServiceFee: amount.optional(),
    pricePerPerson: amount
      .min(0.01)
      .refine(
        (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.000001,
        "Use at most two decimal places",
      )
      .optional(),
    selectedMenuItems: z.array(z.string().trim().min(1)).optional(),
    extraCharges: z
      .array(z.object({ label: z.string().trim().min(1), amount }))
      .max(20)
      .optional(),
    transportFee: amount.optional(),
    serviceFee: amount.optional(),
    taxAmount: amount.optional(),
    discountAmount: amount.optional(),
    paymentPreference: z.enum(["DEPOSIT_ONLY", "PREPAID_IN_FULL"]),
    depositAmount: amount.optional(),
    depositPercent: z.number().finite().gt(0).max(100).optional(),
    message: z.string().optional(),
    noteToClient: z.string().optional(),
    terms: z.string().optional(),
    expiresAt: z.iso
      .datetime({ offset: true })
      .refine((s) => Date.parse(s) > Date.now(), "Expiry must be in the future")
      .optional(),
  })
  .strict()
  .superRefine((v, c) => {
    if (
      v.pricingModel === "PER_PERSON"
        ? !v.pricePerPerson || v.baseServiceFee !== undefined
        : v.baseServiceFee === undefined || v.pricePerPerson !== undefined
    )
      c.addIssue({
        code: "custom",
        message: "Supply the price matching the pricing model",
        path: ["pricingModel"],
      });
    if (
      v.paymentPreference === "DEPOSIT_ONLY" &&
      !(v.depositAmount && v.depositAmount > 0) &&
      !v.depositPercent
    )
      c.addIssue({
        code: "custom",
        message: "Enter a positive deposit amount or percentage",
        path: ["depositAmount"],
      });
    if (
      v.paymentPreference === "PREPAID_IN_FULL" &&
      (v.depositAmount !== undefined || v.depositPercent !== undefined)
    )
      c.addIssue({
        code: "custom",
        message: "Full prepayment is calculated by the backend; omit deposit overrides",
        path: ["depositAmount"],
      });
  });
export type QuoteInput = z.infer<typeof quoteInputSchema>;
export function validQuoteForGuests(v: QuoteInput, guests: number) {
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  if (v.pricingModel === "PER_PERSON" && (!Number.isInteger(guests) || guests < 1))
    return false;
  const base = round(
    v.pricingModel === "PER_PERSON"
      ? (v.pricePerPerson ?? 0) * guests
      : (v.baseServiceFee ?? 0),
  );
  const total = round(
    base +
      round(v.transportFee ?? 0) +
      (v.extraCharges ?? []).reduce((sum, e) => sum + round(e.amount), 0) +
      round(v.serviceFee ?? 0) +
      round(v.taxAmount ?? 0) -
      round(v.discountAmount ?? 0),
  );
  if (total <= 0 || total > 999999999) return false;
  if (v.paymentPreference === "PREPAID_IN_FULL") return true;
  const fromPercent =
    v.depositPercent === undefined
      ? undefined
      : round((total * v.depositPercent) / 100);
  const deposit = round(v.depositAmount ?? fromPercent ?? 0);
  return (
    deposit > 0 &&
    deposit <= total &&
    (v.depositAmount === undefined ||
      fromPercent === undefined ||
      fromPercent === deposit)
  );
}
