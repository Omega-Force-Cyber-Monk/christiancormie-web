import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  type SessionScope,
  type ValidatedQuery,
} from "@/services/api/sessionGuard";
import { vendorApi } from "@/features/vendor/api/vendor.api";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  connectAccountSchema,
  type ConnectAccountStatus,
} from "../schemas/connectAccount.schema";

function ownerVendor(state: RootState, scope: SessionScope) {
  if (scope.role !== "VENDOR" || !scopeMatches(state, scope)) return undefined;
  const profile = vendorApi.endpoints.getVendorMe.select()(state);
  const vendor = profile.data;
  if (
    !vendor ||
    vendor.userId !== scope.userId ||
    !vendor.dashboardAccess.allowed ||
    !["APPROVED", "PENDING_APPROVAL"].includes(vendor.status) ||
    (vendor.user?.status && vendor.user.status !== "ACTIVE") ||
    [401, 403, 404].includes(
      Number((profile.error as { status?: unknown } | undefined)?.status),
    )
  )
    return undefined;
  return vendor;
}
const statusQuery =
  (query: ValidatedQuery): ValidatedQuery =>
  async (args) => {
    const r = await query(args);
    if (!r.error) return { data: r.data };
    const e = normalizeApiError(r.error);
    if (e.kind === "NETWORK")
      return { error: { status: "FETCH_ERROR", error: e.message } };
    if (e.status === undefined)
      return {
        error: {
          status: "CUSTOM_ERROR",
          error: "Payment account status is unavailable.",
        },
      };
    // StripeClient wraps raw provider diagnostics in HTTP 400. Never surface them
    // or retain provider metadata as ordinary API error data.
    return {
      error: {
        status: e.status,
        data: {
          message:
            e.status >= 500
              ? e.message
              : "Payment account status could not be retrieved. Please try again.",
        },
      },
    };
  };
export const connectAccountApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVendorConnectAccount: b.query<ConnectAccountStatus, SessionScope>({
      keepUnusedDataFor: 0,
      async queryFn(scope, a, _e, q) {
        const vendor = ownerVendor(a.getState() as RootState, scope);
        if (!vendor) return sessionDenied;
        const r = await scopedRead(
          a,
          scope,
          statusQuery(q),
          { url: "/payments/connect/account", method: "GET" },
          connectAccountSchema.refine(
            (account) => account === null || account.vendorId === vendor.id,
          ),
        );
        return ownerVendor(a.getState() as RootState, scope)?.id === vendor.id
          ? r
          : sessionDenied;
      },
      providesTags: ["VendorPaymentAccount"],
    }),
  }),
});
export const { useGetVendorConnectAccountQuery } = connectAccountApi;
