import { z } from "zod";
import { baseApi } from "@/services/api/baseApi";
import { readValidated } from "@/services/api/validatedQuery";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { USER_ROLES } from "@/constants/roles";
import type { RootState } from "@/app/store";
export const tierSchema = z.object({
  slug: z.string(),
  name: z.string(),
  requiredPoints: z.number().nonnegative(),
  creditAmount: z.number().nonnegative(),
  level: z.number().positive(),
});
export const rewardSummarySchema = z.object({
  profile: z.object({
    id: z.uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
    level: z.number(),
  }),
  loyalty: z.object({
    availablePoints: z.number(),
    lifetimePoints: z.number(),
    redeemedPoints: z.number(),
    availableCreditAmount: z.number(),
    maxRedeemPerVisit: z.number(),
    currentTier: tierSchema,
    nextTier: tierSchema.extend({ pointsRemaining: z.number() }).nullable(),
    progress: z.object({
      current: z.number(),
      target: z.number(),
      percentage: z.number(),
    }),
  }),
  tiers: z.array(tierSchema.extend({ isCurrent: z.boolean() })),
  pointsPerAction: z.array(
    z.object({ sourceType: z.string(), action: z.string(), points: z.number() }),
  ),
  recentActivity: z.array(
    z.object({
      id: z.uuid(),
      type: z.string(),
      title: z.string(),
      subtitle: z.string(),
      points: z.number(),
      createdAt: z.string(),
      balanceAfter: z.number().nullable(),
    }),
  ),
});
export const rewardRulesSchema = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    triggerType: z.string().nullable(),
    rewardType: z.string(),
    pointsRequired: z.number().nullable(),
    rewardAmount: z.number().nullable(),
    isActive: z.boolean(),
  }),
);
export type RewardSummary = z.infer<typeof rewardSummarySchema>;
export const rewardsAllowed = (state: RootState) =>
  selectIsAuthenticated(state) && selectCurrentRole(state) === USER_ROLES.CUSTOMER;
const denied = {
  error: {
    status: 403 as const,
    data: { message: "Verified customer identity required." },
  },
};
export const rewardsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMyRewardSummary: b.query<RewardSummary, void>({
      async queryFn(_p, a, _e, q) {
        const state = a.getState() as RootState;
        if (!rewardsAllowed(state)) return denied;
        const result = await readValidated(
          { url: "/rewards/me/profile-summary" },
          rewardSummarySchema,
          q,
        );
        return result.data && result.data.profile.id !== state.auth.user?.id
          ? {
              error: {
                status: "CUSTOM_ERROR",
                error: "Reward identity did not match.",
              },
            }
          : result;
      },
      providesTags: ["Rewards"],
    }),
    getRewardRules: b.query<z.infer<typeof rewardRulesSchema>, void>({
      queryFn: (_p, a, _e, q) =>
        rewardsAllowed(a.getState() as RootState)
          ? readValidated({ url: "/rewards/rules" }, rewardRulesSchema, q)
          : denied,
      providesTags: ["Rewards"],
    }),
  }),
});
export const { useGetMyRewardSummaryQuery, useGetRewardRulesQuery } = rewardsApi;
