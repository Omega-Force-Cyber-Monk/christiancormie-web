import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  sessionDenied,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { referralCodesSchema, type ReferralCode } from "../schemas/referrals.schema";
import { USER_ROLES } from "@/constants/roles";
export const referralsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getReferralCodes: b.query<ReferralCode[], SessionScope>({
      keepUnusedDataFor: 0,
      async queryFn(scope, a, _e, q) {
        if (scope.role !== USER_ROLES.CUSTOMER) return sessionDenied;
        const result = await scopedRead(
          a,
          scope,
          q,
          { url: "/referrals/codes", method: "GET" },
          referralCodesSchema,
        );
        return result.data?.some((code) => code.ownerUserId !== scope.userId)
          ? invalidContract
          : result;
      },
      providesTags: ["ReferralCodes"],
    }),
  }),
});
export const { useGetReferralCodesQuery } = referralsApi;
