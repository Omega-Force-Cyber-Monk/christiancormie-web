import { z } from "zod";
import type { RootState, AppDispatch } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import { invalidContract } from "@/services/api/validatedQuery";
import {
  scopedRead,
  scopeMatches,
  sessionFlight,
  sessionDenied,
  type SessionScope,
  type QueryContext,
  type ValidatedQuery,
} from "@/services/api/sessionGuard";
import { authApi } from "@/features/auth/api/auth.api";
import { currentUserResponseSchema } from "@/features/auth/schemas/current-user.schema";
import { toAuthenticatedUser } from "@/features/auth/utils/authAdapters";
import { identityVerified, clearSession } from "@/features/auth/store/auth.slice";
import {
  profilePatchSchema,
  changePasswordSchema,
  leadSchema,
} from "../schemas/account.schema";
import { validAccountImage } from "../utils/accountAdapters";
import { remoteMedia } from "@/utils/files/remoteMedia";
const allowed = (a: QueryContext, s: SessionScope) =>
  ["CUSTOMER", "VENDOR"].includes(s.role) && scopeMatches(a.getState() as RootState, s);
async function refreshIdentity(a: QueryContext, s: SessionScope, q: ValidatedQuery) {
  const r = await scopedRead(
    a,
    s,
    q,
    { url: "/users/me", method: "GET" },
    currentUserResponseSchema.refine((u) => u.id === s.userId),
  );
  if (!r.data) return false;
  const user = toAuthenticatedUser(r.data);
  a.dispatch(
    identityVerified({
      ...user,
      role: user.roles.includes(s.role)
        ? ((a.getState() as RootState).auth.user?.role ?? user.role)
        : user.role,
    }),
  );
  if (scopeMatches(a.getState() as RootState, s)) {
    const dispatch = a.dispatch as AppDispatch;
    await dispatch(authApi.util.upsertQueryData("getCurrentUser", undefined, r.data));
  }
  return true;
}
const profileTags = [
  "CurrentUser",
  "MemberProfile",
  "MemberPosts",
  "MemberFollowers",
  "MemberFollowing",
  "SocialFeed",
  "SocialPosts",
  "Conversations",
  "ConversationDetail",
] as const;
export const accountApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    refreshAccountIdentity: b.mutation<{ identityRefreshed: boolean }, SessionScope>({
      async queryFn(s, a, _e, q) {
        if (!allowed(a, s)) return sessionDenied;
        const ok = await refreshIdentity(a, s, q);
        return scopeMatches(a.getState() as RootState, s)
          ? { data: { identityRefreshed: ok } }
          : sessionDenied;
      },
    }),
    updateAccountProfile: b.mutation<
      { identityRefreshed: boolean },
      { scope: SessionScope; body: z.infer<typeof profilePatchSchema> }
    >({
      queryFn: ({ scope: s, body }, a, _e, q) =>
        sessionFlight(a, s, "profile", async () => {
          if (!allowed(a, s)) return sessionDenied;
          const parsed = profilePatchSchema.safeParse(body);
          if (!parsed.success) return invalidContract;
          const r = await scopedRead(
            a,
            s,
            q,
            { url: "/users/me/profile", method: "PATCH", body: parsed.data },
            z.object({
              userId: z.literal(s.userId),
              displayName: z.string().nullable(),
              email: z.string(),
              phone: z.string().nullable(),
            }),
          );
          if (!r.data) return { error: r.error };
          const identityRefreshed = await refreshIdentity(a, s, q);
          return scopeMatches(a.getState() as RootState, s)
            ? { data: { identityRefreshed } }
            : sessionDenied;
        }),
      invalidatesTags: (r) => (r ? [...profileTags, "Rewards"] : []),
    }),
    uploadAccountAvatar: b.mutation<
      { avatarUrl: string; identityRefreshed: boolean },
      { scope: SessionScope; file: File }
    >({
      queryFn: ({ scope: s, file }, a, _e, q) =>
        sessionFlight(a, s, "profile", async () => {
          if (!allowed(a, s)) return sessionDenied;
          if (validAccountImage(file)) return invalidContract;
          const body = new FormData();
          body.append("file", file, file.name);
          const r = await scopedRead(
            a,
            s,
            q,
            { url: "/users/me/profile/avatar/upload", method: "POST", body },
            z.object({ avatarUrl: z.string().refine((u) => Boolean(remoteMedia(u))) }),
          );
          if (!r.data) return { error: r.error };
          const identityRefreshed = await refreshIdentity(a, s, q);
          return scopeMatches(a.getState() as RootState, s)
            ? { data: { ...r.data, identityRefreshed } }
            : sessionDenied;
        }),
      invalidatesTags: (r) => (r ? [...profileTags] : []),
    }),
    changeAccountPassword: b.mutation<
      { success: true; message: string },
      { scope: SessionScope; body: z.infer<typeof changePasswordSchema> }
    >({
      queryFn: ({ scope: s, body }, a, _e, q) =>
        sessionFlight(a, s, "password", () => {
          if (!allowed(a, s)) return Promise.resolve(sessionDenied);
          const parsed = changePasswordSchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                s,
                q,
                { url: "/auth/change-password", method: "POST", body: parsed.data },
                z.object({ success: z.literal(true), message: z.string() }),
              )
            : Promise.resolve(invalidContract);
        }),
    }),
    submitTruckLead: b.mutation<
      { id: string; truckName: string },
      { scope: SessionScope; body: z.infer<typeof leadSchema> }
    >({
      queryFn: ({ scope: s, body }, a, _e, q) =>
        sessionFlight(a, s, "lead", () => {
          if (!allowed(a, s) || s.role !== "CUSTOMER")
            return Promise.resolve(sessionDenied);
          const parsed = leadSchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                s,
                q,
                {
                  url: "/community/new-food-truck-leads",
                  method: "POST",
                  body: parsed.data,
                },
                z.object({ id: z.uuid(), truckName: z.string() }),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? ["AdminVendors"] : []),
    }),
    deleteCustomerAccount: b.mutation<
      { deleted: true; message: string },
      { scope: SessionScope; confirmed: true }
    >({
      queryFn: ({ scope: s, confirmed }, a, _e, q) =>
        sessionFlight(a, s, "delete", async () => {
          const state = a.getState() as RootState;
          const me = authApi.endpoints.getCurrentUser.select()(state).data;
          if (
            !allowed(a, s) ||
            s.role !== "CUSTOMER" ||
            confirmed !== true ||
            !me ||
            me.id !== s.userId ||
            me.vendor !== null
          )
            return sessionDenied;
          const r = await scopedRead(
            a,
            s,
            q,
            { url: "/users/me", method: "DELETE" },
            z.object({ deleted: z.literal(true), message: z.string() }),
          );
          return r;
        }),
      async onQueryStarted({ scope: s }, lifecycle) {
        try {
          await lifecycle.queryFulfilled;
          if (scopeMatches(lifecycle.getState() as RootState, s))
            lifecycle.dispatch(clearSession("invalid-session"));
        } catch {
          /* A rejected deletion preserves the current account. */
        }
      },
    }),
  }),
});
export const {
  useUpdateAccountProfileMutation,
  useUploadAccountAvatarMutation,
  useChangeAccountPasswordMutation,
  useSubmitTruckLeadMutation,
  useDeleteCustomerAccountMutation,
  useRefreshAccountIdentityMutation,
} = accountApi;
