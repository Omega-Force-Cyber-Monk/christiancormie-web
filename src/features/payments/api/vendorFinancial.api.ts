import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  sessionDenied,
  type SessionScope,
  type QueryContext,
  type ValidatedQuery,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { vendorFor } from "@/features/vendor/api/vendorBookings.api";
import {
  financialFiltersSchema,
  summarySchema,
  transactionsSchema,
  vendorTransactionSchema,
  refundsSchema,
  payoutsSchema,
  type FinancialFilters,
} from "../schemas/vendorFinancial.schema";
export type FinancialListArg = SessionScope & { filters: FinancialFilters };
async function read<T>(
  s: SessionScope,
  a: QueryContext,
  q: ValidatedQuery,
  url: string,
  schema: z.ZodType<T>,
  params?: FinancialFilters,
) {
  const vendor = vendorFor(a.getState() as RootState, s, true);
  if (!vendor) return sessionDenied;
  const result = await scopedRead(
    a,
    s,
    q,
    { url, method: "GET", ...(params ? { params } : {}) },
    schema,
  );
  return vendorFor(a.getState() as RootState, s, true)?.id === vendor.id
    ? result
    : sessionDenied;
}
export const vendorFinancialApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVendorFinancialSummary: b.query<z.infer<typeof summarySchema>, SessionScope>({
      keepUnusedDataFor: 0,
      queryFn: (s, a, _e, q) =>
        read(s, a, q, "/payments/vendor/summary", summarySchema),
      providesTags: ["VendorFinancial"],
    }),
    getVendorTransactions: b.query<
      z.infer<typeof transactionsSchema>,
      FinancialListArg
    >({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        const f = financialFiltersSchema.safeParse(s.filters);
        if (!f.success) return invalidContract;
        return read(
          s,
          a,
          q,
          "/payments/vendor/transactions",
          transactionsSchema.refine(
            (r) =>
              r.meta.page === f.data.page &&
              r.meta.limit === f.data.limit &&
              new Set(r.items.map((i) => i.paymentId)).size === r.items.length,
          ),
          f.data,
        );
      },
      providesTags: ["VendorFinancial"],
    }),
    getVendorTransaction: b.query<
      z.infer<typeof vendorTransactionSchema>,
      SessionScope & { paymentId: string }
    >({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        if (!z.uuid().safeParse(s.paymentId).success) return sessionDenied;
        return read(
          s,
          a,
          q,
          `/payments/vendor/transactions/${s.paymentId}`,
          vendorTransactionSchema.refine((r) => r.paymentId === s.paymentId),
        );
      },
      providesTags: ["VendorFinancial"],
    }),
    getVendorRefundHistory: b.query<z.infer<typeof refundsSchema>, FinancialListArg>({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        const f = financialFiltersSchema.safeParse(s.filters);
        if (!f.success) return invalidContract;
        return read(
          s,
          a,
          q,
          "/payments/vendor/refunds",
          refundsSchema.refine(
            (r) => r.meta.page === f.data.page && r.meta.limit === f.data.limit,
          ),
          f.data,
        );
      },
      providesTags: ["VendorFinancial"],
    }),
    getVendorPayoutHistory: b.query<z.infer<typeof payoutsSchema>, SessionScope>({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        const v = vendorFor(a.getState() as RootState, s, true);
        if (!v) return sessionDenied;
        return read(
          s,
          a,
          q,
          "/payments/payouts/mine",
          payoutsSchema.refine((rows) => rows.every((p) => p.vendorId === v.id)),
        );
      },
      providesTags: ["VendorFinancial"],
    }),
  }),
});
export const {
  useGetVendorFinancialSummaryQuery,
  useGetVendorTransactionsQuery,
  useGetVendorTransactionQuery,
  useGetVendorRefundHistoryQuery,
  useGetVendorPayoutHistoryQuery,
} = vendorFinancialApi;
