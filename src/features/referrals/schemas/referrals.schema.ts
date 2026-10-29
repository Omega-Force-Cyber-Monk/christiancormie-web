import { z } from "zod";
// Raw Prisma records have no createdAt/updatedAt on ReferralCode. Strip nested
// referred-user/reward records that this invitation view does not need.
export const referralCodeSchema = z.object({
  id: z.uuid(),
  ownerUserId: z.uuid(),
  code: z.string().max(50),
  programType: z.enum(["CUSTOMER", "VENDOR"]),
  maximumUses: z.number().int().positive().nullable(),
  usageCount: z.number().int().nonnegative(),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  isActive: z.boolean(),
});
export const referralCodesSchema = z.array(referralCodeSchema);
export type ReferralCode = z.infer<typeof referralCodeSchema>;
