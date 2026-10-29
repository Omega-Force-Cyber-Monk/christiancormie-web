import type { RewardSummary } from "../api/rewards.api";
export function nextTierProgress(loyalty: RewardSummary["loyalty"]) {
  const next = loyalty.nextTier;
  if (!next) return { max: 1, value: 1, label: "Maximum tier reached" };
  // The backend progress object targets its FINAL tier. This bar names the next
  // tier, so use that returned tier's threshold and returned lifetime balance.
  return {
    max: Math.max(1, next.requiredPoints),
    value: Math.max(0, Math.min(loyalty.lifetimePoints, next.requiredPoints)),
    label: `Progress to ${next.name}`,
  };
}
