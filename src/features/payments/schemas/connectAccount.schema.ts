import { z } from "zod";

// Review only status fields. Never retain provider IDs, bank data or arbitrary metadata.
const wireAccount = z
  .object({
    vendorId: z.uuid(),
    onboardingCompleted: z.boolean(),
    chargesEnabled: z.boolean(),
    payoutsEnabled: z.boolean(),
    disabledReason: z.string().nullable(),
    updatedAt: z.iso.datetime({ offset: true }),
    stripe: z.object({
      accountType: z.string().min(1),
      country: z.string().nullable(),
      detailsSubmitted: z.boolean(),
      chargesEnabled: z.boolean(),
      payoutsEnabled: z.boolean(),
      requirements: z.object({
        currentlyDue: z.array(z.string()),
        eventuallyDue: z.array(z.string()),
        pastDue: z.array(z.string()),
        pendingVerification: z.array(z.string()),
        disabledReason: z.string().nullable(),
      }),
    }),
  })
  .refine(
    (r) =>
      r.onboardingCompleted === r.stripe.detailsSubmitted &&
      r.chargesEnabled === r.stripe.chargesEnabled &&
      r.payoutsEnabled === r.stripe.payoutsEnabled,
  );
export const connectAccountSchema = wireAccount
  .transform((r) => ({
    vendorId: r.vendorId,
    onboardingCompleted: r.onboardingCompleted,
    chargesEnabled: r.chargesEnabled,
    payoutsEnabled: r.payoutsEnabled,
    restrictionsReported: Boolean(
      r.disabledReason || r.stripe.requirements.disabledReason,
    ),
    updatedAt: r.updatedAt,
    accountType: r.stripe.accountType,
    country: r.stripe.country,
    requirements: {
      currentlyDue: r.stripe.requirements.currentlyDue.length,
      eventuallyDue: r.stripe.requirements.eventuallyDue.length,
      pastDue: r.stripe.requirements.pastDue.length,
      pendingVerification: r.stripe.requirements.pendingVerification.length,
    },
  }))
  .nullable();
export type ConnectAccountStatus = z.infer<typeof connectAccountSchema>;
