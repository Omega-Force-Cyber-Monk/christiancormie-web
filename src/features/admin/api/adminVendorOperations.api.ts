import { z } from "zod";
import type { RootState } from "@/app/store";
import { adminApi } from "./admin.api";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
export const verificationRequestSchema = z
  .object({
    id: z.uuid(),
    vendorId: z.uuid(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    documents: z.unknown(),
    createdAt: z.iso.datetime({ offset: true }),
    vendor: z.object({
      id: z.uuid(),
      businessName: z.string(),
      status: z.string(),
      isVerified: z.boolean(),
    }),
  })
  .refine((r) => r.vendorId === r.vendor.id);
export type VerificationRequest = z.infer<typeof verificationRequestSchema>;
export const documentBodySchema = z
  .object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
    rejectionReason: z.string().max(1000).optional(),
  })
  .strict();
const keySchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,127}$/);
export const documentRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
export function matchingDocuments(documents: unknown, key: string) {
  return Array.isArray(documents)
    ? documents
        .map(documentRecord)
        .filter(
          (d) =>
            d &&
            ["id", "type", "name", "label"].some(
              (k) =>
                typeof d[k] === "string" &&
                d[k].trim().toLowerCase() === key.trim().toLowerCase(),
            ),
        )
    : [];
}
export function documentKey(doc: Record<string, unknown>, documents: unknown) {
  for (const field of ["id", "type", "name", "label"]) {
    const p = keySchema.safeParse(doc[field]);
    if (p.success && matchingDocuments(documents, p.data).length === 1) return p.data;
  }
  return null;
}
export function adminVendorAllowed(state: RootState, s: SessionScope) {
  return (
    s.role === "ADMIN" && z.uuid().safeParse(s.userId).success && scopeMatches(state, s)
  );
}
const tags = [
  "AdminVendors",
  "AdminDashboard",
  "Vendor",
  "Discovery",
  "TruckProfile",
  "MemberProfile",
] as const;
export const adminVendorOperationsApi = adminApi.injectEndpoints({
  endpoints: (b) => ({
    getAdminVerificationRequests: b.query<
      VerificationRequest[],
      SessionScope & { offset: number }
    >({
      keepUnusedDataFor: 0,
      queryFn: (s, a, _e, q) => {
        if (!adminVendorAllowed(a.getState() as RootState, s)) return sessionDenied;
        if (!z.number().int().nonnegative().safeParse(s.offset).success)
          return invalidContract;
        return scopedRead(
          a,
          s,
          q,
          {
            url: "/admin/verification-requests",
            params: { limit: 100, offset: s.offset },
          },
          z
            .array(verificationRequestSchema)
            .max(100)
            .refine((items) => new Set(items.map((i) => i.id)).size === items.length),
        );
      },
      providesTags: ["AdminVendors"],
    }),
    changeAdminVendorStatus: b.mutation<
      { id: string; status: string },
      SessionScope & {
        vendorId: string;
        action: "suspend" | "retrieve";
        confirmed: boolean;
      }
    >({
      queryFn: (s, a, _e, q) => {
        if (
          !adminVendorAllowed(a.getState() as RootState, s) ||
          !z.uuid().safeParse(s.vendorId).success ||
          s.confirmed !== true
        )
          return sessionDenied;
        if (s.action !== "suspend" && s.action !== "retrieve") return invalidContract;
        const state = a.getState() as RootState;
        const vendors = adminApi.util
          .selectCachedArgsForQuery(state, "getAdminVendorsManagement")
          .flatMap((arg) => {
            const r = adminApi.endpoints.getAdminVendorsManagement.select(arg)(state);
            return r.isSuccess && !r.error ? (r.data?.vendors ?? []) : [];
          });
        const vendor = vendors.find((v) => v.id === s.vendorId);
        if (
          !vendor ||
          vendor.status !== (s.action === "suspend" ? "APPROVED" : "SUSPENDED")
        )
          return sessionDenied;
        return sessionFlight(a, s, `vendor:${s.vendorId}`, async () => {
          const r = await scopedRead(
            a,
            s,
            q,
            { url: `/admin/vendors/${s.vendorId}/${s.action}`, method: "PATCH" },
            z.object({
              id: z.literal(s.vendorId),
              status: z.literal(s.action === "suspend" ? "SUSPENDED" : "APPROVED"),
            }),
          );
          if (adminVendorAllowed(a.getState() as RootState, s))
            a.dispatch(baseApi.util.invalidateTags([...tags]));
          return r;
        });
      },
    }),
    updateAdminVerificationDocument: b.mutation<
      VerificationRequest,
      SessionScope & {
        vendorId: string;
        requestId: string;
        documentKey: string;
        expectedDocumentUrl: string;
        body: z.infer<typeof documentBodySchema>;
        confirmed: boolean;
      }
    >({
      queryFn: (s, a, _e, q) => {
        if (
          !adminVendorAllowed(a.getState() as RootState, s) ||
          !z.uuid().safeParse(s.vendorId).success ||
          !z.uuid().safeParse(s.requestId).success ||
          s.confirmed !== true
        )
          return sessionDenied;
        const body = documentBodySchema.safeParse(s.body);
        if (!body.success || !keySchema.safeParse(s.documentKey).success)
          return invalidContract;
        const state = a.getState() as RootState;
        const requests = adminVendorOperationsApi.util
          .selectCachedArgsForQuery(state, "getAdminVerificationRequests")
          .filter(
            (arg) =>
              arg.sessionId === s.sessionId &&
              arg.userId === s.userId &&
              arg.role === s.role,
          )
          .flatMap((arg) => {
            const r =
              adminVendorOperationsApi.endpoints.getAdminVerificationRequests.select(
                arg,
              )(state);
            return r.isSuccess && !r.error ? (r.data ?? []) : [];
          });
        const request = requests.find(
          (r) => r.id === s.requestId && r.vendorId === s.vendorId,
        );
        if (
          !request ||
          matchingDocuments(request.documents, s.documentKey).length !== 1 ||
          typeof s.expectedDocumentUrl !== "string" ||
          matchingDocuments(request.documents, s.documentKey)[0]?.url !==
            s.expectedDocumentUrl
        )
          return sessionDenied;
        return sessionFlight(a, s, `vendor:${s.vendorId}`, async () => {
          const result = await scopedRead(
            a,
            s,
            q,
            {
              url: `/admin/verification-requests/${s.requestId}/documents/${encodeURIComponent(s.documentKey)}`,
              method: "PATCH",
              body: body.data,
            },
            verificationRequestSchema.refine(
              (r) =>
                r.id === s.requestId &&
                r.vendorId === s.vendorId &&
                matchingDocuments(r.documents, s.documentKey).length === 1 &&
                matchingDocuments(r.documents, s.documentKey)[0]?.status ===
                  body.data.status &&
                matchingDocuments(r.documents, s.documentKey)[0]?.url ===
                  s.expectedDocumentUrl,
            ),
          );
          if (adminVendorAllowed(a.getState() as RootState, s))
            a.dispatch(baseApi.util.invalidateTags([...tags]));
          return result;
        });
      },
    }),
  }),
});
export const {
  useGetAdminVerificationRequestsQuery,
  useChangeAdminVendorStatusMutation,
  useUpdateAdminVerificationDocumentMutation,
} = adminVendorOperationsApi;
