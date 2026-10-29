import type { ReferralCode } from "../schemas/referrals.schema";
export function referralAvailability(code: ReferralCode, now = Date.now()) {
  if (!code.code.trim()) return "Unavailable";
  if (!code.isActive) return "Inactive";
  if (code.expiresAt && Date.parse(code.expiresAt) <= now) return "Expired";
  if (code.maximumUses !== null && code.usageCount >= code.maximumUses)
    return "Usage limit reached";
  return "Available";
}
export const customerReferralCodes = (codes: ReferralCode[]) =>
  codes.filter((code) => code.programType === "CUSTOMER");
export async function copyReferralCode(
  code: ReferralCode,
  writeText: ((text: string) => Promise<void>) | undefined,
  isCurrent: () => boolean,
  now = Date.now(),
) {
  if (!isCurrent()) return false;
  if (
    code.programType !== "CUSTOMER" ||
    referralAvailability(code, now) !== "Available"
  )
    throw new Error(
      "This customer referral code is unavailable. Refresh the code list.",
    );
  if (!writeText)
    throw new Error(
      "Clipboard access is unavailable. Select the code and copy it manually.",
    );
  await writeText(code.code);
  return isCurrent();
}
