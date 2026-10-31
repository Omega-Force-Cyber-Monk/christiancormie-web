import { z } from "zod";
import type { AppDispatch, RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type SessionScope,
  type QueryContext,
  type ValidatedQuery,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { vendorApi } from "./vendor.api";
import {
  createVendorStaffSchema,
  vendorStaffPinSchema,
  type CreateVendorStaffValues,
  type VendorStaffPinValues,
} from "../schemas/settings.schema";
import {
  vendorStaffChangeSchema,
  vendorStaffDeleteSchema,
  vendorStaffListSchema,
  type VendorStaff,
} from "../schemas/vendorStaff.schema";

export function staffOwnerMatches(state: RootState, scope: SessionScope) {
  const profile = vendorApi.endpoints.getVendorMe.select()(state);
  const vendor = profile.data;
  return Boolean(
    scope.role === "VENDOR" &&
    scopeMatches(state, scope) &&
    vendor &&
    vendor.userId === scope.userId &&
    vendor.dashboardAccess.allowed &&
    ["APPROVED", "PENDING_APPROVAL"].includes(vendor.status) &&
    (!vendor.user?.status || vendor.user.status === "ACTIVE") &&
    ![401, 403, 404].includes(
      Number((profile.error as { status?: unknown } | undefined)?.status),
    ),
  );
}

// Only opaque, single-use IDs enter RTK actions/arguments. PINs remain in a short-lived
// handoff, consumed before HTTP; never in Redux, devtools action payloads or storage.
const pinDrafts = new Map<string, { scope: SessionScope; body: unknown }>();
type PinArgs = { scope: SessionScope; submissionId: string; staffId?: string };
const sameScope = (a: SessionScope, b: SessionScope) =>
  a.sessionId === b.sessionId && a.userId === b.userId && a.role === b.role;
function takeDraft(args: PinArgs) {
  const draft = pinDrafts.get(args.submissionId);
  pinDrafts.delete(args.submissionId);
  return draft && sameScope(draft.scope, args.scope) ? draft.body : undefined;
}
function safeErrors(q: ValidatedQuery, pin?: string): ValidatedQuery {
  return async (args) => {
    const result = await q(args);
    if (!result.error) return { data: result.data };
    const error = normalizeApiError(result.error);
    if (error.kind === "NETWORK")
      return { error: { status: "FETCH_ERROR", error: error.message } };
    if (error.status === undefined)
      return { error: { status: "CUSTOM_ERROR", error: error.message } };
    const redact = (s: string) => (pin ? s.replaceAll(pin, "[redacted]") : s);
    return {
      error: {
        status: error.status,
        data: {
          message: redact(error.message),
          ...(error.fieldErrors
            ? {
                errors: Object.fromEntries(
                  Object.entries(error.fieldErrors).map(([k, v]) => [k, redact(v)]),
                ),
              }
            : {}),
          ...(error.validationMessages
            ? { message: error.validationMessages.map(redact) }
            : {}),
        },
      },
    };
  };
}
function selectedStaff(
  a: QueryContext,
  scope: SessionScope,
  id?: string,
): VendorStaff | undefined {
  if (!id || !z.uuid().safeParse(id).success) return undefined;
  const list = vendorStaffApi.endpoints.getVendorStaff.select(scope)(
    a.getState() as RootState,
  );
  if (
    [401, 403, 404].includes(
      Number((list.error as { status?: unknown } | undefined)?.status),
    )
  )
    return undefined;
  return list.data?.items.find((staff) => staff.id === id);
}
export const vendorStaffApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getVendorStaff: b.query<z.infer<typeof vendorStaffListSchema>, SessionScope>({
      keepUnusedDataFor: 0,
      async queryFn(scope, a, _e, q) {
        if (!staffOwnerMatches(a.getState() as RootState, scope)) return sessionDenied;
        const result = await scopedRead(
          a,
          scope,
          safeErrors(q),
          { url: "/vendors/me/staff", method: "GET" },
          vendorStaffListSchema,
        );
        return staffOwnerMatches(a.getState() as RootState, scope)
          ? result
          : sessionDenied;
      },
      providesTags: ["VendorStaff"],
    }),
    createVendorStaff: b.mutation<z.infer<typeof vendorStaffChangeSchema>, PinArgs>({
      queryFn: (args, a, _e, q) => {
        const draft = takeDraft(args);
        return sessionFlight(a, args.scope, "vendor-staff-write", async () => {
          if (!staffOwnerMatches(a.getState() as RootState, args.scope))
            return sessionDenied;
          const parsed = createVendorStaffSchema.safeParse(draft);
          if (!parsed.success) return invalidContract;
          const r = await scopedRead(
            a,
            args.scope,
            safeErrors(q, parsed.data.pin),
            {
              url: "/vendors/me/staff",
              method: "POST",
              body: parsed.data,
            },
            vendorStaffChangeSchema.refine((s) => s.email === parsed.data.email),
          );
          return staffOwnerMatches(a.getState() as RootState, args.scope)
            ? r
            : sessionDenied;
        });
      },
      invalidatesTags: (r) => (r ? ["VendorStaff"] : []),
    }),
    resetVendorStaffPin: b.mutation<z.infer<typeof vendorStaffChangeSchema>, PinArgs>({
      queryFn: (args, a, _e, q) => {
        const draft = takeDraft(args);
        return sessionFlight(a, args.scope, "vendor-staff-write", async () => {
          if (!staffOwnerMatches(a.getState() as RootState, args.scope))
            return sessionDenied;
          const member = selectedStaff(a, args.scope, args.staffId);
          if (!member) return sessionDenied;
          const parsed = vendorStaffPinSchema.safeParse(draft);
          if (!parsed.success) return invalidContract;
          const r = await scopedRead(
            a,
            args.scope,
            safeErrors(q, parsed.data.pin),
            {
              url: `/vendors/me/staff/${member.id}/reset-pin`,
              method: "POST",
              body: parsed.data,
            },
            vendorStaffChangeSchema.refine(
              (s) => s.id === member.id && s.email === member.email,
            ),
          );
          return staffOwnerMatches(a.getState() as RootState, args.scope)
            ? r
            : sessionDenied;
        });
      },
      invalidatesTags: (r) => (r ? ["VendorStaff"] : []),
    }),
    deleteVendorStaff: b.mutation<
      z.infer<typeof vendorStaffDeleteSchema>,
      { scope: SessionScope; staffId: string; confirmed: true }
    >({
      queryFn: ({ scope, staffId, confirmed }, a, _e, q) =>
        sessionFlight(a, scope, "vendor-staff-write", async () => {
          if (
            !staffOwnerMatches(a.getState() as RootState, scope) ||
            confirmed !== true ||
            !selectedStaff(a, scope, staffId)
          )
            return sessionDenied;
          const r = await scopedRead(
            a,
            scope,
            safeErrors(q),
            { url: `/vendors/me/staff/${staffId}`, method: "DELETE" },
            vendorStaffDeleteSchema,
          );
          return staffOwnerMatches(a.getState() as RootState, scope)
            ? r
            : sessionDenied;
        }),
      invalidatesTags: (r) => (r ? ["VendorStaff"] : []),
    }),
  }),
});
// Call these functions directly with dispatch. The sensitive body is not a thunk
// argument or RTK mutation argument; Redux sees only scope/UUID/submissionId.
export async function createVendorStaff(
  dispatch: AppDispatch,
  scope: SessionScope,
  body: CreateVendorStaffValues,
) {
  const submissionId = crypto.randomUUID();
  pinDrafts.set(submissionId, { scope, body });
  const request = dispatch(
    vendorStaffApi.endpoints.createVendorStaff.initiate({ scope, submissionId }),
  );
  try {
    return await request.unwrap();
  } finally {
    pinDrafts.delete(submissionId);
    request.reset();
  }
}
export async function resetVendorStaffPin(
  dispatch: AppDispatch,
  scope: SessionScope,
  staffId: string,
  body: VendorStaffPinValues,
) {
  const submissionId = crypto.randomUUID();
  pinDrafts.set(submissionId, { scope, body });
  const request = dispatch(
    vendorStaffApi.endpoints.resetVendorStaffPin.initiate({
      scope,
      staffId,
      submissionId,
    }),
  );
  try {
    return await request.unwrap();
  } finally {
    pinDrafts.delete(submissionId);
    request.reset();
  }
}
export const { useGetVendorStaffQuery } = vendorStaffApi;
